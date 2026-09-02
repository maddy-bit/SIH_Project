package com.cityai.backend.controller;

import java.time.Instant;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Simple liveness endpoint used by the frontend dashboard header
 * (SYSTEM ONLINE / OFFLINE indicator) and for local verification.
 */
@RestController
public class HealthController {

    private static final String SERVICE_NAME = "city-ai-backend";
    private static final String VERSION = "0.1.0";

    @GetMapping("/api/health")
    public HealthResponse health() {
        return new HealthResponse("ok", SERVICE_NAME, VERSION, Instant.now().toString());
    }

    public record HealthResponse(String status, String service, String version, String timestamp) {}
}
