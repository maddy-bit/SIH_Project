package com.cityai.backend.service;

import com.cityai.backend.model.AuditLogEntry;
import com.cityai.backend.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    /**
     * Logging a search must never fail (or slow down) the search itself -
     * its own transaction, swallow-and-log on error rather than propagate.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(String action, String plate, HttpServletRequest request) {
        try {
            auditLogRepository.save(new AuditLogEntry(Instant.now(), action, plate, clientAddress(request)));
        } catch (Exception ignored) {
            // Audit logging is best-effort in this prototype; a production
            // deployment would alert on failures here rather than swallow them.
        }
    }

    private String clientAddress(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
