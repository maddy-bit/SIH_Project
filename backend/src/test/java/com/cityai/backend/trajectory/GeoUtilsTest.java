package com.cityai.backend.trajectory;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class GeoUtilsTest {

    @Test
    void distanceBetweenSamePointIsZero() {
        assertEquals(0.0, GeoUtils.distanceKm(18.53, 73.85, 18.53, 73.85), 0.0001);
    }

    @Test
    void distanceBetweenPuneCamerasIsPlausible() {
        // CAM-01 (Shivajinagar) -> CAM-11 (Aundh), roughly a few km apart in Pune.
        double distance = GeoUtils.distanceKm(18.5308, 73.8474, 18.5590, 73.8080);
        assertTrue(distance > 1 && distance < 15, "expected a plausible intra-city distance, got " + distance);
    }

    @Test
    void bearingDueNorthIsZero() {
        double bearing = GeoUtils.bearingDegrees(18.0, 73.0, 19.0, 73.0);
        assertEquals(0.0, bearing, 1.0);
    }

    @Test
    void bearingDueEastIsNinety() {
        double bearing = GeoUtils.bearingDegrees(18.0, 73.0, 18.0, 74.0);
        assertEquals(90.0, bearing, 1.0);
    }

    @Test
    void angularDifferenceWrapsAroundNorth() {
        assertEquals(20.0, GeoUtils.angularDifference(350, 10), 0.001);
    }
}
