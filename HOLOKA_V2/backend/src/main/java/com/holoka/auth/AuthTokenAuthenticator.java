package com.holoka.auth;

import com.holoka.user.UserRepository;
import java.time.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class AuthTokenAuthenticator {
    private final JwtService jwt;
    private final UserRepository users;
    private final RefreshSessionRepository sessions;

    @Transactional(readOnly = true)
    public Authentication authenticate(String token) {
        long userId; UUID sessionId; long version;
        try {
            var claims = jwt.decode(token);
            userId = Long.parseLong(claims.getSubject());
            sessionId = UUID.fromString(claims.getClaimAsString("sid"));
            version = ((Number) claims.getClaim("ver")).longValue();
        } catch (RuntimeException ex) { throw new BadCredentialsException("Invalid access token"); }
        var user = users.findById(userId).orElseThrow(() -> new BadCredentialsException("Invalid access token"));
        var session = sessions.findById(sessionId).orElseThrow(() -> new BadCredentialsException("Invalid access token"));
        if (!user.isEnabled() || user.getTokenVersion() != version || session.getUserId() != userId
            || session.getRevokedAt() != null || !session.getExpiresAt().isAfter(LocalDateTime.now(ZoneOffset.UTC))) {
            throw new BadCredentialsException("Invalid access token");
        }
        var authorities = user.isPlatformAdmin() ? List.of(new SimpleGrantedAuthority("ROLE_ADMIN")) : List.<SimpleGrantedAuthority>of();
        return UsernamePasswordAuthenticationToken.authenticated(new AuthPrincipal(userId, sessionId), null, authorities);
    }
}
