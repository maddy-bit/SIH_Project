package com.cityai.backend.trajectory;

import com.cityai.backend.model.Camera;

/**
 * Stands in for a real road-network graph (master prompt's Road/CameraEdge
 * table: distance, estimated travel time, connected road, allowed
 * direction). The prototype has no road-network data, so edges are
 * derived geometrically (great-circle distance + assumed urban travel
 * speed) instead of looked up from a stored graph.
 *
 * Swap point for later: replace edgeBetween() with a lookup against a
 * real CameraEdge table (or a routing engine) without touching
 * TrajectoryScoringService/TrajectoryEngine, which only depend on this
 * class's public API.
 */
public class CameraGraph {

    /** Typical assumed city-traffic speed, used only to estimate travel time - not a hard limit. */
    private static final double ASSUMED_AVG_SPEED_KMH = 25.0;

    public record Edge(
            double distanceKm,
            double estimatedTravelTimeMinutes,
            double bearingDegrees
    ) {
    }

    public Edge edgeBetween(Camera from, Camera to) {
        double distanceKm = GeoUtils.distanceKm(from.getLatitude(), from.getLongitude(), to.getLatitude(), to.getLongitude());
        double bearing = GeoUtils.bearingDegrees(from.getLatitude(), from.getLongitude(), to.getLatitude(), to.getLongitude());
        double estimatedMinutes = (distanceKm / ASSUMED_AVG_SPEED_KMH) * 60.0;
        return new Edge(distanceKm, estimatedMinutes, bearing);
    }
}
