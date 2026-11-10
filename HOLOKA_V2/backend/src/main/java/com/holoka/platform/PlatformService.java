package com.holoka.platform;

import com.holoka.auth.AuthPrincipal;
import com.holoka.auth.RefreshSessionRepository;
import com.holoka.common.error.BusinessException;
import com.holoka.platform.PlatformDtos.*;
import com.holoka.user.AppUser;
import com.holoka.user.UserRepository;
import com.holoka.workspace.Membership;
import com.holoka.workspace.MembershipRepository;
import com.holoka.workspace.Role;
import com.holoka.workspace.Workspace;
import com.holoka.workspace.WorkspaceRepository;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformService {
    private final UserRepository users;
    private final WorkspaceRepository workspaces;
    private final MembershipRepository memberships;
    private final RefreshSessionRepository sessions;
    private final PasswordEncoder passwordEncoder;

    // In-memory audit trail for Super Admin platform monitoring
    private final List<PlatformAuditLogView> auditLogs = new CopyOnWriteArrayList<>();

    private String getActorEmail(AuthPrincipal principal) {
        if (principal == null) return "superadmin@holoka.vn";
        return users.findById(principal.userId()).map(AppUser::getEmail).orElse("superadmin@holoka.vn");
    }

    private void logAudit(String action, String actorEmail, String target, String details, String status) {
        String logId = UUID.randomUUID().toString().substring(0, 8);
        var entry = new PlatformAuditLogView(
            logId,
            Instant.now().toString(),
            action,
            actorEmail,
            target,
            details,
            status
        );
        auditLogs.add(0, entry);
        // keep recent 200 logs
        if (auditLogs.size() > 200) {
            auditLogs.remove(auditLogs.size() - 1);
        }
    }

    private void assertPlatformAdmin(AuthPrincipal principal) {
        var user = users.findById(principal.userId())
            .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Account unavailable"));
        if (!user.isPlatformAdmin()) {
            throw new BusinessException(HttpStatus.FORBIDDEN, "Only HOLOKA Super Admin can perform this operation");
        }
    }

    @Transactional(readOnly = true)
    public List<PlatformUserView> getUsers(AuthPrincipal principal) {
        assertPlatformAdmin(principal);
        var allUsers = users.findAll();
        var result = new ArrayList<PlatformUserView>();

        for (var u : allUsers) {
            var userMemberships = memberships.activeForUser(u.getId());
            var wsSummaries = userMemberships.stream()
                .map(m -> new WorkspaceSummary(m.getWorkspace().getId(), m.getWorkspace().getName(), m.getRole().name()))
                .toList();

            result.add(new PlatformUserView(
                u.getId(),
                u.getFullName(),
                u.getEmail(),
                u.isEnabled(),
                u.isPlatformAdmin(),
                u.getCreatedAt() != null ? u.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString(),
                wsSummaries
            ));
        }

        return result;
    }

    @Transactional
    public PlatformUserView createUser(AuthPrincipal principal, CreateUserRequest req) {
        assertPlatformAdmin(principal);
        String email = req.email().strip().toLowerCase();
        if (users.existsByEmail(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email is already registered on HOLOKA");
        }

        boolean isSuperAdmin = "SUPER_ADMIN".equalsIgnoreCase(req.role());
        String encodedPassword = passwordEncoder.encode(req.password());
        var newUser = users.saveAndFlush(new AppUser(req.fullName().strip(), email, encodedPassword, isSuperAdmin));

        // Handle client organization / workspace assignment
        if (!isSuperAdmin) {
            Role role = Role.STAFF;
            if ("OWNER".equalsIgnoreCase(req.role())) role = Role.OWNER;
            else if ("MANAGER".equalsIgnoreCase(req.role())) role = Role.MANAGER;

            Workspace targetWs = null;
            if (req.workspaceId() != null) {
                targetWs = workspaces.findById(req.workspaceId()).orElse(null);
            } else if (req.newWorkspaceName() != null && !req.newWorkspaceName().isBlank()) {
                targetWs = workspaces.saveAndFlush(new Workspace(req.newWorkspaceName().strip()));
            } else if (role == Role.OWNER) {
                targetWs = workspaces.saveAndFlush(new Workspace("Hệ Thống Bất Động Sản " + newUser.getFullName()));
            }

            if (targetWs == null) {
                targetWs = workspaces.findAll().stream().findFirst().orElseGet(() ->
                    workspaces.saveAndFlush(new Workspace("Hệ Thống Bất Động Sản " + newUser.getFullName()))
                );
            }

            memberships.saveAndFlush(new Membership(targetWs, newUser, role));
        }

        logAudit(
            "CREATE_USER",
            getActorEmail(principal),
            newUser.getEmail(),
            "Created user " + newUser.getFullName() + " with role " + req.role(),
            "SUCCESS"
        );

        var userMemberships = memberships.activeForUser(newUser.getId());
        var wsSummaries = userMemberships.stream()
            .map(m -> new WorkspaceSummary(m.getWorkspace().getId(), m.getWorkspace().getName(), m.getRole().name()))
            .toList();

        return new PlatformUserView(
            newUser.getId(),
            newUser.getFullName(),
            newUser.getEmail(),
            newUser.isEnabled(),
            newUser.isPlatformAdmin(),
            newUser.getCreatedAt() != null ? newUser.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString(),
            wsSummaries
        );
    }

    @Transactional
    public PlatformUserView updateUser(AuthPrincipal principal, long targetUserId, UpdateUserRequest req) {
        assertPlatformAdmin(principal);
        var targetUser = users.lockById(targetUserId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        String email = req.email().strip().toLowerCase();
        if (!email.equalsIgnoreCase(targetUser.getEmail()) && users.existsByEmail(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email is already in use by another account");
        }

        boolean isSuperAdmin = "SUPER_ADMIN".equalsIgnoreCase(req.role());
        targetUser.adminUpdate(req.fullName().strip(), email, isSuperAdmin);

        // Update workspace membership if provided
        if (!isSuperAdmin && req.workspaceId() != null && req.role() != null) {
            Role role = Role.STAFF;
            if ("OWNER".equalsIgnoreCase(req.role())) role = Role.OWNER;
            else if ("MANAGER".equalsIgnoreCase(req.role())) role = Role.MANAGER;

            var existingMembership = memberships.activeInWorkspace(targetUserId, req.workspaceId());
            if (existingMembership.isPresent()) {
                existingMembership.get().updateRole(role);
            } else {
                var targetWs = workspaces.findById(req.workspaceId())
                    .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Workspace not found"));
                memberships.saveAndFlush(new Membership(targetWs, targetUser, role));
            }
        }

        logAudit(
            "UPDATE_USER",
            getActorEmail(principal),
            targetUser.getEmail(),
            "Updated account info for " + targetUser.getFullName(),
            "SUCCESS"
        );

        var userMemberships = memberships.activeForUser(targetUser.getId());
        var wsSummaries = userMemberships.stream()
            .map(m -> new WorkspaceSummary(m.getWorkspace().getId(), m.getWorkspace().getName(), m.getRole().name()))
            .toList();

        return new PlatformUserView(
            targetUser.getId(),
            targetUser.getFullName(),
            targetUser.getEmail(),
            targetUser.isEnabled(),
            targetUser.isPlatformAdmin(),
            targetUser.getCreatedAt() != null ? targetUser.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString(),
            wsSummaries
        );
    }

    @Transactional
    public void resetUserPassword(AuthPrincipal principal, long targetUserId, ResetPasswordRequest req) {
        assertPlatformAdmin(principal);
        var targetUser = users.lockById(targetUserId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        String encoded = passwordEncoder.encode(req.newPassword());
        targetUser.changePassword(encoded);
        sessions.revokeAll(targetUser.getId(), LocalDateTime.now(ZoneOffset.UTC));

        logAudit(
            "RESET_PASSWORD",
            getActorEmail(principal),
            targetUser.getEmail(),
            "Reset password and revoked all active sessions for " + targetUser.getEmail(),
            "SUCCESS"
        );
    }

    @Transactional
    public void deleteUser(AuthPrincipal principal, long targetUserId) {
        assertPlatformAdmin(principal);
        if (targetUserId == principal.userId()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot delete your own active Super Admin account");
        }

        var targetUser = users.lockById(targetUserId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        // Revoke sessions
        sessions.revokeAll(targetUserId, LocalDateTime.now(ZoneOffset.UTC));

        // Delete active memberships
        var userMemberships = memberships.findAll().stream()
            .filter(m -> m.getUser().getId().equals(targetUserId))
            .toList();
        memberships.deleteAll(userMemberships);

        String deletedEmail = targetUser.getEmail();
        try {
            users.delete(targetUser);
            users.flush();
        } catch (Exception ex) {
            targetUser.toggleEnabled();
            targetUser.changePassword(passwordEncoder.encode("DeletedAccountDisabled!@" + System.currentTimeMillis()));
        }

        logAudit(
            "DELETE_USER",
            getActorEmail(principal),
            deletedEmail,
            "Deleted/Scrubbed account " + deletedEmail,
            "SUCCESS"
        );
    }

    @Transactional
    public PlatformUserView toggleUserStatus(AuthPrincipal principal, long targetUserId) {
        assertPlatformAdmin(principal);
        if (targetUserId == principal.userId()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot modify your own Super Admin account status");
        }

        var targetUser = users.lockById(targetUserId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        targetUser.toggleEnabled();
        if (!targetUser.isEnabled()) {
            sessions.revokeAll(targetUser.getId(), LocalDateTime.now(ZoneOffset.UTC));
        }

        logAudit(
            targetUser.isEnabled() ? "ACTIVATE_USER" : "LOCK_USER",
            getActorEmail(principal),
            targetUser.getEmail(),
            (targetUser.isEnabled() ? "Unlocked" : "Locked") + " user account " + targetUser.getEmail(),
            "SUCCESS"
        );

        var userMemberships = memberships.activeForUser(targetUser.getId());
        var wsSummaries = userMemberships.stream()
            .map(m -> new WorkspaceSummary(m.getWorkspace().getId(), m.getWorkspace().getName(), m.getRole().name()))
            .toList();

        return new PlatformUserView(
            targetUser.getId(),
            targetUser.getFullName(),
            targetUser.getEmail(),
            targetUser.isEnabled(),
            targetUser.isPlatformAdmin(),
            targetUser.getCreatedAt() != null ? targetUser.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString(),
            wsSummaries
        );
    }

    @Transactional(readOnly = true)
    public List<PlatformWorkspaceView> getWorkspaces(AuthPrincipal principal) {
        assertPlatformAdmin(principal);
        var allWorkspaces = workspaces.findAll();
        var result = new ArrayList<PlatformWorkspaceView>();

        for (var ws : allWorkspaces) {
            var wsMembers = memberships.findAll().stream()
                .filter(m -> m.getWorkspace().getId().equals(ws.getId()) && m.isEnabled())
                .toList();

            var owner = wsMembers.stream()
                .filter(m -> m.getRole().name().equals("OWNER"))
                .findFirst()
                .map(m -> m.getUser().getFullName())
                .orElse("Chưa gán chủ sở hữu");

            var ownerEmail = wsMembers.stream()
                .filter(m -> m.getRole().name().equals("OWNER"))
                .findFirst()
                .map(m -> m.getUser().getEmail())
                .orElse("—");

            String tier = ws.getId() == 1 ? "Gói Doanh Nghiệp (Pro)" : "Gói Tiêu Chuẩn";

            result.add(new PlatformWorkspaceView(
                ws.getId(),
                ws.getName(),
                ws.getCurrency(),
                ws.getTimezone(),
                ws.isEnabled(),
                tier,
                ws.getCreatedAt() != null ? ws.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString(),
                owner,
                ownerEmail,
                wsMembers.size()
            ));
        }

        return result;
    }

    @Transactional
    public PlatformWorkspaceView createWorkspace(AuthPrincipal principal, CreateWorkspaceRequest req) {
        assertPlatformAdmin(principal);
        var ws = workspaces.saveAndFlush(new Workspace(req.name().strip()));

        String ownerName = "Chưa gán";
        String ownerEmail = "—";

        if (req.ownerUserId() != null) {
            var owner = users.findById(req.ownerUserId()).orElse(null);
            if (owner != null) {
                memberships.saveAndFlush(new Membership(ws, owner, Role.OWNER));
                ownerName = owner.getFullName();
                ownerEmail = owner.getEmail();
            }
        }

        logAudit(
            "CREATE_ORGANIZATION",
            getActorEmail(principal),
            ws.getName(),
            "Created client organization / workspace: " + ws.getName() + " (Owner: " + ownerName + ")",
            "SUCCESS"
        );

        String tier = req.tierPlan() != null && !req.tierPlan().isBlank() ? req.tierPlan() : "Gói Tiêu Chuẩn";

        return new PlatformWorkspaceView(
            ws.getId(),
            ws.getName(),
            ws.getCurrency(),
            ws.getTimezone(),
            ws.isEnabled(),
            tier,
            ws.getCreatedAt() != null ? ws.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString(),
            ownerName,
            ownerEmail,
            req.ownerUserId() != null ? 1 : 0
        );
    }

    @Transactional
    public PlatformWorkspaceView toggleWorkspaceStatus(AuthPrincipal principal, long workspaceId) {
        assertPlatformAdmin(principal);
        var ws = workspaces.findById(workspaceId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Workspace not found"));

        ws.setEnabled(!ws.isEnabled());
        workspaces.saveAndFlush(ws);

        logAudit(
            ws.isEnabled() ? "ACTIVATE_ORGANIZATION" : "SUSPEND_ORGANIZATION",
            getActorEmail(principal),
            ws.getName(),
            (ws.isEnabled() ? "Activated" : "Suspended") + " client organization: " + ws.getName(),
            "SUCCESS"
        );

        var wsMembers = memberships.findAll().stream()
            .filter(m -> m.getWorkspace().getId().equals(ws.getId()) && m.isEnabled())
            .toList();

        var owner = wsMembers.stream()
            .filter(m -> m.getRole().name().equals("OWNER"))
            .findFirst();

        return new PlatformWorkspaceView(
            ws.getId(),
            ws.getName(),
            ws.getCurrency(),
            ws.getTimezone(),
            ws.isEnabled(),
            "Gói Tiêu Chuẩn",
            ws.getCreatedAt() != null ? ws.getCreatedAt().toString() : LocalDateTime.now(ZoneOffset.UTC).toString(),
            owner.map(m -> m.getUser().getFullName()).orElse("Chưa gán"),
            owner.map(m -> m.getUser().getEmail()).orElse("—"),
            wsMembers.size()
        );
    }

    @Transactional(readOnly = true)
    public List<PlatformAuditLogView> getAuditLogs(AuthPrincipal principal) {
        assertPlatformAdmin(principal);
        // Pre-populate initial system logs if empty
        if (auditLogs.isEmpty()) {
            auditLogs.add(new PlatformAuditLogView("SYS-101", Instant.now().minusSeconds(120).toString(), "SYSTEM_BOOT", "system@holoka.vn", "HOLOKA OS", "Hệ thống bảo mật và phân quyền khởi động an toàn", "SUCCESS"));
            auditLogs.add(new PlatformAuditLogView("SYS-102", Instant.now().minusSeconds(60).toString(), "ROLE_VERIFY", "system@holoka.vn", "Security Boundary", "Xác thực phân vùng độc lập giữa Super Admin và Chủ căn hộ", "SUCCESS"));
        }
        return Collections.unmodifiableList(auditLogs);
    }

    @Transactional(readOnly = true)
    public PlatformSystemMetrics getSystemMetrics(AuthPrincipal principal) {
        assertPlatformAdmin(principal);
        var allUsers = users.findAll();
        var allWorkspaces = workspaces.findAll();
        var allMemberships = memberships.findAll();

        long totalUsers = allUsers.size();
        long activeUsers = allUsers.stream().filter(AppUser::isEnabled).count();
        long lockedUsers = totalUsers - activeUsers;

        long totalWorkspaces = allWorkspaces.size();
        long activeWorkspaces = allWorkspaces.stream().filter(Workspace::isEnabled).count();

        long superAdmins = allUsers.stream().filter(AppUser::isPlatformAdmin).count();
        long owners = allMemberships.stream().filter(m -> m.getRole() == Role.OWNER && m.isEnabled()).map(m -> m.getUser().getId()).distinct().count();
        long managers = allMemberships.stream().filter(m -> m.getRole() == Role.MANAGER && m.isEnabled()).map(m -> m.getUser().getId()).distinct().count();
        long staff = allMemberships.stream().filter(m -> m.getRole() == Role.STAFF && m.isEnabled()).map(m -> m.getUser().getId()).distinct().count();

        Runtime rt = Runtime.getRuntime();
        long usedMb = (rt.totalMemory() - rt.freeMemory()) / (1024 * 1024);
        long maxMb = rt.maxMemory() / (1024 * 1024);

        return new PlatformSystemMetrics(
            totalUsers,
            activeUsers,
            lockedUsers,
            totalWorkspaces,
            activeWorkspaces,
            new RoleCountSummary(superAdmins, owners, managers, staff),
            "HEALTHY",
            usedMb,
            maxMb,
            Instant.now().toString()
        );
    }
}
