package com.holoka.common.api;

import java.time.Instant;
import java.util.Map;
import com.fasterxml.jackson.annotation.JsonInclude;
import org.springframework.http.HttpStatus;

public record ApiError(boolean success, String message, int status, Instant timestamp,
        @JsonInclude(JsonInclude.Include.NON_EMPTY) Map<String, String> fieldErrors) {
    public static ApiError of(HttpStatus status, String message) {
        return new ApiError(false, message, status.value(), Instant.now(), Map.of());
    }
}
