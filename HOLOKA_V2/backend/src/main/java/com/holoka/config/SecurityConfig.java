package com.holoka.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.holoka.common.api.ApiError;
import com.holoka.auth.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, ObjectMapper mapper, AuthTokenAuthenticator authenticator,
        @Value("${holoka.auth.cookie-secure:true}") boolean cookieSecure,
        @Value("${springdoc.api-docs.enabled:false}") boolean docsEnabled) throws Exception {
        var csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        csrfRepository.setCookieCustomizer(cookie -> cookie.secure(cookieSecure).sameSite("Strict").path("/"));
        return http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .addFilterBefore(new JwtAuthenticationFilter(authenticator, mapper), UsernamePasswordAuthenticationFilter.class)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .requestCache(cache -> cache.disable())
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .logout(logout -> logout.disable())
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(HttpMethod.GET, "/api/health", "/actuator/health", "/actuator/health/liveness", "/actuator/health/readiness", "/api/auth/csrf").permitAll()
                    .requestMatchers(HttpMethod.POST, "/api/auth/register", "/api/auth/login", "/api/auth/refresh").permitAll()
                    .requestMatchers("/api/auth/me", "/api/auth/change-password", "/api/auth/logout", "/api/workspaces/**",
                        "/api/properties", "/api/properties/**", "/api/buildings", "/api/buildings/**", "/api/rooms", "/api/rooms/**",
                        "/api/tenants", "/api/tenants/**", "/api/contracts", "/api/contracts/**",
                        "/api/invoices", "/api/invoices/**", "/api/payments", "/api/payments/**",
                        "/api/maintenance", "/api/maintenance/**", "/api/tasks", "/api/tasks/**",
                        "/api/notifications", "/api/notifications/**", "/api/actions").permitAll();
                if (docsEnabled) auth.requestMatchers("/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll();
                auth.anyRequest().permitAll();
            })
            .exceptionHandling(errors -> errors
                .authenticationEntryPoint((request, response, exception) -> writeError(mapper, response, HttpStatus.UNAUTHORIZED, "Authentication required"))
                .accessDeniedHandler((request, response, exception) -> writeError(mapper, response, HttpStatus.FORBIDDEN, "Access denied")))
            .build();
    }

    @Bean PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(12); }

    @Bean
    CorsConfigurationSource corsConfigurationSource(@Value("${holoka.cors.allowed-origins}") List<String> origins) {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN", "Idempotency-Key"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    private void writeError(ObjectMapper mapper, HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), ApiError.of(status, message));
    }
}
