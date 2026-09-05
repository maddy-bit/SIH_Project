package com.cityai.backend.dto;

import com.cityai.backend.model.AuditLogEntry;
import java.time.Instant;

public record AuditLogEntryDto(Instant timestamp, String action, String plate, String remoteAddress) {
    public static AuditLogEntryDto from(AuditLogEntry entry) {
        return new AuditLogEntryDto(entry.getTimestamp(), entry.getAction(), entry.getPlate(), entry.getRemoteAddress());
    }
}
