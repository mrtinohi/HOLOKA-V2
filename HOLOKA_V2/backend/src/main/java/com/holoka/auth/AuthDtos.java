package com.holoka.auth;

import jakarta.validation.constraints.*;
import java.util.List;
import io.swagger.v3.oas.annotations.media.Schema;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(
        @NotBlank @Size(max = 160) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @Schema(accessMode = Schema.AccessMode.WRITE_ONLY) @NotBlank @Size(min = 12, max = 72) String password,
        @NotBlank @Size(max = 160) String workspaceName) {}
    public record LoginRequest(@NotBlank @Email @Size(max = 254) String email,
        @Schema(accessMode = Schema.AccessMode.WRITE_ONLY) @NotBlank @Size(max = 72) String password) {}
    public record ChangePasswordRequest(
        @Schema(accessMode = Schema.AccessMode.WRITE_ONLY) @NotBlank @Size(max = 72) String currentPassword,
        @Schema(accessMode = Schema.AccessMode.WRITE_ONLY) @NotBlank @Size(min = 12, max = 72) String newPassword) {}
    public record WorkspaceView(long id, String name, String role) {}
    public record UserView(long id, String fullName, String email, boolean platformAdmin, List<WorkspaceView> workspaces) {}
    public record AuthResponse(String accessToken, String tokenType, long expiresIn, UserView user) {}
    public record CsrfResponse(String headerName, String token) {}
    // Internal result: refresh token is put in a cookie, never serialized into the response body.
    public record IssuedSession(AuthResponse response, String refreshToken) {}
}
