package com.cityai.backend.trajectory;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.cityai.backend.model.Camera;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.Test;

class TrajectoryScoringServiceTest {

    private final TrajectoryScoringService scoringService = new TrajectoryScoringService();

    // Two real demo cameras, ~1.7 km apart (CAM-01 -> CAM-03 in data/cameras.json).
    private final Camera cam01 = new Camera("CAM-01", "Shivajinagar Chowk", 18.5308, 73.8474, "SE", "ONLINE", "");
    private final Camera cam03 = new Camera("CAM-03", "JM Road - Deccan Gymkhana", 18.5158, 73.8412, "SW", "ONLINE", "");

    @Test
    void plausibleTransitionScoresHighConfidence() {
        Instant t1 = Instant.parse("2026-08-30T18:14:23Z");
        Instant t2 = t1.plus(7, ChronoUnit.MINUTES); // matches the master prompt's example gap

        var score = scoringService.score(cam01, t1, 0.95, cam03, t2, 0.90);

        assertFalse(score.physicallyImplausible());
        assertTrue(score.confidence() > 0.6, "expected a high-confidence match, got " + score.confidence());
    }

    @Test
    void impossibleSpeedIsFlaggedAndCapped() {
        Instant t1 = Instant.parse("2026-08-30T18:14:23Z");
        Instant t2 = t1.plus(1, ChronoUnit.SECONDS); // ~1.7 km in 1 second is not a car

        var score = scoringService.score(cam01, t1, 0.95, cam03, t2, 0.90);

        assertTrue(score.physicallyImplausible());
        assertTrue(score.confidence() <= 0.2, "expected a heavily capped confidence, got " + score.confidence());
        assertTrue(score.note() != null && score.note().contains("Implied speed"));
    }

    @Test
    void missingPlateConfidenceFallsBackToNeutralScore() {
        Instant t1 = Instant.parse("2026-08-30T18:14:23Z");
        Instant t2 = t1.plus(7, ChronoUnit.MINUTES);

        var score = scoringService.score(cam01, t1, null, cam03, t2, null);

        assertFalse(score.physicallyImplausible());
        assertTrue(score.plateScore() == 0.5);
    }
}
