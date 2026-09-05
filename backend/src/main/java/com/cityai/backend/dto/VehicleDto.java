package com.cityai.backend.dto;

import com.cityai.backend.model.Vehicle;

public record VehicleDto(
        String plate,
        String vehicleType,
        String color,
        String make,
        String model
) {
    public static VehicleDto from(Vehicle vehicle) {
        return new VehicleDto(
                vehicle.getPlate(),
                vehicle.getVehicleType(),
                vehicle.getColor(),
                vehicle.getMake(),
                vehicle.getModel()
        );
    }
}
