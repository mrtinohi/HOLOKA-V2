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
