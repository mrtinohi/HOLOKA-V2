package com.holoka.building;

import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.property.*;
import com.holoka.room.*;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class BuildingService {
    private final InventoryPolicy policy;
    private final BuildingRepository buildings;
    private final RoomRepository rooms;
    public PageResponse<BuildingDtos.View> list(AuthPrincipal principal,long workspaceId,String search,Long propertyId,RecordStatus status,int page,int size,String sort) {
        policy.operator(principal,workspaceId);if(propertyId!=null) policy.property(workspaceId,propertyId);
        var spec=ListQuery.<Building>scope(workspaceId).and(ListQuery.search(search,"name","code"))
            .and(ListQuery.equal("propertyId",propertyId)).and(ListQuery.equal("status",status));
        return PageResponse.from(buildings.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","name","code","numberOfFloors","status","createdAt","updatedAt"))),BuildingDtos.View::of);
    }
    public BuildingDtos.View get(AuthPrincipal principal,long workspaceId,long id) {
        policy.operator(principal,workspaceId);return BuildingDtos.View.of(find(workspaceId,id));
    }
    @Transactional
    public BuildingDtos.View create(AuthPrincipal principal,long workspaceId,BuildingDtos.Write body) {
        policy.operator(principal,workspaceId);creating(body.version());var property=policy.lockProperty(workspaceId,body.propertyId());policy.active(property);
        var building=new Building(workspaceId,property.getId());apply(building,body);buildings.saveAndFlush(building);
        policy.audit(principal,workspaceId,"CREATE","Building",building.getId());return BuildingDtos.View.of(building);
    }
    @Transactional
    public BuildingDtos.View update(AuthPrincipal principal,long workspaceId,long id,BuildingDtos.Write body) {
        policy.operator(principal,workspaceId);long parent=buildings.parentId(id,workspaceId).orElseThrow(() -> missing("Building"));
        var property=policy.lockProperty(workspaceId,parent);var building=find(workspaceId,id);version(body.version(),building.getVersion());
        if (body.propertyId()!=parent) throw bad("A building cannot be moved to a different property");
        if (body.status()==RecordStatus.ACTIVE) policy.active(property);
        if (body.status()==RecordStatus.INACTIVE && rooms.existsByWorkspaceIdAndBuildingIdAndStatusNot(workspaceId,id,RoomStatus.INACTIVE))
            throw conflict("Deactivate rooms before deactivating the building");
        if (rooms.existsByWorkspaceIdAndBuildingIdAndFloorGreaterThan(workspaceId,id,body.numberOfFloors()))
            throw conflict("Floor count cannot be below an existing room's floor");
        apply(building,body);buildings.flush();policy.audit(principal,workspaceId,"UPDATE","Building",id);return BuildingDtos.View.of(building);
    }
    @Transactional
    public void delete(AuthPrincipal principal,long workspaceId,long id,long requestedVersion) {
        policy.operator(principal,workspaceId);long parent=buildings.parentId(id,workspaceId).orElseThrow(() -> missing("Building"));
        policy.lockProperty(workspaceId,parent);var building=find(workspaceId,id);version(requestedVersion,building.getVersion());
        if (rooms.existsByWorkspaceIdAndBuildingId(workspaceId,id)) throw conflict("Building has rooms; deactivate it instead");
        buildings.delete(building);buildings.flush();policy.audit(principal,workspaceId,"DELETE","Building",id);
    }
    private Building find(long workspaceId,long id) { return buildings.findByIdAndWorkspaceId(id,workspaceId).orElseThrow(() -> missing("Building")); }
    private void apply(Building b,BuildingDtos.Write body) { b.update(body.name().strip(),code(body.code()),description(body.description()),body.numberOfFloors(),body.status()); }
}
