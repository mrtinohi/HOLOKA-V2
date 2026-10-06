package com.holoka.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.holoka.common.api.ApiError;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final AuthTokenAuthenticator authenticator;
    private final ObjectMapper mapper;
    @Override protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null) {
            try {
                if (!header.startsWith("Bearer ") || header.length() > 8192) throw new org.springframework.security.authentication.BadCredentialsException("Invalid access token");
                var authentication = authenticator.authenticate(header.substring(7));
                var context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication); SecurityContextHolder.setContext(context);
            } catch (AuthenticationException ex) {
                SecurityContextHolder.clearContext();
                response.setStatus(401); response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                mapper.writeValue(response.getOutputStream(), ApiError.of(HttpStatus.UNAUTHORIZED, "Invalid or expired access token"));
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
