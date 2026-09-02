package com.cityai.backend.util;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class PlateNormalizerTest {

    @Test
    void normalizesSpacedPlate() {
        assertEquals("MH12AB1234", PlateNormalizer.normalize("MH 12 AB 1234"));
    }

    @Test
    void normalizesLowercasePlate() {
        assertEquals("MH12AB1234", PlateNormalizer.normalize("mh12ab1234"));
    }

    @Test
    void normalizesAlreadyCanonicalPlate() {
        assertEquals("MH12AB1234", PlateNormalizer.normalize("MH12AB1234"));
    }

    @Test
    void stripsPunctuationFromOcrNoise() {
        assertEquals("MH12AB1234", PlateNormalizer.normalize("MH-12-AB-1234"));
    }

    @Test
    void returnsEmptyStringForNull() {
        assertEquals("", PlateNormalizer.normalize(null));
    }
}
