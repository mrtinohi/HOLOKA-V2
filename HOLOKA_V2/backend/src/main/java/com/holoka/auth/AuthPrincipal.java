package com.holoka.auth;
import java.util.UUID;
public record AuthPrincipal(long userId, UUID sessionId) {}
