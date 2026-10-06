package com.holoka;

import com.fasterxml.jackson.databind.*;
import com.holoka.auth.*;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

@SpringBootTest @AutoConfigureMockMvc
class AuthIT extends SqlServerTestSupport {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired PasswordEncoder passwords;
    @Autowired AuthTokenAuthenticator authenticator;
    private final List<Long> users = new ArrayList<>();
    private final List<Long> workspaces = new ArrayList<>();
    private static final String PASSWORD = "Test-only-passphrase-2026!";

    @AfterEach void removeOnlyThisTestsFixtures() {
        for (long id : users) {
            jdbc.update("DELETE FROM dbo.audit_logs WHERE actor_user_id=?", id);
            jdbc.update("DELETE FROM dbo.refresh_sessions WHERE user_id=?", id);
            jdbc.update("DELETE FROM dbo.memberships WHERE user_id=?", id);
        }
        for (long id : workspaces) jdbc.update("DELETE FROM dbo.workspaces WHERE id=?", id);
        for (long id : users) jdbc.update("DELETE FROM dbo.app_users WHERE id=?", id);
    }

    @Test void registrationPersistsOwnerWorkspaceHashAndSafeResponse() throws Exception {
        var account = register();
        var body = account.body;
        assertThat(body.path("user").path("platformAdmin").asBoolean()).isFalse();
        assertThat(body.path("user").path("workspaces").get(0).path("role").asText()).isEqualTo("OWNER");
        assertThat(body.toString()).doesNotContain("passwordHash", PASSWORD, "refreshToken");
        String hash = jdbc.queryForObject("SELECT password_hash FROM dbo.app_users WHERE id=?", String.class, account.userId);
        assertThat(hash).startsWith("$2"); assertThat(passwords.matches(PASSWORD, hash)).isTrue();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.audit_logs WHERE actor_user_id=? AND action='CREATE'", Integer.class, account.userId)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT token_hash FROM dbo.refresh_sessions WHERE user_id=?", String.class, account.userId)).isNotEqualTo(account.refresh.getValue());
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(account))).andExpect(status().isOk())
            .andExpect(jsonPath("$.data.email").value(account.email)).andExpect(jsonPath("$.data.passwordHash").doesNotExist());
    }

    @Test void loginAcceptsNormalizedEmailAndRejectsWrongOrMissingAccount() throws Exception {
        var account = register();
        mvc.perform(post("/api/auth/login").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("email", account.email.toUpperCase(Locale.ROOT), "password", PASSWORD))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.accessToken").isString());
        for (String email : List.of(account.email, UUID.randomUUID()+"@test.invalid")) {
            mvc.perform(post("/api/auth/login").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("email", email, "password", "incorrect-passphrase"))))
                .andExpect(status().isUnauthorized()).andExpect(jsonPath("$.message").value("Invalid email or password"));
        }
    }

    @Test void rejectsDuplicateEmailAndPrivilegeInjection() throws Exception {
        var account = register();
        var request = registration(account.email.toUpperCase(Locale.ROOT));
        mvc.perform(post("/api/auth/register").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
            .andExpect(status().isConflict());
        request.put("email", UUID.randomUUID()+"@test.invalid"); request.put("role", "ADMIN");
        mvc.perform(post("/api/auth/register").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
            .andExpect(status().isBadRequest());
    }

    @Test void validatesPasswordAndDoesNotExposeInternalErrors() throws Exception {
        var request = registration(UUID.randomUUID()+"@test.invalid"); request.put("password", "short");
        mvc.perform(post("/api/auth/register").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.fieldErrors.password").exists());
        request.put("password", "ắ".repeat(30));
        mvc.perform(post("/api/auth/register").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON).content(json(request)))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.message").value("Password must be at most 72 UTF-8 bytes"));
    }

    @Test void rejectsMissingTamperedAndExpiredTokens() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        var account = register();
        String token = account.body.path("accessToken").asText();
        String[] parts = token.split("\\.");
        var claims = mapper.readTree(Base64.getUrlDecoder().decode(parts[1]));
        ((com.fasterxml.jackson.databind.node.ObjectNode)claims).put("sub", "999999999");
        String tampered = parts[0]+"."+Base64.getUrlEncoder().withoutPadding().encodeToString(mapper.writeValueAsBytes(claims))+"."+parts[2];
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer "+tampered)).andExpect(status().isUnauthorized());
        var key = new javax.crypto.spec.SecretKeySpec(Base64.getDecoder().decode(JWT_SECRET), "HmacSHA256");
        var encoder = new org.springframework.security.oauth2.jwt.NimbusJwtEncoder(new com.nimbusds.jose.jwk.source.ImmutableSecret<>(key));
        var expiredClaims = org.springframework.security.oauth2.jwt.JwtClaimsSet.builder().issuer("holoka").audience(List.of("holoka-api"))
            .subject(Long.toString(account.userId)).issuedAt(java.time.Instant.now().minusSeconds(3600)).expiresAt(java.time.Instant.now().minusSeconds(300))
            .claim("kind","access").claim("sid",UUID.randomUUID().toString()).claim("ver",0).build();
        String expired = encoder.encode(org.springframework.security.oauth2.jwt.JwtEncoderParameters.from(
            org.springframework.security.oauth2.jwt.JwsHeader.with(org.springframework.security.oauth2.jose.jws.MacAlgorithm.HS256).build(), expiredClaims)).getTokenValue();
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer "+expired)).andExpect(status().isUnauthorized());
    }

    @Test void refreshRotatesAndReplayRevokesTheFamily() throws Exception {
        var account = register();
        var refreshed = mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(account.refresh)).andExpect(status().isOk()).andReturn();
        String access = data(refreshed).path("accessToken").asText();
        Cookie rotated = refreshed.getResponse().getCookie(AuthController.REFRESH_COOKIE);
        assertThat(rotated.getValue()).isNotEqualTo(account.refresh.getValue());
        mvc.perform(get("/api/auth/me").header("Authorization", bearer(account))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer "+access)).andExpect(status().isOk());
        mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(account.refresh)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(rotated)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer "+access)).andExpect(status().isUnauthorized());
    }

    @Test void concurrentRefreshHasOneWinnerAndReplayRevokesIt() throws Exception {
        var account = register();
        var barrier = new CyclicBarrier(2);
        try (var pool = Executors.newFixedThreadPool(2)) {
            Callable<Integer> attempt = () -> { barrier.await(5, TimeUnit.SECONDS); return mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(account.refresh)).andReturn().getResponse().getStatus(); };
            var first = pool.submit(attempt); var second = pool.submit(attempt);
            assertThat(List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,401);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.refresh_sessions WHERE user_id=? AND revoked_at IS NULL", Integer.class, account.userId)).isZero();
    }

    @Test void passwordChangeRequiresCurrentPasswordAndRevokesAllSessions() throws Exception {
        var account = register();
        var login = mvc.perform(post("/api/auth/login").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("email",account.email,"password",PASSWORD)))).andExpect(status().isOk()).andReturn();
        mvc.perform(put("/api/auth/change-password").with(browserCsrf()).header("Authorization",bearer(account)).contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("currentPassword","wrong-password","newPassword","A-new-test-passphrase!"))))
            .andExpect(status().isBadRequest());
        mvc.perform(put("/api/auth/change-password").with(browserCsrf()).header("Authorization",bearer(account)).contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("currentPassword",PASSWORD,"newPassword","A-new-test-passphrase!"))))
            .andExpect(status().isOk());
        mvc.perform(get("/api/auth/me").header("Authorization",bearer(account))).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization","Bearer "+data(login).path("accessToken").asText())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(login.getResponse().getCookie(AuthController.REFRESH_COOKIE))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("email",account.email,"password",PASSWORD)))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("email",account.email,"password","A-new-test-passphrase!")))).andExpect(status().isOk());
    }

    @Test void logoutRevokesAccessAndRefresh() throws Exception {
        var account = register();
        mvc.perform(post("/api/auth/logout").with(browserCsrf()).header("Authorization",bearer(account))).andExpect(status().isOk())
            .andExpect(cookie().maxAge(AuthController.REFRESH_COOKIE,0));
        mvc.perform(get("/api/auth/me").header("Authorization",bearer(account))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(account.refresh)).andExpect(status().isUnauthorized());
    }

    @Test void roleChecksAreScopedAndRecheckedFromDatabase() throws Exception {
        var owner = register(); var other = register();
        mvc.perform(get("/api/workspaces/"+owner.workspaceId).header("Authorization",bearer(other))).andExpect(status().isNotFound());
        mvc.perform(get("/api/workspaces/"+owner.workspaceId+"/members").header("Authorization",bearer(owner)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'STAFF')",owner.workspaceId,other.userId);
        mvc.perform(get("/api/workspaces/"+owner.workspaceId).header("Authorization",bearer(other))).andExpect(status().isOk());
        mvc.perform(get("/api/workspaces/"+owner.workspaceId+"/members").header("Authorization",bearer(other))).andExpect(status().isForbidden());
        jdbc.update("UPDATE dbo.memberships SET role_code='MANAGER' WHERE workspace_id=? AND user_id=?",owner.workspaceId,other.userId);
        mvc.perform(get("/api/workspaces/"+owner.workspaceId+"/members").header("Authorization",bearer(other))).andExpect(status().isOk());
        jdbc.update("UPDATE dbo.memberships SET enabled=0 WHERE workspace_id=? AND user_id=?",owner.workspaceId,other.userId);
        mvc.perform(get("/api/workspaces/"+owner.workspaceId).header("Authorization",bearer(other))).andExpect(status().isNotFound());
    }

    @Test void platformAdminDoesNotBypassWorkspaceMembership() throws Exception {
        var admin = register(); var owner = register();
        jdbc.update("UPDATE dbo.app_users SET platform_admin=1 WHERE id=?",admin.userId);
        assertThat(authenticator.authenticate(admin.body.path("accessToken").asText()).getAuthorities()).extracting("authority").contains("ROLE_ADMIN");
        mvc.perform(get("/api/workspaces/"+owner.workspaceId).header("Authorization",bearer(admin))).andExpect(status().isNotFound());
    }

    @Test void disabledAccountImmediatelyLosesAccessAndCannotRefreshOrLogin() throws Exception {
        var account = register();
        jdbc.update("UPDATE dbo.app_users SET enabled=0 WHERE id=?",account.userId);
        mvc.perform(get("/api/auth/me").header("Authorization",bearer(account))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(account.refresh)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON)
            .content(json(Map.of("email",account.email,"password",PASSWORD)))).andExpect(status().isUnauthorized());
    }

    @Test void actualCsrfCookieHeaderFlowAndCookieSecurity() throws Exception {
        var tokenResult = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        Cookie xsrf = tokenResult.getResponse().getCookie("XSRF-TOKEN");
        String token = data(tokenResult).path("token").asText();
        String email = UUID.randomUUID()+"@test.invalid";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(json(registration(email))))
            .andExpect(status().isForbidden());
        var result = mvc.perform(post("/api/auth/register").cookie(xsrf).header("X-XSRF-TOKEN",token)
            .contentType(MediaType.APPLICATION_JSON).content(json(registration(email))))
            .andExpect(status().isCreated()).andExpect(cookie().httpOnly(AuthController.REFRESH_COOKIE,true))
            .andExpect(cookie().secure(AuthController.REFRESH_COOKIE,true)).andExpect(cookie().path(AuthController.REFRESH_COOKIE,"/api/auth"))
            .andExpect(header().string("Cache-Control","no-store")).andReturn();
        track(result,email);
        assertThat(result.getResponse().getHeaders("Set-Cookie").toString()).contains("SameSite=Strict");
        mvc.perform(post("/api/auth/refresh").cookie(result.getResponse().getCookie(AuthController.REFRESH_COOKIE))).andExpect(status().isForbidden());
    }

    private RequestPostProcessor browserCsrf() throws Exception {
        var response = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        Cookie cookie = response.getResponse().getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        String header = data(response).path("headerName").asText();
        String token = data(response).path("token").asText();
        return request -> {
            var cookies = new ArrayList<Cookie>();
            if (request.getCookies() != null) cookies.addAll(Arrays.asList(request.getCookies()));
            cookies.add(cookie); request.setCookies(cookies.toArray(Cookie[]::new));
            request.addHeader(header, token); return request;
        };
    }

    @Test void rejectsExpiredAndUnknownRefreshSessions() throws Exception {
        var account = register();
        jdbc.update("UPDATE dbo.refresh_sessions SET created_at=DATEADD(day,-2,SYSUTCDATETIME()), expires_at=DATEADD(day,-1,SYSUTCDATETIME()) WHERE user_id=?", account.userId);
        mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(account.refresh)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/auth/me").header("Authorization",bearer(account))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/refresh").with(browserCsrf()).cookie(new Cookie(AuthController.REFRESH_COOKIE,"x".repeat(43)))).andExpect(status().isUnauthorized());
    }

    private Account register() throws Exception {
        String email = UUID.randomUUID()+"@test.invalid";
        var result = mvc.perform(post("/api/auth/register").with(browserCsrf()).contentType(MediaType.APPLICATION_JSON).content(json(registration(email))))
            .andExpect(status().isCreated()).andReturn();
        return track(result,email);
    }
    private Account track(MvcResult result, String email) throws Exception {
        var body = data(result); long user = body.path("user").path("id").asLong(); long workspace = body.path("user").path("workspaces").get(0).path("id").asLong();
        users.add(user); workspaces.add(workspace);
        return new Account(body,result.getResponse().getCookie(AuthController.REFRESH_COOKIE),email,user,workspace);
    }
    private Map<String,Object> registration(String email) { return new LinkedHashMap<>(Map.of("fullName","Nguyễn An","email",email,"password",PASSWORD,"workspaceName","Nhà An Phú")); }
    private String json(Object value) throws Exception { return mapper.writeValueAsString(value); }
    private JsonNode data(MvcResult result) throws Exception { return mapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data"); }
    private String bearer(Account account) { return "Bearer "+account.body.path("accessToken").asText(); }
    record Account(JsonNode body, Cookie refresh, String email, long userId, long workspaceId) {}
}

