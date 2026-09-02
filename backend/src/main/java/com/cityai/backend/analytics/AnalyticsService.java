package com.cityai.backend.analytics;

import com.cityai.backend.dto.AnalyticsOverviewDto;
import com.cityai.backend.dto.AnalyticsOverviewDto.CameraCountDto;
import com.cityai.backend.dto.AnalyticsOverviewDto.HourCountDto;
import com.cityai.backend.dto.AnalyticsOverviewDto.RouteCountDto;
import com.cityai.backend.dto.AnalyticsOverviewDto.TypeCountDto;
import com.cityai.backend.model.Camera;
import com.cityai.backend.model.Vehicle;
import com.cityai.backend.model.VehicleDetection;
import com.cityai.backend.repository.CameraRepository;
import com.cityai.backend.repository.VehicleDetectionRepository;
import com.cityai.backend.repository.VehicleRepository;
import com.cityai.backend.trajectory.TrajectoryEngine;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * City-wide traffic analytics, computed on demand from stored
 * detections/trajectories. Every figure here traces back to real
 * ingested data (see DetectionIngestionService / TrajectoryEngine) - the
 * dataset is a small demo network, so these are honestly small numbers,
 * not padded to look more impressive.
 */
@Service
public class AnalyticsService {

    private static final int TOP_N = 5;

    private final CameraRepository cameraRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleDetectionRepository detectionRepository;
    private final TrajectoryEngine trajectoryEngine;

    public AnalyticsService(
            CameraRepository cameraRepository,
            VehicleRepository vehicleRepository,
            VehicleDetectionRepository detectionRepository,
            TrajectoryEngine trajectoryEngine) {
        this.cameraRepository = cameraRepository;
        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
        this.trajectoryEngine = trajectoryEngine;
    }

    @Transactional(readOnly = true)
    public AnalyticsOverviewDto overview() {
        List<Camera> cameras = cameraRepository.findAll();
        List<Vehicle> vehicles = vehicleRepository.findAll();
        List<VehicleDetection> detections = detectionRepository.findAll();
        Map<String, Camera> camerasById = cameras.stream().collect(Collectors.toMap(Camera::getId, c -> c));

        int camerasOnline = (int) cameras.stream().filter(c -> "ONLINE".equals(c.getStatus())).count();
        int camerasProcessing = (int) cameras.stream().filter(c -> "PROCESSING".equals(c.getStatus())).count();
        int camerasOffline = (int) cameras.stream().filter(c -> "OFFLINE".equals(c.getStatus())).count();

        List<TypeCountDto> vehicleTypeDistribution = vehicles.stream()
                .filter(v -> v.getVehicleType() != null)
                .collect(Collectors.groupingBy(Vehicle::getVehicleType, Collectors.counting()))
                .entrySet().stream()
                .map(e -> new TypeCountDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingLong(TypeCountDto::count).reversed())
                .toList();

        List<HourCountDto> detectionsByHour = detections.stream()
                .collect(Collectors.groupingBy(d -> d.getTimestamp().atZone(ZoneOffset.UTC).getHour(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new HourCountDto(e.getKey(), e.getValue()))
                .sorted(Comparator.comparingInt(HourCountDto::hour))
                .toList();

        List<CameraCountDto> busiestCameras = detections.stream()
                .collect(Collectors.groupingBy(d -> d.getCamera().getId(), Collectors.counting()))
                .entrySet().stream()
                .map(e -> toCameraCount(e.getKey(), e.getValue(), camerasById))
                .sorted(Comparator.comparingLong(CameraCountDto::count).reversed())
                .limit(TOP_N)
                .toList();

        // Cross-vehicle trajectory aggregation: origins, destinations, common
        // routes, and average implied travel speed - all derived from the
        // same per-vehicle scoring TrajectoryEngine already uses for search.
        Map<String, Long> originCounts = new HashMap<>();
        Map<String, Long> destinationCounts = new HashMap<>();
        Map<String, Long> routeCounts = new HashMap<>();
        List<Double> impliedSpeeds = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            TrajectoryEngine.TrajectoryResult result;
            try {
                result = trajectoryEngine.reconstruct(vehicle.getPlate());
            } catch (NoSuchElementException e) {
                continue;
            }
            if (result.visits().isEmpty()) continue;

            originCounts.merge(result.visits().get(0).camera().getId(), 1L, Long::sum);
            destinationCounts.merge(result.visits().get(result.visits().size() - 1).camera().getId(), 1L, Long::sum);

            for (TrajectoryEngine.Transition transition : result.transitions()) {
                routeCounts.merge(transition.fromCameraId() + "->" + transition.toCameraId(), 1L, Long::sum);
                impliedSpeeds.add(transition.score().impliedSpeedKmh());
            }
        }

        List<CameraCountDto> commonOrigins = originCounts.entrySet().stream()
                .map(e -> toCameraCount(e.getKey(), e.getValue(), camerasById))
                .sorted(Comparator.comparingLong(CameraCountDto::count).reversed())
                .limit(TOP_N)
                .toList();
        List<CameraCountDto> commonDestinations = destinationCounts.entrySet().stream()
                .map(e -> toCameraCount(e.getKey(), e.getValue(), camerasById))
                .sorted(Comparator.comparingLong(CameraCountDto::count).reversed())
                .limit(TOP_N)
                .toList();
        List<RouteCountDto> topRoutes = routeCounts.entrySet().stream()
                .map(e -> {
                    String[] parts = e.getKey().split("->");
                    Camera from = camerasById.get(parts[0]);
                    Camera to = camerasById.get(parts[1]);
                    return new RouteCountDto(
                            parts[0], from != null ? from.getName() : parts[0],
                            parts[1], to != null ? to.getName() : parts[1],
                            e.getValue());
                })
                .sorted(Comparator.comparingLong(RouteCountDto::count).reversed())
                .limit(TOP_N)
                .toList();

        Double averageTransitionSpeedKmh = impliedSpeeds.isEmpty()
                ? null
                : impliedSpeeds.stream().mapToDouble(Double::doubleValue).average().orElse(0);

        return new AnalyticsOverviewDto(
                cameras.size(), camerasOnline, camerasProcessing, camerasOffline,
                vehicles.size(), detections.size(),
                vehicleTypeDistribution, detectionsByHour, busiestCameras,
                averageTransitionSpeedKmh, commonOrigins, commonDestinations, topRoutes
        );
    }

    private CameraCountDto toCameraCount(String cameraId, long count, Map<String, Camera> camerasById) {
        Camera camera = camerasById.get(cameraId);
        return new CameraCountDto(cameraId, camera != null ? camera.getName() : cameraId, count);
    }
}
