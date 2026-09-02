package com.cityai.backend.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Deliberately scoped, honestly labeled: this is "basic-tier" auth, not a
 * production identity system. It protects the actual attack surface for
 * this prototype - anyone being able to inject fake detection events, or
 * read the audit log of who searched what - with HTTP Basic auth on
 * writes and on /api/audit/**, without requiring a login UI in the
 * investigation frontend, which stays read-only against these endpoints.
 *
 * NOT protected, and why:
 * - GET endpoints (search, trajectory, analytics, evidence images): the
 *   frontend calls these unauthenticated. Gating them would need a real
 *   login flow (session/JWT) in the frontend, which is a bigger,
 *   separate piece of work - see README's production-readiness table.
 * - The /ws/live/** WebSocket handshake: browsers can't attach an
 *   Authorization header to a native WebSocket connection; real
 *   WS auth needs a short-lived token passed some other way (query
 *   param, sub-protocol) - also listed as a follow-up, not implemented
 *   here rather than half-done.
 *
 * Credentials are configurable via INGEST_USERNAME/INGEST_PASSWORD env
 * vars; the defaults below are for local development only.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder,
            @Value("${ingest.username:ingest}") String username,
            @Value("${ingest.password:change-me-in-production}") String password) {
        var user = User.withUsername(username)
                .password(passwordEncoder.encode(password))
                .roles("INGEST")
                .build();
        return new InMemoryUserDetailsManager(user);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable()) // stateless JSON API, no cookies/sessions involved
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.POST, "/api/detections/**").authenticated()
                        .requestMatchers("/api/audit/**").authenticated()
                        .anyRequest().permitAll())
                .httpBasic(basic -> {});
        return http.build();
    }
}
