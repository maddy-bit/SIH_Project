package com.cityai.backend.dto;

import java.time.Instant;

public record TrajectoryPointDto(
        String cameraId,
        String cameraName,
        double latitude,
        double longitude,
        String direction,
        Instant timestamp,
        Double plateConfidence,
        Double detectionConfidence,
        String imagePath,
        int detectionCount,
        Double incomingTransitionConfidence,
        String transitionNote
) {
}
