# Step 8 — Maintenance and tasks

## Completed behavior

Implemented persisted maintenance requests and tasks, staff assignment/reassignment, explicit status workflows, versioned updates, maintenance cost tracking and append-only work history. Operators can search, filter, sort and paginate their workspace's work. STAFF can read and advance only currently assigned work; reassignment removes previous staff access on subsequent requests. Completion timestamps are server-controlled.

Maintenance uses OPEN → ASSIGNED → IN_PROGRESS → COMPLETED, with WAITING/resumption and operator cancellation. Cost corrections after completion retain the original completion date and append a new history snapshot. Tasks use TODO → IN_PROGRESS → COMPLETED with operator cancellation. Only TODO tasks can be soft-deleted; their stored history remains intact. Task overdue flags and filters use the workspace's current calendar date.

## Created files

- `backend/src/main/resources/db/migration/V5__maintenance_tasks.sql`.
- `backend/src/main/java/com/holoka/maintenance/`: MaintenanceRequest, MaintenanceStatus, MaintenanceDtos, MaintenanceRepository, MaintenanceService and MaintenanceController.
- `backend/src/main/java/com/holoka/task/`: Task, TaskStatus, TaskDtos, TaskRepository, TaskService and TaskController.
- `backend/src/main/java/com/holoka/work/`: AssignedWork, Priority, WorkDtos, WorkPolicy, WorkEvent and WorkEventRepository.
- `backend/src/test/java/com/holoka/OperationsIT.java`.
- `docs/operations.md` and this report.

Updated SecurityConfig for the authenticated routes, ContractRepository for tenant/location rental-history validation, DatabaseMigrationIT for schema version 5, both README files and architecture/API/database/inventory documentation. Applied V1–V4 migrations were not modified.

## Architecture and important code

Each module follows Controller → validated DTO → transactional Service → scoped Repository → SQL Server. AssignedWork shares operational fields without merging the distinct maintenance/task lifecycle rules. WorkPolicy shares permission, location, assignee and history handling. WorkEvent stores the actor, previous/current status, assignee, note and maintenance cost snapshots. AuditLog also records each mutation.

Status changes serialize on the same record lock used for assignment changes. Authorization is checked against the freshly locked assignment before mutation:

```java
var t=locked(workspace,id);
policy.visible(p,t);
version(b.version(),t.getVersion());
// Validate the requested lifecycle transition and active assignee.
t.transition(b.status(),calendar.now());
tasks.flush();
record(p,t,"TASK_CHANGE",previous,b.note());
```

The transaction commits the work record, history and audit together. A stale request gets 409. STAFF list predicates restrict records before pagination, so totals and filters do not expose other assignees' work. Composite foreign keys protect workspace/location/member references, while checks protect costs and completion state. Assignment role/enabled checks and tenant rental-history rules are enforced by services.

Maintenance requests do not automatically change room occupancy or maintenance availability: those changes follow the existing room and contract rules. History is a workflow/event record with cost snapshots, not full versioned storage of title/description text.

## Run and test

Use `backend/README.md` for startup with DB_URL and JWT_SECRET. Flyway applies V5 automatically. No new environment variables are required. Enable API_DOCS_ENABLED for local Swagger. `docs/operations.md` documents all bodies, transitions, filters, roles and retained-history behavior.

From backend:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

## Verification results

On 2026-09-29 the full build and executable package passed 82 tests: 6 foundation, 1 limiter, 5 migration, 14 authentication, 11 inventory, 14 leasing, 14 billing and 17 operations tests. No failures, errors or skips. Surefire covers 7 database-independent tests; Failsafe covers 75 integration tests against SQL Server.

The new tests verify maintenance creation/edit/filtering, assignment, waiting/resumption/completion, cost history, closed-record protection, disabled users/memberships, staff read/write boundaries, access removal after reassignment, matching property/building/room/tenant links, task CRUD and retained soft-delete history, completion timestamps, midnight overdue behavior, manager access, concurrent cost changes, concurrent completion/cancellation, validation and database constraints. Both concurrency cases produce exactly one successful mutation and one version conflict, with no duplicate history event.

The packaged backend then started against `holoka_newconcept`, applied V5 and reported readiness UP. Real HTTP checks verified all 16 operational API methods appear in OpenAPI with bearer security and anonymous list requests return 401. SQL Server confirms successful V1–V5 and the three new tables. The temporary server was stopped after verification. Tests used `holoka_newconcept_it` and removed their own records; the unrelated existing `holoka` database was not modified.

## Remaining work

Step 9 is notifications and alerts. Assignment requires existing enabled STAFF memberships; team invitations/membership mutations and demo staff accounts are not implemented in this step. Broad inventory, tenant identity and finance access remain unavailable to STAFF. React operational screens remain Step 11. This completes the Step 8 backend scope rather than the entire website.
