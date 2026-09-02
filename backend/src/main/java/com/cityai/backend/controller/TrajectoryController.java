package com.cityai.backend.controller;

import com.cityai.backend.dto.TrajectoryResponseDto;
import com.cityai.backend.trajectory.TrajectoryEngine;
import com.cityai.backend.util.PlateNormalizer;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
public class TrajectoryController {

    private final TrajectoryEngine trajectoryEngine;

    public TrajectoryController(TrajectoryEngine trajectoryEngine) {
        this.trajectoryEngine = trajectoryEngine;
    }

    @GetMapping("/{plate}/trajectory")
    public TrajectoryResponseDto getTrajectory(@PathVariable String plate) {
        return trajectoryEngine.reconstructAsDto(PlateNormalizer.normalize(plate));
    }
}
