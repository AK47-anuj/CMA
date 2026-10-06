package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HistoricalReminder {
    private String id;
    private String eventTitle;
    private String eventType;
    private String originalDate;
    private String anniversaryDate;
    private String reminderTriggerDate;
    private Integer daysRemaining;
    private Boolean isToday;
    private Map<String, Object> priorYearStats;
    private String status;
}
