package com.holoka.platform;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class PlatformDtos {
    private PlatformDtos() {}

    public record WorkspaceSummary(long id, String name, String role) {}

    public record PlatformUserView(
        long id,
        String fullName,
        String email,
        boolean enabled,
        boolean platformAdmin,
        String createdAt,
        List<WorkspaceSummary> workspaces
    ) {}

    public record CreateUserRequest(
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        String role, // 'OWNER', 'MANAGER', 'STAFF', 'SUPER_ADMIN'
        Long workspaceId,
        String newWorkspaceName
    ) {}

    public record UpdateUserRequest(
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        String role, // 'OWNER', 'MANAGER', 'STAFF', 'SUPER_ADMIN'
        Long workspaceId
    ) {}

    public record ResetPasswordRequest(
        @NotBlank @Size(min = 8, max = 72) String newPassword
    ) {}

    public record PlatformWorkspaceView(
        long id,
        String name,
        String currency,
        String timezone,
        boolean enabled,
        String tierPlan,
        String createdAt,
        String ownerName,
        String ownerEmail,
        long memberCount
    ) {}

    public record CreateWorkspaceRequest(
        @NotBlank @Size(max = 160) String name,
        String currency,
        String timezone,
        String tierPlan,
        Long ownerUserId
    ) {}

    public record PlatformAuditLogView(
        String id,
        String timestamp,
        String action,
        String actorEmail,
        String target,
        String details,
        String status
    ) {}

    public record RoleCountSummary(
        long superAdmins,
        long owners,
        long managers,
        long staff
    ) {}

    public record PlatformSystemMetrics(
        long totalUsers,
        long activeUsers,
        long lockedUsers,
        long totalWorkspaces,
        long activeWorkspaces,
        RoleCountSummary roles,
        String systemStatus,
        long jvmMemoryUsedMb,
        long jvmMemoryMaxMb,
        String serverTime
    ) {}
}
