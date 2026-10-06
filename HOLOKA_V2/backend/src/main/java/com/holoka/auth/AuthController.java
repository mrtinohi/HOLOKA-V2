package com.holoka.auth;

import com.holoka.common.api.ApiResponse;
import static com.holoka.auth.AuthDtos.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
@Tag(name = "Authentication")
public class AuthController {
    public static final String REFRESH_COOKIE = "HOLOKA_REFRESH";
    private final AuthService service;
    private final AuthProperties properties;
    private final AuthRateLimiter limiter;

    @GetMapping("/csrf")
    @Operation(summary = "Get a CSRF token and cookie before any state-changing request")
    public ApiResponse<CsrfResponse> csrf(CsrfToken csrf, HttpServletResponse response) {
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return ApiResponse.ok(new CsrfResponse(csrf.getHeaderName(), csrf.getToken()));
    }

    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Register an OWNER and a new workspace; roles cannot be supplied")
    public ApiResponse<AuthResponse> register(@Valid @RequestBody RegisterRequest body, HttpServletRequest request, HttpServletResponse response) {
        limiter.check(request.getRemoteAddr()); return issued(service.register(body), response);
    }
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        limiter.check(request.getRemoteAddr()); return issued(service.login(body), response);
    }
    @PostMapping("/refresh")
    @Operation(summary = "Rotate the HttpOnly refresh cookie; requires CSRF header; do not send an expired access token")
    public ApiResponse<AuthResponse> refresh(@CookieValue(name = REFRESH_COOKIE, required = false) String token,
        HttpServletRequest request, HttpServletResponse response) {
        limiter.check(request.getRemoteAddr());
        try { return issued(service.refresh(token), response); }
        catch (com.holoka.common.error.BusinessException ex) { clearCookie(response); throw ex; }
    }
    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<UserView> me(@AuthenticationPrincipal AuthPrincipal principal) { return ApiResponse.ok(service.me(principal)); }
    @PutMapping("/change-password")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Change password and revoke every access/refresh session; sign in again afterwards")
    public ApiResponse<Void> changePassword(@AuthenticationPrincipal AuthPrincipal principal,
        @Valid @RequestBody ChangePasswordRequest body, HttpServletRequest request, HttpServletResponse response) {
        limiter.check(request.getRemoteAddr()); service.changePassword(principal, body); clearCookie(response); return ApiResponse.ok(null);
    }
    @PostMapping("/logout")
    @SecurityRequirement(name = "bearerAuth")
    public ApiResponse<Void> logout(@AuthenticationPrincipal AuthPrincipal principal, HttpServletResponse response) {
        service.logout(principal); clearCookie(response); return ApiResponse.ok(null);
    }

    private ApiResponse<AuthResponse> issued(IssuedSession issued, HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(issued.refreshToken(), Duration.ofDays(properties.refreshDays())).toString());
        response.setHeader(HttpHeaders.CACHE_CONTROL, "no-store");
        return ApiResponse.ok(issued.response());
    }
    private void clearCookie(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
    }
    private ResponseCookie cookie(String value, Duration age) {
        return ResponseCookie.from(REFRESH_COOKIE, value).httpOnly(true).secure(properties.cookieSecure())
            .sameSite("Strict").path("/api/auth").maxAge(age).build();
    }
}
