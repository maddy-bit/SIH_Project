package com.cityai.backend.dto;

import java.util.List;

/**
 * All-camera-network summary - every number here is computed from stored
 * detections/trajectories at request time, nothing is a canned figure.
 */
public record AnalyticsOverviewDto(
        int totalCameras,
        int camerasOnline,
        int camerasProcessing,
        int camerasOffline,
        int totalVehicles,
        int totalDetections,
        List<TypeCountDto> vehicleTypeDistribution,
        List<HourCountDto> detectionsByHour,
        List<CameraCountDto> busiestCameras,
        Double averageTransitionSpeedKmh,
        List<CameraCountDto> commonOrigins,
        List<CameraCountDto> commonDestinations,
        List<RouteCountDto> topRoutes
) {
    public record TypeCountDto(String vehicleType, long count) {
    }

    public record HourCountDto(int hour, long count) {
    }

    public record CameraCountDto(String cameraId, String cameraName, long count) {
    }

    public record RouteCountDto(String fromCameraId, String fromCameraName, String toCameraId, String toCameraName, long count) {
    }
}
