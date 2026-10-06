package com.holoka.property;

import com.holoka.auth.AuthPrincipal;
import com.holoka.building.BuildingRepository;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.workspace.*;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class PropertyService {
    private final InventoryPolicy policy;
    private final PropertyRepository properties;
    private final BuildingRepository buildings;
    private final MembershipRepository memberships;

    public PageResponse<PropertyDtos.View> list(AuthPrincipal principal,long workspaceId,String search,RecordStatus status,PropertyType type,int page,int size,String sort) {
        policy.operator(principal,workspaceId);
        var spec=ListQuery.<Property>scope(workspaceId).and(ListQuery.search(search,"name","code","address"))
            .and(ListQuery.equal("status",status)).and(ListQuery.equal("propertyType",type));
        return PageResponse.from(properties.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","name","code","status","propertyType","createdAt","updatedAt"))),PropertyDtos.View::of);
    }
    public PropertyDtos.View get(AuthPrincipal principal,long workspaceId,long id) {
        policy.operator(principal,workspaceId);return PropertyDtos.View.of(policy.property(workspaceId,id));
    }
    @Transactional
    public PropertyDtos.View create(AuthPrincipal principal,long workspaceId,PropertyDtos.Write body) {
        policy.owner(principal,workspaceId);creating(body.version());validateOwner(workspaceId,body.ownerUserId());
        var property=new Property(workspaceId);apply(property,body);properties.saveAndFlush(property);
        policy.audit(principal,workspaceId,"CREATE","Property",property.getId());return PropertyDtos.View.of(property);
    }
    @Transactional
    public PropertyDtos.View update(AuthPrincipal principal,long workspaceId,long id,PropertyDtos.Write body) {
        var actor=policy.operator(principal,workspaceId);var property=policy.lockProperty(workspaceId,id);version(body.version(),property.getVersion());
        if (property.getOwnerUserId()!=body.ownerUserId() && actor.getRole()!=Role.OWNER) policy.owner(principal,workspaceId);
        validateOwner(workspaceId,body.ownerUserId());
        if (body.status()==RecordStatus.INACTIVE && buildings.existsByWorkspaceIdAndPropertyIdAndStatus(workspaceId,id,RecordStatus.ACTIVE))
            throw conflict("Deactivate active buildings before deactivating the property");
        apply(property,body);properties.flush();policy.audit(principal,workspaceId,"UPDATE","Property",id);return PropertyDtos.View.of(property);
    }
    @Transactional
    public void delete(AuthPrincipal principal,long workspaceId,long id,long requestedVersion) {
        policy.owner(principal,workspaceId);var property=policy.lockProperty(workspaceId,id);version(requestedVersion,property.getVersion());
        if (buildings.existsByWorkspaceIdAndPropertyId(workspaceId,id)) throw conflict("Property has buildings; deactivate it instead");
        properties.delete(property);properties.flush();policy.audit(principal,workspaceId,"DELETE","Property",id);
    }
    private void validateOwner(long workspaceId,long userId) {
        var owner=memberships.activeInWorkspace(userId,workspaceId).orElseThrow(() -> bad("Owner must be an active OWNER in this workspace"));
        if (owner.getRole()!=Role.OWNER || !owner.getUser().isEnabled()) throw bad("Owner must be an active OWNER in this workspace");
    }
    private void apply(Property property,PropertyDtos.Write body) {
        property.update(body.name().strip(),code(body.code()),body.address().strip(),description(body.description()),body.propertyType(),body.status(),body.ownerUserId());
    }
}
