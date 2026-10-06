# Step 7 — Invoices and payments

## Completed behavior

Implemented database-backed monthly invoices, draft editing/deletion, issuance/cancellation, search/filter/sort/pagination, payment recording and owner-only correction of mistaken payments. Five charge amounts are summed with decimal arithmetic. Partial/full payments update paid and remaining amounts atomically. Overpayment, duplicate payment codes and stale submissions are rejected. History is preserved after issuance and payment recording.

Invoice tenant, room and property scope comes from the contract. One non-cancelled invoice is permitted per contract/month. Billing requires an activated or historical contract, and the billing month must intersect its original dates. OVERDUE is computed from the workspace's local date in both detail responses and list queries, including partially paid invoices. This avoids stale status between midnight and a scheduled job. OWNER and MANAGER can operate billing; only OWNER can void a payment, and STAFF cannot read this financial data.

## Created files

- `backend/src/main/resources/db/migration/V4__invoices_payments.sql`.
- `backend/src/main/java/com/holoka/invoice/`: Invoice, InvoiceStatus, InvoiceDtos, InvoiceRepository, InvoiceService and InvoiceController.
- `backend/src/main/java/com/holoka/payment/`: Payment, PaymentMethod, PaymentStatus, PaymentDtos, PaymentRepository, PaymentService and PaymentController.
- `backend/src/test/java/com/holoka/BillingIT.java`.
- `docs/billing.md` and this report.

Updated SecurityConfig route authorization, DatabaseMigrationIT's schema count, both README files and architecture/API/database documentation. Applied V1–V3 scripts were preserved.

## Architecture and important code

Controllers → validated DTOs → transactional services → scoped JPA repositories → SQL Server. The existing workspace policy, version handling, audit writer and timezone-aware clock are reused. Composite foreign keys reinforce invoice contract parties and payment workspace relationships. Database check constraints enforce amounts and financial lifecycle state. Filtered uniqueness allows a cancelled invoice to be replaced without deleting its history.

Payment recording holds an invoice write lock before checking the client version and outstanding amount:

```java
var i=lockedInvoice(workspace,body.invoiceId());
version(body.invoiceVersion(),i.getVersion());
// Validate issued state, amount and date before creating the payment.
payments.save(p);
i.applyPayment(body.amount());
invoices.flush();
```

The service transaction also records the audit entry. Constraint or version failures roll back the entire change. Every operation that changes the balance uses the same invoice lock, including owner-only voiding. Payment history is immutable except for the recorded-to-voided transition and its mandatory reason. Direct SQL ledger mutations are unsupported because they bypass this service invariant.

## Run and test

Start using `backend/README.md` with DB_URL and JWT_SECRET configured. Startup applies V4. Enable API_DOCS_ENABLED locally for Swagger. `docs/billing.md` contains complete request examples, filter/sort fields, role rules, status semantics and retry guidance. No new environment variables are required.

From backend:

```powershell
$env:TEST_DB_URL = 'jdbc:sqlserver://localhost:1433;databaseName=holoka_newconcept_it;encrypt=true;trustServerCertificate=true;integratedSecurity=true'
.\mvnw.cmd '-Pwindows-auth,sqlserver-it' verify
```

## Verification results

On 2026-09-29 the full build and executable package passed 65 tests: 6 foundation, 1 limiter, 5 migration, 14 authentication, 11 inventory, 14 leasing and 14 billing. There were no failures, errors or skips. Maven Surefire reports cover the seven database-independent tests; Failsafe reports cover the 58 SQL Server integration tests.

Billing coverage includes exact decimal totals, draft CRUD, partial/full payments, invalid dates/amounts, overpayment, duplicate-code rollback, stale retries, simultaneous payments with one winner, Vietnam-midnight overdue status and matching filters, issued/cancelled/paid protections, invoice replacement, one-time voiding, permission and workspace isolation, historical contracts, pagination/search and database constraints. Ledger assertions compare invoice paidAmount with the sum of RECORDED payments.

The first restricted build could not access a cached Maven dependency. The authorized build with access to the local Maven cache and Windows-authenticated SQL Server completed successfully. No dependency upgrade was required.

The executable JAR then started against `holoka_newconcept`, applied V4 and reported database readiness UP. HTTP checks verified all 11 billing operations in OpenAPI have bearer security and anonymous list requests return 401. SQL Server confirms successful V1–V4 and both new tables. The temporary backend was stopped after verification. Tests used `holoka_newconcept_it`; the unrelated existing `holoka` database was not modified.

## Remaining work

Step 8 is maintenance requests and tasks. React finance screens remain Step 11; overdue notifications remain Step 9. Payment methods record money already received: no external gateway, automatic bank verification or external refund has been implemented. Recurring invoice generation, meter integrations, automatic prorating and deposit allocation are future features. This completes the Step 7 backend scope, not the entire website.
