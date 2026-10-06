package com.holoka.work;
import com.holoka.auth.AuthPrincipal;
import com.holoka.building.BuildingRepository;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.contract.LeaseCalendar;
import com.holoka.property.InventoryPolicy;
import com.holoka.room.RoomRepository;
import com.holoka.workspace.*;
import java.math.BigDecimal;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import static com.holoka.property.InventoryPolicy.*;

@Component @RequiredArgsConstructor
public class WorkPolicy {
    private final WorkspaceAccess access;
    private final MembershipRepository memberships;
    private final InventoryPolicy inventory;
    private final BuildingRepository buildings;
    private final RoomRepository rooms;
    private final WorkEventRepository events;
    private final LeaseCalendar calendar;
    public boolean staff(AuthPrincipal p,long workspace){return access.require(p,workspace,Role.OWNER,Role.MANAGER,Role.STAFF).getRole()==Role.STAFF;}
    public void operator(AuthPrincipal p,long workspace){inventory.operator(p,workspace);}
    public void visible(AuthPrincipal p,AssignedWork item){if(staff(p,item.getWorkspaceId()) && !Objects.equals(item.getAssignedUserId(),p.userId())) throw missing("Work item");}
    public void assignee(long workspace,Long user){
        if(user==null) return;
        var m=memberships.activeInWorkspace(user,workspace).orElseThrow(() -> missing("Assignee"));
        if(!m.getUser().isEnabled() || m.getRole()!=Role.STAFF) throw bad("Assignee must be an enabled STAFF member of this workspace");
    }
    public void location(long workspace,long property,Long building,Long room){
        inventory.property(workspace,property);
        if(building!=null){var b=buildings.findByIdAndWorkspaceId(building,workspace).orElseThrow(() -> missing("Building"));if(b.getPropertyId()!=property)throw bad("Building does not belong to property");}
        if(room!=null){var r=rooms.findByIdAndWorkspaceId(room,workspace).orElseThrow(() -> missing("Room"));if(r.getPropertyId()!=property || (building!=null && r.getBuildingId()!=building))throw bad("Room does not belong to the selected location");}
    }
    public void lockProperty(long workspace,long id){inventory.lockProperty(workspace,id);}
    public void record(AuthPrincipal p,AssignedWork item,boolean maintenance,String action,String previous,String note,BigDecimal estimate,BigDecimal actual){
        events.save(new WorkEvent(item,maintenance,p.userId(),action,previous,description(note),estimate,actual,calendar.now()));
        inventory.audit(p,item.getWorkspaceId(),action,maintenance?"MaintenanceRequest":"Task",item.getId());
    }
    public PageResponse<WorkEvent.View> history(AssignedWork item,boolean maintenance,int page,int size){
        var spec=ListQuery.<WorkEvent>scope(item.getWorkspaceId()).and(ListQuery.equal(maintenance?"maintenanceId":"taskId",item.getId()));
        return PageResponse.from(events.findAll(spec,ListQuery.page(page,size,"id,desc",Set.of("id"))),WorkEvent.View::of);
    }
}
