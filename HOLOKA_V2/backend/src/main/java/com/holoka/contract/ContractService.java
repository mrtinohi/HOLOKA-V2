package com.holoka.contract;

import com.holoka.auth.AuthPrincipal;
import com.holoka.building.BuildingRepository;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.property.*;
import com.holoka.room.*;
import com.holoka.tenant.TenantRepository;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class ContractService {
    private final ContractRepository contracts;
    private final TenantRepository tenants;
    private final RoomRepository rooms;
    private final BuildingRepository buildings;
    private final InventoryPolicy policy;
    private final LeaseCalendar calendar;
    private final ContractLifecycle lifecycle;

    public PageResponse<ContractDtos.View> list(AuthPrincipal principal,long workspace,String search,Long tenantId,Long roomId,Long propertyId,ContractStatus status,int page,int size,String sort) {
        policy.operator(principal,workspace);
        if(tenantId!=null) tenants.findByIdAndWorkspaceId(tenantId,workspace).orElseThrow(() -> missing("Tenant"));
        if(roomId!=null) {var room=room(workspace,roomId);if(propertyId!=null && room.getPropertyId()!=propertyId) throw bad("Room does not belong to selected property");}
        if(propertyId!=null) policy.property(workspace,propertyId);
        var spec=ListQuery.<Contract>scope(workspace).and(ListQuery.search(search,"contractCode"))
            .and(ListQuery.equal("tenantId",tenantId)).and(ListQuery.equal("roomId",roomId)).and(ListQuery.equal("propertyId",propertyId)).and(ListQuery.equal("status",status));
        return PageResponse.from(contracts.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","contractCode","startDate","endDate","monthlyRent","deposit","status","createdAt","updatedAt"))),ContractDtos.View::of);
    }
    public ContractDtos.View get(AuthPrincipal principal,long workspace,long id) {policy.operator(principal,workspace);return ContractDtos.View.of(find(workspace,id));}
    @Transactional
    public ContractDtos.View create(AuthPrincipal principal,long workspace,ContractDtos.Write body) {
        policy.operator(principal,workspace);creating(body.version());validateDates(body);
        if(body.status()!=ContractStatus.DRAFT && body.status()!=ContractStatus.ACTIVE) throw bad("New contracts must be DRAFT or ACTIVE");
        long parent=rooms.parentPropertyId(body.roomId(),workspace).orElseThrow(() -> missing("Room"));
        policy.lockProperty(workspace,parent);var room=room(workspace,body.roomId());
        var tenant=tenants.lock(body.tenantId(),workspace).orElseThrow(() -> missing("Tenant"));
        if(tenant.getStatus()!=RecordStatus.ACTIVE) throw conflict("Tenant is inactive");
        var contract=new Contract(workspace,parent,tenant.getId(),room.getId());edit(contract,body);
        if(body.status()==ContractStatus.ACTIVE) {lifecycle.reconcileLocked(room);validateActivation(contract,room);contract.activate();}
        contracts.saveAndFlush(contract);
        if(contract.getStatus()==ContractStatus.ACTIVE) lifecycle.reconcileLocked(room);
        policy.audit(principal,workspace,"CREATE","Contract",contract.getId());return ContractDtos.View.of(contract);
    }
    @Transactional
    public ContractDtos.View update(AuthPrincipal principal,long workspace,long id,ContractDtos.Write body) {
        policy.operator(principal,workspace);var contract=locked(workspace,id);version(body.version(),contract.getVersion());validateDates(body);
        if(contract.getStatus()!=ContractStatus.DRAFT || body.status()!=ContractStatus.DRAFT) throw conflict("Only DRAFT contracts can be edited; use lifecycle actions to change status");
        if(body.tenantId()!=contract.getTenantId() || body.roomId()!=contract.getRoomId()) throw bad("Contract parties cannot be changed; replace the draft instead");
        edit(contract,body);contracts.flush();policy.audit(principal,workspace,"UPDATE","Contract",id);return ContractDtos.View.of(contract);
    }
    @Transactional
    public ContractDtos.View activate(AuthPrincipal principal,long workspace,long id,long requestedVersion) {
        policy.operator(principal,workspace);var contract=locked(workspace,id);version(requestedVersion,contract.getVersion());
        if(contract.getStatus()!=ContractStatus.DRAFT) throw conflict("Only DRAFT contracts can be activated");
        var tenant=tenants.lock(contract.getTenantId(),workspace).orElseThrow(() -> missing("Tenant"));
        if(tenant.getStatus()!=RecordStatus.ACTIVE) throw conflict("Tenant is inactive");
        var room=room(workspace,contract.getRoomId());lifecycle.reconcileLocked(room);validateActivation(contract,room);
        contract.activate();contracts.flush();lifecycle.reconcileLocked(room);
        policy.audit(principal,workspace,"CONTRACT_CHANGE","Contract",id);return ContractDtos.View.of(contract);
    }
    @Transactional
    public ContractDtos.View terminate(AuthPrincipal principal,long workspace,long id,long requestedVersion) {
        policy.operator(principal,workspace);var contract=locked(workspace,id);var room=room(workspace,contract.getRoomId());
        lifecycle.reconcileLocked(room);version(requestedVersion,contract.getVersion());
        if(contract.getStatus()!=ContractStatus.ACTIVE) throw conflict("Only ACTIVE contracts can be terminated");
        contract.terminate();contracts.flush();lifecycle.reconcileLocked(room);
        policy.audit(principal,workspace,"CONTRACT_CHANGE","Contract",id);return ContractDtos.View.of(contract);
    }
    @Transactional
    public void delete(AuthPrincipal principal,long workspace,long id,long requestedVersion) {
        policy.operator(principal,workspace);var contract=locked(workspace,id);version(requestedVersion,contract.getVersion());
        if(contract.getStatus()!=ContractStatus.DRAFT) throw conflict("Only DRAFT contracts can be deleted; preserve rental history");
        contracts.delete(contract);contracts.flush();policy.audit(principal,workspace,"DELETE","Contract",id);
    }
    private Contract find(long workspace,long id) {return contracts.findByIdAndWorkspaceId(id,workspace).orElseThrow(() -> missing("Contract"));}
    private Contract locked(long workspace,long id) {long parent=contracts.parentId(id,workspace).orElseThrow(() -> missing("Contract"));policy.lockProperty(workspace,parent);return find(workspace,id);}
    private Room room(long workspace,long id) {return rooms.findByIdAndWorkspaceId(id,workspace).orElseThrow(() -> missing("Room"));}
    private void validateDates(ContractDtos.Write body) {if(!body.startDate().isBefore(body.endDate())) throw bad("Start date must be before end date");}
    private void validateActivation(Contract contract,Room room) {
        if(!contract.getEndDate().isAfter(calendar.today(contract.getWorkspaceId()))) throw conflict("Cannot activate a contract that has already ended");
        policy.active(policy.property(contract.getWorkspaceId(),contract.getPropertyId()));
        var building=buildings.findByIdAndWorkspaceId(room.getBuildingId(),contract.getWorkspaceId()).orElseThrow(() -> missing("Building"));
        if(building.getStatus()!=RecordStatus.ACTIVE || room.getStatus()==RoomStatus.INACTIVE || room.getStatus()==RoomStatus.MAINTENANCE)
            throw conflict("Room and its building must be rentable");
        if(contracts.overlaps(contract.getWorkspaceId(),room.getId(),contract.getStartDate(),contract.getEndDate())) throw conflict("Room has an overlapping active contract");
    }
    private void edit(Contract contract,ContractDtos.Write body) {contract.edit(code(body.contractCode()),body.startDate(),body.endDate(),body.monthlyRent(),body.deposit(),description(body.terms()));}
}
