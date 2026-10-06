package com.holoka.audit;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name = "audit_logs", schema = "dbo")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditLog {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long workspaceId;
    private Long actorUserId;
    @Column(nullable = false, length = 40) private String action;
    @Column(nullable = false, length = 80) private String entity;
    @Column(length = 80) private String entityId;
    @Nationalized @Column(nullable = false, length = 1000) private String description;
    @Column(nullable = false, columnDefinition = "datetime2(6)") private LocalDateTime occurredAt;
    public AuditLog(Long workspaceId, Long userId, String action, String entity, String entityId, String description) {
        this.workspaceId = workspaceId; actorUserId = userId; this.action = action;
        this.entity = entity; this.entityId = entityId; this.description = description;
        occurredAt = LocalDateTime.now(ZoneOffset.UTC);
    }
}
