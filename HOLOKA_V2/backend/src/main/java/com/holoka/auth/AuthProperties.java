package com.holoka.auth;

import jakarta.validation.constraints.*;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated @ConfigurationProperties("holoka.auth")
public record AuthProperties(@NotBlank String jwtSecret, @NotBlank String issuer,
    @Min(60) @Max(3600) long accessSeconds, @Min(1) @Max(90) int refreshDays,
    boolean cookieSecure, @Min(1) @Max(1000) int requestsPerMinute) {}
