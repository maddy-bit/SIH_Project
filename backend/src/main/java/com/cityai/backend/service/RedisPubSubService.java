package com.cityai.backend.service;

import com.cityai.backend.dto.VehicleDetectionDto;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.listener.Topic;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

@Service
public class RedisPubSubService implements MessageListener {

    private static final Logger log = LoggerFactory.getLogger(RedisPubSubService.class);

    private final RedisTemplate<String, Object> redisTemplate;
    private final ChannelTopic detectionTopic;
    private final RedisMessageListenerContainer listenerContainer;
    private final RedisConnectionFactory connectionFactory;
    private final ObjectMapper objectMapper;

    public RedisPubSubService(
            RedisTemplate<String, Object> redisTemplate,
            ChannelTopic detectionTopic,
            RedisMessageListenerContainer listenerContainer,
            RedisConnectionFactory connectionFactory,
            ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.detectionTopic = detectionTopic;
        this.listenerContainer = listenerContainer;
        this.connectionFactory = connectionFactory;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            try (RedisConnection connection = connectionFactory.getConnection()) {
                Topic topic = Objects.requireNonNull(detectionTopic, "detectionTopic must not be null");
                listenerContainer.addMessageListener(this, topic);
                listenerContainer.start();
                log.info("Subscribed to Redis detection topic: {}", detectionTopic.getTopic());
            }
        } catch (Exception e) {
            log.warn("Could not register Redis message listener (Redis may be offline): {}", e.getMessage());
        }
    }

    /**
     * Publishes a newly ingested vehicle detection event to all backend instances.
     */
    public void publishDetection(VehicleDetectionDto detection) {
        try {
            String json = objectMapper.writeValueAsString(detection);
            // Cast to Object to satisfy @NonNull Object parameter in convertAndSend
            Object payload = Objects.requireNonNull(json, "Serialized detection JSON must not be null");
            redisTemplate.convertAndSend(detectionTopic.getTopic(), payload);
            log.debug("Published detection to Redis for plate: {}", detection.plateTextNormalized());
        } catch (Exception e) {
            log.warn("Failed to publish detection to Redis: {}", e.getMessage());
        }
    }

    @Override
    public void onMessage(@NonNull Message message, @Nullable byte[] pattern) {
        try {
            String body = new String(message.getBody(), StandardCharsets.UTF_8);
            VehicleDetectionDto detection = objectMapper.readValue(body, VehicleDetectionDto.class);
            log.debug("Received distributed Redis detection event for plate: {} at camera: {}",
                    detection.plateTextNormalized(), detection.cameraId());
            // Handled across distributed nodes for real-time live map & investigation synchronization
        } catch (Exception e) {
            log.warn("Error processing Redis PubSub message: {}", e.getMessage());
        }
    }

    /**
     * Checks if Redis is accessible and returns ping latency in milliseconds (-1 if down).
     */
    public long checkLatencyMs() {
        try {
            long start = System.currentTimeMillis();
            try (RedisConnection connection = connectionFactory.getConnection()) {
                String ping = connection.ping();
                if ("PONG".equalsIgnoreCase(ping)) {
                    return System.currentTimeMillis() - start;
                }
            }
        } catch (Exception e) {
            log.debug("Redis ping check failed: {}", e.getMessage());
        }
        return -1;
    }
}
