package com.cityai.backend.service;

/** Shape of one entry in data/vehicles.json (the mock registry). */
public record VehicleRegistryRecord(
        String plate,
        String vehicleType,
        String make,
        String model,
        String color
) {
}
