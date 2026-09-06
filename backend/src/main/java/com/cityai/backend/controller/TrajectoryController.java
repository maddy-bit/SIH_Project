package com.cityai.backend.controller;

import com.cityai.backend.dto.TrajectoryResponseDto;
import com.cityai.backend.service.AuditLogService;
import com.cityai.backend.trajectory.TrajectoryEngine;
import com.cityai.backend.util.PlateNormalizer;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class TrajectoryController {

    private final TrajectoryEngine trajectoryEngine;
    private final AuditLogService auditLogService;

    public TrajectoryController(TrajectoryEngine trajectoryEngine, AuditLogService auditLogService) {
        this.trajectoryEngine = trajectoryEngine;
        this.auditLogService = auditLogService;
    }

    @GetMapping("/{plate}/trajectory")
    public TrajectoryResponseDto getTrajectory(@PathVariable("plate") String plate, HttpServletRequest request) {
        String normalized = PlateNormalizer.normalize(plate);
        auditLogService.record("TRAJECTORY_VIEW", normalized, request);
        return trajectoryEngine.reconstructAsDto(normalized);
    }
}
