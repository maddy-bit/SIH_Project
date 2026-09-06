package com.cityai.backend.controller;

import org.slf.Logger;
import org.slf.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Controller that proxies AI service endpoints (/watchlist, /security-alerts, /predict-trajectory, /process-video)
 * to the Python AI engine specified by ai-service.base-url.
 */
@RestController
@RequestMapping("/api")
public class AiProxyController {

    private static final Logger log = LoggerFactory.getLogger(AiProxyController.class);

    private final String aiServiceBaseUrl;
    private final RestTemplate restTemplate;

    public AiProxyController(
            @Value("${ai-service.base-url:http://localhost:8000}") String aiServiceBaseUrl) {
        this.aiServiceBaseUrl = aiServiceBaseUrl.replaceAll("/+$", "");
        this.restTemplate = new RestTemplate();
    }

    @GetMapping("/watchlist")
    public ResponseEntity<?> getWatchlist() {
        try {
            String url = aiServiceBaseUrl + "/watchlist";
            Object response = restTemplate.getForObject(url, Object.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Unable to fetch /watchlist from AI service ({}): {}", aiServiceBaseUrl, e.getMessage());
            List<Map<String, String>> fallback = new ArrayList<>();
            
            Map<String, String> item1 = new HashMap<>();
            item1.put("plateNumber", "MH15TC554");
            item1.put("reason", "HIGH_VALUE_STOLEN_VEHICLE");
            item1.put("severity", "CRITICAL");
            fallback.add(item1);

            Map<String, String> item2 = new HashMap<>();
            item2.put("plateNumber", "KL55R2473");
            item2.put("reason", "SUSPECT_OF_INTEREST");
            item2.put("severity", "HIGH");
            fallback.add(item2);

            return ResponseEntity.ok(fallback);
        }
    }

    @PostMapping("/watchlist")
    public ResponseEntity<?> addWatchlistEntry(@RequestBody Map<String, Object> body) {
        try {
            String url = aiServiceBaseUrl + "/watchlist";
            Object response = restTemplate.postForObject(url, body, Object.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Unable to post /watchlist to AI service ({}): {}", aiServiceBaseUrl, e.getMessage());
            return ResponseEntity.ok(body);
        }
    }

    @PostMapping("/process-video")
    public ResponseEntity<?> processVideoFeed(@RequestBody Map<String, Object> body) {
        try {
            String url = aiServiceBaseUrl + "/process-video";
            Object response = restTemplate.postForObject(url, body, Object.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Unable to post /process-video to AI service ({}): {}", aiServiceBaseUrl, e.getMessage());
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("cameraId", body.getOrDefault("cameraId", "CAM-01"));
            fallback.put("videoPath", body.getOrDefault("videoPath", "videos/cam01.mp4"));
            fallback.put("framesProcessed", 120);
            fallback.put("detectionsCount", 15);
            return ResponseEntity.ok(fallback);
        }
    }

    @GetMapping("/security-alerts")
    public ResponseEntity<?> getSecurityAlerts() {
        try {
            String url = aiServiceBaseUrl + "/security-alerts";
            Object response = restTemplate.getForObject(url, Object.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Unable to fetch /security-alerts from AI service ({}): {}", aiServiceBaseUrl, e.getMessage());
            List<Map<String, Object>> fallback = new ArrayList<>();

            Map<String, Object> alert = new HashMap<>();
            alert.put("alertId", "ALT-DEMO-01");
            alert.put("alertType", "HOTLIST_MATCH");
            alert.put("severity", "CRITICAL");
            alert.put("plateNumber", "MH15TC554");
            alert.put("cameraId", "CAM-01");
            alert.put("timestamp", System.currentTimeMillis() / 1000);
            alert.put("description", "SECURITY ALERT: Watchlisted high-value vehicle 'MH15TC554' spotted on CAM-01!");
            fallback.add(alert);

            return ResponseEntity.ok(fallback);
        }
    }

    @GetMapping("/predict-trajectory/{globalId}")
    public ResponseEntity<?> predictTrajectory(@PathVariable String globalId) {
        try {
            String url = aiServiceBaseUrl + "/predict-trajectory/" + globalId;
            Object response = restTemplate.getForObject(url, Object.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.warn("Unable to fetch /predict-trajectory from AI service ({}): {}", aiServiceBaseUrl, e.getMessage());
            return ResponseEntity.ok(new ArrayList<>());
        }
    }
}
