# Step 4 — Authentication and workspace authorization

## Implementation

- Added JPA identity, workspace, membership, refresh-session and audit mappings against the existing V1 schema; no applied migration was edited.
- Added validated request DTOs and safe response DTOs, transactional authentication services, BCrypt, HS256 JWT encoding/validation and database session checks.
- Added registration/login/me/change-password/refresh/logout/CSRF endpoints.
- Registration creates an OWNER and a new workspace atomically. Client role/ID injection is rejected.
- Added scoped workspace details and a paginated OWNER/MANAGER-only member list. STAFF and cross-workspace access are denied appropriately.
- Added refresh rotation, reuse-family revocation, password-change global revocation, account-disable checks and authentication audits.
- Added secure cookie defaults, real cookie/header CSRF, restricted CORS, a bounded single-instance authentication rate limiter and opt-in OpenAPI.

## Files

New domain sources are under `backend/src/main/java/com/holoka/auth`, `user`, `workspace`, `audit` and `common/persistence`. `config/OpenApiConfig.java` documents implemented routes. Updated `SecurityConfig`, global conflict handling, Maven dependencies and application/environment configuration.

New tests: `AuthIT`, `SqlServerTestSupport` and `auth/AuthRateLimiterTest`. Existing foundation and migration tests were adjusted to isolate their dependencies and share the dedicated database configuration. New API documentation is `docs/api.md`; root/backend READMEs contain current run instructions.

## Important code paths

- `AuthService.register`: user → workspace → OWNER membership → audit → session, in one transaction.
- `AuthService.refresh`: lookup token hash → lock user → re-read session → rotate. `noRollbackFor = RefreshReuseException.class` preserves family revocation when rejecting replay.
- `AuthTokenAuthenticator.authenticate`: validate JWT, then check persisted user and refresh-session state on every authenticated request.
- `WorkspaceAccess.require`: enforce enabled workspace membership before checking an allowed role, even for platform ADMIN.
- `SecurityConfig`: CSRF cookie/header validation on mutations, JWT filter, exact public auth routes, and default-deny for unimplemented routes.

## Run and test

Set DB_URL as documented in `docs/database.md`. Generate JWT_SECRET from at least 32 cryptographically random bytes, Base64 encoded. The application has no default signing secret. For local HTTP set AUTH_COOKIE_SECURE=false; keep true with HTTPS. Set API_DOCS_ENABLED=true only when API documentation should be available.

Build/test the real SQL Server workflow from backend:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

Tests generate an ephemeral signing key internally and never use the development database. They remove only their own fixture rows. The six foundation tests and one limiter test can run without SQL Server through ordinary `verify`; the database profile adds five migration tests and fourteen authentication tests.

## Verification

The full build passed 26 tests with no failures, errors or skips. Checks cover persisted owner registration, BCrypt, valid/invalid login, duplicate/invalid input, token tampering/expiry, secure cookies, actual CSRF cookie/header exchange, refresh rotation/replay/concurrency/expiry, password change, logout, disabled users, live membership changes, platform ADMIN boundaries and workspace isolation.

After final OpenAPI annotations were added, packaging passed and the executable JAR was checked over real HTTP against the dedicated test database: readiness, CSRF exchange, registration, current user, refresh, logout, rejection of the revoked access token, OpenAPI JSON security declarations and Swagger UI all passed. The temporary account/workspace were removed and the test server was stopped. No real credentials or signing key were printed or persisted by that smoke check.

An initial cookie test exposed that Spring's mock CSRF helper replaced cookie handling inside the test context. Authentication integration tests now obtain actual CSRF cookies and headers rather than using that helper. The corrected suite passed.

## Remaining scope

Step 4 implements backend authentication, not the future React screens. Member invitation/creation, role editing, password recovery, email verification and MFA are not provided here. Production scaling needs a shared rate-limit policy and deployment-specific TLS/secrets configuration. Step 5 is Property / Building / Room.
