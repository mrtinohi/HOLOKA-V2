package com.holoka;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import com.holoka.auth.AuthTokenAuthenticator;
import com.holoka.config.SecurityConfig;
import com.holoka.health.HealthController;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = BackendFoundationTest.FoundationApp.class, properties = {
    "spring.autoconfigure.exclude=org.springframework.boot.autoconfigure.security.servlet.UserDetailsServiceAutoConfiguration,org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration,org.springframework.boot.autoconfigure.orm.jpa.HibernateJpaAutoConfiguration,org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration",
    "management.endpoint.health.group.readiness.include=readinessState"
})
@AutoConfigureMockMvc
class BackendFoundationTest {
    @Configuration @EnableAutoConfiguration @Import({HealthController.class, SecurityConfig.class})
    static class FoundationApp {}
    @MockitoBean AuthTokenAuthenticator authenticator;
    @Autowired MockMvc mvc;

    @Test void healthUsesApiEnvelope() throws Exception {
        mvc.perform(get("/api/health")).andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test void healthDoesNotExposeInfrastructure() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.components").doesNotExist());
    }

    @Test void businessRoutesRequireAuthentication() throws Exception {
        mvc.perform(get("/api/properties")).andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.success").value(false)).andExpect(jsonPath("$.status").value(401));
    }

    @Test void mutationWithoutCsrfIsRejectedWithEnvelope() throws Exception {
        mvc.perform(post("/api/properties")).andExpect(status().isForbidden())
            .andExpect(jsonPath("$.status").value(403));
    }

    @Test void allowedOriginCanPreflight() throws Exception {
        mvc.perform(options("/api/properties").header("Origin", "http://localhost:5173")
            .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isOk()).andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"));
    }

    @Test void unknownOriginIsRejected() throws Exception {
        mvc.perform(options("/api/properties").header("Origin", "https://untrusted.example")
            .header("Access-Control-Request-Method", "POST"))
            .andExpect(status().isForbidden()).andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }
}
