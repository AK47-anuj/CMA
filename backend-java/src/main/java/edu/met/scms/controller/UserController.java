package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import edu.met.scms.model.AuditLogEntry;
import edu.met.scms.model.ScmsData;
import edu.met.scms.model.User;
import edu.met.scms.store.DataStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * User management endpoints — exact port of userController.js + userRoutes.js.
 *
 * GET    /api/users                 → getAllUsers (?role=, ?status=)
 * GET    /api/users/:id             → getUserById
 * POST   /api/users/login           → login
 * POST   /api/users/register        → registerFaculty
 * PATCH  /api/users/:id/status      → updateUserStatus
 */
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final DataStore store;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public UserController(DataStore store) {
        this.store = store;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status) {

        List<User> users = store.get().getUsers();

        if (role != null) {
            users = users.stream()
                    .filter(u -> u.getRole().equalsIgnoreCase(role))
                    .collect(Collectors.toList());
        }
        if (status != null) {
            users = users.stream()
                    .filter(u -> u.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        return ResponseEntity.ok(ApiResponse.ok(users, users.size()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getUserById(@PathVariable String id) {
        return store.get().getUsers().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst()
                .map(u -> ResponseEntity.ok(ApiResponse.ok(u)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.fail("User not found")));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<User>> login(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String id = body.get("id");

        ScmsData data = store.get();
        User user = null;

        if (id != null) {
            user = data.getUsers().stream()
                    .filter(u -> u.getId().equals(id))
                    .findFirst().orElse(null);
        } else if (email != null) {
            user = data.getUsers().stream()
                    .filter(u -> u.getEmail().equalsIgnoreCase(email))
                    .findFirst().orElse(null);
        }

        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.fail("Account not recognized in department roster."));
        }

        return ResponseEntity.ok(ApiResponse.ok("Login successful", user));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<User>> registerFaculty(@RequestBody Map<String, String> body) {
        String name = body.get("name");
        String email = body.get("email");
        String designation = body.getOrDefault("designation", "Assistant Professor");
        String department = body.getOrDefault("department", "Management Studies");

        if (name == null || name.isBlank() || email == null || email.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Name and official email are required"));
        }

        ScmsData data = store.get();

        boolean exists = data.getUsers().stream()
                .anyMatch(u -> u.getEmail().equalsIgnoreCase(email));
        if (exists) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(ApiResponse.fail("A profile with this MET email address already exists."));
        }

        // Generate initials (first 2 chars of each word)
        String initials = "";
        String[] parts = name.split("\\s+");
        for (String p : parts) {
            if (!p.isEmpty()) initials += p.charAt(0);
        }
        initials = initials.substring(0, Math.min(2, initials.length())).toUpperCase();

        String now = LocalDateTime.now().format(FMT);
        String newId = "usr_fac_" + String.valueOf(System.currentTimeMillis()).substring(9);

        User newFaculty = new User();
        newFaculty.setId(newId);
        newFaculty.setName(name);
        newFaculty.setRole("FACULTY");
        newFaculty.setEmail(email);
        newFaculty.setDesignation(designation);
        newFaculty.setDepartment(department);
        newFaculty.setStatus("PENDING_HOD_APPROVAL");
        newFaculty.setRegisteredAt(now);
        newFaculty.setAvatar(initials);

        data.getUsers().add(newFaculty);
        data.getAuditLog().add(0, new AuditLogEntry(
                now, "System", "FACULTY_REGISTRATION",
                name + " submitted onboarding registration (Status: PENDING_HOD_APPROVAL)"
        ));

        store.save();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration submitted successfully. Pending HOD approval.", newFaculty));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<User>> updateUserStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {

        String status = body.get("status");
        String actorName = body.getOrDefault("actorName", "Prof. Nilesh Bread (HOD)");

        List<String> validStatuses = List.of("ACTIVE", "REJECTED", "PENDING_HOD_APPROVAL");
        if (status == null || !validStatuses.contains(status)) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.fail("Invalid status value"));
        }

        ScmsData data = store.get();
        User faculty = data.getUsers().stream()
                .filter(u -> u.getId().equals(id))
                .findFirst().orElse(null);

        if (faculty == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.fail("Faculty member not found"));
        }

        faculty.setStatus(status);
        String now = LocalDateTime.now().format(FMT);

        if ("ACTIVE".equals(status)) {
            data.getAuditLog().add(0, new AuditLogEntry(
                    now, actorName, "FACULTY_APPROVED",
                    "HOD approved onboarding credentials for " + faculty.getName()
            ));
        } else if ("REJECTED".equals(status)) {
            data.getAuditLog().add(0, new AuditLogEntry(
                    now, actorName, "FACULTY_REJECTED",
                    "HOD rejected onboarding request for " + faculty.getName()
            ));
        }

        store.save();

        return ResponseEntity.ok(ApiResponse.ok("Faculty status updated to " + status, faculty));
    }
}
