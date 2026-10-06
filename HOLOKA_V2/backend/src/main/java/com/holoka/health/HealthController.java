package com.holoka.health;

import com.holoka.common.api.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {
    /** Liveness only. Use /actuator/health/readiness for database connectivity. */
    @GetMapping("/api/health")
    public ApiResponse<HealthStatus> health() {
        return ApiResponse.ok(new HealthStatus("UP", "holoka-backend"));
    }

    public record HealthStatus(String status, String service) {}
}
