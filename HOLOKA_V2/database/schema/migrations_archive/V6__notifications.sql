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
