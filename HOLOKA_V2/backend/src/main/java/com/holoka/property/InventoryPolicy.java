package com.holoka.property;

import com.holoka.audit.*;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.error.BusinessException;
import com.holoka.workspace.*;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor
public class InventoryPolicy {
    private final WorkspaceAccess access;
    private final PropertyRepository properties;
    private final AuditRepository audit;
    private final org.springframework.context.ApplicationEventPublisher events;
    public Membership operator(AuthPrincipal principal,long workspaceId) {
        // STAFF gets access through assigned work in a later module, never workspace-wide by default.
        return access.require(principal,workspaceId,Role.OWNER,Role.MANAGER);
    }
    public void owner(AuthPrincipal principal,long workspaceId) { access.require(principal,workspaceId,Role.OWNER); }
    public Property property(long workspaceId,long id) {
        return properties.findByIdAndWorkspaceId(id,workspaceId).orElseThrow(() -> missing("Property"));
    }
    public Property lockProperty(long workspaceId,long id) {
        return properties.lock(id,workspaceId).orElseThrow(() -> missing("Property"));
    }
    public void active(Property p) { if (p.getStatus()!=RecordStatus.ACTIVE) throw conflict("Property is inactive"); }
    public void audit(AuthPrincipal principal,long workspaceId,String action,String entity,long id) {
        audit.save(new AuditLog(workspaceId,principal.userId(),action,entity,Long.toString(id),action+" "+entity));
        events.publishEvent(new com.holoka.notification.OperationalChange(workspaceId,entity));
    }
    public static void version(Long requested,long actual) {
        if (requested==null) throw bad("Version is required when updating or deleting a record");
        if (requested!=actual) throw conflict("Record changed; reload it before saving");
    }
    public static void creating(Long version) { if (version!=null) throw bad("Do not supply version when creating a record"); }
    public static String code(String value) { return value.toUpperCase(Locale.ROOT); }
    public static String description(String value) { return value==null ? null : value.strip(); }
    public static BusinessException missing(String name) { return new BusinessException(HttpStatus.NOT_FOUND,name+" not found"); }
    public static BusinessException conflict(String message) { return new BusinessException(HttpStatus.CONFLICT,message); }
    public static BusinessException bad(String message) { return new BusinessException(HttpStatus.BAD_REQUEST,message); }
}
