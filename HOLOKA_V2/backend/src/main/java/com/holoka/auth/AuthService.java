package com.holoka.auth;

import com.holoka.audit.*;
import com.holoka.common.error.BusinessException;
import com.holoka.user.*;
import com.holoka.workspace.*;
import static com.holoka.auth.AuthDtos.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UserRepository users;
    private final WorkspaceRepository workspaces;
    private final MembershipRepository memberships;
    private final RefreshSessionRepository sessions;
    private final AuditRepository audit;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    private final AuthProperties properties;
    private final SecureRandom random = new SecureRandom();
    private final String dummyHash;

    public AuthService(UserRepository users, WorkspaceRepository workspaces, MembershipRepository memberships,
        RefreshSessionRepository sessions, AuditRepository audit, PasswordEncoder passwords, JwtService jwt, AuthProperties properties) {
        this.users = users; this.workspaces = workspaces; this.memberships = memberships; this.sessions = sessions;
        this.audit = audit; this.passwords = passwords; this.jwt = jwt; this.properties = properties;
        dummyHash = passwords.encode(UUID.randomUUID().toString());
    }

    @Transactional
    public IssuedSession register(RegisterRequest request) {
        validatePasswordBytes(request.password());
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) throw new BusinessException(HttpStatus.CONFLICT, "Email is already registered");
        var user = users.saveAndFlush(new AppUser(request.fullName().strip(), email, passwords.encode(request.password())));
        var workspace = workspaces.saveAndFlush(new Workspace(request.workspaceName().strip()));
        memberships.saveAndFlush(new Membership(workspace, user, Role.OWNER));
        record(workspace.getId(), user.getId(), "CREATE", "Owner registered a new workspace");
        return issue(user, UUID.randomUUID(), null);
    }

    @Transactional
    public IssuedSession login(LoginRequest request) {
        validatePasswordBytes(request.password());
        // Read a scalar first to avoid caching a stale entity before obtaining the lock.
        var id = users.idForEmail(normalizeEmail(request.email()));
        if (id.isEmpty()) { passwords.matches(request.password(), dummyHash); throw unauthorized("Invalid email or password"); }
        var user = users.lockById(id.get()).orElseThrow(() -> unauthorized("Invalid email or password"));
        boolean passwordMatches = passwords.matches(request.password(), user.getPasswordHash());
        if (!passwordMatches || !user.isEnabled()) throw unauthorized("Invalid email or password");
        record(null, user.getId(), "LOGIN", "User signed in");
        return issue(user, UUID.randomUUID(), null);
    }

    @Transactional(noRollbackFor = RefreshReuseException.class)
    public IssuedSession refresh(String rawToken) {
        String hash = tokenHash(rawToken);
        long userId = sessions.userIdForHash(hash).orElseThrow(() -> unauthorized("Invalid refresh session"));
        var user = users.lockById(userId).orElseThrow(() -> unauthorized("Invalid refresh session"));
        var session = sessions.findByTokenHash(hash).orElseThrow(() -> unauthorized("Invalid refresh session"));
        if (session.getRevokedAt() != null) {
            sessions.revokeFamily(session.getFamilyId(), now());
            record(null, userId, "SESSION_REVOKED", "Refresh token reuse revoked a session family");
            // Commit the family revocation even though the response is 401.
            throw new RefreshReuseException();
        }
        if (!user.isEnabled() || !session.getExpiresAt().isAfter(now())) throw unauthorized("Invalid refresh session");
        return issue(user, session.getFamilyId(), session);
    }

    @Transactional(readOnly = true)
    public UserView me(AuthPrincipal principal) {
        return view(users.findById(principal.userId()).orElseThrow(() -> unauthorized("Account unavailable")));
    }

    @Transactional
    public void changePassword(AuthPrincipal principal, ChangePasswordRequest request) {
        validatePasswordBytes(request.currentPassword()); validatePasswordBytes(request.newPassword());
        var user = users.lockById(principal.userId()).orElseThrow(() -> unauthorized("Account unavailable"));
        validSession(principal);
        if (!passwords.matches(request.currentPassword(), user.getPasswordHash()))
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
        if (passwords.matches(request.newPassword(), user.getPasswordHash()))
            throw new BusinessException(HttpStatus.BAD_REQUEST, "New password must differ from current password");
        user.changePassword(passwords.encode(request.newPassword()));
        sessions.revokeAll(user.getId(), now());
        record(null, user.getId(), "PASSWORD_CHANGE", "Password changed; all sessions revoked");
    }

    @Transactional
    public void logout(AuthPrincipal principal) {
        users.lockById(principal.userId()).orElseThrow(() -> unauthorized("Account unavailable"));
        var session = validSession(principal);
        sessions.revokeFamily(session.getFamilyId(), now());
        record(null, principal.userId(), "LOGOUT", "User signed out of a session family");
    }

    private RefreshSession validSession(AuthPrincipal principal) {
        var session = sessions.findById(principal.sessionId()).orElseThrow(() -> unauthorized("Invalid session"));
        if (session.getUserId() != principal.userId() || session.getRevokedAt() != null || !session.getExpiresAt().isAfter(now()))
            throw unauthorized("Invalid session");
        return session;
    }

    private IssuedSession issue(AppUser user, UUID family, RefreshSession old) {
        byte[] bytes = new byte[32]; random.nextBytes(bytes);
        String raw = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        LocalDateTime now = now();
        // Rotation does not extend the original family's absolute expiration.
        var session = new RefreshSession(user.getId(), family, tokenHash(raw), now,
            old == null ? now.plusDays(properties.refreshDays()) : old.getExpiresAt());
        sessions.saveAndFlush(session);
        if (old != null) old.rotate(session.getId(), now);
        return new IssuedSession(new AuthResponse(jwt.issue(user, session.getId()), "Bearer", properties.accessSeconds(), view(user)), raw);
    }

    private UserView view(AppUser user) {
        var scopes = memberships.activeForUser(user.getId()).stream()
            .map(m -> new WorkspaceView(m.getWorkspace().getId(), m.getWorkspace().getName(), m.getRole().name())).toList();
        return new UserView(user.getId(), user.getFullName(), user.getEmail(), user.isPlatformAdmin(), scopes);
    }
    private void record(Long workspace, long user, String action, String description) {
        audit.save(new AuditLog(workspace, user, action, "User", Long.toString(user), description));
    }
    private static String normalizeEmail(String email) { return email.strip().toLowerCase(Locale.ROOT); }
    private static LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }
    private static void validatePasswordBytes(String password) {
        if (password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Password must be at most 72 UTF-8 bytes");
    }
    private static String tokenHash(String raw) {
        if (raw == null || !raw.matches("[A-Za-z0-9_-]{43}")) throw unauthorized("Invalid refresh session");
        try { return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.US_ASCII))); }
        catch (NoSuchAlgorithmException ex) { throw new IllegalStateException(ex); }
    }
    private static BusinessException unauthorized(String message) { return new BusinessException(HttpStatus.UNAUTHORIZED, message); }
    public static final class RefreshReuseException extends BusinessException {
        public RefreshReuseException() { super(HttpStatus.UNAUTHORIZED, "Refresh session revoked; sign in again"); }
    }
}
