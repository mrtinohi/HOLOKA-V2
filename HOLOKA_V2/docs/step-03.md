# Step 3 — SQL Server connection and migrations

## Completed

Configured Microsoft JDBC, Spring Data JPA, HikariCP and Flyway against the user's local SQL Server 2025 instance. Created dedicated `holoka_newconcept` and `holoka_newconcept_it` databases. The pre-existing `holoka` database was inspected for table names only and left unchanged.

## Files created

- `backend/src/main/resources/db/migration/V1__identity_workspace_foundation.sql`
- `backend/src/test/java/com/holoka/DatabaseMigrationIT.java`
- `database/schema/create-databases.sql`
- `database/seed/README.md`
- `docs/database.md`
- `docs/step-03.md`

Updated Maven dependencies/profiles, application configuration, health-route security, health comments, foundation test isolation, environment examples and root/backend run instructions.

## Architecture and important configuration

Startup now follows DataSource → Flyway checksum validation/migration → JPA initialization → web readiness. V1 creates app_users, roles, workspaces, memberships, refresh_sessions and audit_logs. Four reference roles are inserted; no user accounts or operational demo data are created.

```yaml
spring:
  jpa:
    open-in-view: false
    hibernate:
      ddl-auto: validate
  flyway:
    baseline-on-migrate: false
    clean-disabled: true
    validate-on-migrate: true
```

The Windows-auth Maven profile obtains the official matching x64 authentication DLL locally under target/native. Credentials remain outside source. Database readiness uses the actual pooled connection and reports only status publicly.

## Run and test

See `docs/database.md` for SSMS setup and SQL authentication alternatives. From backend:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify

$env:DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
java '-Djava.library.path=target/native' -jar target/holoka-backend-0.1.0-SNAPSHOT.jar
```

The local certificate exception is for development only. Production connections must validate the server certificate.

## Executed checks

- Build/package succeeded on JDK 21.0.12.
- Six foundation tests passed; five real SQL Server tests passed; zero failures/errors/skips.
- Fresh V1 migration succeeded against both dedicated databases.
- Checked migration checksum/history, reference roles and no reapplication.
- Verified Vietnamese Unicode round-trip, case-insensitive unique email, unique membership, orphan-reference rejection and ADMIN membership prohibition.
- The packaged backend returned readiness `UP` and the expected liveness response over real HTTP.
- A genuine stop/restart returned readiness `UP` and logged `Schema [dbo] is up to date. No migration necessary.`
- Development database contains one successful migration, four role rows and zero user rows.
- Temporary backend processes were stopped after smoke tests.

Resolved a native-authentication artifact coordinate mismatch during setup. Updated Flyway from Boot's managed 11.7.2 to 11.20.3 after the older version warned about SQL Server 17; the final build and migration checks passed without that compatibility warning. A temporary launcher process initially survived its parent; it was identified and stopped, then restart verification was repeated using the direct JDK executable.

## Scope remaining

This completes database infrastructure and the identity/workspace foundation, not all Phase 1 tables. JPA entity mappings and authentication arrive in Step 4; property, leasing, billing and operational schemas arrive with their respective modules. No login, business API or frontend is represented as working yet.
