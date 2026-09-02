package com.cityai.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Entry point for the City AI Traffic Intelligence Engine backend (SIH26127).
 *
 * Phase 1: project skeleton only. Investigation, trajectory, and AI-proxy
 * modules are added in later phases per the phased build plan.
 */
@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
