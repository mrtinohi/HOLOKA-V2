# Notifications, alerts and today's actions — Step 9

This module generates real in-app notifications from SQL Server data. It does not send email, SMS or push messages. React notification/action-center screens remain Step 11.

## Rules and recipients

| Rule | Condition | Category | Recipients |
| --- | --- | --- | --- |
| INVOICE_OVERDUE | ISSUED/PARTIALLY_PAID invoice with dueDate before today | URGENT | Enabled OWNER/MANAGER members |
| CONTRACT_EXPIRING | ACTIVE contract ending after today and within 30 days | UPCOMING; NEEDS_ATTENTION within 7 days | Enabled OWNER/MANAGER members |
| HIGH_MAINTENANCE | HIGH/URGENT priority request, not completed/cancelled | URGENT | Enabled OWNER/MANAGER and current STAFF assignee |
| TASK_OVERDUE | Undeleted TODO/IN_PROGRESS task with dueDate before today | NEEDS_ATTENTION | Enabled OWNER/MANAGER and current STAFF assignee |
| ROOM_VACANT | AVAILABLE room vacant longer than workspace vacancyAlertDays, with active property/building and no ACTIVE lease covering today | NEEDS_ATTENTION | Enabled OWNER/MANAGER members |

Dates use the workspace timezone. Invoice/task due dates themselves are not overdue. A contract's exclusive end date is no longer an approaching expiry. The default vacancy threshold is 30 days; vacancy is measured by local calendar days using availableSince, and must exceed the threshold. A future lease does not remove a vacancy alert until it covers today. The active-lease predicate protects against a delayed room-occupancy scheduler.

The action center queries the same live SQL rule predicates as the generator. It does not depend on a notification having been delivered or read. Once an invoice is paid, work is closed, or another condition stops applying, the item disappears from live actions on the next read.

## Notification API

Every route requires bearer authentication and a positive `workspaceId`. Mutations require the existing CSRF cookie/header. Every query is restricted to the authenticated recipient; clients cannot choose a recipient user ID. OWNER does not have access to other members' inboxes.

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/notifications | Search/filter/sort/paginate personal inbox |
| GET | /api/notifications/{id} | Read one authorized notification |
| GET | /api/notifications/unread-count | Count currently visible unread notifications |
| PATCH | /api/notifications/{id}/read | Mark read; no body; idempotent |
| POST | /api/notifications/read-all | Mark all currently visible personal notifications read; no body |

List filters: read=true/false, active=true/false, type, category and search (title/message). Types are CONTRACT, PAYMENT, MAINTENANCE, TASK and SYSTEM. The vacancy rule uses SYSTEM. Categories are URGENT, NEEDS_ATTENTION and UPCOMING. Default includes both active and resolved notifications. Use active=true for ongoing conditions. Unread count includes visible unresolved and resolved unread history; marking a notification read does not resolve its source.

Paging: page zero-based, size 1–100. Sort accepts id, createdAt or updatedAt followed by `,asc` or `,desc`; default is createdAt,desc, with deterministic ID ordering. Search is limited to 120 characters and escapes SQL LIKE wildcards.

Each response includes id, workspaceId, propertyId, rule, type, sourceId, sourcePath, title, message, category, read, active, createdAt, updatedAt and resolvedAt. Text is Vietnamese. Timestamps are UTC. sourcePath is a relative frontend route such as `/invoices/123` or `/maintenance/456`; the backend detail endpoint still applies its own authorization. Historical notifications may link to a source later removed; the target can then return 404.

Mark-one returns the updated notification. Mark-all returns `{"updatedCount":2}` inside data and only affects the current recipient's currently visible rows. Read state changes do not require optimistic versions because they are idempotent and never toggle back to unread through these routes. Unknown or inaccessible IDs return 404.

## Action center API

`GET /api/actions?workspaceId=…` returns live, paginated work needing attention. Filters: propertyId, category, rule and search. Default ordering is URGENT → NEEDS_ATTENTION → UPCOMING, then due date, rule and source ID; null dates appear first within a category. page and size follow inbox limits. Source property filter IDs outside the scope simply produce no rows.

Each item includes propertyId, rule, type, sourceId, sourcePath, title, message, category and optional dueDate. The existing source APIs provide the permitted actions and enforce role/assignment rules; this endpoint does not execute them. There are no invented dashboard figures or placeholder responses.

OWNER/MANAGER see their workspace's matching records. STAFF see only currently assigned high-priority maintenance and overdue tasks. The action center never exposes invoice, contract or vacancy records to STAFF.

## Generation and consistency

Operational mutations publish a domain event through the existing audit boundary. A transaction listener evaluates the workspace only after successful commit, in a separate transaction. Rollbacks create no notifications. The listener is synchronous; it may add response latency for large workspaces. If evaluation fails, the already committed business change still succeeds, an error is logged, and scheduled reconciliation retries.

The scheduler starts after approximately three seconds and repeats about every minute after each run. It handles date boundaries, missed events, membership changes and restarts. Workspace and source scans use batches of 100. Evaluation serializes on a SQL Server workspace update lock and a unique delivery index prevents duplicates across concurrent evaluators/application instances. Each workspace evaluation commits atomically; a failed pass does not partially resolve its inbox.

The delivery key is workspace + recipient + rule + source + alert window. Invoice/task windows use due date, contracts use end date, vacancy uses availableSince and maintenance uses its single non-reopenable lifecycle. Repeated evaluation updates the same notification without resetting read state. Changing a due date creates a new window and resolves the old one. Category/message changes or reactivation of a resolved condition mark the existing row unread once; unchanged repeats do not. Records no longer qualifying or no longer addressed to an eligible recipient become inactive with resolvedAt. Read history is retained.

Notifications are an eventually reconciled inbox: active/resolved state can lag until the next successful pass, typically about a minute when no event was received. Live actions query current conditions immediately. Reads also recheck membership, current role and staff assignment independently of reconciliation. Old financial notifications become inaccessible after demotion to STAFF, and reassigned/deleted task notifications are hidden from former assignees even before the scheduler runs.

Notification records retain property/source IDs as historical references rather than foreign keys to mutable/deletable sources. Recipient membership is protected by a scoped foreign key. Deleting memberships with retained notifications is therefore blocked; disable memberships to revoke access. There is no general broadcast, custom-message or inbox-deletion API in this step.

## Configuration and testing

Keep both flags enabled in normal operation:

```text
ALERT_EVENTS_ENABLED=true
ALERT_SCHEDULER_ENABLED=true
```

API_DOCS_ENABLED enables the local API reference. Start using `backend/README.md`; Flyway applies V6. No external service keys are needed.

Run `./mvnw.cmd '-Pwindows-auth,sqlserver-it' verify` from backend with TEST_DB_URL targeting `holoka_newconcept_it`. NotificationIT enables real after-commit listeners, uses a controlled clock and manually invokes the scheduler. It tests all five rules, recipient isolation, read state, concurrent deduplication, expiry escalation, local midnight, resolution, new alert windows, disabled membership/workspace, SQL constraints and rolled-back writes. Other module tests disable notification generation to keep their fixtures isolated.

Dashboard aggregates/charts remain Step 10; email/push delivery, configurable reminder cadence, retention policy and a durable external-delivery outbox are future features.
