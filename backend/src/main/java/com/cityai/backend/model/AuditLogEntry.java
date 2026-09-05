package com.cityai.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

/**
 * One investigation-relevant access, e.g. "someone searched plate X at
 * time Y from IP Z". This is what the master prompt's "audit logs" /
 * "access logging" security requirement means for a law-enforcement-style
 * tool - who looked up what, and when - not a general request log.
 */
@Entity
@Table(name = "audit_log_entries")
public class AuditLogEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Instant timestamp;
    private String action;   // e.g. "VEHICLE_SEARCH", "TRAJECTORY_VIEW"
    private String plate;    // normalized plate looked up, if applicable
    private String remoteAddress;

    protected AuditLogEntry() {
        // JPA
    }

    public AuditLogEntry(Instant timestamp, String action, String plate, String remoteAddress) {
        this.timestamp = timestamp;
        this.action = action;
        this.plate = plate;
        this.remoteAddress = remoteAddress;
    }

    public Long getId() {
        return id;
    }

    public Instant getTimestamp() {
        return timestamp;
    }

    public String getAction() {
        return action;
    }

    public String getPlate() {
        return plate;
    }

    public String getRemoteAddress() {
        return remoteAddress;
    }
}
