package com.cityai.backend.service;

import com.cityai.backend.dto.DetectionIngestRequest;
import com.cityai.backend.dto.VehicleDetectionDto;
import com.cityai.backend.model.Camera;
import com.cityai.backend.model.Vehicle;
import com.cityai.backend.model.VehicleDetection;
import com.cityai.backend.repository.CameraRepository;
import com.cityai.backend.repository.VehicleDetectionRepository;
import com.cityai.backend.repository.VehicleRepository;
import java.util.NoSuchElementException;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
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

    private static final Logger log = LoggerFactory.getLogger(DetectionIngestionService.class);

    private final CameraRepository cameraRepository;
    private final VehicleRepository vehicleRepository;
    private final VehicleDetectionRepository detectionRepository;
    private final VehicleRegistryService vehicleRegistryService;
    private final CacheManager cacheManager;
    private final RedisPubSubService redisPubSubService;

    public DetectionIngestionService(
            CameraRepository cameraRepository,
            VehicleRepository vehicleRepository,
            VehicleDetectionRepository detectionRepository,
            VehicleRegistryService vehicleRegistryService,
            CacheManager cacheManager,
            RedisPubSubService redisPubSubService) {
        this.cameraRepository = cameraRepository;
        this.vehicleRepository = vehicleRepository;
        this.detectionRepository = detectionRepository;
        this.vehicleRegistryService = vehicleRegistryService;
        this.cacheManager = cacheManager;
        this.redisPubSubService = redisPubSubService;
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
        String normalizedPlate = request.plateTextNormalized();
        if (normalizedPlate != null && !normalizedPlate.isBlank()) {
            vehicle = resolveOrCreateVehicle(normalizedPlate);
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
        VehicleDetection saved = detectionRepository.save(detection);

        if (vehicle != null) {
            String plate = vehicle.getPlate();
            if (plate != null) {
                evictPlateCaches(plate);
            }
        }

        try {
            redisPubSubService.publishDetection(VehicleDetectionDto.from(saved));
        } catch (Exception e) {
            log.debug("Redis pub/sub unavailable, skipping detection event: {}", e.getMessage());
        }

        return saved;
    }

    /**
     * Evicts stale cached entries for the given plate across vehicles and
     * trajectories caches. Uses Objects.requireNonNull to prove non-null to the
     * JDT null checker before passing into the Spring Cache API.
     */
    private void evictPlateCaches(String plate) {
        try {
            Cache vehicleCache = cacheManager.getCache("vehicles");
            if (vehicleCache != null) {
                vehicleCache.evict(Objects.requireNonNull(plate));
            }
            Cache trajectoryCache = cacheManager.getCache("trajectories");
            if (trajectoryCache != null) {
                trajectoryCache.evict(Objects.requireNonNull(plate));
            }
        } catch (Exception e) {
            log.debug("Cache eviction skipped (Redis offline?): {}", e.getMessage());
        }
    }

    private Vehicle resolveOrCreateVehicle(String normalizedPlate) {
        return vehicleRepository.findByPlate(normalizedPlate).orElseGet(() -> {
            Vehicle v = new Vehicle(normalizedPlate);
            vehicleRegistryService.lookup(normalizedPlate).ifPresent(record -> {
                v.setVehicleType(record.vehicleType());
                v.setMake(record.make());
                v.setModel(record.model());
                v.setColor(record.color());
            });
            return vehicleRepository.save(v);
        });
    }
}
