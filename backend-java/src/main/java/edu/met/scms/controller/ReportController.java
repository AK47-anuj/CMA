package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import edu.met.scms.model.AuditLogEntry;
import edu.met.scms.model.EventReport;
import edu.met.scms.model.ScmsData;
import edu.met.scms.store.DataStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Event report endpoints — exact port of reportController.js + reportRoutes.js.
 *
 * GET    /api/reports                → getAllReports (?status=, ?submittedByEmail=)
 * GET    /api/reports/:id            → getReportById
 * POST   /api/reports                → createReport
 * PUT    /api/reports/:id            → updateReport
 * PATCH  /api/reports/:id/status     → updateReportStatus
 */
@RestController
@RequestMapping("/api/reports")
public class ReportController {

    private final DataStore store;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final Random RANDOM = new Random();

    public ReportController(DataStore store) {
        this.store = store;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<EventReport>>> getAllReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String submittedByEmail) {

        List<EventReport> reports = store.get().getEventReports();

        if (status != null) {
            reports = reports.stream()
                    .filter(r -> r.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }
        if (submittedByEmail != null) {
            reports = reports.stream()
                    .filter(r -> r.getSubmittedByEmail() != null &&
                                 r.getSubmittedByEmail().equalsIgnoreCase(submittedByEmail))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(ApiResponse.ok(reports, reports.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EventReport>> getReportById(@PathVariable String id) {
        return store.get().getEventReports().stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("Report not found")));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<EventReport>> createReport(@RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String type = (String) body.get("type");
        String date = (String) body.get("date");

        if (title == null || type == null || date == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Title, type, and date are required"));
        }

        Map<String, String> prefixMap = Map.of(
                "Guest Lecture", "GL",
                "Workshop", "WS",
                "Industrial Visit", "IV",
                "Seminar", "SEM",
                "Competition", "CMP"
        );

        String prefix = prefixMap.getOrDefault(type, "EVT");
        int randomNum = 100 + RANDOM.nextInt(900);
        String newId = "RPT-2026-" + prefix + "-" + randomNum;
        String now = LocalDateTime.now().format(FMT);

        EventReport report = new EventReport();
        report.setId(newId);
        report.setTitle(title);
        report.setType(type);
        report.setSubmittedBy(getStr(body, "submittedBy", "Faculty Member"));
        report.setSubmittedByEmail(getStr(body, "submittedByEmail", "faculty@met.edu"));
        report.setSubmittedTime("Just now");
        report.setDate(date);
        report.setTime(getStr(body, "time", "10:00 AM - 01:00 PM"));
        report.setVenue(getStr(body, "venue", "Auditorium"));
        report.setSpeaker(getStr(body, "speaker", "Industry Expert"));
        report.setAttendees(getInt(body, "attendees", 0));
        report.setFacultyInvolved(getStr(body, "facultyInvolved", report.getSubmittedBy()));
        report.setQuorumStatus("100% Biometric Verified");
        report.setPhotosAttached(getInt(body, "photosAttached", 4));
        report.setStatus("PENDING_HOD_APPROVAL");
        report.setObjectives(getStr(body, "objectives", ""));
        report.setActivities(getStr(body, "activities", ""));
        report.setOutcomes(getStr(body, "outcomes", ""));
        report.setCurriculumMapping(getStr(body, "curriculumMapping", "NAAC Criterion 1.3 • Aligned"));

        ScmsData data = store.get();
        data.getEventReports().add(0, report);
        data.getAuditLog().add(0, new AuditLogEntry(
                now, report.getSubmittedBy(), "EVENT_REPORT_SUBMITTED",
                "Submitted '" + title + "' for HOD Review (Ref: " + newId + ")"
        ));

        store.save();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Event report submitted successfully for HOD approval", report));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<EventReport>> updateReport(
            @PathVariable String id,
            @RequestBody Map<String, Object> body) {

        ScmsData data = store.get();
        EventReport report = data.getEventReports().stream()
                .filter(r -> r.getId().equals(id))
                .findFirst().orElse(null);

        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("Report not found"));
        }

        // Merge allowed editable fields
        if (body.containsKey("title")) report.setTitle((String) body.get("title"));
        if (body.containsKey("type")) report.setType((String) body.get("type"));
        if (body.containsKey("date")) report.setDate((String) body.get("date"));
        if (body.containsKey("time")) report.setTime((String) body.get("time"));
        if (body.containsKey("venue")) report.setVenue((String) body.get("venue"));
        if (body.containsKey("speaker")) report.setSpeaker((String) body.get("speaker"));
        if (body.containsKey("attendees")) report.setAttendees(getInt(body, "attendees", report.getAttendees()));
        if (body.containsKey("facultyInvolved")) report.setFacultyInvolved((String) body.get("facultyInvolved"));
        if (body.containsKey("objectives")) report.setObjectives((String) body.get("objectives"));
        if (body.containsKey("activities")) report.setActivities((String) body.get("activities"));
        if (body.containsKey("outcomes")) report.setOutcomes((String) body.get("outcomes"));
        if (body.containsKey("curriculumMapping")) report.setCurriculumMapping((String) body.get("curriculumMapping"));
        if (body.containsKey("photosAttached")) report.setPhotosAttached(getInt(body, "photosAttached", report.getPhotosAttached()));

        // Resubmission logic
        Boolean resubmit = (Boolean) body.get("resubmit");
        if (Boolean.TRUE.equals(resubmit)) {
            report.setStatus("PENDING_HOD_APPROVAL");
            report.setRejectionReason(null);
            report.setSubmittedTime("Resubmitted just now");

            String now = LocalDateTime.now().format(FMT);
            data.getAuditLog().add(0, new AuditLogEntry(
                    now, report.getSubmittedBy(), "EVENT_REPORT_RESUBMITTED",
                    "Resubmitted revised dossier for '" + report.getTitle() + "' (" + report.getId() + ")"
            ));
        }

        store.save();

        return ResponseEntity.ok(ApiResponse.ok("Report updated successfully", report));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<EventReport>> updateReportStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        String status = body.get("status");

        List<String> validStatuses = List.of("APPROVED", "REJECTED", "PENDING_HOD_APPROVAL");
        if (status == null || !validStatuses.contains(status)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Invalid status provided"));
        }

        ScmsData data = store.get();
        EventReport report = data.getEventReports().stream()
                .filter(r -> r.getId().equals(id))
                .findFirst().orElse(null);

        if (report == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("Report not found"));
        }

        String now = LocalDateTime.now().format(FMT);
        report.setStatus(status);

        if ("APPROVED".equals(status)) {
            // Generate a pseudo digital signature hash
            String hash = "SHA256: " + randomHex(8) + randomHex(8);
            String docRef = "MET/IOM/DMS/2026/" + report.getId().replace("RPT-2026-", "");

            report.setApprovedBy(body.getOrDefault("approvedBy", "Prof. Nilesh Bread (HOD)"));
            report.setApprovalDate(now.split(" ")[0]);
            report.setDigitalSignatureHash(hash);
            report.setDocumentRef(docRef);
            report.setRejectionReason(null);

            data.getAuditLog().add(0, new AuditLogEntry(
                    now, report.getApprovedBy(), "EVENT_REPORT_APPROVED",
                    "Approved '" + report.getTitle() + "' with digital seal (" + report.getDocumentRef() + ")"
            ));
        } else if ("REJECTED".equals(status)) {
            report.setRejectionReason(
                    body.getOrDefault("rejectionReason",
                            "Requires revision and additional documentation before approval."));
            String actor = body.getOrDefault("approvedBy", "Prof. Nilesh Bread (HOD)");

            data.getAuditLog().add(0, new AuditLogEntry(
                    now, actor, "EVENT_REPORT_REJECTED",
                    "Returned '" + report.getTitle() + "' for revision: \"" + report.getRejectionReason() + "\""
            ));
        }

        store.save();

        return ResponseEntity.ok(ApiResponse.ok("Report status updated to " + status, report));
    }

    // ──── Utility helpers ────

    private String getStr(Map<String, Object> map, String key, String defaultVal) {
        Object v = map.get(key);
        return v != null ? v.toString() : defaultVal;
    }

    private int getInt(Map<String, Object> map, String key, int defaultVal) {
        Object v = map.get(key);
        if (v instanceof Number) return ((Number) v).intValue();
        if (v instanceof String) {
            try { return Integer.parseInt((String) v); } catch (NumberFormatException e) { /* ignore */ }
        }
        return defaultVal;
    }

    private String randomHex(int length) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(Integer.toHexString(RANDOM.nextInt(16)));
        }
        return sb.toString();
    }
}
