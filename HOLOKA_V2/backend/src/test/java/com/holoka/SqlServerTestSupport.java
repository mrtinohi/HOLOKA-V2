package com.holoka;

import java.security.SecureRandom;
import java.util.Base64;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

abstract class SqlServerTestSupport {
    static final String JWT_SECRET;
    static {
        byte[] bytes = new byte[32]; new SecureRandom().nextBytes(bytes);
        JWT_SECRET = Base64.getEncoder().encodeToString(bytes);
    }
    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        String url = System.getenv("TEST_DB_URL");
        if (url == null) throw new IllegalStateException("TEST_DB_URL is required");
        var databaseNames = java.util.Arrays.stream(url.split(";"))
            .filter(part -> part.toLowerCase(java.util.Locale.ROOT).startsWith("databasename="))
            .map(part -> part.substring(part.indexOf('=') + 1)).toList();
        if (databaseNames.size()!=1 || !java.util.Set.of("holoka_newconcept_it", "holoka_anti_it").contains(databaseNames.getFirst()))
            throw new IllegalStateException("TEST_DB_URL must explicitly target holoka_newconcept_it or holoka_anti_it");
        registry.add("spring.datasource.url", () -> url);
        registry.add("spring.datasource.username", () -> System.getenv().getOrDefault("TEST_DB_USERNAME", ""));
        registry.add("spring.datasource.password", () -> System.getenv().getOrDefault("TEST_DB_PASSWORD", ""));
        registry.add("holoka.auth.jwt-secret", () -> JWT_SECRET);
        registry.add("holoka.auth.requests-per-minute", () -> 1000);
        registry.add("holoka.contracts.scheduling-enabled", () -> false);
        registry.add("holoka.alerts.events-enabled", () -> false);
        registry.add("holoka.alerts.scheduling-enabled", () -> false);
    }
}
