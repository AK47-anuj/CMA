package edu.met.scms.controller;

import edu.met.scms.dto.ApiResponse;
import edu.met.scms.model.ScmsData;
import edu.met.scms.model.Tenant;
import edu.met.scms.store.DataStore;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * System / admin endpoints — exact port of systemController.js.
 *
 * GET   /api/system/tenant   → getTenant
 * GET   /api/system/data     → getFullData
 * POST  /api/system/reset    → resetData
 */
@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final DataStore store;

    public SystemController(DataStore store) {
        this.store = store;
    }

    @GetMapping("/tenant")
    public ResponseEntity<ApiResponse<Tenant>> getTenant() {
        return ResponseEntity.ok(ApiResponse.ok(store.get().getTenant()));
    }

    @GetMapping("/data")
    public ResponseEntity<ApiResponse<ScmsData>> getFullData() {
        return ResponseEntity.ok(ApiResponse.ok(store.get()));
    }

    @PostMapping("/reset")
    public ResponseEntity<ApiResponse<ScmsData>> resetData() {
        ScmsData resetState = store.reset();
        return ResponseEntity.ok(ApiResponse.ok("Store reset to initial state successfully", resetState));
    }
}
