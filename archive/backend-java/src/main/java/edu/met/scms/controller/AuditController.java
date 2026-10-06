package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import edu.met.scms.model.AuditLogEntry;
import edu.met.scms.model.ScmsData;
import edu.met.scms.store.DataStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Audit log endpoints — exact port of auditController.js.
 *
 * GET   /api/audit-logs   → getAllAuditLogs
 * POST  /api/audit-logs   → createAuditLog
 */
@RestController
@RequestMapping("/api/audit-logs")
public class AuditController {

    private final DataStore store;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public AuditController(DataStore store) {
        this.store = store;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<AuditLogEntry>>> getAllAuditLogs() {
        List<AuditLogEntry> logs = store.get().getAuditLog();
        return ResponseEntity.ok(ApiResponse.ok(logs, logs.size()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<AuditLogEntry>> createAuditLog(@RequestBody Map<String, String> body) {
        String actor = body.get("actor");
        String action = body.get("action");
        String details = body.get("details");

        if (actor == null || action == null || details == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Actor, action, and details are required"));
        }

        String now = LocalDateTime.now().format(FMT);
        AuditLogEntry entry = new AuditLogEntry(now, actor, action, details);

        ScmsData data = store.get();
        data.getAuditLog().add(0, entry);
        store.save();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Audit entry recorded", entry));
    }
}
