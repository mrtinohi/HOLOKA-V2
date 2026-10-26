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
