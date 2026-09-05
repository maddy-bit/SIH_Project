package com.cityai.backend.dto;

import com.cityai.backend.model.Camera;

public record CameraDto(
        String id,
        String name,
        double latitude,
        double longitude,
        String direction,
        String status
) {
    public static CameraDto from(Camera camera) {
        return new CameraDto(
                camera.getId(),
                camera.getName(),
                camera.getLatitude(),
                camera.getLongitude(),
                camera.getDirection(),
                camera.getStatus()
        );
    }
}
