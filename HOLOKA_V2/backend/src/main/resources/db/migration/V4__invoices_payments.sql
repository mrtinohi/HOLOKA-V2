ALTER TABLE dbo.contracts ADD CONSTRAINT uq_contract_billing_scope UNIQUE(workspace_id,property_id,tenant_id,room_id,id);
CREATE TABLE dbo.invoices (
 id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_invoices PRIMARY KEY,
 workspace_id BIGINT NOT NULL, property_id BIGINT NOT NULL, tenant_id BIGINT NOT NULL, room_id BIGINT NOT NULL, contract_id BIGINT NOT NULL,
 invoice_code VARCHAR(40) NOT NULL, billing_month DATE NOT NULL, due_date DATE NOT NULL,
 rent_amount DECIMAL(19,2) NOT NULL, electricity_amount DECIMAL(19,2) NOT NULL, water_amount DECIMAL(19,2) NOT NULL,
 service_amount DECIMAL(19,2) NOT NULL, other_amount DECIMAL(19,2) NOT NULL,
 total_amount DECIMAL(19,2) NOT NULL, paid_amount DECIMAL(19,2) NOT NULL DEFAULT 0,
 status VARCHAR(20) NOT NULL,
 version BIGINT NOT NULL DEFAULT 0,
 created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT uq_invoice_scope UNIQUE(workspace_id,id),
 CONSTRAINT uq_invoice_code UNIQUE(workspace_id,invoice_code),
 CONSTRAINT fk_invoice_contract FOREIGN KEY(workspace_id,property_id,tenant_id,room_id,contract_id) REFERENCES dbo.contracts(workspace_id,property_id,tenant_id,room_id,id),
 CONSTRAINT ck_invoice_month CHECK(DAY(billing_month)=1),
 CONSTRAINT ck_invoice_amounts CHECK(rent_amount>=0 AND electricity_amount>=0 AND water_amount>=0 AND service_amount>=0 AND other_amount>=0 AND total_amount>0 AND paid_amount>=0 AND paid_amount<=total_amount),
 CONSTRAINT ck_invoice_total CHECK(total_amount=rent_amount+electricity_amount+water_amount+service_amount+other_amount),
 CONSTRAINT ck_invoice_status CHECK((status IN ('DRAFT','ISSUED','CANCELLED') AND paid_amount=0) OR (status='PARTIALLY_PAID' AND paid_amount>0 AND paid_amount<total_amount) OR (status='PAID' AND paid_amount=total_amount))
);
CREATE UNIQUE INDEX uq_invoice_contract_month ON dbo.invoices(workspace_id,contract_id,billing_month) WHERE status<>'CANCELLED';
CREATE INDEX ix_invoice_due ON dbo.invoices(workspace_id,status,due_date,id);
CREATE INDEX ix_invoice_property_month ON dbo.invoices(workspace_id,property_id,billing_month,id);
CREATE INDEX ix_invoice_tenant ON dbo.invoices(workspace_id,tenant_id,id);
CREATE TABLE dbo.payments (
 id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_payments PRIMARY KEY,
 workspace_id BIGINT NOT NULL, invoice_id BIGINT NOT NULL, payment_code VARCHAR(40) NOT NULL,
 amount DECIMAL(19,2) NOT NULL, payment_method VARCHAR(20) NOT NULL, payment_date DATE NOT NULL, status VARCHAR(20) NOT NULL,
 reference NVARCHAR(200) NULL, note NVARCHAR(1000) NULL, void_reason NVARCHAR(500) NULL,
 version BIGINT NOT NULL DEFAULT 0,
 created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT uq_payment_code UNIQUE(workspace_id,payment_code),
 CONSTRAINT fk_payment_invoice FOREIGN KEY(workspace_id,invoice_id) REFERENCES dbo.invoices(workspace_id,id),
 CONSTRAINT ck_payment_amount CHECK(amount>0),
 CONSTRAINT ck_payment_method CHECK(payment_method IN ('CASH','BANK_TRANSFER','ONLINE','OTHER')),
 CONSTRAINT ck_payment_status CHECK((status='RECORDED' AND void_reason IS NULL) OR (status='VOIDED' AND void_reason IS NOT NULL AND LEN(TRIM(void_reason))>0))
);
CREATE INDEX ix_payment_invoice ON dbo.payments(workspace_id,invoice_id,status,id);
CREATE INDEX ix_payment_date ON dbo.payments(workspace_id,payment_date,id);
