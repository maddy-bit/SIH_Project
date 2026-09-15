package com.cityai.backend.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.jsontype.impl.LaissezFaireSubTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.cache.Cache;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.RedisMessageListenerContainer;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.lang.NonNull;
import org.springframework.lang.Nullable;

@Configuration
@ConditionalOnClass(RedisConnectionFactory.class)
public class RedisConfig implements CachingConfigurer {

    private static final Logger log = LoggerFactory.getLogger(RedisConfig.class);
    public static final String DETECTION_LIVE_TOPIC = "cityai:detections:live";

    @Bean
    public ChannelTopic detectionTopic() {
        return new ChannelTopic(DETECTION_LIVE_TOPIC);
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer stringSerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer jsonSerializer = buildJsonSerializer();

        template.setKeySerializer(stringSerializer);
        template.setHashKeySerializer(stringSerializer);
        template.setValueSerializer(Objects.requireNonNull(jsonSerializer, "value serializer"));
        template.setHashValueSerializer(Objects.requireNonNull(jsonSerializer, "hash-value serializer"));
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public RedisCacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer jsonSerializer = buildJsonSerializer();

        // Explicit non-null durations to satisfy @NonNull in RedisCacheConfiguration API
        final Duration ttl10m = Objects.requireNonNull(Duration.ofMinutes(10));
        final Duration ttl5m  = Objects.requireNonNull(Duration.ofMinutes(5));
        final Duration ttl1h  = Objects.requireNonNull(Duration.ofHours(1));
        final Duration ttl2m  = Objects.requireNonNull(Duration.ofMinutes(2));

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(ttl10m)
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                Objects.requireNonNull(jsonSerializer, "cache value serializer")));

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("trajectories", defaultConfig.entryTtl(ttl5m));
        cacheConfigs.put("vehicles",     defaultConfig.entryTtl(ttl10m));
        cacheConfigs.put("cameras",      defaultConfig.entryTtl(ttl1h));
        cacheConfigs.put("analytics",    defaultConfig.entryTtl(ttl2m));

        // Objects.requireNonNull used to prove non-nullness to the JDT null checker
        RedisConnectionFactory factory = Objects.requireNonNull(connectionFactory,
                "RedisConnectionFactory must not be null");

        return RedisCacheManager.builder(factory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }

    @Bean
    public RedisMessageListenerContainer redisMessageListenerContainer(RedisConnectionFactory connectionFactory) {
        RedisMessageListenerContainer container = new RedisMessageListenerContainer();
        container.setConnectionFactory(
                Objects.requireNonNull(connectionFactory, "RedisConnectionFactory must not be null"));
        return container;
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(
                    @NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
                log.warn("Redis GET failed on cache [{}] for key [{}]. Falling back to data source: {}",
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(
                    @NonNull RuntimeException exception, @NonNull Cache cache,
                    @NonNull Object key, @Nullable Object value) {
                log.warn("Redis PUT failed on cache [{}] for key [{}]: {}",
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(
                    @NonNull RuntimeException exception, @NonNull Cache cache, @NonNull Object key) {
                log.warn("Redis EVICT failed on cache [{}] for key [{}]: {}",
                        cache.getName(), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(
                    @NonNull RuntimeException exception, @NonNull Cache cache) {
                log.warn("Redis CLEAR failed on cache [{}]: {}",
                        cache.getName(), exception.getMessage());
            }
        };
    }

    // ── private helpers ──────────────────────────────────────────────────────

    private static GenericJackson2JsonRedisSerializer buildJsonSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.activateDefaultTyping(
                LaissezFaireSubTypeValidator.instance,
                ObjectMapper.DefaultTyping.NON_FINAL,
                JsonTypeInfo.As.PROPERTY
        );
        return new GenericJackson2JsonRedisSerializer(mapper);
    }
}
