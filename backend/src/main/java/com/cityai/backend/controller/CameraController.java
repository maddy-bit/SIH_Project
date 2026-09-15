package com.cityai.backend.controller;

import com.cityai.backend.dto.CameraDto;
import com.cityai.backend.model.Camera;
import com.cityai.backend.repository.CameraRepository;
import com.cityai.backend.spatial.SpatialCameraService;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/cameras")
public class CameraController {

    private final CameraRepository cameraRepository;
    private final ObjectProvider<SpatialCameraService> spatialCameraService;

    public CameraController(CameraRepository cameraRepository, ObjectProvider<SpatialCameraService> spatialCameraService) {
        this.cameraRepository = cameraRepository;
        this.spatialCameraService = spatialCameraService;
    }

    @GetMapping
    @Cacheable(value = "cameras", key = "'all'")
    public List<CameraDto> listCameras() {
        return cameraRepository.findAll().stream().map(CameraDto::from).toList();
    }

    /**
     * Real PostGIS ST_DWithin + nearest-neighbor query - only available
     * when running against PostgreSQL (SPRING_PROFILES_ACTIVE=postgres,
     * see README's "Production datasource" section). On the default H2
     * dev profile this returns 501 with a clear explanation rather than
     * silently falling back to a fake/unindexed distance calculation.
     */
    @GetMapping("/nearby")
    public List<CameraDto> nearbyCameras(
            @RequestParam("lat") double lat, @RequestParam("lon") double lon, @RequestParam(name = "radiusKm", defaultValue = "5") double radiusKm) {
        SpatialCameraService service = spatialCameraService.getIfAvailable();
        if (service == null) {
            throw new ResponseStatusException(HttpStatus.NOT_IMPLEMENTED,
                    "Spatial queries require the 'postgres' profile (PostgreSQL + PostGIS). "
                            + "Currently running on the default H2 profile - see README's "
                            + "'Production datasource (PostgreSQL + PostGIS)' section.");
        }
        return service.findNearby(lat, lon, radiusKm);
    }

    @GetMapping("/{cameraId}")
    @Cacheable(value = "cameras", key = "#cameraId")
    public CameraDto getCamera(@PathVariable("cameraId") String cameraId) {
        if (cameraId == null) {
            throw new NoSuchElementException("Unknown camera: null");
        }
        Camera camera = cameraRepository.findById(cameraId)
                .orElseThrow(() -> new NoSuchElementException("Unknown camera: " + cameraId));
        return CameraDto.from(camera);
    }
}
