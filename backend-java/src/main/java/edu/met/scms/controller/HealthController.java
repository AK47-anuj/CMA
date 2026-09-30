package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Health check endpoint — mirrors GET /api/health from the Node.js backend.
 */
@RestController
@RequestMapping("/api")
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "online",
                "timestamp", Instant.now().toString(),
                "service", "MET SCMS Backend API",
                "version", "1.0.0"
        );
    }
}
