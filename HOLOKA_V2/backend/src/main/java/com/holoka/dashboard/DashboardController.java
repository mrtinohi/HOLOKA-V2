package com.holoka.dashboard;

import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Positive;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Validated
@Tag(name = "Dashboard")
@SecurityRequirement(name = "bearerAuth")
public class DashboardController {

    private final DashboardService service;

    @GetMapping("/overview")
    public ApiResponse<DashboardDtos.Overview> overview(
            @AuthenticationPrincipal AuthPrincipal p,
            @RequestParam @Positive long workspaceId) {
        return ApiResponse.ok(service.getOverview(p, workspaceId));
    }
}
