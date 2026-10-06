package com.holoka.tenant;

import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.contract.*;
import com.holoka.property.*;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class TenantService {
    private final TenantRepository tenants;
    private final ContractRepository contracts;
    private final InventoryPolicy policy;
    private final LeaseCalendar calendar;
    public PageResponse<TenantDtos.Summary> list(AuthPrincipal principal,long workspace,String search,RecordStatus status,int page,int size,String sort) {
        policy.operator(principal,workspace);
        var spec=ListQuery.<Tenant>scope(workspace).and(ListQuery.search(search,"fullName","phone","email")).and(ListQuery.equal("status",status));
        return PageResponse.from(tenants.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","fullName","status","createdAt","updatedAt"))),TenantDtos.Summary::of);
    }
    public TenantDtos.View get(AuthPrincipal principal,long workspace,long id) {policy.operator(principal,workspace);return TenantDtos.View.of(find(workspace,id));}
    @Transactional
    public TenantDtos.View create(AuthPrincipal principal,long workspace,TenantDtos.Write body) {
        policy.operator(principal,workspace);creating(body.version());validate(workspace,body);
        var tenant=new Tenant(workspace);apply(tenant,body);tenants.saveAndFlush(tenant);
        policy.audit(principal,workspace,"CREATE","Tenant",tenant.getId());return TenantDtos.View.of(tenant);
    }
    @Transactional
    public TenantDtos.View update(AuthPrincipal principal,long workspace,long id,TenantDtos.Write body) {
        policy.operator(principal,workspace);var tenant=tenants.lock(id,workspace).orElseThrow(() -> missing("Tenant"));version(body.version(),tenant.getVersion());validate(workspace,body);
        if(body.status()==RecordStatus.INACTIVE && contracts.existsByWorkspaceIdAndTenantIdAndStatus(workspace,id,ContractStatus.ACTIVE))
            throw conflict("Terminate active contracts before deactivating the tenant");
        apply(tenant,body);tenants.flush();policy.audit(principal,workspace,"UPDATE","Tenant",id);return TenantDtos.View.of(tenant);
    }
    @Transactional
    public void delete(AuthPrincipal principal,long workspace,long id,long requestedVersion) {
        policy.operator(principal,workspace);var tenant=tenants.lock(id,workspace).orElseThrow(() -> missing("Tenant"));version(requestedVersion,tenant.getVersion());
        if(contracts.existsByWorkspaceIdAndTenantId(workspace,id)) throw conflict("Tenant has rental history; deactivate instead");
        tenants.delete(tenant);tenants.flush();policy.audit(principal,workspace,"DELETE","Tenant",id);
    }
    private Tenant find(long workspace,long id) {return tenants.findByIdAndWorkspaceId(id,workspace).orElseThrow(() -> missing("Tenant"));}
    private void validate(long workspace,TenantDtos.Write body) {
        if(body.dateOfBirth()!=null && body.dateOfBirth().isAfter(calendar.today(workspace))) throw bad("Date of birth cannot be in the future");
    }
    private String optional(String value) {return value==null || value.isBlank()?null:value.strip();}
    private void apply(Tenant tenant,TenantDtos.Write body) {
        String email=optional(body.email());String identity=optional(body.identityNumber());
        tenant.update(body.fullName().strip(),body.phone().strip(),email==null?null:email.toLowerCase(Locale.ROOT),identity==null?null:identity.toUpperCase(Locale.ROOT),body.dateOfBirth(),optional(body.address()),optional(body.emergencyContact()),body.status());
    }
}
