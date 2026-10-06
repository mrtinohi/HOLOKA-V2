package com.holoka.notification;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.PageResponse;
import com.holoka.workspace.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.missing;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class NotificationService {
    private final NotificationRepository repository;
    private final WorkspaceAccess access;
    private final AlertParameters parameters;
    private MapSqlParameterSource scope(AuthPrincipal p,long workspace){
        var m=access.require(p,workspace,Role.OWNER,Role.MANAGER,Role.STAFF);
        return new MapSqlParameterSource().addValue("workspace",workspace).addValue("user",p.userId()).addValue("operator",m.getRole()==Role.STAFF?0:1);
    }
    public PageResponse<NotificationDtos.View> list(AuthPrincipal p,long workspace,Boolean read,Boolean active,NotificationType type,AlertCategory category,String search,int page,int size,String sort){return repository.list(scope(p,workspace),read,active,type,category,search,page,size,sort);}
    public NotificationDtos.View get(AuthPrincipal p,long workspace,long id){return repository.get(scope(p,workspace),id).orElseThrow(() -> missing("Notification"));}
    public NotificationDtos.Unread unread(AuthPrincipal p,long workspace){return new NotificationDtos.Unread(repository.unread(scope(p,workspace)));}
    @Transactional public NotificationDtos.View markRead(AuthPrincipal p,long workspace,long id){
        var s=scope(p,workspace);repository.get(s,id).orElseThrow(() -> missing("Notification"));repository.markRead(s,id);
        return repository.get(s,id).orElseThrow(() -> missing("Notification"));
    }
    @Transactional public NotificationDtos.Marked markAll(AuthPrincipal p,long workspace){return new NotificationDtos.Marked(repository.markRead(scope(p,workspace),null));}
    public PageResponse<NotificationDtos.Action> actions(AuthPrincipal p,long workspace,Long property,AlertCategory category,AlertRule rule,String search,int page,int size){
        var s=scope(p,workspace);var live=parameters.forWorkspace(workspace);s.addValues(live.getValues());return repository.actions(s,property,category,rule,search,page,size);
    }
}
