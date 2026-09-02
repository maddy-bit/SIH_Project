package com.cityai.backend.trajectory;

import com.cityai.backend.dto.TrajectoryPointDto;
import com.cityai.backend.dto.TrajectoryResponseDto;
import com.cityai.backend.dto.VehicleDto;
import com.cityai.backend.model.Camera;
import com.cityai.backend.model.Vehicle;
import com.cityai.backend.model.VehicleDetection;
import com.cityai.backend.repository.VehicleDetectionRepository;
import com.cityai.backend.repository.VehicleRepository;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reconstructs the most probable route for a vehicle from its stored
 * detections: groups raw per-frame detections into one visit per camera,
 * scores each camera-to-camera transition (TrajectoryScoringService), and
 * produces an overall confidence.
 *
 * Scope note: this prototype identifies "candidate vehicle" purely by
 * matched plate (a detection is only linked to a Vehicle once its plate
 * was read - see DetectionIngestionService), so there's exactly one
 * detection stream per plate to reason about, not several competing
 * candidates to disambiguate between. What this engine adds beyond "trust
 * the plate matches and connect them in order" is: it still SCORES every
 * transition (time/distance/direction/appearance plausibility) and flags
 * ones that are physically impossible - e.g. a plate misread that
 * happens to normalize to a real plate, or two different vehicles
 * momentarily sharing a similar-looking plate. Multi-candidate
 * disambiguation using appearance/Re-ID when the plate is unreadable on
 * some cameras is a natural next step (persisted embeddings + a proper
 * assignment/clustering step), not yet built.
 */
@Service
public class TrajectoryEngine {

    private final VehicleRepository vehicleRepository;
    private final VehicleDetectionRepository detectionRepository;
    private final TrajectoryScoringService scoringService;

    public TrajectoryEngine(
            VehicleRepository vehicleRepository,
            VehicleDetectionRepository detectionRepository,
            TrajectoryScoringService scoringService) {
        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
        this.scoringService = scoringService;
    }

    public record CameraVisit(
            Camera camera,
            Instant firstSeen,
            Instant lastSeen,
            Double bestPlateConfidence,
            Double bestDetectionConfidence,
            String bestImagePath,
            int detectionCount
    ) {
    }

    public record Transition(
            String fromCameraId,
            String toCameraId,
            TrajectoryScoringService.TransitionScore score
    ) {
    }

    public record TrajectoryResult(
            Vehicle vehicle,
            List<CameraVisit> visits,
            List<Transition> transitions,
            Double overallConfidence,
            double totalDistanceKm,
            long totalDurationMinutes,
            String warning
    ) {
        /** Shared REST/WebSocket DTO shape - see TrajectoryController and LiveTrackingWebSocketHandler. */
        public TrajectoryResponseDto toDto() {
            List<TrajectoryPointDto> points = new ArrayList<>();
            for (int i = 0; i < visits.size(); i++) {
                CameraVisit visit = visits.get(i);
                Double incomingConfidence = null;
                String note = null;
                if (i > 0) {
                    Transition transition = transitions.get(i - 1);
                    incomingConfidence = transition.score().confidence();
                    note = transition.score().note();
                }
                points.add(new TrajectoryPointDto(
                        visit.camera().getId(),
                        visit.camera().getName(),
                        visit.camera().getLatitude(),
                        visit.camera().getLongitude(),
                        visit.camera().getDirection(),
                        visit.firstSeen(),
                        visit.bestPlateConfidence(),
                        visit.bestDetectionConfidence(),
                        visit.bestImagePath(),
                        visit.detectionCount(),
                        incomingConfidence,
                        note
                ));
            }
            return new TrajectoryResponseDto(
                    VehicleDto.from(vehicle), points, overallConfidence, totalDistanceKm, totalDurationMinutes, warning);
        }
    }

    @Transactional(readOnly = true)
    public TrajectoryResult reconstruct(String normalizedPlate) {
        Vehicle vehicle = vehicleRepository.findByPlate(normalizedPlate)
                .orElseThrow(() -> new NoSuchElementException("No vehicle found for plate: " + normalizedPlate));

        List<VehicleDetection> detections =
                detectionRepository.findByVehicle_PlateOrderByTimestampAsc(normalizedPlate);

        List<CameraVisit> visits = groupIntoVisits(detections);

        if (visits.isEmpty()) {
            return new TrajectoryResult(vehicle, visits, List.of(), null, 0.0, 0,
                    "No detections found for this vehicle.");
        }
        if (visits.size() == 1) {
            return new TrajectoryResult(vehicle, visits, List.of(), null, 0.0, 0,
                    "NO_RELIABLE_TRAJECTORY_FOUND: only one camera detection available.");
        }

        List<Transition> transitions = new ArrayList<>();
        double totalDistance = 0;
        for (int i = 0; i < visits.size() - 1; i++) {
            CameraVisit from = visits.get(i);
            CameraVisit to = visits.get(i + 1);
            var score = scoringService.score(
                    from.camera(), from.firstSeen(), from.bestPlateConfidence(),
                    to.camera(), to.firstSeen(), to.bestPlateConfidence());
            transitions.add(new Transition(from.camera().getId(), to.camera().getId(), score));
            totalDistance += score.distanceKm();
        }

        double overallConfidence = transitions.stream()
                .mapToDouble(t -> t.score().confidence())
                .average()
                .orElse(0.0);

        long totalDurationMinutes = Duration.between(
                visits.get(0).firstSeen(), visits.get(visits.size() - 1).firstSeen()).toMinutes();

        String warning = transitions.stream().anyMatch(t -> t.score().physicallyImplausible())
                ? "One or more transitions were physically implausible - see flagged transitions."
                : null;

        return new TrajectoryResult(vehicle, visits, transitions, overallConfidence, totalDistance,
                totalDurationMinutes, warning);
    }

    @Transactional(readOnly = true)
    public TrajectoryResponseDto reconstructAsDto(String normalizedPlate) {
        return reconstruct(normalizedPlate).toDto();
    }

    /** Collapses consecutive same-camera detections (many rows per pass) into one visit. */
    private List<CameraVisit> groupIntoVisits(List<VehicleDetection> detections) {
        List<CameraVisit> visits = new ArrayList<>();
        int i = 0;
        while (i < detections.size()) {
            Camera camera = detections.get(i).getCamera();
            int j = i;
            List<VehicleDetection> group = new ArrayList<>();
            while (j < detections.size() && detections.get(j).getCamera().getId().equals(camera.getId())) {
                group.add(detections.get(j));
                j++;
            }

            Instant firstSeen = group.get(0).getTimestamp();
            Instant lastSeen = group.get(group.size() - 1).getTimestamp();
            Double bestPlateConfidence = group.stream()
                    .map(VehicleDetection::getPlateConfidence)
                    .filter(java.util.Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            Double bestDetectionConfidence = group.stream()
                    .map(VehicleDetection::getDetectionConfidence)
                    .filter(java.util.Objects::nonNull)
                    .max(Comparator.naturalOrder())
                    .orElse(null);
            String bestImagePath = group.stream()
                    .filter(d -> d.getPlateConfidence() != null)
                    .max(Comparator.comparingDouble(VehicleDetection::getPlateConfidence))
                    .map(VehicleDetection::getImagePath)
                    .orElse(group.get(0).getImagePath());

            visits.add(new CameraVisit(camera, firstSeen, lastSeen, bestPlateConfidence,
                    bestDetectionConfidence, bestImagePath, group.size()));
            i = j;
        }
        return visits;
    }
}
