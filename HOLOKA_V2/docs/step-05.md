# Step 5 — Property, Building and Room management

## Completed behavior

Implemented database-backed CRUD for properties, buildings and rooms. Every list supports scoped search, filters, sorting and pagination; every detail response includes a version for safe updates/deletes. All endpoints require authenticated, authorized workspace access and use the established API response/error contracts.

The hierarchy is Property → Building → Room, with composite SQL Server foreign keys preventing cross-workspace or mismatched-parent records. Room property IDs are derived from the building. Property owner IDs must identify active owners in the same workspace.

OWNER has full access. MANAGER can edit property operational fields and manage buildings/rooms, but cannot create/delete properties or transfer ownership. STAFF has no broad inventory access; assigned-record access awaits the assignment modules. Platform ADMIN does not bypass workspace membership.

## Created files

- `backend/src/main/resources/db/migration/V2__property_building_room.sql`
- `backend/src/main/java/com/holoka/property/`: Property, PropertyDtos, PropertyRepository, PropertyService, PropertyController, PropertyType, RecordStatus and InventoryPolicy.
- `backend/src/main/java/com/holoka/building/`: Building, BuildingDtos, BuildingRepository, BuildingService and BuildingController.
- `backend/src/main/java/com/holoka/room/`: Room, RoomDtos, RoomRepository, RoomService, RoomController and RoomStatus.
- `backend/src/main/java/com/holoka/common/api/PageResponse.java`
- `backend/src/main/java/com/holoka/common/persistence/ListQuery.java`
- `backend/src/test/java/com/holoka/InventoryIT.java`
- `docs/property-management.md` and this report.

Updated security route authorization, global validation/conflict handling, TimedEntity timestamp precision, the migration test's expected schema count, and project/API/database documentation. The existing `application.properties` contained YAML syntax; it was converted to valid dotted-key properties while preserving configuration values and environment placeholders.

## Architecture and important code

Each resource follows Controller → validated request/response DTO → transactional Service → scoped Repository → SQL Server. Shared helpers enforce pagination/sort limits, literal search escaping, version checks, parent locking and audit writes. List DTOs use scalar entity fields, so mapping does not trigger relationship queries.

Every inventory query starts with:

```java
ListQuery.<Room>scope(workspaceId)
    .and(ListQuery.search(search, "name", "roomCode"))
    .and(ListQuery.equal("propertyId", propertyId))
    .and(ListQuery.equal("buildingId", buildingId))
    .and(ListQuery.equal("status", status));
```

Writes authorize the workspace, lock the property's row, verify the client version, validate the hierarchy/state, flush the mutation, and append its audit entry in one transaction. Version mismatches return 409, preventing silent overwrites. Parent IDs cannot be changed through ordinary updates.

Deletion is blocked when children exist; deactivation requires inactive descendants. Floor count cannot drop below an existing room's floor. Creating/reactivating children requires active ancestors. Money and area use validated decimal types; database constraints reinforce numeric/status rules. SQL LIKE wildcard characters are escaped before searching.

`availableSince` is set when entering AVAILABLE, retained on ordinary edits and cleared when leaving. Timestamps use microsecond precision to match SQL Server DATETIME2(6). OCCUPIED cannot be entered/cleared manually, and occupied rooms cannot be deleted. Contract-driven occupancy and overlap prevention remain Step 6.

## Run and test

Use the startup instructions in `backend/README.md` with DB_URL and JWT_SECRET set. Application startup applies V2 automatically to `holoka_newconcept`; no applied V1 script was changed. Optional OpenAPI documents all 15 inventory operations.

From backend:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

See `docs/property-management.md` for request bodies, query parameters, permissions and lifecycle rules. `workspaceId` is required on every inventory endpoint. Supply `version` in PUT bodies and DELETE query parameters; omit it on POST.

## Verification

The build/package succeeded with 37 tests passing: 6 foundation, 1 rate-limiter, 5 migration, 14 authentication and 11 inventory tests; no failures, errors or skips.

Inventory checks cover the full owner CRUD hierarchy, audit persistence, workspace isolation, role boundaries, duplicate codes, validation, parent deactivation/deletion constraints, floor limits, concurrent updates with one winner/one conflict, SQL composite foreign keys, literal wildcard search, filtering/pagination/numeric sorting, immutable parent links, and manual occupancy restrictions.

The first run identified the configuration format mismatch. After correcting it, one timestamp round-trip assertion exposed sub-microsecond SQL Server rounding; generation was aligned to the database precision and the complete suite passed. Tests operate only on `holoka_newconcept_it` and remove their own fixtures. The pre-existing `holoka` database remains untouched.

The executable JAR also started successfully against `holoka_newconcept`, applied V2, and returned database readiness UP. Real HTTP checks verified all 15 secured CRUD operations appear in OpenAPI and anonymous inventory requests return 401. SQL Server reports V1/V2 successful and all three inventory tables present. The temporary server was stopped after verification; no operational demo records were inserted.

## Remaining work

Step 6: tenant management, contracts, overlapping active-contract prevention, and automatic room occupancy. Frontend screens, assigned STAFF inventory access, demo data and other Phase 1 modules remain pending; they are not presented as completed features.
