package com.cityai.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * A camera node in the city network. Seeded from data/cameras.json at
 * startup (see DataSeedService) - id is a human-readable code like
 * "CAM-01" so it can be used directly in URLs and demo scripts.
 */
@Entity
@Table(name = "cameras")
public class Camera {

    @Id
    private String id;

    private String name;
    private double latitude;
    private double longitude;

    /** Compass direction the camera faces, e.g. "NE". */
    private String direction;

    /** ONLINE, PROCESSING, or OFFLINE. */
    private String status;

    /** Relative path to the demo video/image source for this camera. */
    private String videoSource;

    protected Camera() {
        // JPA
    }

    public Camera(String id, String name, double latitude, double longitude,
                  String direction, String status, String videoSource) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
        this.direction = direction;
        this.status = status;
        this.videoSource = videoSource;
    }

    public String getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public String getDirection() {
        return direction;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVideoSource() {
        return videoSource;
    }
}
