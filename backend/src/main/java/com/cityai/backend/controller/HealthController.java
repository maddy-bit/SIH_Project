package com.cityai.backend.controller;

import com.cityai.backend.service.RedisPubSubService;
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

    private final RedisPubSubService redisPubSubService;

    public HealthController(RedisPubSubService redisPubSubService) {
        this.redisPubSubService = redisPubSubService;
    }

    @GetMapping("/api/health")
    public HealthResponse health() {
        long latency = redisPubSubService.checkLatencyMs();
        String redisStatus = latency >= 0 ? "UP" : "STANDALONE_FALLBACK";
        return new HealthResponse("ok", SERVICE_NAME, VERSION, Instant.now().toString(), redisStatus, latency >= 0 ? latency : null);
    }

    public record HealthResponse(
            String status,
            String service,
            String version,
            String timestamp,
            String redisStatus,
            Long redisLatencyMs
    ) {}
}
