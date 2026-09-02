package com.cityai.backend.service;

import com.cityai.backend.model.Camera;
import com.cityai.backend.repository.CameraRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.File;
import java.io.IOException;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds the camera network from data/cameras.json on startup, if the
 * cameras table is empty. Vehicles are NOT seeded here - they're created
 * lazily as detections come in (see DetectionIngestionService), enriched
 * from the mock registry.
 */
@Component
public class DataSeedService implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeedService.class);

    private final CameraRepository cameraRepository;
    private final String dataDir;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public DataSeedService(CameraRepository cameraRepository, @Value("${app.data-dir}") String dataDir) {
        this.cameraRepository = cameraRepository;
        this.dataDir = dataDir;
    }

    @Override
    public void run(String... args) throws IOException {
        if (cameraRepository.count() > 0) {
            log.info("Cameras already seeded ({} rows) - skipping.", cameraRepository.count());
            return;
        }

        File file = new File(dataDir, "cameras.json");
        if (!file.exists()) {
            log.warn("Camera seed file not found at {} - no cameras loaded.", file.getAbsolutePath());
            return;
        }

        List<CameraRecord> records = objectMapper.readValue(
                file, objectMapper.getTypeFactory().constructCollectionType(List.class, CameraRecord.class));

        for (CameraRecord record : records) {
            cameraRepository.save(new Camera(
                    record.id(), record.name(), record.latitude(), record.longitude(),
                    record.direction(), record.status(), record.videoSource()));
        }
        log.info("Seeded {} cameras from {}", records.size(), file.getAbsolutePath());
    }
}
