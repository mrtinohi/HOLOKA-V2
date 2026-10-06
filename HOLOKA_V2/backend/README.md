# HOLOKA backend — Steps 2–9

## Requirements and running

JDK 21 and network access for the first Maven/dependency download. The wrapper pins Maven 3.9.16; the build pins Spring Boot 3.5.16 and Flyway 11.20.3. Running requires SQL Server, DB_URL and JWT_SECRET. Seven foundation/limiter tests remain independent of a database; the opt-in database suite uses real SQL Server.

From this directory in PowerShell:

```powershell
.\mvnw.cmd -Pwindows-auth verify
$env:DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
$taskKey = New-Object byte[] 32
$taskRng = [Security.Cryptography.RandomNumberGenerator]::Create()
$taskRng.GetBytes($taskKey)
$taskRng.Dispose()
$env:JWT_SECRET = [Convert]::ToBase64String($taskKey)
$env:AUTH_COOKIE_SECURE = 'false'
$env:API_DOCS_ENABLED = 'true'
java '-Djava.library.path=target/native' -jar target/holoka-backend-0.1.0-SNAPSHOT.jar
```

Create the database first using the script in `database/schema`. The Windows authentication profile supplies Microsoft's matching native DLL for x64 Windows/JDKs. The example trusts only the local development self-signed certificate. For SQL authentication, omit the profile and java.library.path, set DB_USERNAME/DB_PASSWORD, and use a JDBC URL with trustServerCertificate=false. On macOS/Linux use `sh mvnw verify` and configure SQL authentication before starting the JAR.

If a restricted execution environment assigns the wrong home directory, explicitly select your Maven cache:

```powershell
$env:MAVEN_USER_HOME = "$env:USERPROFILE\.m2"
.\mvnw.cmd "-Dmaven.repo.local=$env:USERPROFILE\.m2\repository" verify
```

## Configuration

Set process environment variables before starting the backend:

```powershell
$env:SERVER_PORT = '8080'
$env:CORS_ALLOWED_ORIGINS = 'http://localhost:5173'
```

Comma-separated origins are supported. Do not use wildcard origins with credentials. `.env.example` documents DB_URL, DB_USERNAME and DB_PASSWORD. These are read from the process environment; no secret or connection string is embedded in source. Missing database configuration or failed migrations prevents normal startup. Never commit actual credentials.

JWT_SECRET must be Base64 encoding of at least 32 cryptographically random bytes; there is no fallback key. The startup example generates an ephemeral development key. For deployments, manage a stable secret externally. AUTH_COOKIE_SECURE defaults to true; set false only for local HTTP. API_DOCS_ENABLED defaults to false.

## Implemented endpoints

`GET /api/health` is a process liveness check returning:

```json
{"success":true,"message":"Success","data":{"status":"UP","service":"holoka-backend"}}
```

`GET /actuator/health` reports aggregate health including the database. `GET /actuator/health/liveness` checks the process and `GET /actuator/health/readiness` includes a real database check. Actuator intentionally uses its standard response format and suppresses internal details. `/api/health` remains process liveness only.

Authentication routes implement registration, login, refresh, logout, current user and password change. Workspace detail/member-list routes enforce live membership and role checks. All unimplemented routes remain denied. No default user/password is generated. CSRF protection remains enabled for every mutation, including login; CORS permits configured origins only. API errors from security handlers and controller advice use a common envelope; CORS rejection occurs before controller dispatch and uses the framework's rejection response. See `docs/api.md` for exact requests and the cookie/header flow.

## Architecture and files

- `HolokaApplication`: executable application entry point.
- `health/HealthController`: public liveness endpoint and response DTO.
- `common/api/ApiResponse`, `ApiError`: shared response contracts.
- `common/error/BusinessException`, `GlobalExceptionHandler`: safe business, validation, access and unexpected error responses.
- `config/SecurityConfig`: default-deny routes, stateless sessions, method security, CORS and JSON security errors.
- `application.properties`: external configuration and restricted health exposure; standard key=value syntax.
- `BackendFoundationTest`: application context, health, access, CSRF and CORS integration checks.
- `db/migration/V1__identity_workspace_foundation.sql`: six foundational tables and reference roles.
- `DatabaseMigrationIT`: opt-in real SQL Server migration, Unicode, unique/check/foreign key constraint tests; test data is rolled back.
- `auth/`: DTOs, controller, transactional service, JWT validation, session rotation, cookies and rate limits.
- `user/`, `workspace/`, `audit/`: JPA entities/repositories and workspace access boundary.
- `AuthIT`: real SQL Server authentication and permission integration checks with actual CSRF cookies/headers.
- `OpenApiConfig`: opt-in OpenAPI and Swagger UI for implemented endpoints.
- `property/`, `building/`, `room/`: scoped CRUD, validation, search/filter/sort/pagination, optimistic versions and transactional audit.
- `db/migration/V2__property_building_room.sql`: domain tables, scoped foreign keys, indexes and constraints.
- `InventoryIT`: SQL Server hierarchy CRUD, role/scope isolation, parent lifecycle, concurrent-edit and filter checks.
- `tenant/`, `contract/`: renter CRUD, protected rental history, draft/active lease workflows, overlap prevention and clock-driven room reconciliation.
- `db/migration/V3__tenants_contracts.sql`: tenant/contract tables and scoped relationships.
- `LeaseIT`: controlled-clock, concurrency, lifecycle, authorization and persistence checks.
- `invoice/`, `payment/`: draft/issued billing, partial/full collection, overdue queries and owner-only payment corrections.
- `db/migration/V4__invoices_payments.sql`: scoped billing tables, decimal checks and unique invoice/payment indexes.
- `BillingIT`: calculation, payment concurrency, ledger consistency, lifecycle, timezone and permission checks.
- `maintenance/`, `task/`, `work/`: operational workflows, current-assignee access, shared work events and policy.
- `db/migration/V5__maintenance_tasks.sql`: maintenance, task and append-only event storage with scoped relationships.
- `OperationsIT`: assignment, lifecycle, history, costs, staff isolation, concurrency and completion checks.
- `notification/`: shared live rule queries, personal inbox, after-commit evaluation, scheduled reconciliation and action center.
- `db/migration/V6__notifications.sql`: recipient-scoped notifications with unique delivery keys.
- `NotificationIT`: real event generation, controlled-clock rules, deduplication, read state and current-role/assignment checks.

Domain controllers → DTOs → transactional services → repositories keep HTTP, policy and persistence separate. Identity, property inventory, leasing, billing and assigned operational work are implemented. No fake repositories or business data have been added. See `docs/property-management.md`, `docs/leasing.md`, `docs/billing.md` and `docs/operations.md` for request bodies and permissions.

## Tests and packaging

`.\mvnw.cmd verify` runs tests and creates `target/holoka-backend-0.1.0-SNAPSHOT.jar`. `.\mvnw.cmd test` runs tests only. Reports are under `target/surefire-reports`.

The generated Windows wrapper includes a small null check for directory link targets to work in restricted Windows environments. JDK 21 may emit a Mockito dynamic-agent warning during tests; it does not indicate a failing test.

Run the database tests explicitly (after creating holoka_newconcept_it):

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

This executes 97 tests: six foundation, one limiter, five migration, fourteen authentication, eleven inventory, fourteen leasing, fourteen billing, seventeen operations and fifteen notification tests. Without the `sqlserver-it` profile, `verify` executes only seven database-independent tests. Database tests fail when TEST_DB_URL is missing rather than silently skipping, generate their own temporary signing key and remove only their test fixtures. Failsafe reports are in `target/failsafe-reports`.

## Pending

Step 10: dashboard aggregates and charts. STAFF can read and advance their assigned maintenance/tasks and see corresponding alerts; broad workspace inventory, financial and renter-identity access remains denied. Team-management mutations, account recovery, verification/MFA, production deployment and browser UI are not complete. Assignments require existing enabled STAFF memberships; invitations and team-editing APIs are not yet implemented. External payment processing, automatic recurring billing and refunds are future features; the payment API records payments already received. The in-process authentication rate limiter requires a shared replacement or gateway policy for multi-instance deployment.

The contract scheduler is enabled by default and reconciles dates about every minute using workspace timezones. Keep CONTRACT_SCHEDULER_ENABLED=true in normal operation. Activation/termination update room occupancy immediately; date boundaries are reconciled by the scheduler, including catch-up after restarts. Tests use a controlled clock and invoke the scheduler explicitly.

Keep ALERT_EVENTS_ENABLED and ALERT_SCHEDULER_ENABLED true for after-commit and date-driven in-app notifications. The alert scheduler reconciles approximately every minute. Live `/api/actions` queries current conditions independently. See `docs/notifications.md` for rules, recipient security, read/resolution semantics and batching limitations. No external message delivery is implemented.
