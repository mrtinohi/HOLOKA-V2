CREATE DATABASE holoka_newconcept_it;
GO
USE holoka_newconcept_it;
GO
-- SQL Server only. Roles are reference data; no demo accounts or passwords.
CREATE TABLE dbo.app_users (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_app_users PRIMARY KEY,
    full_name NVARCHAR(160) NOT NULL,
    email NVARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    enabled BIT NOT NULL CONSTRAINT df_users_enabled DEFAULT 1,
    platform_admin BIT NOT NULL CONSTRAINT df_users_admin DEFAULT 0,
    token_version BIGINT NOT NULL CONSTRAINT df_users_token_version DEFAULT 0,
    version BIGINT NOT NULL CONSTRAINT df_users_version DEFAULT 0,
    created_at DATETIME2(6) NOT NULL CONSTRAINT df_users_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL CONSTRAINT df_users_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_users_email UNIQUE(email),
    CONSTRAINT ck_users_name CHECK (LEN(TRIM(full_name)) > 0),
    CONSTRAINT ck_users_email CHECK (LEN(TRIM(email)) > 3 AND email = TRIM(email)),
    CONSTRAINT ck_users_token_version CHECK (token_version >= 0)
);

CREATE TABLE dbo.roles (
    code VARCHAR(20) NOT NULL CONSTRAINT pk_roles PRIMARY KEY,
    description NVARCHAR(200) NOT NULL,
    CONSTRAINT ck_roles_code CHECK (code IN ('ADMIN','OWNER','MANAGER','STAFF'))
);
INSERT INTO dbo.roles(code, description) VALUES
('ADMIN', N'Platform administrator; granted on user account, not workspace membership'),
('OWNER', N'Workspace owner'), ('MANAGER', N'Property operations manager'), ('STAFF', N'Assigned operational work');

CREATE TABLE dbo.workspaces (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_workspaces PRIMARY KEY,
    name NVARCHAR(160) NOT NULL,
    currency CHAR(3) NOT NULL CONSTRAINT df_workspace_currency DEFAULT 'VND',
    timezone VARCHAR(80) NOT NULL CONSTRAINT df_workspace_timezone DEFAULT 'Asia/Ho_Chi_Minh',
    vacancy_alert_days INT NOT NULL CONSTRAINT df_workspace_vacancy DEFAULT 30,
    enabled BIT NOT NULL CONSTRAINT df_workspace_enabled DEFAULT 1,
    version BIGINT NOT NULL CONSTRAINT df_workspace_version DEFAULT 0,
    created_at DATETIME2(6) NOT NULL CONSTRAINT df_workspace_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL CONSTRAINT df_workspace_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT ck_workspace_name CHECK (LEN(TRIM(name)) > 0),
    CONSTRAINT ck_workspace_vacancy CHECK (vacancy_alert_days BETWEEN 1 AND 3650)
);

CREATE TABLE dbo.memberships (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_memberships PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role_code VARCHAR(20) NOT NULL,
    enabled BIT NOT NULL CONSTRAINT df_memberships_enabled DEFAULT 1,
    version BIGINT NOT NULL CONSTRAINT df_memberships_version DEFAULT 0,
    created_at DATETIME2(6) NOT NULL CONSTRAINT df_memberships_created DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL CONSTRAINT df_memberships_updated DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_memberships_workspace FOREIGN KEY(workspace_id) REFERENCES dbo.workspaces(id),
    CONSTRAINT fk_memberships_user FOREIGN KEY(user_id) REFERENCES dbo.app_users(id),
    CONSTRAINT fk_memberships_role FOREIGN KEY(role_code) REFERENCES dbo.roles(code),
    CONSTRAINT uq_memberships_user_workspace UNIQUE(workspace_id, user_id),
    -- Supports composite scoped foreign keys in subsequent domain migrations.
    CONSTRAINT uq_memberships_workspace_id UNIQUE(workspace_id, id),
    CONSTRAINT ck_memberships_role CHECK (role_code IN ('OWNER','MANAGER','STAFF'))
);
CREATE INDEX ix_memberships_user ON dbo.memberships(user_id, enabled) INCLUDE(workspace_id, role_code);

CREATE TABLE dbo.refresh_sessions (
    id UNIQUEIDENTIFIER NOT NULL CONSTRAINT pk_refresh_sessions PRIMARY KEY,
    user_id BIGINT NOT NULL,
    family_id UNIQUEIDENTIFIER NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at DATETIME2(6) NOT NULL,
    revoked_at DATETIME2(6) NULL,
    replaced_by UNIQUEIDENTIFIER NULL,
    created_at DATETIME2(6) NOT NULL CONSTRAINT df_sessions_created DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_sessions_user FOREIGN KEY(user_id) REFERENCES dbo.app_users(id),
    CONSTRAINT uq_sessions_token UNIQUE(token_hash),
    CONSTRAINT ck_sessions_expiry CHECK (expires_at > created_at)
);
CREATE INDEX ix_sessions_user ON dbo.refresh_sessions(user_id, revoked_at);
CREATE INDEX ix_sessions_family ON dbo.refresh_sessions(family_id);
CREATE INDEX ix_sessions_expiry ON dbo.refresh_sessions(expires_at);

CREATE TABLE dbo.audit_logs (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_audit_logs PRIMARY KEY,
    workspace_id BIGINT NULL,
    actor_user_id BIGINT NULL,
    action VARCHAR(40) NOT NULL,
    entity VARCHAR(80) NOT NULL,
    entity_id VARCHAR(80) NULL,
    description NVARCHAR(1000) NOT NULL,
    occurred_at DATETIME2(6) NOT NULL CONSTRAINT df_audit_occurred DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_audit_workspace FOREIGN KEY(workspace_id) REFERENCES dbo.workspaces(id),
    CONSTRAINT fk_audit_actor FOREIGN KEY(actor_user_id) REFERENCES dbo.app_users(id)
);
CREATE INDEX ix_audit_workspace_time ON dbo.audit_logs(workspace_id, occurred_at DESC);
CREATE INDEX ix_audit_actor ON dbo.audit_logs(actor_user_id, occurred_at DESC);
CREATE TABLE dbo.properties (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_properties PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    owner_user_id BIGINT NOT NULL,
    name NVARCHAR(160) NOT NULL,
    code VARCHAR(40) NOT NULL,
    address NVARCHAR(500) NOT NULL,
    description NVARCHAR(4000) NULL,
    property_type VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_property_workspace FOREIGN KEY(workspace_id) REFERENCES dbo.workspaces(id),
    CONSTRAINT fk_property_owner_membership FOREIGN KEY(workspace_id, owner_user_id) REFERENCES dbo.memberships(workspace_id, user_id),
    CONSTRAINT uq_property_scope UNIQUE(workspace_id, id),
    CONSTRAINT uq_property_code UNIQUE(workspace_id, code),
    CONSTRAINT ck_property_name CHECK (LEN(TRIM(name)) > 0),
    CONSTRAINT ck_property_address CHECK (LEN(TRIM(address)) > 0),
    CONSTRAINT ck_property_code CHECK (LEN(TRIM(code)) > 0),
    CONSTRAINT ck_property_status CHECK (status IN ('ACTIVE','INACTIVE')),
    CONSTRAINT ck_property_type CHECK (property_type IN ('APARTMENT','ROOM_RENTAL','SERVICED_APARTMENT','HOUSE','BUILDING','OTHER'))
);
CREATE INDEX ix_property_workspace_status ON dbo.properties(workspace_id, status, id);
CREATE INDEX ix_property_workspace_type ON dbo.properties(workspace_id, property_type, id);

CREATE TABLE dbo.buildings (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_buildings PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    name NVARCHAR(160) NOT NULL,
    code VARCHAR(40) NOT NULL,
    description NVARCHAR(4000) NULL,
    number_of_floors INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_building_property FOREIGN KEY(workspace_id, property_id) REFERENCES dbo.properties(workspace_id, id),
    CONSTRAINT uq_building_scope UNIQUE(workspace_id, property_id, id),
    CONSTRAINT uq_building_code UNIQUE(workspace_id, property_id, code),
    CONSTRAINT ck_building_name CHECK (LEN(TRIM(name)) > 0),
    CONSTRAINT ck_building_code CHECK (LEN(TRIM(code)) > 0),
    CONSTRAINT ck_building_floors CHECK (number_of_floors BETWEEN 1 AND 300),
    CONSTRAINT ck_building_status CHECK (status IN ('ACTIVE','INACTIVE'))
);
CREATE INDEX ix_building_workspace_status ON dbo.buildings(workspace_id, status, id);

CREATE TABLE dbo.rooms (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_rooms PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    building_id BIGINT NOT NULL,
    room_code VARCHAR(40) NOT NULL,
    name NVARCHAR(160) NOT NULL,
    floor INT NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    monthly_rent DECIMAL(19,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    description NVARCHAR(4000) NULL,
    available_since DATETIME2(6) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_room_building FOREIGN KEY(workspace_id, property_id, building_id) REFERENCES dbo.buildings(workspace_id, property_id, id),
    CONSTRAINT uq_room_scope UNIQUE(workspace_id, id),
    CONSTRAINT uq_room_code UNIQUE(workspace_id, building_id, room_code),
    CONSTRAINT ck_room_name CHECK (LEN(TRIM(name)) > 0),
    CONSTRAINT ck_room_code CHECK (LEN(TRIM(room_code)) > 0),
    CONSTRAINT ck_room_floor CHECK (floor BETWEEN 0 AND 300),
    CONSTRAINT ck_room_area CHECK (area > 0),
    CONSTRAINT ck_room_rent CHECK (monthly_rent >= 0),
    CONSTRAINT ck_room_status CHECK (status IN ('AVAILABLE','OCCUPIED','MAINTENANCE','INACTIVE')),
    CONSTRAINT ck_room_available_since CHECK ((status='AVAILABLE' AND available_since IS NOT NULL) OR (status<>'AVAILABLE' AND available_since IS NULL))
);
CREATE INDEX ix_room_workspace_status ON dbo.rooms(workspace_id, status, id);
CREATE INDEX ix_room_property ON dbo.rooms(workspace_id, property_id, id);
CREATE INDEX ix_room_building ON dbo.rooms(workspace_id, building_id, floor);
CREATE INDEX ix_room_vacancy ON dbo.rooms(workspace_id, available_since) WHERE status='AVAILABLE';
CREATE TABLE dbo.tenants (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_tenants PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    full_name NVARCHAR(160) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email NVARCHAR(254) NULL,
    identity_number VARCHAR(40) NULL,
    date_of_birth DATE NULL,
    address NVARCHAR(500) NULL,
    emergency_contact NVARCHAR(250) NULL,
    status VARCHAR(20) NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT fk_tenant_workspace FOREIGN KEY(workspace_id) REFERENCES dbo.workspaces(id),
    CONSTRAINT uq_tenant_scope UNIQUE(workspace_id,id),
    CONSTRAINT ck_tenant_name CHECK(LEN(TRIM(full_name))>0),
    CONSTRAINT ck_tenant_phone CHECK(LEN(TRIM(phone))>=6),
    CONSTRAINT ck_tenant_status CHECK(status IN ('ACTIVE','INACTIVE'))
);
CREATE UNIQUE INDEX uq_tenant_identity ON dbo.tenants(workspace_id,identity_number) WHERE identity_number IS NOT NULL;
CREATE INDEX ix_tenant_workspace_status ON dbo.tenants(workspace_id,status,id);
ALTER TABLE dbo.rooms ADD CONSTRAINT uq_room_property_scope UNIQUE(workspace_id,property_id,id);

CREATE TABLE dbo.contracts (
    id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_contracts PRIMARY KEY,
    workspace_id BIGINT NOT NULL,
    property_id BIGINT NOT NULL,
    tenant_id BIGINT NOT NULL,
    room_id BIGINT NOT NULL,
    contract_code VARCHAR(40) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    monthly_rent DECIMAL(19,2) NOT NULL,
    deposit DECIMAL(19,2) NOT NULL,
    status VARCHAR(20) NOT NULL,
    terms NVARCHAR(4000) NULL,
    version BIGINT NOT NULL DEFAULT 0,
    created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT uq_contract_scope UNIQUE(workspace_id,id),
    CONSTRAINT uq_contract_code UNIQUE(workspace_id,contract_code),
    CONSTRAINT fk_contract_tenant FOREIGN KEY(workspace_id,tenant_id) REFERENCES dbo.tenants(workspace_id,id),
    CONSTRAINT fk_contract_room FOREIGN KEY(workspace_id,property_id,room_id) REFERENCES dbo.rooms(workspace_id,property_id,id),
    CONSTRAINT ck_contract_code CHECK(LEN(TRIM(contract_code))>0),
    CONSTRAINT ck_contract_dates CHECK(start_date<end_date),
    CONSTRAINT ck_contract_rent CHECK(monthly_rent>=0 AND deposit>=0),
    CONSTRAINT ck_contract_status CHECK(status IN ('DRAFT','ACTIVE','EXPIRED','TERMINATED'))
);
CREATE INDEX ix_contract_room_period ON dbo.contracts(workspace_id,room_id,status,start_date,end_date);
CREATE INDEX ix_contract_tenant ON dbo.contracts(workspace_id,tenant_id,status,id);
CREATE INDEX ix_contract_property ON dbo.contracts(workspace_id,property_id,status,id);
CREATE INDEX ix_contract_expiration ON dbo.contracts(workspace_id,status,end_date,id);
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
ALTER TABLE dbo.rooms ADD CONSTRAINT uq_room_building_scope UNIQUE(workspace_id,property_id,building_id,id);
CREATE TABLE dbo.maintenance_requests (
 id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_maintenance PRIMARY KEY,
 workspace_id BIGINT NOT NULL, property_id BIGINT NOT NULL, building_id BIGINT NULL, room_id BIGINT NULL, tenant_id BIGINT NULL,
 assigned_user_id BIGINT NULL, request_code VARCHAR(40) NOT NULL,
 title NVARCHAR(200) NOT NULL, description NVARCHAR(4000) NULL, priority VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL,
 estimated_cost DECIMAL(19,2) NOT NULL, actual_cost DECIMAL(19,2) NOT NULL,
 reported_at DATETIME2(6) NOT NULL, completed_at DATETIME2(6) NULL,
 version BIGINT NOT NULL DEFAULT 0, created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT uq_maintenance_scope UNIQUE(workspace_id,id), CONSTRAINT uq_maintenance_code UNIQUE(workspace_id,request_code),
 CONSTRAINT fk_maintenance_property FOREIGN KEY(workspace_id,property_id) REFERENCES dbo.properties(workspace_id,id),
 CONSTRAINT fk_maintenance_building FOREIGN KEY(workspace_id,property_id,building_id) REFERENCES dbo.buildings(workspace_id,property_id,id),
 CONSTRAINT fk_maintenance_room FOREIGN KEY(workspace_id,property_id,building_id,room_id) REFERENCES dbo.rooms(workspace_id,property_id,building_id,id),
 CONSTRAINT fk_maintenance_tenant FOREIGN KEY(workspace_id,tenant_id) REFERENCES dbo.tenants(workspace_id,id),
 CONSTRAINT fk_maintenance_assignee FOREIGN KEY(workspace_id,assigned_user_id) REFERENCES dbo.memberships(workspace_id,user_id),
 CONSTRAINT ck_maintenance_room CHECK(room_id IS NULL OR building_id IS NOT NULL),
 CONSTRAINT ck_maintenance_title CHECK(LEN(TRIM(title))>0),
 CONSTRAINT ck_maintenance_cost CHECK(estimated_cost>=0 AND actual_cost>=0),
 CONSTRAINT ck_maintenance_priority CHECK(priority IN ('LOW','MEDIUM','HIGH','URGENT')),
 CONSTRAINT ck_maintenance_status CHECK(status IN ('OPEN','ASSIGNED','IN_PROGRESS','WAITING','COMPLETED','CANCELLED')),
 CONSTRAINT ck_maintenance_assignment CHECK((status='OPEN' AND assigned_user_id IS NULL) OR (status IN ('ASSIGNED','IN_PROGRESS','WAITING','COMPLETED') AND assigned_user_id IS NOT NULL) OR status='CANCELLED'),
 CONSTRAINT ck_maintenance_completed CHECK((status='COMPLETED' AND completed_at IS NOT NULL AND completed_at>=reported_at) OR (status<>'COMPLETED' AND completed_at IS NULL))
);
CREATE INDEX ix_maintenance_assignment ON dbo.maintenance_requests(workspace_id,assigned_user_id,status,id);
CREATE INDEX ix_maintenance_property ON dbo.maintenance_requests(workspace_id,property_id,status,priority,id);
CREATE TABLE dbo.tasks (
 id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_tasks PRIMARY KEY,
 workspace_id BIGINT NOT NULL, property_id BIGINT NOT NULL, room_id BIGINT NULL, assigned_user_id BIGINT NULL,
 title NVARCHAR(200) NOT NULL, description NVARCHAR(4000) NULL, priority VARCHAR(20) NOT NULL, status VARCHAR(20) NOT NULL,
 due_date DATE NOT NULL, completed_at DATETIME2(6) NULL, deleted BIT NOT NULL DEFAULT 0,
 version BIGINT NOT NULL DEFAULT 0, created_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(), updated_at DATETIME2(6) NOT NULL DEFAULT SYSUTCDATETIME(),
 CONSTRAINT uq_task_scope UNIQUE(workspace_id,id),
 CONSTRAINT fk_task_property FOREIGN KEY(workspace_id,property_id) REFERENCES dbo.properties(workspace_id,id),
 CONSTRAINT fk_task_room FOREIGN KEY(workspace_id,property_id,room_id) REFERENCES dbo.rooms(workspace_id,property_id,id),
 CONSTRAINT fk_task_assignee FOREIGN KEY(workspace_id,assigned_user_id) REFERENCES dbo.memberships(workspace_id,user_id),
 CONSTRAINT ck_task_title CHECK(LEN(TRIM(title))>0),
 CONSTRAINT ck_task_priority CHECK(priority IN ('LOW','MEDIUM','HIGH','URGENT')),
 CONSTRAINT ck_task_status CHECK(status IN ('TODO','IN_PROGRESS','COMPLETED','CANCELLED')),
 CONSTRAINT ck_task_assignment CHECK(status NOT IN ('IN_PROGRESS','COMPLETED') OR assigned_user_id IS NOT NULL),
 CONSTRAINT ck_task_completed CHECK((status='COMPLETED' AND completed_at IS NOT NULL) OR (status<>'COMPLETED' AND completed_at IS NULL)),
 CONSTRAINT ck_task_deleted CHECK(deleted=0 OR status='TODO')
);
CREATE INDEX ix_task_assignment ON dbo.tasks(workspace_id,deleted,assigned_user_id,status,id);
CREATE INDEX ix_task_due ON dbo.tasks(workspace_id,deleted,status,due_date,id);
CREATE TABLE dbo.work_events (
 id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_work_events PRIMARY KEY,
 workspace_id BIGINT NOT NULL, maintenance_id BIGINT NULL, task_id BIGINT NULL, actor_user_id BIGINT NOT NULL,
 action VARCHAR(40) NOT NULL, previous_status VARCHAR(20) NULL, new_status VARCHAR(20) NOT NULL, assigned_user_id BIGINT NULL,
 estimated_cost DECIMAL(19,2) NULL, actual_cost DECIMAL(19,2) NULL, note NVARCHAR(1000) NULL, occurred_at DATETIME2(6) NOT NULL,
 CONSTRAINT fk_work_event_maintenance FOREIGN KEY(workspace_id,maintenance_id) REFERENCES dbo.maintenance_requests(workspace_id,id),
 CONSTRAINT fk_work_event_task FOREIGN KEY(workspace_id,task_id) REFERENCES dbo.tasks(workspace_id,id),
 CONSTRAINT fk_work_event_actor FOREIGN KEY(workspace_id,actor_user_id) REFERENCES dbo.memberships(workspace_id,user_id),
 CONSTRAINT fk_work_event_assignee FOREIGN KEY(workspace_id,assigned_user_id) REFERENCES dbo.memberships(workspace_id,user_id),
 CONSTRAINT ck_work_event_parent CHECK((maintenance_id IS NOT NULL AND task_id IS NULL) OR (task_id IS NOT NULL AND maintenance_id IS NULL))
);
CREATE INDEX ix_event_maintenance ON dbo.work_events(workspace_id,maintenance_id,id);
CREATE INDEX ix_event_task ON dbo.work_events(workspace_id,task_id,id);
CREATE TABLE dbo.notifications (
 id BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT pk_notifications PRIMARY KEY,
 workspace_id BIGINT NOT NULL, user_id BIGINT NOT NULL, property_id BIGINT NOT NULL,
 [rule] VARCHAR(40) NOT NULL, type VARCHAR(20) NOT NULL, source_id BIGINT NOT NULL, window_key VARCHAR(80) NOT NULL,
 title NVARCHAR(160) NOT NULL, message NVARCHAR(500) NOT NULL, category VARCHAR(30) NOT NULL,
 is_read BIT NOT NULL DEFAULT 0, active BIT NOT NULL DEFAULT 1,
 created_at DATETIME2(6) NOT NULL, updated_at DATETIME2(6) NOT NULL, resolved_at DATETIME2(6) NULL,
 last_seen UNIQUEIDENTIFIER NOT NULL,
 CONSTRAINT fk_notification_recipient FOREIGN KEY(workspace_id,user_id) REFERENCES dbo.memberships(workspace_id,user_id),
 CONSTRAINT uq_notification_delivery UNIQUE(workspace_id,user_id,[rule],source_id,window_key),
 CONSTRAINT ck_notification_rule CHECK([rule] IN ('INVOICE_OVERDUE','CONTRACT_EXPIRING','HIGH_MAINTENANCE','TASK_OVERDUE','ROOM_VACANT')),
 CONSTRAINT ck_notification_type CHECK(type IN ('CONTRACT','PAYMENT','MAINTENANCE','TASK','SYSTEM')),
 CONSTRAINT ck_notification_category CHECK(category IN ('URGENT','NEEDS_ATTENTION','UPCOMING')),
 CONSTRAINT ck_notification_resolved CHECK((active=1 AND resolved_at IS NULL) OR (active=0 AND resolved_at IS NOT NULL))
);
CREATE INDEX ix_notification_inbox ON dbo.notifications(workspace_id,user_id,is_read,active,id DESC);
CREATE INDEX ix_notification_reconcile ON dbo.notifications(workspace_id,active,last_seen);

