package com.cityai.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.concurrent.TimeUnit;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@Order(1)
public class RedisRateLimiterFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimiterFilter.class);

    private final StringRedisTemplate stringRedisTemplate;
    private final boolean enabled;
    private final long requestsPerMinute;

    public RedisRateLimiterFilter(
            StringRedisTemplate stringRedisTemplate,
            @Value("${ratelimit.enabled:true}") boolean enabled,
            @Value("${ratelimit.requests-per-minute:300}") long requestsPerMinute) {
        this.stringRedisTemplate = stringRedisTemplate;
        this.enabled = enabled;
        this.requestsPerMinute = requestsPerMinute;
    }

    @Override
    protected void doFilterInternal(
            @org.springframework.lang.NonNull HttpServletRequest request,
            @org.springframework.lang.NonNull HttpServletResponse response,
            @org.springframework.lang.NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (!enabled || !isRateLimitedPath(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        long currentMinute = Instant.now().getEpochSecond() / 60;
        String key = "ratelimit:" + clientIp + ":" + currentMinute;

        try {
            Long count = stringRedisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                stringRedisTemplate.expire(key, 65, TimeUnit.SECONDS);
            }

            long currentCount = count != null ? count : 1;
            response.setHeader("X-RateLimit-Limit", String.valueOf(requestsPerMinute));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(Math.max(0, requestsPerMinute - currentCount)));

            if (currentCount > requestsPerMinute) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.setHeader("Retry-After", "60");
                response.getWriter().write(String.format(
                        "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded (%d requests/minute).\",\"retryAfterSeconds\":60}",
                        requestsPerMinute
                ));
                return;
            }
        } catch (Exception e) {
            // Redis unavailable - gracefully fail open so user traffic is never blocked
            log.debug("Redis rate limiter unavailable, falling through: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    private boolean isRateLimitedPath(String uri) {
        return uri.startsWith("/api/vehicles")
                || uri.startsWith("/api/detections/ingest")
                || uri.startsWith("/api/ai");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}
