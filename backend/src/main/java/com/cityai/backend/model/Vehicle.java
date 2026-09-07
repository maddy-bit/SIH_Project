package com.cityai.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

/**
 * A vehicle identity. Created lazily on first detection ingestion (see
 * DetectionIngestionService) and enriched with registry metadata
 * (type/make/model/color) via VehicleRegistryService when available.
 */
@Entity
@Table(name = "vehicles", uniqueConstraints = @UniqueConstraint(columnNames = "plate"))
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Normalized registration number, e.g. "MH12AB1234". */
    @Column(nullable = false, unique = true)
    private String plate;

    private String vehicleType;
    private String color;
    private String make;
    private String model;

    protected Vehicle() {
        // JPA
    }

    public Vehicle(String plate) {
        this.plate = plate;
    }

    public Vehicle(String plate, String vehicleType, String color, String make, String model) {
        this.plate = plate;
        this.vehicleType = vehicleType;
        this.color = color;
        this.make = make;
        this.model = model;
    }

    public Long getId() {
        return id;
    }

    public String getPlate() {
        return plate;
    }

    public String getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(String vehicleType) {
        this.vehicleType = vehicleType;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public String getMake() {
        return make;
    }

    public void setMake(String make) {
        this.make = make;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
