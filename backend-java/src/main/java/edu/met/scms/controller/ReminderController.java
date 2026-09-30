package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import edu.met.scms.model.HistoricalReminder;
import edu.met.scms.store.DataStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Historical reminder endpoints — exact port of reminderController.js.
 *
 * GET  /api/reminders       → getAllReminders
 * GET  /api/reminders/:id   → getReminderById
 */
@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final DataStore store;

    public ReminderController(DataStore store) {
        this.store = store;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HistoricalReminder>>> getAllReminders() {
        List<HistoricalReminder> reminders = store.get().getHistoricalReminders();
        return ResponseEntity.ok(ApiResponse.ok(reminders, reminders.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HistoricalReminder>> getReminderById(@PathVariable String id) {
        return store.get().getHistoricalReminders().stream()
                .filter(r -> r.getId().equals(id))
                .findFirst()
                .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("Reminder not found")));
    }
}
