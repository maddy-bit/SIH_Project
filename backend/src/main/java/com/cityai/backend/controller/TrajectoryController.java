package com.cityai.backend.controller;

import com.cityai.backend.dto.TrajectoryPointDto;
import com.cityai.backend.dto.TrajectoryResponseDto;
import com.cityai.backend.dto.VehicleDto;
import com.cityai.backend.trajectory.TrajectoryEngine;
import com.cityai.backend.util.PlateNormalizer;
import java.util.ArrayList;
import java.util.List;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vehicles")
@Transactional(readOnly = true)
public class TrajectoryController {

    private final TrajectoryEngine trajectoryEngine;

    public TrajectoryController(TrajectoryEngine trajectoryEngine) {
        this.trajectoryEngine = trajectoryEngine;
    }

    @GetMapping("/{plate}/trajectory")
    public TrajectoryResponseDto getTrajectory(@PathVariable String plate) {
        String normalized = PlateNormalizer.normalize(plate);
        var result = trajectoryEngine.reconstruct(normalized);

        List<TrajectoryPointDto> points = new ArrayList<>();
        for (int i = 0; i < result.visits().size(); i++) {
            var visit = result.visits().get(i);
            Double incomingConfidence = null;
            String note = null;
            if (i > 0) {
                var transition = result.transitions().get(i - 1);
                incomingConfidence = transition.score().confidence();
                note = transition.score().note();
            }
            points.add(new TrajectoryPointDto(
                    visit.camera().getId(),
                    visit.camera().getName(),
                    visit.camera().getLatitude(),
                    visit.camera().getLongitude(),
                    visit.camera().getDirection(),
                    visit.firstSeen(),
                    visit.bestPlateConfidence(),
                    visit.bestDetectionConfidence(),
                    visit.bestImagePath(),
                    visit.detectionCount(),
                    incomingConfidence,
                    note
            ));
        }

        return new TrajectoryResponseDto(
                VehicleDto.from(result.vehicle()),
                points,
                result.overallConfidence(),
                result.totalDistanceKm(),
                result.totalDurationMinutes(),
                result.warning()
        );
    }
}
