# SQL Server setup and schema

## Engine and database selection

Use Microsoft SQL Server, administered with SSMS. Local verification uses SQL Server 2025 (17.0.1000.7), localhost TCP port 1433 and the signed-in Windows user's existing database access. No server authentication mode, service settings, login or existing database has been changed.

The machine already contains a `holoka` database with business tables. This checkout deliberately uses `holoka_newconcept` and `holoka_newconcept_it` to preserve that database. Do not point migrations at `holoka` or another existing application database. Adoption/import of existing data requires a separate explicit migration plan.

## Create databases in SSMS

Connect to `localhost` using Windows Authentication. Open `database/schema/create-databases.sql`, confirm the server, and execute it. It creates only missing databases; it never drops or clears them. Database creation requires the corresponding SQL Server permission.

The script uses `Latin1_General_100_CI_AS_SC`: case-insensitive, accent-sensitive and supplementary-character aware. Human-facing strings use NVARCHAR. Email uniqueness is case-insensitive. UTC timestamps use DATETIME2(6); subsequent monetary columns will use DECIMAL rather than floating point.

## Start with Windows authentication (local development)

Since Step 4, also set JWT_SECRET before startup using the secure-generation example in the root/backend README. For local HTTP auth cookies use AUTH_COOKIE_SECURE=false; production defaults remain secure. The commands below focus on database configuration.

From `backend`:

```powershell
.\mvnw.cmd -Pwindows-auth verify
$env:DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
java '-Djava.library.path=target/native' -jar target/holoka-backend-0.1.0-SNAPSHOT.jar
```

The Maven profile downloads the official Microsoft 12.10.2.x64 native authentication library matching the JDBC driver. It is kept under ignored `target/native`, not installed system-wide. This profile requires Windows x64 with a matching JDK. Native authentication is documented by [Microsoft](https://learn.microsoft.com/en-us/sql/connect/jdbc/setting-the-connection-properties).

For a deployed instance, use a properly trusted server certificate and `trustServerCertificate=false`. Do not copy the local development certificate exception into production.

## SQL authentication alternative

Configure a dedicated login/user using your normal administrator workflow, then supply DB_URL, DB_USERNAME and DB_PASSWORD as process environment variables or secret-manager values. Do not place credentials inside DB_URL because connection URLs can appear in library logs. The application does not auto-load `.env`.

Build without `windows-auth` and omit java.library.path. No SQL login is created by this repository. Separate schema-migration privileges from the runtime account for production; the initial local workflow runs migrations at startup using the configured connection.

## Migration lifecycle

Flyway applies versioned scripts under `backend/src/main/resources/db/migration` before JPA starts. Flyway core and its SQL Server module are pinned together at 11.20.3. The initial Boot-managed 11.7.2 warned about SQL Server 2025, so the dependency was updated.

- `baseline-on-migrate=false`: refuse adoption of a nonempty unversioned schema.
- `clean-disabled=true`: prevent Flyway clean from deleting application tables.
- `validate-on-migrate=true`: verify checksums on startup.
- `ddl-auto=validate`: Hibernate cannot create or update the schema.
- `open-in-view=false`: database access belongs in service transactions.

Do not execute versioned migration files directly in SSMS; let Flyway record their history. Never edit an already-applied migration; add V2, V3 and subsequent scripts. Domain tables will be introduced alongside the relevant implementation steps.

## V1 tables and relationships

| Table | Purpose and relationships |
| --- | --- |
| app_users | Global user identity, unique email, hash storage, account/token version; no accounts seeded |
| roles | ADMIN, OWNER, MANAGER, STAFF reference values |
| workspaces | Workspace name, timezone, currency, vacancy threshold and lifecycle |
| memberships | User/workspace/role, unique per user/workspace; ADMIN cannot be a workspace role |
| refresh_sessions | Hashed rotating-token storage with user/family/expiration indexes |
| audit_logs | Optional workspace and actor references; indexed by scope/time |

Memberships expose a unique `(workspace_id,id)` key for future scoped foreign keys. Referential deletes do not cascade. Step 4 now maps these entities with JPA and adds owner registration, workspace access control, token rotation and authentication auditing. Team-management mutations and future domain-specific rules remain later work.

## V2 property inventory

Step 5 adds properties, buildings and rooms. Composite foreign keys ensure a room belongs to the same workspace and property as its building; a building belongs to the declared workspace/property; and the property's owner is a member of that workspace. Owner role/enabled checks are enforced by the service. Codes are unique per workspace for properties, per property for buildings and per building for rooms. Check constraints enforce status, positive area, nonnegative rent, floor bounds and the relationship between AVAILABLE status and availableSince. Indexes support workspace/status/parent filters and vacancy evaluation.

Human-facing timestamps are generated at microsecond precision to match DATETIME2(6). Application configuration is in `application.properties` using standard dotted keys and environment placeholders.

## V3 tenants and contracts

V3 adds tenants and contracts; V1/V2 were not changed. Tenants store Unicode contact information, optional identity/birth data, status and timestamps. A filtered unique index enforces identity-number uniqueness within a workspace while permitting multiple nulls. Contracts reference the same-workspace tenant and the exact room/property scope, with unique contract codes, valid date intervals and nonnegative monetary constraints. Indexes support room/date overlap checks, tenant rental history, property filtering and expiration.

The application prevents overlapping ACTIVE intervals while holding the same parent-property write lock used by inventory mutations. All contract workflows use this service boundary; raw SQL writes do not receive an exclusion constraint. Contract foreign keys prevent deleting rooms or tenants with rental history. See `leasing.md` for the scheduler, timezone semantics and controlled-clock integration tests.

## V4 invoices and payments

V4 adds invoices and payments. Invoices reference the exact workspace/property/tenant/room/contract tuple. Five DECIMAL(19,2) charges sum to totalAmount, with paidAmount constrained between zero and totalAmount. A filtered unique index permits one non-cancelled invoice per contract/month; codes are unique within each workspace. Payments reference a same-workspace invoice, retain their original details and allow a recorded/voided lifecycle. Invoice locks and transactional service changes keep recorded payment totals and invoice balances consistent. OVERDUE is computed from due date and workspace timezone rather than stored. See `billing.md` for query semantics and financial history rules.

## V5 maintenance and tasks

The schema is now version 5. Maintenance requests link to a property, optional matching building/room/tenant and an assigned workspace member. Tasks link to a property, optional room and assignee. Composite foreign keys enforce scope; checks reinforce assignment-required states, completion timestamps, costs and priority/status values. Tenant-location rental history and enabled STAFF assignment are service rules. Work events reference exactly one maintenance request or task in the same workspace and record actor, transition, assignment and cost snapshots. Events are append-only through the API. TODO tasks use soft deletion to preserve history. Existing migrations were not modified. See `operations.md` for workflows, locking and permissions.

## Verification commands

From `backend`:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

The test suite requires the dedicated test database name; missing configuration fails the run. Migration checks verify history, checksums, no reapplication and role reference data. Transactional tests verify Vietnamese round trips, duplicate memberships/emails, forbidden ADMIN memberships and orphan references. Test rows are rolled back; schema/history remain for repeatable startup tests. Ordinary `verify` without the profile tests only the database-independent backend foundation.

Inspect in SSMS:

```sql
USE holoka_newconcept;
SELECT installed_rank, version, description, success FROM dbo.flyway_schema_history;
SELECT code, description FROM dbo.roles;
```

Readiness is `/actuator/health/readiness` (database included); liveness is `/api/health` or `/actuator/health/liveness`. Actuator omits credentials, hosts and internal component details from public responses.

## Troubleshooting

- Connection refused: confirm SQL Server is running and TCP is enabled on the configured port.
- Integrated-authentication DLL failure: build with `-Pwindows-auth` and pass java.library.path before `-jar`; verify matching x64 Java.
- Login failure: confirm the Windows or SQL login has access to the chosen database.
- TLS trust failure: configure the trusted certificate chain; only local development may use the explicitly documented self-signed exception.
- Nonempty schema without history: verify DB_URL; do not turn on automatic baseline to bypass the protection.
- Missing DB_URL: set the process variable before launching; `.env.example` is documentation only.
