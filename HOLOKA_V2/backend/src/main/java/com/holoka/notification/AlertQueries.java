package com.holoka.notification;

/** Shared live rule predicates for the action center and notification reconciliation. */
final class AlertQueries {
    private AlertQueries(){}
    static final String CANDIDATES="""
        SELECT 'INVOICE_OVERDUE' AS [rule],'PAYMENT' AS type,i.id AS source_id,i.property_id,
          CAST(NULL AS BIGINT) AS assigned_user_id,CONVERT(VARCHAR(80),i.due_date,23) AS window_key,
          N'Hóa đơn quá hạn' AS title,CONCAT(N'Hóa đơn ',i.invoice_code,N' đã quá hạn thanh toán từ ',CONVERT(VARCHAR(10),i.due_date,23),N'.') AS message,
          'URGENT' AS category,i.due_date AS due_date
        FROM dbo.invoices i WHERE i.workspace_id=:workspace AND i.status IN ('ISSUED','PARTIALLY_PAID') AND i.due_date<:today
        UNION ALL
        SELECT 'CONTRACT_EXPIRING','CONTRACT',c.id,c.property_id,NULL,CONVERT(VARCHAR(80),c.end_date,23),
          N'Hợp đồng sắp hết hạn',CONCAT(N'Hợp đồng ',c.contract_code,N' kết thúc ngày ',CONVERT(VARCHAR(10),c.end_date,23),N'.'),
          CASE WHEN c.end_date<=:soon THEN 'NEEDS_ATTENTION' ELSE 'UPCOMING' END,c.end_date
        FROM dbo.contracts c WHERE c.workspace_id=:workspace AND c.status='ACTIVE' AND c.end_date>:today AND c.end_date<=:horizon
        UNION ALL
        SELECT 'HIGH_MAINTENANCE','MAINTENANCE',m.id,m.property_id,m.assigned_user_id,'OPEN',
          N'Bảo trì cần ưu tiên',CONCAT(N'Yêu cầu ',m.request_code,N' đang có mức ưu tiên ',m.priority,N'.'),'URGENT',NULL
        FROM dbo.maintenance_requests m WHERE m.workspace_id=:workspace AND m.priority IN ('HIGH','URGENT') AND m.status NOT IN ('COMPLETED','CANCELLED')
        UNION ALL
        SELECT 'TASK_OVERDUE','TASK',t.id,t.property_id,t.assigned_user_id,CONVERT(VARCHAR(80),t.due_date,23),
          N'Công việc quá hạn',CONCAT(N'Công việc #',t.id,N' đã quá hạn từ ',CONVERT(VARCHAR(10),t.due_date,23),N'.'),'NEEDS_ATTENTION',t.due_date
        FROM dbo.tasks t WHERE t.workspace_id=:workspace AND t.deleted=0 AND t.status IN ('TODO','IN_PROGRESS') AND t.due_date<:today
        UNION ALL
        SELECT 'ROOM_VACANT','SYSTEM',r.id,r.property_id,NULL,CONVERT(VARCHAR(80),r.available_since,126),
          N'Phòng trống lâu ngày',CONCAT(N'Phòng ',r.room_code,N' đã trống hơn ',:vacancyDays,N' ngày.'),'NEEDS_ATTENTION',NULL
        FROM dbo.rooms r JOIN dbo.properties p ON p.workspace_id=r.workspace_id AND p.id=r.property_id
          JOIN dbo.buildings b ON b.workspace_id=r.workspace_id AND b.id=r.building_id
        WHERE r.workspace_id=:workspace AND r.status='AVAILABLE' AND r.available_since<:vacancyCutoff AND p.status='ACTIVE' AND b.status='ACTIVE'
          AND NOT EXISTS(SELECT 1 FROM dbo.contracts c WHERE c.workspace_id=r.workspace_id AND c.room_id=r.id AND c.status='ACTIVE' AND c.start_date<=:today AND c.end_date>:today)
        """;
    static final String ACTION_ACCESS="""
        (:operator=1 OR (a.[rule] IN ('HIGH_MAINTENANCE','TASK_OVERDUE') AND a.assigned_user_id=:user))
        """;
    // Recheck source assignment at read time, including during the scheduler's eventual-consistency window.
    static final String INBOX_ACCESS="""
        n.workspace_id=:workspace AND n.user_id=:user AND
        (:operator=1 OR
          (n.[rule]='HIGH_MAINTENANCE' AND EXISTS(SELECT 1 FROM dbo.maintenance_requests m WHERE m.workspace_id=n.workspace_id AND m.id=n.source_id AND m.assigned_user_id=:user)) OR
          (n.[rule]='TASK_OVERDUE' AND EXISTS(SELECT 1 FROM dbo.tasks t WHERE t.workspace_id=n.workspace_id AND t.id=n.source_id AND t.assigned_user_id=:user AND t.deleted=0)))
        """;
}
