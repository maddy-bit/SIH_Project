package com.cityai.backend.util;

/**
 * Mirrors ai-service/utils/plate_normalizer.py so a plate typed into the
 * search box ("MH12 AB 1234", "mh12ab1234", ...) matches what was stored
 * from OCR output.
 */
public final class PlateNormalizer {

    private PlateNormalizer() {
    }

    public static String normalize(String rawText) {
        if (rawText == null) {
            return "";
        }
        return rawText.toUpperCase().replaceAll("[^A-Z0-9]", "");
    }
}
