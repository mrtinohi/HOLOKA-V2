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
