package edu.met.scms.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    private String id;
    private String name;
    private String role;
    private String email;
    private String designation;
    private String status;
    private String avatar;
    private String department;
    private String registeredAt;
}
