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
