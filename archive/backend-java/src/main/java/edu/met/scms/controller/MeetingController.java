package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import edu.met.scms.model.ActionItem;
import edu.met.scms.model.AuditLogEntry;
import edu.met.scms.model.Meeting;
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
 * Meeting / Minutes-of-Meeting endpoints — exact port of meetingController.js.
 *
 * GET    /api/meetings               → getAllMeetings (?status=)
 * GET    /api/meetings/:id           → getMeetingById
 * POST   /api/meetings               → createMeeting
 * PATCH  /api/meetings/:id/status    → updateMeetingStatus
 */
@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    private final DataStore store;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final Random RANDOM = new Random();

    public MeetingController(DataStore store) {
        this.store = store;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Meeting>>> getAllMeetings(
            @RequestParam(required = false) String status) {

        List<Meeting> meetings = store.get().getMeetings();

        if (status != null) {
            meetings = meetings.stream()
                    .filter(m -> m.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(ApiResponse.ok(meetings, meetings.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Meeting>> getMeetingById(@PathVariable String id) {
        return store.get().getMeetings().stream()
                .filter(m -> m.getId().equals(id))
                .findFirst()
                .map(m -> ResponseEntity.ok(ApiResponse.ok(m)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("Meeting not found")));
    }

    @PostMapping
    @SuppressWarnings("unchecked")
    public ResponseEntity<ApiResponse<Meeting>> createMeeting(@RequestBody Map<String, Object> body) {
        String title = (String) body.get("title");
        String committee = (String) body.get("committee");
        String date = (String) body.get("date");

        if (title == null || committee == null || date == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Title, committee, and date are required"));
        }

        String prefix = committee.contains("Board") ? "BOS" : "FAC";
        int randomNum = 10 + RANDOM.nextInt(90);
        String newId = "MOM-2026-" + prefix + "-" + randomNum;
        String now = LocalDateTime.now().format(FMT);

        Meeting meeting = new Meeting();
        meeting.setId(newId);
        meeting.setTitle(title);
        meeting.setCommittee(committee);
        meeting.setDate(date);
        meeting.setTime(getStr(body, "time", "10:00 AM - 12:30 PM"));
        meeting.setVenue(getStr(body, "venue", "Conference Boardroom A"));
        meeting.setChairperson(getStr(body, "chairperson", "Prof. Nilesh Bread (Head of Department)"));
        meeting.setMembersPresent(getStr(body, "membersPresent", "Faculty Members"));
        meeting.setAgenda(getStr(body, "agenda", ""));
        meeting.setDiscussionPoints(getStr(body, "discussionPoints", ""));
        meeting.setDecisions(getStr(body, "decisions", ""));
        meeting.setStatus("PENDING_HOD_APPROVAL");
        meeting.setSubmittedBy(getStr(body, "submittedBy", "Faculty Member"));

        // Parse action items
        Object actionItemsRaw = body.get("actionItems");
        if (actionItemsRaw instanceof List) {
            List<ActionItem> items = new ArrayList<>();
            for (Object item : (List<?>) actionItemsRaw) {
                if (item instanceof Map) {
                    Map<String, String> m = (Map<String, String>) item;
                    items.add(new ActionItem(
                            m.getOrDefault("task", ""),
                            m.getOrDefault("responsible", ""),
                            m.getOrDefault("deadline", "")
                    ));
                }
            }
            meeting.setActionItems(items);
        } else {
            meeting.setActionItems(new ArrayList<>());
        }

        ScmsData data = store.get();
        data.getMeetings().add(0, meeting);
        data.getAuditLog().add(0, new AuditLogEntry(
                now, meeting.getSubmittedBy(), "MOM_SUBMISSION",
                "Created draft Minutes of Meeting for '" + title + "' (" + newId + ")"
        ));

        store.save();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Minutes of Meeting created successfully", meeting));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Meeting>> updateMeetingStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        String status = body.get("status");

        List<String> validStatuses = List.of("APPROVED", "PENDING_HOD_APPROVAL");
        if (status == null || !validStatuses.contains(status)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Invalid status provided"));
        }

        ScmsData data = store.get();
        Meeting meeting = data.getMeetings().stream()
                .filter(m -> m.getId().equals(id))
                .findFirst().orElse(null);

        if (meeting == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("Meeting record not found"));
        }

        String now = LocalDateTime.now().format(FMT);
        meeting.setStatus(status);

        if ("APPROVED".equals(status)) {
            meeting.setApprovedBy(body.getOrDefault("approvedBy", "Prof. Nilesh Bread (HOD)"));
            meeting.setApprovalDate(now.split(" ")[0]);

            data.getAuditLog().add(0, new AuditLogEntry(
                    now, meeting.getApprovedBy(), "MOM_APPROVED",
                    "HOD finalized and approved MoM for '" + meeting.getTitle() + "' (" + meeting.getId() + ")"
            ));
        }

        store.save();

        return ResponseEntity.ok(ApiResponse.ok("Meeting status updated to " + status, meeting));
    }

    private String getStr(Map<String, Object> map, String key, String defaultVal) {
        Object v = map.get(key);
        return v != null ? v.toString() : defaultVal;
    }
}
