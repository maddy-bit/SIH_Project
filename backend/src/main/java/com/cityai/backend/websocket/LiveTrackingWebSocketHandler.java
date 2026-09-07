package com.cityai.backend.websocket;

import com.cityai.backend.dto.TrajectoryPointDto;
import com.cityai.backend.dto.TrajectoryResponseDto;
import com.cityai.backend.trajectory.TrajectoryEngine;
import com.cityai.backend.util.PlateNormalizer;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.List;
import java.util.NoSuchElementException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

/**
 * Simulates live camera processing for GET /ws/live/{plate}: replays the
 * vehicle's already-reconstructed trajectory (see TrajectoryEngine) as a
 * chronological stream of "detection" events, a few seconds apart -
 * exactly the master prompt's "simulate live camera processing" spec.
 * This is explicitly a simulation over stored/demo data, not a live RTSP
 * feed - there is no such feed in this prototype.
 */
@Component
public class LiveTrackingWebSocketHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(LiveTrackingWebSocketHandler.class);

    /** Fixed pacing between simulated detection events - illustrative, not real elapsed time. */
    private static final long EVENT_INTERVAL_SECONDS = 3;

    private final TrajectoryEngine trajectoryEngine;
    private final ObjectMapper objectMapper;
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(4);
    private final Map<String, List<ScheduledFuture<?>>> sessionTasks = new ConcurrentHashMap<>();

    public LiveTrackingWebSocketHandler(TrajectoryEngine trajectoryEngine, ObjectMapper objectMapper) {
        this.trajectoryEngine = trajectoryEngine;
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(@org.springframework.lang.NonNull WebSocketSession session) {
        String plate = extractPlate(session);
        if (plate == null || plate.isBlank()) {
            sendAndClose(session, errorMessage("No plate specified. Connect to /ws/live/{plate}."));
            return;
        }

        String normalized = PlateNormalizer.normalize(plate);
        TrajectoryResponseDto trajectory;
        try {
            trajectory = trajectoryEngine.reconstructAsDto(normalized);
        } catch (NoSuchElementException e) {
            sendAndClose(session, errorMessage("No vehicle found for plate: " + normalized));
            return;
        }

        List<TrajectoryPointDto> points = trajectory.points();
        if (points.isEmpty()) {
            sendAndClose(session, errorMessage("No detections available to simulate for: " + normalized));
            return;
        }

        send(session, connectedMessage(normalized, points.size()));

        List<ScheduledFuture<?>> tasks = sessionTasks.computeIfAbsent(session.getId(), id -> new java.util.ArrayList<>());
        for (int i = 0; i < points.size(); i++) {
            int index = i;
            ScheduledFuture<?> task = scheduler.schedule(
                    () -> sendDetectionEvent(session, points, index, trajectory),
                    (index + 1) * EVENT_INTERVAL_SECONDS,
                    TimeUnit.SECONDS);
            tasks.add(task);
        }
    }

    private void sendDetectionEvent(WebSocketSession session, List<TrajectoryPointDto> points, int index, TrajectoryResponseDto trajectory) {
        if (!session.isOpen()) return;
        try {
            Map<String, Object> message = Map.of(
                    "type", "detection",
                    "index", index,
                    "total", points.size(),
                    "point", points.get(index)
            );
            session.sendMessage(new TextMessage(java.util.Objects.requireNonNull(objectMapper.writeValueAsString(message))));

            if (index == points.size() - 1) {
                Map<String, Object> complete = Map.of(
                        "type", "complete",
                        "overallConfidence", trajectory.overallConfidence() != null ? trajectory.overallConfidence() : 1.0,
                        "estimatedDistanceKm", trajectory.estimatedDistanceKm(),
                        "estimatedDurationMinutes", trajectory.estimatedDurationMinutes()
                );
                session.sendMessage(new TextMessage(java.util.Objects.requireNonNull(objectMapper.writeValueAsString(complete))));
                session.close(java.util.Objects.requireNonNull(CloseStatus.NORMAL));
            }
        } catch (IOException e) {
            log.debug("Failed to send live detection event (client likely disconnected): {}", e.getMessage());
        }
    }

    @Override
    public void afterConnectionClosed(@org.springframework.lang.NonNull WebSocketSession session, @org.springframework.lang.NonNull CloseStatus status) {
        List<ScheduledFuture<?>> tasks = sessionTasks.remove(session.getId());
        if (tasks != null) {
            tasks.forEach(t -> t.cancel(false));
        }
    }

    private String extractPlate(WebSocketSession session) {
        java.net.URI uri = session.getUri();
        String path = uri != null ? uri.getPath() : null;
        if (path == null) return null;
        String[] segments = path.split("/");
        return segments.length > 0 ? segments[segments.length - 1] : null;
    }

    private void send(WebSocketSession session, Map<String, Object> message) {
        try {
            session.sendMessage(new TextMessage(java.util.Objects.requireNonNull(objectMapper.writeValueAsString(message))));
        } catch (IOException e) {
            log.debug("Failed to send live tracking message: {}", e.getMessage());
        }
    }

    private void sendAndClose(WebSocketSession session, Map<String, Object> message) {
        send(session, message);
        try {
            session.close(java.util.Objects.requireNonNull(CloseStatus.NORMAL));
        } catch (IOException ignored) {
            // session already closing
        }
    }

    private Map<String, Object> connectedMessage(String plate, int totalEvents) {
        return Map.of("type", "connected", "plate", plate, "totalEvents", totalEvents);
    }

    private Map<String, Object> errorMessage(String message) {
        return Map.of("type", "error", "message", message);
    }
}
