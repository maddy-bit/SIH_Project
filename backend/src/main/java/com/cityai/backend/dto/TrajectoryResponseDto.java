package com.cityai.backend.dto;

import java.util.List;

public record TrajectoryResponseDto(
        VehicleDto vehicle,
        List<TrajectoryPointDto> points,
        Double overallConfidence,
        double estimatedDistanceKm,
        long estimatedDurationMinutes,
        String warning
) {
}
