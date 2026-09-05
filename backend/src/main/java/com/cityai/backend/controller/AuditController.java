package com.cityai.backend.controller;

import com.cityai.backend.dto.AuditLogEntryDto;
import com.cityai.backend.repository.AuditLogRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Who searched what, when - see AuditLogService. Requires the same
 * credentials as POST /api/detections/ingest (see SecurityConfig); a real
 * deployment would give this its own "investigator"/"auditor" role rather
 * than reusing the ingestion pipeline's credentials.
 */
@RestController
@RequestMapping("/api/audit")
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    public AuditController(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @GetMapping("/recent")
    public List<AuditLogEntryDto> recent(@RequestParam(defaultValue = "50") int limit) {
        return auditLogRepository.findAllByOrderByTimestampDesc(PageRequest.of(0, Math.min(limit, 500))).stream()
                .map(AuditLogEntryDto::from)
                .toList();
    }
}
