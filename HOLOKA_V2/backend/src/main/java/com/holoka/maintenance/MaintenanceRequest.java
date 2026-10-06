package com.holoka.maintenance;
import com.holoka.work.AssignedWork;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.*;
@Entity @Table(name="maintenance_requests",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class MaintenanceRequest extends AssignedWork {
    private Long buildingId;
    private Long tenantId;
    @Column(nullable=false,length=40) private String requestCode;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private MaintenanceStatus status=MaintenanceStatus.OPEN;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal estimatedCost=BigDecimal.ZERO;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal actualCost=BigDecimal.ZERO;
    @Column(nullable=false,columnDefinition="datetime2(6)") private LocalDateTime reportedAt;
    public MaintenanceRequest(long workspace,long property,Long building,Long room,Long tenant,String code,LocalDateTime now){workspaceId=workspace;propertyId=property;buildingId=building;roomId=room;tenantId=tenant;requestCode=code;reportedAt=now;}
    public void assign(Long user){assignedUserId=user;if(status==MaintenanceStatus.OPEN || status==MaintenanceStatus.ASSIGNED)status=user==null?MaintenanceStatus.OPEN:MaintenanceStatus.ASSIGNED;}
    public void costs(BigDecimal estimate,BigDecimal actual){estimatedCost=estimate;actualCost=actual;}
    public void transition(MaintenanceStatus next,LocalDateTime now){status=next;completedAt=next==MaintenanceStatus.COMPLETED?now:null;}
    @Override public String statusName(){return status.name();}
}
