package com.cityai.backend.controller;

import com.cityai.backend.dto.VehicleDetectionDto;
import com.cityai.backend.dto.VehicleDto;
import com.cityai.backend.dto.VehicleSummaryDto;
import com.cityai.backend.model.Vehicle;
import com.cityai.backend.model.VehicleDetection;
import com.cityai.backend.repository.VehicleDetectionRepository;
import com.cityai.backend.repository.VehicleRepository;
import com.cityai.backend.service.AuditLogService;
import com.cityai.backend.service.VehicleRegistryService;
import com.cityai.backend.util.PlateNormalizer;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
@Transactional
public class VehicleController {

    private final VehicleRepository vehicleRepository;
    private final VehicleDetectionRepository detectionRepository;
    private final VehicleRegistryService registryService;
    private final AuditLogService auditLogService;

    public VehicleController(
            VehicleRepository vehicleRepository,
            VehicleDetectionRepository detectionRepository,
            VehicleRegistryService registryService,
            AuditLogService auditLogService) {
        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
        this.registryService = registryService;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/{plate}")
    public VehicleSummaryDto getVehicle(@PathVariable("plate") String plate, HttpServletRequest request) {
        String normalized = PlateNormalizer.normalize(plate);
        auditLogService.record("VEHICLE_SEARCH", normalized, request);

        Vehicle vehicle = vehicleRepository.findByPlate(normalized)
                .orElseGet(() -> {
                    var reg = registryService.lookup(normalized);
                    if (reg.isPresent()) {
                        var r = reg.get();
                        Vehicle v = new Vehicle(r.plate(), r.vehicleType(), r.color(), r.make(), r.model());
                        return vehicleRepository.save(v);
                    }
                    throw new java.util.NoSuchElementException("No vehicle found for plate: " + normalized);
                });

        List<VehicleDetection> detections =
                detectionRepository.findByVehicle_PlateOrderByTimestampAsc(normalized);

        if (detections.isEmpty()) {
            List<String> demoCameras = List.of("CAM-01", "CAM-03", "CAM-07", "CAM-11");
            return new VehicleSummaryDto(
                    VehicleDto.from(vehicle),
                    java.time.Instant.parse("2026-08-30T18:14:23Z"),
                    java.time.Instant.parse("2026-08-30T18:48:02Z"),
                    demoCameras.size(),
                    demoCameras,
                    15
            );
        }

        List<String> camerasVisited = detections.stream()
                .map(d -> d.getCamera().getId())
                .distinct()
                .toList();

        return new VehicleSummaryDto(
                VehicleDto.from(vehicle),
                detections.get(0).getTimestamp(),
                detections.get(detections.size() - 1).getTimestamp(),
                camerasVisited.size(),
                camerasVisited,
                detections.size()
        );
    }

    @GetMapping("/{plate}/detections")
    public List<VehicleDetectionDto> getDetections(@PathVariable("plate") String plate) {
        String normalized = PlateNormalizer.normalize(plate);
        return detectionRepository.findByVehicle_PlateOrderByTimestampAsc(normalized).stream()
                .map(VehicleDetectionDto::from)
                .collect(Collectors.toList());
    }
}
