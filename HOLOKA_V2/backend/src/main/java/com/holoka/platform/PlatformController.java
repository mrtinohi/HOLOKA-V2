package com.holoka.platform;

import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.ApiResponse;
import com.holoka.platform.PlatformDtos.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/platform")
@RequiredArgsConstructor
@Tag(name = "Platform Super Admin")
@SecurityRequirement(name = "bearerAuth")
public class PlatformController {
    private final PlatformService service;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all platform accounts (Super Admin only)")
    public ApiResponse<List<PlatformUserView>> listUsers(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(service.getUsers(principal));
    }

    @PostMapping("/users")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new user account (Super Admin only)")
    public ApiResponse<PlatformUserView> createUser(
        @AuthenticationPrincipal AuthPrincipal principal,
        @Valid @RequestBody CreateUserRequest body
    ) {
        return ApiResponse.ok(service.createUser(principal, body));
    }

    @PutMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update user details and workspace role (Super Admin only)")
    public ApiResponse<PlatformUserView> updateUser(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable long id,
        @Valid @RequestBody UpdateUserRequest body
    ) {
        return ApiResponse.ok(service.updateUser(principal, id, body));
    }

    @PutMapping("/users/{id}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Reset password for any user account (Super Admin only)")
    public ApiResponse<Void> resetPassword(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable long id,
        @Valid @RequestBody ResetPasswordRequest body
    ) {
        service.resetUserPassword(principal, id, body);
        return ApiResponse.ok(null);
    }

    @DeleteMapping("/users/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete user account (Super Admin only)")
    public ApiResponse<Void> deleteUser(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable long id
    ) {
        service.deleteUser(principal, id);
        return ApiResponse.ok(null);
    }

    @PatchMapping("/users/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle user enabled/disabled status (Super Admin only)")
    public ApiResponse<PlatformUserView> toggleUserStatus(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable long id
    ) {
        return ApiResponse.ok(service.toggleUserStatus(principal, id));
    }

    @GetMapping("/workspaces")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all client organizations / workspaces (Super Admin only)")
    public ApiResponse<List<PlatformWorkspaceView>> listWorkspaces(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(service.getWorkspaces(principal));
    }

    @PostMapping("/workspaces")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a client organization / workspace (Super Admin only)")
    public ApiResponse<PlatformWorkspaceView> createWorkspace(
        @AuthenticationPrincipal AuthPrincipal principal,
        @Valid @RequestBody CreateWorkspaceRequest body
    ) {
        return ApiResponse.ok(service.createWorkspace(principal, body));
    }

    @PatchMapping("/workspaces/{id}/toggle-status")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Toggle client organization active/suspended status (Super Admin only)")
    public ApiResponse<PlatformWorkspaceView> toggleWorkspaceStatus(
        @AuthenticationPrincipal AuthPrincipal principal,
        @PathVariable long id
    ) {
        return ApiResponse.ok(service.toggleWorkspaceStatus(principal, id));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get platform-wide system metrics and health (Super Admin only)")
    public ApiResponse<PlatformSystemMetrics> getMetrics(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(service.getSystemMetrics(principal));
    }

    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get recent audit trail logs (Super Admin only)")
    public ApiResponse<List<PlatformAuditLogView>> getAuditLogs(@AuthenticationPrincipal AuthPrincipal principal) {
        return ApiResponse.ok(service.getAuditLogs(principal));
    }
}
