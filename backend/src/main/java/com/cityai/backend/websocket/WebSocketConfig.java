package com.cityai.backend.websocket;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    private final LiveTrackingWebSocketHandler liveTrackingWebSocketHandler;
    private final String[] allowedOrigins;

    public WebSocketConfig(
            LiveTrackingWebSocketHandler liveTrackingWebSocketHandler,
            @Value("${cors.allowed-origins:http://localhost:3000}") String allowedOriginsProp) {
        this.liveTrackingWebSocketHandler = liveTrackingWebSocketHandler;
        this.allowedOrigins = allowedOriginsProp.split("\\s*,\\s*");
    }

    @Override
    public void registerWebSocketHandlers(@org.springframework.lang.NonNull WebSocketHandlerRegistry registry) {
        if (liveTrackingWebSocketHandler != null && allowedOrigins != null) {
            registry.addHandler(liveTrackingWebSocketHandler, "/ws/live/{plate}")
                    .setAllowedOrigins(allowedOrigins);
        }
    }
}
