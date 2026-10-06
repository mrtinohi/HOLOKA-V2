# Property, Building and Room API — Step 5

All endpoints are backed by SQL Server and require a bearer access token plus a positive `workspaceId` query parameter. Mutations also require the CSRF cookie/header described in `api.md`. No frontend screens exist yet.

## Routes

For each resource `properties`, `buildings` and `rooms`:

| Method | Route | Behavior |
| --- | --- | --- |
| GET | /api/{resource}?workspaceId=… | Search, filter, sort and paginate |
| GET | /api/{resource}/{id}?workspaceId=… | Read a scoped detail DTO |
| POST | /api/{resource}?workspaceId=… | Create; returns 201 and the persisted DTO |
| PUT | /api/{resource}/{id}?workspaceId=… | Replace editable fields; requires the last-read version in the body |
| DELETE | /api/{resource}/{id}?workspaceId=…&version=… | Delete an unreferenced record; returns success with null data |

The selected workspace is authorized on every request. A resource ID from another workspace is unavailable even when a user is a member of both workspaces. Parent IDs and property owner IDs are independently validated. The API never returns JPA entities.

## Permissions

- OWNER: full property/building/room CRUD in that workspace.
- MANAGER: read inventory, update property operational fields, and manage buildings/rooms. Cannot create/delete properties or transfer property ownership.
- STAFF: no workspace-wide inventory access. Step 8 provides assigned maintenance/task details and progress updates through the operations endpoints; inventory CRUD and tenant identity APIs remain restricted to operators.
- Platform ADMIN: no implicit operational access; explicit workspace membership and role remain required.

Cross-workspace records return 404. Members without an allowed role receive 403. Authentication alone does not grant workspace access.

## Request bodies

These are request examples; no sample operational records are automatically inserted. Use IDs returned by your own API calls. For creation, omit `version`; for update, include the version returned by the latest GET/POST/PUT.

Property:

```json
{
  "name": "Nhà An Phú",
  "code": "AN-PHU",
  "address": "Thủ Đức, TP.HCM",
  "description": "Nhà cho thuê dài hạn",
  "propertyType": "ROOM_RENTAL",
  "status": "ACTIVE",
  "ownerUserId": 1
}
```

Owner must be an enabled user with an enabled OWNER membership in the selected workspace. Property types: APARTMENT, ROOM_RENTAL, SERVICED_APARTMENT, HOUSE, BUILDING, OTHER. Status: ACTIVE or INACTIVE.

Building:

```json
{
  "propertyId": 1,
  "name": "Tòa A",
  "code": "A",
  "description": "Khối nhà chính",
  "numberOfFloors": 3,
  "status": "ACTIVE"
}
```

Room:

```json
{
  "buildingId": 1,
  "roomCode": "A101",
  "name": "Phòng có ban công",
  "floor": 1,
  "area": 25.50,
  "monthlyRent": 5000000.00,
  "status": "AVAILABLE",
  "description": "Cửa sổ hướng đông"
}
```

A room's property is derived from its authorized building, not accepted as a separate editable input. Responses include workspaceId, propertyId, buildingId, version and timestamps. Available rooms include availableSince in UTC. Codes are normalized to uppercase and accept only letters, digits, hyphens and underscores (1–40 characters). Names are required and limited to 160 characters; descriptions to 4000; property addresses to 500.

Building floor count is 1–300; room floor is 0–300 and cannot exceed its building's count. Floor 0 represents ground level. Area must be positive and fit DECIMAL(10,2). Rent may be zero but not negative and must fit DECIMAL(19,2). More than two decimal places is rejected rather than silently rounded. Unknown JSON fields, invalid enum values, missing required fields or invalid pagination return 400.

## Search, filters and pagination

Every list accepts `search`, `page` (default 0), `size` (default 20, maximum 100), and `sort` (default `createdAt,desc`). Page is capped at 100000. Sort syntax is exactly `field,asc` or `field,desc`. A stable ID tie-breaker is added automatically.

| Resource | Filters | Search fields | Allowed sort fields |
| --- | --- | --- | --- |
| Properties | status, propertyType | name, code, address | id, name, code, status, propertyType, createdAt, updatedAt |
| Buildings | propertyId, status | name, code | id, name, code, numberOfFloors, status, createdAt, updatedAt |
| Rooms | propertyId, buildingId, status | name, roomCode | id, name, roomCode, floor, area, monthlyRent, status, createdAt, updatedAt |

Search is trimmed and limited to 120 characters. SQL LIKE metacharacters are escaped so user input such as `%`, `_` and `[` is searched literally. Filtering by a foreign/inaccessible parent returns 404. Mismatched property/building filters return 400. Unknown sort fields are rejected; client strings never become SQL identifiers directly.

List data contains `items`, `page`, `size`, `totalElements` and `totalPages`. Query specifications always include workspace scope. Scalar fields and DTO mapping avoid lazy relationship traversal on list results; SQL pagination prevents loading the full dataset.

## Updates, hierarchy and deletion

`version` is mandatory on update and delete. Stale values return 409 with a reload message. Do not supply a version on create. Property-row locks serialize mutations within each property, including child creation and parent deletion/deactivation; entity versions detect stale client edits. Future contract operations must preserve the same parent-first locking order when changing rooms.

Existing buildings cannot move to another property, and rooms cannot move to another building through CRUD. Such moves need a separate history-aware workflow once leasing is implemented.

- A property with buildings cannot be deleted; deactivate it after its buildings are inactive.
- A building with rooms cannot be deleted; deactivate it after all its rooms are inactive.
- Creating children requires active parents. Reactivating a building/room also requires active ancestors.
- A building's floor count cannot be reduced below an existing room's floor.
- A room cannot be manually switched into or out of OCCUPIED, and an occupied room cannot be deleted. Step 6 now provides contract-driven occupancy and overlap prevention; see `leasing.md`. Any rental history blocks room deletion, and ACTIVE reservations also block MAINTENANCE/INACTIVE transitions.
- AVAILABLE, MAINTENANCE and INACTIVE are supported manual room states. availableSince is set on entering AVAILABLE, preserved during ordinary edits, and cleared on leaving AVAILABLE.

No cascade deletion removes descendants. SQL Server composite foreign keys enforce consistent workspace/property/building relationships, unique codes are scoped to their parent, and constraints protect status/numeric values. Contract history is now protected by V3 foreign keys; financial restrictions will be added with the billing module.

Create/update/delete operations append audit records inside the same transaction, so a failed change cannot leave a success audit entry. Failed transactions also roll back their mutations.

## Files and tests

- Migration: `backend/src/main/resources/db/migration/V2__property_building_room.sql`.
- Modules: `property`, `building`, `room`; each contains controller, DTO, service, entity and repository.
- Shared helpers: `InventoryPolicy`, `ListQuery`, `PageResponse`; no generic endpoint accepts arbitrary table names.
- Tests: `InventoryIT`, alongside authentication and database regression tests.

Run from backend with the dedicated SQL Server test database configured:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

Application configuration now uses valid `application.properties` syntax. Do not paste YAML into that file; preserve environment placeholders for credentials and the signing key. Startup automatically applies V2 to the configured application database after validating V1's existing checksum.
