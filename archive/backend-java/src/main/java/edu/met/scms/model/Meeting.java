package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Meeting {
    private String id;
    private String title;
    private String committee;
    private String date;
    private String time;
    private String venue;
    private String chairperson;
    private String membersPresent;
    private String agenda;
    private String discussionPoints;
    private String decisions;
    private List<ActionItem> actionItems;
    private String status;
    private String submittedBy;

    // Approval fields
    private String approvedBy;
    private String approvalDate;
}
