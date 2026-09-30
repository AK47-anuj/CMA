package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalendarEvent {
    private String id;
    private String date;
    private String time;
    private String title;
    private String type;
    private String venue;
    private String tag;
}
