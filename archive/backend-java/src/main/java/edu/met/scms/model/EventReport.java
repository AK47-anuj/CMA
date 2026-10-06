package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class EventReport {
    private String id;
    private String title;
    private String type;
    private String submittedBy;
    private String submittedByEmail;
    private String submittedTime;
    private String date;
    private String time;
    private String venue;
    private String speaker;
    private Integer attendees;
    private String facultyInvolved;
    private String quorumStatus;
    private Integer photosAttached;
    private String status;
    private String objectives;
    private String activities;
    private String outcomes;
    private String curriculumMapping;

    // Approval fields (set when approved)
    private String approvedBy;
    private String approvalDate;
    private String digitalSignatureHash;
    private String documentRef;

    // Rejection fields (set when rejected)
    private String rejectionReason;
}
