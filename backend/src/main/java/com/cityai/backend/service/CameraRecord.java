package com.cityai.backend.service;

/** Shape of one entry in data/cameras.json. */
public record CameraRecord(
        String id,
        String name,
        double latitude,
        double longitude,
        String direction,
        String status,
        String videoSource
) {
}
