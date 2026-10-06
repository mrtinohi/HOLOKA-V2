# Step 6 — Tenants and contracts

## Completed behavior

Implemented SQL Server-backed tenant management and rental history, plus contract creation, draft editing, activation, termination and draft deletion. OWNER and MANAGER access is scoped to their workspace. STAFF cannot access these tenant identity records. All mutations use the existing CSRF protection, version checks and audit trail.

Active leases reserve the interval from startDate inclusive to endDate exclusive. Adjacent leases are allowed; overlapping active leases for a room are rejected, including simultaneous activation requests. Future active leases reserve a room without marking it occupied before the start date. Contract history prevents deleting the referenced tenant or room.

Room occupancy follows the lease calendar in the workspace timezone. A scheduled reconciliation runs every minute, starts after one second, expires ended contracts and updates occupancy. Contract writes also reconcile the affected room. Reconciliation is idempotent; the scheduled interval means time-driven changes may take up to approximately one minute under normal operation.

## Files and architecture

- Migration: `backend/src/main/resources/db/migration/V3__tenants_contracts.sql`.
- Tenant module: `backend/src/main/java/com/holoka/tenant/`.
- Contract module: `backend/src/main/java/com/holoka/contract/`, including LeaseCalendar, ContractLifecycle and ContractScheduler.
- Clock configuration: `backend/src/main/java/com/holoka/config/TimeConfig.java`.
- Integration tests: `backend/src/test/java/com/holoka/LeaseIT.java`.
- API usage and lifecycle rules: `docs/leasing.md`.

Controllers validate request DTOs and delegate to transactional services and workspace-scoped repositories. Property row locks serialize room reservation changes before overlap checks; tenant locks coordinate tenant state changes. Composite foreign keys enforce workspace and property relationships. Money uses fixed-precision decimals. Applied V1 and V2 migrations were not changed.

RoomService now rejects maintenance/deactivation while active reservations exist and rejects deletion when contract history exists. Room occupancy changes are performed by contract lifecycle logic. WorkspaceRepository supports batched reconciliation. Security configuration protects the new endpoints, and the test configuration disables background scheduling so time-boundary checks remain deterministic.

## Run and test

Use `backend/README.md` for SQL Server connection and JWT configuration. Startup applies V3 automatically. `CONTRACT_SCHEDULER_ENABLED` defaults to true. See `docs/leasing.md` for payloads and query parameters; every route requires workspaceId, and updates/transitions/deletes require the current version.

From the backend directory:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

## Verification

The complete build and executable package passed 51 tests: 6 foundation, 1 rate limiter, 5 migration, 14 authentication, 11 inventory and 14 leasing tests, with no failures, errors or skips.

Leasing tests cover tenant CRUD and private detail access, rental history, draft lifecycle, activation and termination, concurrent overlapping activation, adjacent leases, future reservations, local-midnight start/expiration, idempotent reconciliation, validation, role/workspace isolation, stale versions and SQL constraints. The scheduler itself was invoked with a controlled clock to verify date-driven changes.

The packaged backend started against `holoka_newconcept` with scheduling enabled and database readiness UP. Real HTTP checks verified all 13 leasing operations in OpenAPI, bearer security and anonymous access denial. SQL Server reports migrations V1–V3 successful and both new leasing tables present. The temporary verification server was stopped. Integration tests used `holoka_newconcept_it`; the unrelated existing `holoka` database was not modified.

## Remaining work

Step 7 is invoices and payments, including partial and full payments. React screens and the remaining application modules are still pending. This step delivers backend APIs, not the completed website.
