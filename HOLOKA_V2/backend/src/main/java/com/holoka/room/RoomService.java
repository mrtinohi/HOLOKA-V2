package com.holoka.room;

import com.holoka.auth.AuthPrincipal;
import com.holoka.building.*;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.property.*;
import com.holoka.contract.ContractRepository;
import com.holoka.contract.ContractStatus;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class RoomService {
    private final InventoryPolicy policy;
    private final RoomRepository rooms;
    private final BuildingRepository buildings;
    private final ContractRepository contracts;
    public PageResponse<RoomDtos.View> list(AuthPrincipal principal,long workspaceId,String search,Long propertyId,Long buildingId,RoomStatus status,int page,int size,String sort) {
        policy.operator(principal,workspaceId);if(propertyId!=null) policy.property(workspaceId,propertyId);
        if(buildingId!=null) {var b=building(workspaceId,buildingId);if(propertyId!=null && b.getPropertyId()!=propertyId) throw bad("Building does not belong to the selected property");}
        var spec=ListQuery.<Room>scope(workspaceId).and(ListQuery.search(search,"name","roomCode"))
            .and(ListQuery.equal("propertyId",propertyId)).and(ListQuery.equal("buildingId",buildingId)).and(ListQuery.equal("status",status));
        return PageResponse.from(rooms.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","name","roomCode","floor","area","monthlyRent","status","createdAt","updatedAt"))),RoomDtos.View::of);
    }
    public RoomDtos.View get(AuthPrincipal principal,long workspaceId,long id) {policy.operator(principal,workspaceId);return RoomDtos.View.of(find(workspaceId,id));}
    @Transactional
    public RoomDtos.View create(AuthPrincipal principal,long workspaceId,RoomDtos.Write body) {
        policy.operator(principal,workspaceId);creating(body.version());
        long parent=buildings.parentId(body.buildingId(),workspaceId).orElseThrow(() -> missing("Building"));
        var property=policy.lockProperty(workspaceId,parent);policy.active(property);var building=building(workspaceId,body.buildingId());active(building);
        validate(body,building);if(body.status()==RoomStatus.OCCUPIED) throw conflict("Occupancy is controlled by active contracts");
        var room=new Room(workspaceId,parent,body.buildingId());apply(room,body);rooms.saveAndFlush(room);
        policy.audit(principal,workspaceId,"CREATE","Room",room.getId());return RoomDtos.View.of(room);
    }
    @Transactional
    public RoomDtos.View update(AuthPrincipal principal,long workspaceId,long id,RoomDtos.Write body) {
        policy.operator(principal,workspaceId);long parent=rooms.parentPropertyId(id,workspaceId).orElseThrow(() -> missing("Room"));
        var property=policy.lockProperty(workspaceId,parent);var room=find(workspaceId,id);version(body.version(),room.getVersion());
        if(body.buildingId()!=room.getBuildingId()) throw bad("A room cannot be moved to a different building");
        var building=building(workspaceId,room.getBuildingId());validate(body,building);
        if(body.status()!=RoomStatus.INACTIVE) {policy.active(property);active(building);}
        if((body.status()==RoomStatus.OCCUPIED || room.getStatus()==RoomStatus.OCCUPIED) && body.status()!=room.getStatus())
            throw conflict("Occupancy is controlled by active contracts");
        if((body.status()==RoomStatus.MAINTENANCE || body.status()==RoomStatus.INACTIVE)
            && contracts.existsByWorkspaceIdAndRoomIdAndStatus(workspaceId,id,ContractStatus.ACTIVE))
            throw conflict("Room is reserved by an active contract");
        apply(room,body);rooms.flush();policy.audit(principal,workspaceId,"UPDATE","Room",id);return RoomDtos.View.of(room);
    }
    @Transactional
    public void delete(AuthPrincipal principal,long workspaceId,long id,long requestedVersion) {
        policy.operator(principal,workspaceId);long parent=rooms.parentPropertyId(id,workspaceId).orElseThrow(() -> missing("Room"));
        policy.lockProperty(workspaceId,parent);var room=find(workspaceId,id);version(requestedVersion,room.getVersion());
        if(room.getStatus()==RoomStatus.OCCUPIED) throw conflict("Occupied rooms cannot be deleted");
        if(contracts.existsByWorkspaceIdAndRoomId(workspaceId,id)) throw conflict("Room has rental history; deactivate instead");
        rooms.delete(room);rooms.flush();policy.audit(principal,workspaceId,"DELETE","Room",id);
    }
    private Room find(long workspaceId,long id) {return rooms.findByIdAndWorkspaceId(id,workspaceId).orElseThrow(() -> missing("Room"));}
    private Building building(long workspaceId,long id) {return buildings.findByIdAndWorkspaceId(id,workspaceId).orElseThrow(() -> missing("Building"));}
    private void active(Building b) {if(b.getStatus()!=RecordStatus.ACTIVE) throw conflict("Building is inactive");}
    private void validate(RoomDtos.Write body,Building building) {if(body.floor()>building.getNumberOfFloors()) throw bad("Room floor exceeds the building's floor count");}
    private void apply(Room r,RoomDtos.Write body) {r.update(code(body.roomCode()),body.name().strip(),body.floor(),body.area(),body.monthlyRent(),body.status(),description(body.description()));}
}
