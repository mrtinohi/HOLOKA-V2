package com.holoka.common.error;

import org.springframework.http.HttpStatus;

/** Messages must be safe to expose to API clients. */
public class BusinessException extends RuntimeException {
    private final HttpStatus status;

    public BusinessException(HttpStatus status, String message) {
        super(message);
        if (!status.is4xxClientError()) {
            throw new IllegalArgumentException("Business errors must use a 4xx status");
        }
        this.status = status;
    }

    public HttpStatus getStatus() { return status; }
}
