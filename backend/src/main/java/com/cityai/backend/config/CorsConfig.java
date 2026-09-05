package com.cityai.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Allows the Next.js frontend (local dev) to call this API directly.
 * Origins are read from CORS_ALLOWED_ORIGINS (comma separated) with a
 * sensible localhost default for prototype use.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public CorsConfig(
            @org.springframework.beans.factory.annotation.Value(
                    "${cors.allowed-origins:http://localhost:3000}") String allowedOriginsProp) {
        this.allowedOrigins = allowedOriginsProp.split("\\s*,\\s*");
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
