package com.holoka.maintenance;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.contract.*;
import com.holoka.room.RoomRepository;
import com.holoka.tenant.TenantRepository;
import com.holoka.work.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class MaintenanceService {
    private final MaintenanceRepository requests;
    private final WorkPolicy policy;
    private final LeaseCalendar calendar;
    private final RoomRepository rooms;
    private final TenantRepository tenants;
    private final ContractRepository contracts;
    public PageResponse<MaintenanceDtos.View> list(AuthPrincipal p,long workspace,String search,Long property,Long building,Long room,Long assigned,MaintenanceStatus status,Priority priority,int page,int size,String sort){
        boolean staff=policy.staff(p,workspace);
        var spec=ListQuery.<MaintenanceRequest>scope(workspace).and(ListQuery.search(search,"requestCode","title","description"))
            .and(ListQuery.equal("propertyId",property)).and(ListQuery.equal("buildingId",building)).and(ListQuery.equal("roomId",room))
            .and(ListQuery.equal("assignedUserId",assigned)).and(ListQuery.equal("status",status)).and(ListQuery.equal("priority",priority));
        if(staff) spec=spec.and(ListQuery.equal("assignedUserId",p.userId()));
        return PageResponse.from(requests.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","requestCode","title","priority","status","estimatedCost","actualCost","reportedAt","completedAt","createdAt","updatedAt"))),MaintenanceDtos.View::of);
    }
    public MaintenanceDtos.View get(AuthPrincipal p,long workspace,long id){policy.staff(p,workspace);var m=find(workspace,id);policy.visible(p,m);return MaintenanceDtos.View.of(m);}
    public PageResponse<WorkEvent.View> history(AuthPrincipal p,long workspace,long id,int page,int size){policy.staff(p,workspace);var m=find(workspace,id);policy.visible(p,m);return policy.history(m,true,page,size);}
    @Transactional public MaintenanceDtos.View create(AuthPrincipal p,long workspace,MaintenanceDtos.Create b){
        policy.operator(p,workspace);policy.lockProperty(workspace,b.propertyId());
        Long building=b.buildingId();
        if(b.roomId()!=null && building==null) building=rooms.findByIdAndWorkspaceId(b.roomId(),workspace).orElseThrow(() -> missing("Room")).getBuildingId();
        policy.location(workspace,b.propertyId(),building,b.roomId());
        if(b.tenantId()!=null){
            tenants.findByIdAndWorkspaceId(b.tenantId(),workspace).orElseThrow(() -> missing("Tenant"));
            if(!contracts.hasMaintenanceRelationship(workspace,b.tenantId(),b.propertyId(),building,b.roomId()))throw bad("Tenant has no rental history at the selected location");
        }
        var m=new MaintenanceRequest(workspace,b.propertyId(),building,b.roomId(),b.tenantId(),code(b.requestCode()),calendar.now());
        m.edit(b.title(),description(b.description()),b.priority());m.costs(b.estimatedCost(),java.math.BigDecimal.ZERO);requests.saveAndFlush(m);
        record(p,m,"CREATE",null,null);return MaintenanceDtos.View.of(m);
    }
    @Transactional public MaintenanceDtos.View update(AuthPrincipal p,long workspace,long id,MaintenanceDtos.Edit b){
        policy.operator(p,workspace);var m=locked(workspace,id);version(b.version(),m.getVersion());nonterminal(m);
        m.edit(b.title(),description(b.description()),b.priority());requests.flush();record(p,m,"UPDATE",m.statusName(),null);return MaintenanceDtos.View.of(m);
    }
    @Transactional public MaintenanceDtos.View assign(AuthPrincipal p,long workspace,long id,WorkDtos.Assignment b){
        policy.operator(p,workspace);var m=locked(workspace,id);version(b.version(),m.getVersion());nonterminal(m);
        if(Objects.equals(m.getAssignedUserId(),b.assigneeUserId())) throw conflict("Assignment is unchanged");
        if(b.assigneeUserId()==null && m.getStatus()!=MaintenanceStatus.OPEN && m.getStatus()!=MaintenanceStatus.ASSIGNED)throw conflict("Work already started; reassign it to another staff member");
        policy.assignee(workspace,b.assigneeUserId());String previous=m.statusName();m.assign(b.assigneeUserId());requests.flush();record(p,m,"ASSIGN",previous,b.note());return MaintenanceDtos.View.of(m);
    }
    @Transactional public MaintenanceDtos.View costs(AuthPrincipal p,long workspace,long id,MaintenanceDtos.Costs b){
        policy.operator(p,workspace);var m=locked(workspace,id);version(b.version(),m.getVersion());
        if(m.getStatus()==MaintenanceStatus.CANCELLED)throw conflict("Cancelled request costs cannot be changed");
        m.costs(b.estimatedCost(),b.actualCost());requests.flush();record(p,m,"COST_CHANGE",m.statusName(),b.note());return MaintenanceDtos.View.of(m);
    }
    @Transactional public MaintenanceDtos.View transition(AuthPrincipal p,long workspace,long id,MaintenanceDtos.Transition b){
        boolean staff=policy.staff(p,workspace);var m=locked(workspace,id);policy.visible(p,m);version(b.version(),m.getVersion());
        if(staff && b.status()==MaintenanceStatus.CANCELLED)throw new com.holoka.common.error.BusinessException(org.springframework.http.HttpStatus.FORBIDDEN,"Only operators can cancel work");
        boolean allowed=switch(m.getStatus()){
            case OPEN -> b.status()==MaintenanceStatus.CANCELLED;
            case ASSIGNED -> b.status()==MaintenanceStatus.IN_PROGRESS || b.status()==MaintenanceStatus.CANCELLED;
            case IN_PROGRESS -> Set.of(MaintenanceStatus.WAITING,MaintenanceStatus.COMPLETED,MaintenanceStatus.CANCELLED).contains(b.status());
            case WAITING -> b.status()==MaintenanceStatus.IN_PROGRESS || b.status()==MaintenanceStatus.CANCELLED;
            default -> false;
        };
        if(!allowed)throw conflict("Invalid maintenance status transition");
        if(b.status()!=MaintenanceStatus.CANCELLED)policy.assignee(workspace,m.getAssignedUserId());
        if((b.status()==MaintenanceStatus.WAITING || b.status()==MaintenanceStatus.CANCELLED) && (b.note()==null || b.note().isBlank()))throw bad("A note is required when waiting or cancelling");
        String previous=m.statusName();m.transition(b.status(),calendar.now());requests.flush();record(p,m,"MAINTENANCE_CHANGE",previous,b.note());return MaintenanceDtos.View.of(m);
    }
    private void nonterminal(MaintenanceRequest m){if(m.getStatus()==MaintenanceStatus.COMPLETED || m.getStatus()==MaintenanceStatus.CANCELLED)throw conflict("Closed maintenance requests cannot be edited or reassigned");}
    private void record(AuthPrincipal p,MaintenanceRequest m,String action,String previous,String note){policy.record(p,m,true,action,previous,note,m.getEstimatedCost(),m.getActualCost());}
    private MaintenanceRequest find(long workspace,long id){return requests.findByIdAndWorkspaceId(id,workspace).orElseThrow(() -> missing("Maintenance request"));}
    private MaintenanceRequest locked(long workspace,long id){return requests.lock(id,workspace).orElseThrow(() -> missing("Maintenance request"));}
}
