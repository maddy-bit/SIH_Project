package com.cityai.backend.trajectory;

import com.cityai.backend.model.Camera;
import org.springframework.stereotype.Service;

/**
 * Scores how plausible it is that two consecutive camera sightings are the
 * same physical vehicle. This is the "don't just connect detections in
 * timestamp order" reasoning the master prompt calls for.
 *
 * trajectory_score = plate_score + time_score + geographic_score
 *                     + appearance_score + direction_score
 * (weighted, prototype-tunable). A clean, swappable heuristic - replace
 * with a learned/probabilistic model later without touching callers.
 */
@Service
public class TrajectoryScoringService {

    // Weights sum to 1.0 - tune here, nowhere else.
    private static final double WEIGHT_PLATE = 0.30;
    private static final double WEIGHT_KINEMATIC = 0.25; // time + distance plausibility ("time_score")
    private static final double WEIGHT_GEOGRAPHIC = 0.15; // hop-distance plausibility ("geographic_score"/road_score stand-in)
    private static final double WEIGHT_DIRECTION = 0.15;
    private static final double WEIGHT_APPEARANCE = 0.15; // Re-ID - neutral until embeddings are persisted (Phase 8+ follow-up)

    private static final double PLAUSIBLE_MIN_SPEED_KMH = 3.0;   // slower than this over a long gap looks like loitering, not transit
    private static final double PLAUSIBLE_MAX_SPEED_KMH = 60.0;  // comfortable urban upper bound
    private static final double IMPOSSIBLE_SPEED_KMH = 150.0;    // beyond this, flag as physically implausible
    private static final double MAX_TYPICAL_HOP_KM = 15.0;       // beyond this a single hop looks like a network gap, not a direct path

    private final CameraGraph cameraGraph = new CameraGraph();

    public record TransitionScore(
            double distanceKm,
            double elapsedMinutes,
            double impliedSpeedKmh,
            double plateScore,
            double kinematicScore,
            double geographicScore,
            double directionScore,
            double appearanceScore,
            double confidence,
            boolean physicallyImplausible,
            String note
    ) {
    }

    public TransitionScore score(
            Camera fromCamera, java.time.Instant fromTime, Double fromPlateConfidence,
            Camera toCamera, java.time.Instant toTime, Double toPlateConfidence) {

        CameraGraph.Edge edge = cameraGraph.edgeBetween(fromCamera, toCamera);
        double elapsedMinutes = Math.max(0.001, java.time.Duration.between(fromTime, toTime).toSeconds() / 60.0);
        double impliedSpeedKmh = edge.distanceKm() / (elapsedMinutes / 60.0);

        double plateScore = averageOrDefault(fromPlateConfidence, toPlateConfidence, 0.5);
        double kinematicScore = kinematicPlausibility(impliedSpeedKmh);
        double geographicScore = hopPlausibility(edge.distanceKm());
        double directionScore = directionAlignment(toCamera, edge.bearingDegrees());
        double appearanceScore = 0.6; // neutral placeholder - see class docs

        boolean implausible = impliedSpeedKmh > IMPOSSIBLE_SPEED_KMH;

        double confidence = WEIGHT_PLATE * plateScore
                + WEIGHT_KINEMATIC * kinematicScore
                + WEIGHT_GEOGRAPHIC * geographicScore
                + WEIGHT_DIRECTION * directionScore
                + WEIGHT_APPEARANCE * appearanceScore;

        String note = null;
        if (implausible) {
            confidence = Math.min(confidence, 0.15);
            note = String.format(
                    "Implied speed %.0f km/h between %s and %s exceeds physical plausibility - "
                            + "possible OCR misread, plate cloning, or unrelated vehicle.",
                    impliedSpeedKmh, fromCamera.getId(), toCamera.getId());
        }

        return new TransitionScore(
                edge.distanceKm(), elapsedMinutes, impliedSpeedKmh,
                plateScore, kinematicScore, geographicScore, directionScore, appearanceScore,
                clamp01(confidence), implausible, note
        );
    }

    private double kinematicPlausibility(double impliedSpeedKmh) {
        if (impliedSpeedKmh > IMPOSSIBLE_SPEED_KMH) {
            return 0.0;
        }
        if (impliedSpeedKmh >= PLAUSIBLE_MIN_SPEED_KMH && impliedSpeedKmh <= PLAUSIBLE_MAX_SPEED_KMH) {
            return 1.0;
        }
        // Linear falloff outside the comfortable range, down to 0 at the impossible threshold
        // (or down to 0.3 at standstill - a brief stop isn't implausible).
        if (impliedSpeedKmh < PLAUSIBLE_MIN_SPEED_KMH) {
            return 0.3 + 0.7 * (impliedSpeedKmh / PLAUSIBLE_MIN_SPEED_KMH);
        }
        double over = impliedSpeedKmh - PLAUSIBLE_MAX_SPEED_KMH;
        double range = IMPOSSIBLE_SPEED_KMH - PLAUSIBLE_MAX_SPEED_KMH;
        return clamp01(1.0 - (over / range));
    }

    private double hopPlausibility(double distanceKm) {
        if (distanceKm <= MAX_TYPICAL_HOP_KM) {
            return 1.0;
        }
        // Gentle falloff for long single hops between non-adjacent cameras.
        double over = distanceKm - MAX_TYPICAL_HOP_KM;
        return clamp01(1.0 - over / (MAX_TYPICAL_HOP_KM * 2));
    }

    private double directionAlignment(Camera toCamera, double actualBearing) {
        Double facing = GeoUtils.compassToDegrees(toCamera.getDirection());
        if (facing == null) {
            return 0.6; // unknown facing - neutral
        }
        double diff = GeoUtils.angularDifference(actualBearing, facing);
        return clamp01(1.0 - diff / 180.0);
    }

    private static double averageOrDefault(Double a, Double b, double fallback) {
        if (a == null && b == null) {
            return fallback;
        }
        if (a == null) {
            return b;
        }
        if (b == null) {
            return a;
        }
        return (a + b) / 2.0;
    }

    private static double clamp01(double v) {
        return Math.max(0.0, Math.min(1.0, v));
    }
}
