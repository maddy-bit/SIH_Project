package com.cityai.backend.dto;

import java.time.Instant;
import java.util.List;

/**
 * Vehicle-intelligence summary for the investigation search result -
 * GET /api/vehicles/{plate}. Distance/travel-time/confidence fields are
 * populated by the trajectory engine (Phase 9); left null until then.
 */
public record VehicleSummaryDto(
        VehicleDto vehicle,
        Instant firstSeen,
        Instant lastSeen,
        int cameraCount,
        List<String> camerasVisited,
        int detectionCount
) {
}
