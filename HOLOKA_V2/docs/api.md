# HOLOKA API — implemented through Step 9

All application endpoints use `/api`. Responses use `success`, `message` and `data`; errors use `success=false`, a safe message, HTTP status and timestamp. Validation errors may include fieldErrors. Entity objects and password hashes are never returned.

Step 5 adds `/api/properties`, `/api/buildings` and `/api/rooms` with full scoped CRUD, search, filters, sorting and pagination. See [inventory API details](property-management.md) for request bodies, permissions, versions and lifecycle rules.

Step 6 adds `/api/tenants`, `/api/contracts`, rental history, activation and termination. See [leasing API details](leasing.md) for date semantics, overlap prevention, automatic occupancy and protected history.

Step 7 adds `/api/invoices` and `/api/payments`, issuance/cancellation, partial/full payments and owner-only payment corrections. See [billing API details](billing.md) for amounts, versions, overdue semantics and request examples.

Step 8 adds `/api/maintenance` and `/api/tasks`, staff assignment, workflow transitions, maintenance costs and append-only history. See [operations API details](operations.md) for current-assignee permissions and completion rules.

## Authentication


| Method | Path | Requirements and behavior |
| --- | --- | --- |
| GET | /auth/csrf | Public; returns token/header name and XSRF-TOKEN cookie |
| POST | /auth/register | CSRF; fullName, email, password, workspaceName; creates OWNER, workspace and membership atomically; 201 |
| POST | /auth/login | CSRF; email, password; generic 401 on invalid credentials |
| POST | /auth/refresh | CSRF and HOLOKA_REFRESH cookie; returns new access token and rotates cookie |
| GET | /auth/me | Bearer token; safe user details and active workspace memberships |
| PUT | /auth/change-password | Bearer + CSRF; currentPassword, newPassword; revokes all sessions |
| POST | /auth/logout | Bearer + CSRF; revokes current session family and clears refresh cookie |

Registration accepts no role, user ID, workspace ID or administrator flag. Unknown JSON fields fail with 400. Passwords must contain at least 12 characters and at most 72 UTF-8 bytes; BCrypt cost is 12. Email is stripped and lowercased before persistence; database uniqueness is case-insensitive. Names and workspace names are limited to 160 characters. Duplicate registration returns 409. No default/admin/demo account is created.

Successful registration/login/refresh returns:

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "accessToken": "<JWT>",
    "tokenType": "Bearer",
    "expiresIn": 900,
    "user": {
      "id": 1,
      "fullName": "Nguyễn An",
      "email": "owner@example.com",
      "platformAdmin": false,
      "workspaces": [{"id": 1, "name": "Nhà An Phú", "role": "OWNER"}]
    }
  }
}
```

IDs above are illustrative, not seeded business data. The refresh secret is returned only in an HttpOnly cookie, not the JSON body.

## Browser flow

1. GET `/api/auth/csrf` with credentials enabled. Keep the returned token and its XSRF-TOKEN cookie.
2. For every POST/PUT/PATCH/DELETE, include the cookie and `X-XSRF-TOKEN` header containing that token. This includes public login, registration and refresh.
3. Store the access JWT in memory and use `Authorization: Bearer <token>` for protected requests. Do not persist access tokens in localStorage.
4. Refresh using the HttpOnly cookie and CSRF header; omit the expired access header. Replace the in-memory access token with the new one.
5. Serialize refresh requests through one shared in-flight request in the future frontend. Parallel use of the same refresh token is treated as reuse and revokes the family.
6. After changing password, clear the in-memory access token and sign in again. Logout requires a current access token; refresh first if the access JWT has expired, then logout.

Refresh cookies are Secure by default, HttpOnly, SameSite=Strict, scoped to `/api/auth`, and have no domain attribute. CSRF cookies are JavaScript-readable with SameSite=Strict. Production must use HTTPS. `AUTH_COOKIE_SECURE=false` is an explicit local HTTP development option. Authentication responses are not cacheable.

## Session security

HS256 access tokens include issuer, audience, user ID, session ID, issued/expiry times, token version, kind and unique token ID. The server verifies the signature and claims using Spring Security/Nimbus, then rechecks account enabled status, token version and session revocation/expiry in SQL Server. Memberships are read from SQL Server when workspace access is requested; workspace roles are not trusted from token claims or client IDs.

Refresh tokens contain 32 cryptographically random bytes. Only SHA-256 hashes are stored. Rotation locks the user row before inspecting and changing sessions. Reuse revokes the entire family in a transaction that commits even though the HTTP response is 401. Families have a fixed 14-day lifetime; refresh does not extend the original database expiration. Rotation invalidates the previous access token, logout revokes its family, and password change revokes all sessions and increments token version.

Authentication attempts are limited to 30 per source IP per minute for valid login/register/refresh/password-change requests. The in-process limiter bounds stored client entries, returns 429 and ignores untrusted forwarding headers. It is suitable for one application instance; shared limits/trusted-proxy configuration are required before multiple instances are deployed. Email verification, account recovery and two-factor authentication remain FUTURE FEATURES.

## Workspace permissions

| Method | Path | Access |
| --- | --- | --- |
| GET | /workspaces/{id} | Enabled member of that enabled workspace |
| GET | /workspaces/{id}/members?page=0&size=20 | OWNER or MANAGER of that workspace; page size 1–100 |

Member list responses contain user ID, display name and workspace role, plus pagination. STAFF cannot list workspace members. A cross-workspace ID returns 404; a member lacking the required role receives 403. Disabled memberships/workspaces lose access immediately. ADMIN is a platform-level account flag, not a grant to read every workspace; administrative operational access needs an explicit audited scope in a future administration module. No API can self-promote a user to ADMIN. Team creation/role editing is not implemented in this step.

## OpenAPI

Set `API_DOCS_ENABLED=true` for local development. Read `/v3/api-docs` or open `/swagger-ui/index.html`. Docs are disabled by default. Protected operations declare bearer security; mutations document the CSRF header. Fetch CSRF first, use the same browser cookies, and enter the header value when trying mutations. The specification lists actual controllers rather than planned CRUD endpoints.

## Audit events

Registration, successful login, logout, password change and detected refresh-token reuse create database audit entries within their transaction. Descriptions never include passwords, access JWTs or refresh secrets. No audit mutation endpoint exists.

## Verification and limits

The SQL Server integration suite checks registration persistence and BCrypt hashing, login, duplicate/invalid input, token tampering/expiry, cookie flags, real CSRF headers, refresh rotation/replay/concurrency/expiry, password changes, logout, disabled accounts and role/workspace isolation. The frontend login/register screens and protected React routes belong to the later frontend steps and are not implemented yet.
