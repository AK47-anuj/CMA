package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import edu.met.scms.model.CalendarEvent;
import edu.met.scms.model.ScmsData;
import edu.met.scms.store.DataStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Calendar event endpoints — exact port of calendarController.js.
 *
 * GET   /api/calendar   → getAllCalendarEvents
 * POST  /api/calendar   → addCalendarEvent
 */
@RestController
@RequestMapping("/api/calendar")
public class CalendarController {

    private final DataStore store;

    public CalendarController(DataStore store) {
        this.store = store;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CalendarEvent>>> getAllCalendarEvents() {
        List<CalendarEvent> events = store.get().getCalendarEvents();
        return ResponseEntity.ok(ApiResponse.ok(events, events.size()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CalendarEvent>> addCalendarEvent(@RequestBody Map<String, String> body) {
        String date = body.get("date");
        String title = body.get("title");

        if (date == null || title == null) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Date and Title are required"));
        }

        String newId = "cal-" + String.valueOf(System.currentTimeMillis()).substring(9);

        CalendarEvent event = new CalendarEvent();
        event.setId(newId);
        event.setDate(date);
        event.setTime(body.getOrDefault("time", "10:00 AM"));
        event.setTitle(title);
        event.setType(body.getOrDefault("type", "Academic"));
        event.setVenue(body.getOrDefault("venue", "Campus"));
        event.setTag(body.getOrDefault("tag", "Department Schedule"));

        ScmsData data = store.get();
        data.getCalendarEvents().add(event);
        store.save();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Calendar event added", event));
    }
}
