package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Root data model — the entire in-memory JSON database.
 * Mirrors the structure of db.json / initialData.js from the Node.js backend.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScmsData {
    private Tenant tenant;
    private List<User> users;
    private List<HistoricalReminder> historicalReminders;
    private List<EventReport> eventReports;
    private List<Meeting> meetings;
    private List<CalendarEvent> calendarEvents;
    private List<AuditLogEntry> auditLog;
}
