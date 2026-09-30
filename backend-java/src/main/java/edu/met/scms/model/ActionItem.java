package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActionItem {
    private String task;
    private String responsible;
    private String deadline;
}
