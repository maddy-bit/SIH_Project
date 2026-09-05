package com.cityai.backend.dto;

import com.cityai.backend.model.VehicleDetection;
import java.time.Instant;

public record VehicleDetectionDto(
        Long id,
        String cameraId,
        String cameraName,
        Instant timestamp,
        double latitude,
        double longitude,
        String direction,
        Double speedKmh,
        String vehicleClass,
        Double detectionConfidence,
        String plateTextRaw,
        String plateTextNormalized,
        Double plateConfidence,
        Double reidConfidence,
        String imagePath,
        Integer trackId,
        Integer frameNumber
) {
    public static VehicleDetectionDto from(VehicleDetection d) {
        return new VehicleDetectionDto(
                d.getId(),
                d.getCamera().getId(),
                d.getCamera().getName(),
                d.getTimestamp(),
                d.getLatitude(),
                d.getLongitude(),
                d.getDirection(),
                d.getSpeedKmh(),
                d.getVehicleClass(),
                d.getDetectionConfidence(),
                d.getPlateTextRaw(),
                d.getPlateTextNormalized(),
                d.getPlateConfidence(),
                d.getReidConfidence(),
                d.getImagePath(),
                d.getTrackId(),
                d.getFrameNumber()
        );
    }
}
