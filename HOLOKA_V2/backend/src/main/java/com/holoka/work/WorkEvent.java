package com.holoka.work;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
import org.hibernate.annotations.Nationalized;
@Entity @Table(name="work_events",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class WorkEvent {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    private Long maintenanceId;
    private Long taskId;
    @Column(nullable=false) private long actorUserId;
    @Column(nullable=false,length=40) private String action;
    @Column(length=20) private String previousStatus;
    @Column(nullable=false,length=20) private String newStatus;
    private Long assignedUserId;
    @Column(precision=19,scale=2) private BigDecimal estimatedCost;
    @Column(precision=19,scale=2) private BigDecimal actualCost;
    @Nationalized @Column(length=1000) private String note;
    @Column(nullable=false,columnDefinition="datetime2(6)") private LocalDateTime occurredAt;
    public WorkEvent(AssignedWork item,boolean maintenance,long actor,String action,String previous,String note,BigDecimal estimate,BigDecimal actual,LocalDateTime now){
        workspaceId=item.getWorkspaceId();maintenanceId=maintenance?item.getId():null;taskId=maintenance?null:item.getId();actorUserId=actor;this.action=action;previousStatus=previous;
        newStatus=item.statusName();assignedUserId=item.getAssignedUserId();estimatedCost=estimate;actualCost=actual;this.note=note;occurredAt=now;
    }
    public record View(long id,long actorUserId,String action,String previousStatus,String newStatus,Long assignedUserId,BigDecimal estimatedCost,BigDecimal actualCost,String note,LocalDateTime occurredAt){
        public static View of(WorkEvent e){return new View(e.id,e.actorUserId,e.action,e.previousStatus,e.newStatus,e.assignedUserId,e.estimatedCost,e.actualCost,e.note,e.occurredAt);}
    }
}
