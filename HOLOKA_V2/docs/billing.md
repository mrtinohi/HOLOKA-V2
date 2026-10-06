# Invoice and Payment API — Step 7

These APIs persist real records in SQL Server. Every endpoint requires bearer authentication, an authorized `workspaceId` query parameter and OWNER or MANAGER membership. Mutations require the CSRF cookie/header described in `api.md`. Only OWNER can void a payment. STAFF and platform ADMIN have no implicit access.

## Invoice routes

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/invoices | Search, filters, sorting and pagination |
| POST | /api/invoices | Create a DRAFT; returns 201 |
| GET | /api/invoices/{id} | Detail and current balance |
| PUT | /api/invoices/{id} | Edit a DRAFT using its version |
| DELETE | /api/invoices/{id} | Delete a DRAFT; query parameter version required |
| POST | /api/invoices/{id}/issue | Issue a DRAFT; body `{"version":0}` |
| POST | /api/invoices/{id}/cancel | Cancel an unpaid invoice; body includes version |

Example create body:

```json
{
  "invoiceCode": "INV-202609-101",
  "contractId": 123,
  "billingMonth": "2026-09",
  "dueDate": "2026-09-30",
  "rentAmount": 5000000,
  "electricityAmount": 400000,
  "waterAmount": 100000,
  "serviceAmount": 300000,
  "otherAmount": 200000
}
```

IDs are illustrative. All five amounts are required, nonnegative and limited to two decimal places. The server sums them using decimals; the total must be positive and fit DECIMAL(19,2). Clients cannot set totalAmount, paidAmount or status. PUT uses the same body with the latest version. The linked contract is immutable. Tenant, room and property IDs are derived from that contract rather than trusted from the client.

The contract must have been activated; EXPIRED and TERMINATED contracts can still receive final bills. Billing month must intersect the original contract period. One non-cancelled invoice is permitted per contract/month. Cancelling a bill allows a replacement with a new code. Invoice codes remain unique per workspace, including cancelled records. Amounts are explicitly entered: automatic meter readings, prorating, deposit allocation and recurring generation are future features. No currency conversion or payment gateway is provided.

Issued invoices cannot be edited or deleted. Cancel an unpaid mistake and create a replacement. Invoices with recorded payments cannot be cancelled until an OWNER voids the mistaken payment records. Cancellation preserves history. Voiding is an accounting correction, not an external refund.

Responses include the five amounts, totalAmount, paidAmount, remainingAmount, status, version and timestamps. `remainingAmount = totalAmount - paidAmount` is the arithmetic balance; CANCELLED and DRAFT invoices are not collectible regardless of this value. Future outstanding-balance reports must restrict to issued/partially paid/overdue invoices.

List filters: search (invoice code), tenantId, propertyId, contractId, billingMonth (`YYYY-MM`) and status. Use page (zero-based), size (1–100), and sort (`field,asc` or `field,desc`). Sort fields: id, invoiceCode, billingMonth, dueDate, totalAmount, paidAmount, createdAt, updatedAt. Default: createdAt,desc.

## Payment routes

| Method | Path | Behavior |
| --- | --- | --- |
| GET | /api/payments | Search/filter/sort/paginate, including invoice history |
| POST | /api/payments | Record payment; returns 201 with payment and updated invoice |
| GET | /api/payments/{id} | Payment detail |
| POST | /api/payments/{id}/void | OWNER-only correction; returns payment and invoice |

Example payment body:

```json
{
  "paymentCode": "PAY-202609-0001",
  "invoiceId": 456,
  "invoiceVersion": 1,
  "amount": 3000000,
  "paymentMethod": "BANK_TRANSFER",
  "paymentDate": "2026-09-29",
  "reference": "Bank receipt reference",
  "note": "First installment"
}
```

Methods: CASH, BANK_TRANSFER, ONLINE, OTHER. Each describes a payment already received; ONLINE does not initiate or verify an external transaction. Payment date is a calendar date and cannot be in the future according to the workspace timezone. Amount must be positive, have at most two decimals and not exceed the invoice's remaining balance. Payments require an issued invoice with outstanding balance, including overdue invoices. A partial payment updates paidAmount and remainingAmount; paying the remainder produces PAID.

Codes are normalized to uppercase and unique per workspace. A repeated code returns 409 without adding another payment. Reuse the same code when retrying an uncertain submission, then look up that code to check the original record; this API does not return cached success responses. invoiceVersion is required and prevents two requests based on the same stale balance from both succeeding. On conflict, reload the invoice and payment history before deciding whether another payment is appropriate.

Payment records cannot be edited or deleted. To correct a mistake, OWNER posts:

```json
{"version":0,"invoiceVersion":2,"reason":"Recorded against the wrong invoice"}
```

to `/api/payments/{id}/void?workspaceId=…`. The payment becomes VOIDED and retains its original amount/method/reference. The invoice balance and status are recalculated in the same transaction. A second void is rejected. The reason is mandatory and retained. Create a new payment if necessary after correcting the record.

List filters: invoiceId, paymentMethod, status (RECORDED/VOIDED), from and to (inclusive payment dates), search (code/reference). Paging is identical to invoices. Sort fields: id, paymentCode, amount, paymentDate, paymentMethod, status, createdAt, updatedAt. Default: createdAt,desc.

## Status, consistency and security

Invoice states are DRAFT, ISSUED, PARTIALLY_PAID, PAID, OVERDUE and CANCELLED. OVERDUE is derived on reads and in database list predicates when dueDate is before the workspace's current date and the invoice is ISSUED or PARTIALLY_PAID. The due date itself is not overdue. Overdue takes precedence over PARTIALLY_PAID; paidAmount still shows progress. This remains correct at local midnight without waiting for a scheduled job. The database stores the financial lifecycle state, so raw SQL status alone does not reveal overdue bills. No overdue notification is sent yet; that belongs to Step 9.

All invoice changes, payment recording and voiding acquire a write lock on the invoice row. Version checks, payment history, balance changes and audit writes commit or roll back together. Unique indexes prevent duplicate invoice periods/codes and duplicate payment codes. Scoped composite foreign keys enforce the exact contract parties and invoice workspace. Check constraints enforce totals, valid monetary bounds and status/balance consistency. The application maintains paidAmount as the sum of RECORDED payments; direct SQL ledger changes bypass that service rule and are unsupported.

Expected errors: 400 invalid fields/dates/months; 401 missing authentication; 403 insufficient role or CSRF; 404 inaccessible scoped IDs; 409 stale versions, duplicate codes/periods, invalid transitions or excess payment. Validation and database errors do not expose SQL details.

## Run and verify

Follow `backend/README.md` to start with SQL Server and a JWT key. Flyway applies V4 automatically. Enable API_DOCS_ENABLED locally for Swagger. Run `./mvnw.cmd '-Pwindows-auth,sqlserver-it' verify` from backend with TEST_DB_URL targeting `holoka_newconcept_it`.

BillingIT covers decimal calculations, partial/full payments, overpayment, duplicate retries, concurrency, lifecycle protections, cancellation/replacement, voiding, timezone boundaries, search/filter/pagination, role isolation and database constraints. React finance screens are pending Step 11.
