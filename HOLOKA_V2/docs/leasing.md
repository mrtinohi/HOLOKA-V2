# Tenant and Contract API — Step 6

These are implemented SQL Server-backed APIs. React tenant/contract screens remain part of the later frontend work. Every endpoint requires a bearer token, an authorized `workspaceId` query parameter, and OWNER or MANAGER membership. Mutations require the CSRF cookie/header from `api.md`. STAFF cannot access renter identity data through these endpoints. Platform ADMIN has no implicit cross-workspace access.

## Tenant endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/tenants | Search/filter/sort/paginate tenant summaries |
| POST | /api/tenants | Create; returns 201 with details |
| GET | /api/tenants/{id} | Details including identity/contact information |
| PUT | /api/tenants/{id} | Update using the latest version |
| DELETE | /api/tenants/{id} | Delete only when no rental history exists |
| GET | /api/tenants/{id}/contracts | Paginated rental history; optional status filter |

DELETE requires `?workspaceId=…&version=…`, just like the inventory APIs. Every other route also requires `workspaceId`.

Example tenant request (illustrative, not seeded data):

```json
{
  "fullName": "Nguyễn An",
  "phone": "0901234567",
  "email": "an@example.com",
  "identityNumber": "ID-123456",
  "dateOfBirth": "1995-04-12",
  "address": "Thủ Đức, TP.HCM",
  "emergencyContact": "Nguyễn Bình — 0907654321",
  "status": "ACTIVE"
}
```

fullName and phone are required. Other contact/identity fields may be omitted or null. Omit identityNumber instead of sending an empty string. Identity numbers are normalized to uppercase and unique within a workspace when present; multiple records may have no identity number. Email is normalized to lowercase. Date of birth cannot be after today in the workspace timezone.

Status is ACTIVE or INACTIVE. Tenants with any ACTIVE contract, including future reservations, cannot be deactivated until those contracts are terminated or expire. Tenants with any contract history cannot be deleted; deactivate them instead. Drafts may remain attached to an inactive tenant but cannot be activated until the tenant is active again.

Tenant lists include ID, name, phone, email, status and version; they omit identity number, date of birth and address. Full details are available only through the authorized detail endpoint. No tenant PII is written into audit descriptions.

## Contract endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/contracts | Scoped list with filters, search, sorting and pagination |
| POST | /api/contracts | Create DRAFT or directly activate an ACTIVE lease |
| GET | /api/contracts/{id} | Read persisted contract details |
| PUT | /api/contracts/{id} | Edit DRAFT terms/dates/amounts/code only |
| DELETE | /api/contracts/{id} | Delete DRAFT only; version query required |
| POST | /api/contracts/{id}/activate | Activate DRAFT; body contains current version |
| POST | /api/contracts/{id}/terminate | Terminate ACTIVE; body contains current version |

Example request; use the tenant/room IDs returned by your own API calls:

```json
{
  "contractCode": "HD-2026-001",
  "tenantId": 1,
  "roomId": 1,
  "startDate": "2026-10-01",
  "endDate": "2027-10-01",
  "monthlyRent": 5000000.00,
  "deposit": 5000000.00,
  "status": "DRAFT",
  "terms": "Thanh toán tiền thuê vào đầu tháng."
}
```

Omit version on create. PUT includes the latest version and must retain status DRAFT and the original tenantId/roomId. To replace a draft's parties, delete the draft and create a new one. ACTIVE, EXPIRED and TERMINATED financial/lease records are immutable through CRUD; use lifecycle actions or create a new contract for renewal. Lifecycle action bodies are `{"version":0}` using the current returned version. Stale versions return 409.

Contract codes use 1–40 letters/digits/hyphens/underscores, normalize to uppercase and are unique within the workspace. Rent and deposit must be nonnegative, have at most two decimal places and fit DECIMAL(19,2). Terms are limited to 4000 characters. Tenant, room and property relationships are scoped and verified; the property is derived from the room.

## Dates, reservations and occupancy

Periods are **start-inclusive, end-exclusive**: `[startDate, endDate)`. Start must be strictly before end. Thus a contract ending October 1 does not overlap one starting October 1.

- DRAFT does not reserve or occupy a room.
- ACTIVE reserves its full date interval, including future dates. Another ACTIVE interval for the same room cannot overlap it.
- A future ACTIVE contract keeps the room AVAILABLE until its start date. ACTIVE therefore means a confirmed lease; OCCUPIED means a confirmed lease covering today.
- A contract covering today changes the room to OCCUPIED in the activation transaction.
- End date reached changes ACTIVE → EXPIRED and releases the room unless another ACTIVE contract covers today.
- Termination changes ACTIVE → TERMINATED immediately and recomputes occupancy. Terminating a future reservation does not free a room occupied by a different current lease.
- ACTIVE contracts cannot be created/activated after their end date. Drafts may contain past dates and be corrected before activation.

Activation requires an active tenant, active property/building, and a room that is neither MAINTENANCE nor INACTIVE. A currently OCCUPIED room may accept a nonoverlapping future reservation. Rooms with ACTIVE reservations cannot be set to MAINTENANCE or INACTIVE through inventory CRUD. Rooms with any contract history cannot be deleted.

All contract mutations acquire the property's database write lock, matching the inventory module's parent-first order. Overlap checking and activation occur within that transaction, so two concurrent requests cannot both reserve overlapping dates. Tenant locks serialize activation against tenant deletion/deactivation. SQL constraints enforce valid date/amount values and scoped relationships; overlap prevention depends on the transactional application service, not a SQL exclusion constraint. Direct database edits must not bypass these services.

## Automatic date transitions

The backend scheduler runs shortly after startup and then every 60 seconds. It scans workspace and candidate room IDs in bounded batches using keyset pagination, then reconciles each room in its own transaction. Candidate rooms have ACTIVE contracts or are OCCUPIED. Status transitions are idempotent; repeated runs do not add duplicate expiration/occupancy audit events.

Today uses each workspace's timezone (default Asia/Ho_Chi_Minh), not the server's calendar date. If the backend is stopped at a date boundary, startup reconciliation catches up. Natural expiration sets availableSince to the lease-end midnight converted to UTC; termination uses the current UTC time. Adjacent leases keep the room occupied across the boundary.

`CONTRACT_SCHEDULER_ENABLED` defaults to true. Keep it enabled for normal operation. Tests disable background execution and drive the same scheduler explicitly with a controlled clock. Date-driven changes are eventually reflected after the next scheduler pass (normally about one minute); activation and termination update occupancy synchronously. Reconciliation errors are logged and retried on later passes; deployment log monitoring is required.

## Lists

All lists use the established `items/page/size/totalElements/totalPages` envelope and default page 0, size 20 (maximum 100), sort `createdAt,desc`.

| Resource | Search | Filters | Sort fields |
| --- | --- | --- | --- |
| Tenants | fullName, phone, email | status | id, fullName, status, createdAt, updatedAt |
| Contracts | contractCode | tenantId, roomId, propertyId, status | id, contractCode, startDate, endDate, monthlyRent, deposit, status, createdAt, updatedAt |
| Rental history | scoped to the tenant path ID | status | Same as contracts; default startDate,desc |

Unknown sort fields and mismatched property/room filters return 400. Foreign/inaccessible IDs return 404. Unauthorized workspace roles return 403. Tenant and contract list mapping uses scalar fields to avoid per-row relationship queries.

## Verification and next step

`LeaseIT` exercises tenant CRUD/privacy, contract drafting/editing, rental history, activation/termination, overlap prevention under concurrent requests, adjacent intervals, future reservations, local-midnight expiration, repeatable scheduler runs, invalid data, protected history, workspace/role boundaries and SQL constraints. The full regression suite also covers prior authentication and inventory behavior.

Run the documented `-Pwindows-auth,sqlserver-it verify` command against `holoka_newconcept_it`; no real tenant data is used. Migration V3 creates tenants/contracts and adds the room relationship key without editing V1 or V2. Next is invoices/payments; no billing is generated by contract activation in this step.
