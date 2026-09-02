package com.cityai.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.io.File;
import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Local mock vehicle registry backed by data/vehicles.json - NOT a real
 * government/RTO integration. See VehicleRegistryService for the swap point.
 */
@Service
public class MockVehicleRegistryService implements VehicleRegistryService {

    private static final Logger log = LoggerFactory.getLogger(MockVehicleRegistryService.class);

    private final String dataDir;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private Map<String, VehicleRegistryRecord> byPlate = new HashMap<>();

    public MockVehicleRegistryService(@Value("${app.data-dir}") String dataDir) {
        this.dataDir = dataDir;
    }

    @PostConstruct
    void load() {
        File file = new File(dataDir, "vehicles.json");
        if (!file.exists()) {
            log.warn("Mock vehicle registry file not found at {} - registry will be empty", file.getAbsolutePath());
            return;
        }
        try {
            List<VehicleRegistryRecord> records =
                    objectMapper.readValue(file, objectMapper.getTypeFactory()
                            .constructCollectionType(List.class, VehicleRegistryRecord.class));
            Map<String, VehicleRegistryRecord> loaded = new HashMap<>();
            for (VehicleRegistryRecord record : records) {
                loaded.put(record.plate().toUpperCase(), record);
            }
            this.byPlate = loaded;
            log.info("Loaded {} mock vehicle registry entries from {}", loaded.size(), file.getAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to load mock vehicle registry from {}", file.getAbsolutePath(), e);
        }
    }

    @Override
    public Optional<VehicleRegistryRecord> lookup(String normalizedPlate) {
        if (normalizedPlate == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(byPlate.get(normalizedPlate.toUpperCase()));
    }
}
