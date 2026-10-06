package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Tenant {
    private String id;
    private String organization;
    private String institute;
    private String department;
    private String academicYear;
    private String accreditation;
    private String address;
    private String schema;
}
