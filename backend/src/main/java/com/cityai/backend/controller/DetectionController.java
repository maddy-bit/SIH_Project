package com.cityai.backend.controller;

import com.cityai.backend.dto.DetectionIngestRequest;
import com.cityai.backend.dto.VehicleDetectionDto;
import com.cityai.backend.service.DetectionIngestionService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ingestion endpoint for the AI service's video pipeline output.
 * See scripts/process_video.py, which calls this once per detection event
 * after processing a camera's video.
 */
@RestController
@RequestMapping("/api/detections")
public class DetectionController {

    private final DetectionIngestionService ingestionService;

    public DetectionController(DetectionIngestionService ingestionService) {
        this.ingestionService = ingestionService;
    }

    @PostMapping("/ingest")
    public ResponseEntity<VehicleDetectionDto> ingest(@Valid @RequestBody DetectionIngestRequest request) {
        var saved = ingestionService.ingest(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(VehicleDetectionDto.from(saved));
    }

    @PostMapping("/ingest/batch")
    public ResponseEntity<List<VehicleDetectionDto>> ingestBatch(@Valid @RequestBody List<DetectionIngestRequest> requests) {
        List<VehicleDetectionDto> saved = requests.stream()
                .map(ingestionService::ingest)
                .map(VehicleDetectionDto::from)
                .toList();
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
}
