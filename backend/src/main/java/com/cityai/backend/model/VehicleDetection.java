package com.cityai.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * One AI-pipeline detection event: a vehicle observed by one camera at one
 * point in time. Produced by the AI service's video-processing pipeline
 * (vehicle detection -> plate detection -> OCR -> tracking) and ingested
 * via DetectionController. This is the raw evidence the trajectory engine
 * (Phase 9) later groups and scores into routes.
 */
@Entity
@Table(name = "vehicle_detections", indexes = {
        @Index(name = "idx_detection_camera_time", columnList = "camera_id,timestamp"),
        @Index(name = "idx_detection_vehicle_time", columnList = "vehicle_id,timestamp")
})
public class VehicleDetection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Nullable: a detection is stored as raw evidence even when the plate
    // couldn't be read. It gets linked to a Vehicle once a plate read (or,
    // from Phase 8+, appearance/trajectory matching) resolves an identity.
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "vehicle_id")
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "camera_id")
    private Camera camera;

    @Column(nullable = false)
    private Instant timestamp;

    private double latitude;
    private double longitude;
    private String direction;
    private Double speedKmh;

    /** Detector class for the vehicle bounding box, e.g. "car", "truck". */
    private String vehicleClass;

    /** Vehicle-detector confidence (0-1). */
    private Double detectionConfidence;

    /** OCR confidence for the plate read (0-1), null if plate unreadable. */
    private Double plateConfidence;

    /** As read by OCR before normalization, e.g. "MH 12 AB 1234". */
    private String plateTextRaw;

    /** Normalized plate actually used for matching, e.g. "MH12AB1234". */
    private String plateTextNormalized;

    /** Placeholder for appearance-based Re-ID confidence (Phase 8+). */
    private Double reidConfidence;

    /** Path to the saved evidence frame for this detection. */
    private String imagePath;

    /** Per-camera tracker ID (ByteTrack), for within-camera track continuity. */
    private Integer trackId;

    private Integer frameNumber;

    protected VehicleDetection() {
        // JPA
    }

    public VehicleDetection(Vehicle vehicle, Camera camera, Instant timestamp) {
        this.vehicle = vehicle;
        this.camera = camera;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public Vehicle getVehicle() {
        return vehicle;
    }

    public void setVehicle(Vehicle vehicle) {
        this.vehicle = vehicle;
    }

    public Camera getCamera() {
        return camera;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public String getDirection() {
        return direction;
    }

    public void setDirection(String direction) {
        this.direction = direction;
    }

    public Double getSpeedKmh() {
        return speedKmh;
    }

    public void setSpeedKmh(Double speedKmh) {
        this.speedKmh = speedKmh;
    }

    public String getVehicleClass() {
        return vehicleClass;
    }

    public void setVehicleClass(String vehicleClass) {
        this.vehicleClass = vehicleClass;
    }

    public Double getDetectionConfidence() {
        return detectionConfidence;
    }

    public void setDetectionConfidence(Double detectionConfidence) {
        this.detectionConfidence = detectionConfidence;
    }

    public Double getPlateConfidence() {
        return plateConfidence;
    }

    public void setPlateConfidence(Double plateConfidence) {
        this.plateConfidence = plateConfidence;
    }

    public String getPlateTextRaw() {
        return plateTextRaw;
    }

    public void setPlateTextRaw(String plateTextRaw) {
        this.plateTextRaw = plateTextRaw;
    }

    public String getPlateTextNormalized() {
        return plateTextNormalized;
    }

    public void setPlateTextNormalized(String plateTextNormalized) {
        this.plateTextNormalized = plateTextNormalized;
    }

    public Double getReidConfidence() {
        return reidConfidence;
    }

    public void setReidConfidence(Double reidConfidence) {
        this.reidConfidence = reidConfidence;
    }

    public String getImagePath() {
        return imagePath;
    }

    public void setImagePath(String imagePath) {
        this.imagePath = imagePath;
    }

    public Integer getTrackId() {
        return trackId;
    }

    public void setTrackId(Integer trackId) {
        this.trackId = trackId;
    }

    public Integer getFrameNumber() {
        return frameNumber;
    }

    public void setFrameNumber(Integer frameNumber) {
        this.frameNumber = frameNumber;
    }
}
