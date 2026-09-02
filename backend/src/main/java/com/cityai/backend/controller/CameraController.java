package com.cityai.backend.controller;

import com.cityai.backend.dto.CameraDto;
import com.cityai.backend.model.Camera;
import com.cityai.backend.repository.CameraRepository;
import java.util.List;
import java.util.NoSuchElementException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cameras")
public class CameraController {

    private final CameraRepository cameraRepository;

    public CameraController(CameraRepository cameraRepository) {
        this.cameraRepository = cameraRepository;
    }

    @GetMapping
    public List<CameraDto> listCameras() {
        return cameraRepository.findAll().stream().map(CameraDto::from).toList();
    }

    @GetMapping("/{cameraId}")
    public CameraDto getCamera(@PathVariable String cameraId) {
        Camera camera = cameraRepository.findById(cameraId)
                .orElseThrow(() -> new NoSuchElementException("Unknown camera: " + cameraId));
        return CameraDto.from(camera);
    }
}
