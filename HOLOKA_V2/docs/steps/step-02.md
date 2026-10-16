# Step 2 — Backend foundation

## Created

- `backend/pom.xml`, official Maven wrapper scripts and `.mvn/wrapper/maven-wrapper.properties`.
- Application entry point, liveness controller, response DTOs, business exception and global exception handler.
- Spring Security configuration and externalized application settings.
- Six backend foundation integration tests.
- Root/backend READMEs, `.env.example`, `.gitignore`, and this report.

Updated `docs/architecture.md` to the user's confirmed SQL Server choice. The JDBC/database work remains Step 3.

## Important behavior

The health controller returns `ApiResponse.ok(new HealthStatus("UP", "holoka-backend"))`; it reports only running-process liveness. Security permits GET requests to the two health routes and ends with `.anyRequest().denyAll()`. Business functionality is therefore inaccessible until explicitly implemented and authorized. Exception advice centralizes safe error bodies without client-visible stack traces.

## Run and test

From `backend`, run `.\mvnw.cmd verify`, then `java -jar target/holoka-backend-0.1.0-SNAPSHOT.jar`. Check `/api/health`. See the backend README for environment configuration and cache overrides.

## Verification

The Maven build succeeded on Java 21.0.12. Six tests passed with zero failures/errors/skips: liveness envelope, health detail suppression, anonymous business-route rejection, CSRF rejection, allowed CORS preflight, and untrusted-origin rejection. The executable JAR was started on port 18080 and a real HTTP request returned the expected successful health response.

No database connection, authentication workflow, CRUD feature, frontend, or production deployment is claimed as complete.
