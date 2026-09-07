package com.cityai.backend.service;

import com.cityai.backend.dto.DetectionIngestRequest;
import com.cityai.backend.model.Camera;
import com.cityai.backend.model.Vehicle;
import com.cityai.backend.model.VehicleDetection;
import com.cityai.backend.repository.CameraRepository;
import com.cityai.backend.repository.VehicleDetectionRepository;
import com.cityai.backend.repository.VehicleRepository;
import java.util.NoSuchElementException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Turns raw AI-pipeline output (DetectionIngestRequest) into stored
 * VehicleDetection rows, resolving/creating the Vehicle identity from a
 * successfully-read plate via VehicleRegistryService. Detections with no
 * readable plate are still stored (as unlinked evidence) rather than
 * dropped - see VehicleDetection's nullable vehicle field.
 */
@Service
public class DetectionIngestionService {

    private final CameraRepository cameraRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleDetectionRepository detectionRepository;
    private final VehicleRegistryService vehicleRegistryService;

    public DetectionIngestionService(
            CameraRepository cameraRepository,
            VehicleRepository vehicleRepository,
            VehicleDetectionRepository detectionRepository,
            VehicleRegistryService vehicleRegistryService) {
        this.cameraRepository = cameraRepository;
        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
        this.vehicleRegistryService = vehicleRegistryService;
    }

    @Transactional
    public VehicleDetection ingest(DetectionIngestRequest request) {
        String cameraId = request.cameraId();
        if (cameraId == null) {
            throw new NoSuchElementException("Unknown camera: null");
        }
        Camera camera = cameraRepository.findById(cameraId)
                .orElseThrow(() -> new NoSuchElementException("Unknown camera: " + cameraId));

        Vehicle vehicle = null;
        if (request.plateTextNormalized() != null && !request.plateTextNormalized().isBlank()) {
            vehicle = resolveOrCreateVehicle(request.plateTextNormalized());
        }

        VehicleDetection detection = new VehicleDetection(vehicle, camera, request.timestamp());
        detection.setLatitude(camera.getLatitude());
        detection.setLongitude(camera.getLongitude());
        detection.setDirection(camera.getDirection());
        detection.setVehicleClass(request.vehicleClass());
        detection.setDetectionConfidence(request.detectionConfidence());
        detection.setPlateTextRaw(request.plateTextRaw());
        detection.setPlateTextNormalized(request.plateTextNormalized());
        detection.setPlateConfidence(request.plateConfidence());
        detection.setTrackId(request.trackId());
        detection.setFrameNumber(request.frameNumber());
        detection.setImagePath(request.imagePath());

        return detectionRepository.save(detection);
    }

    private Vehicle resolveOrCreateVehicle(String normalizedPlate) {
        return vehicleRepository.findByPlate(normalizedPlate).orElseGet(() -> {
            Vehicle vehicle = new Vehicle(normalizedPlate);
            vehicleRegistryService.lookup(normalizedPlate).ifPresent(record -> {
                vehicle.setVehicleType(record.vehicleType());
                vehicle.setMake(record.make());
                vehicle.setModel(record.model());
                vehicle.setColor(record.color());
            });
            return vehicleRepository.save(vehicle);
        });
    }
}
