package com.holoka.notification;
import com.holoka.contract.LeaseCalendar;
import java.sql.Timestamp;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;

@Service @RequiredArgsConstructor
public class AlertEvaluator {
    private final NamedParameterJdbcTemplate jdbc;
    private final AlertParameters parameters;
    private final LeaseCalendar calendar;
    // Serializes generators across application instances; business writes finish before event evaluation.
    @Transactional(propagation=Propagation.REQUIRES_NEW)
    public void evaluate(long workspace){
        var lock=new MapSqlParameterSource("workspace",workspace);
        var enabled=jdbc.query("SELECT enabled FROM dbo.workspaces WITH (UPDLOCK,HOLDLOCK) WHERE id=:workspace",lock,(rs,n)->rs.getBoolean(1));
        if(enabled.isEmpty() || !enabled.getFirst())return;
        var p=parameters.forWorkspace(workspace).addValue("generation",UUID.randomUUID().toString()).addValue("now",Timestamp.valueOf(calendar.now()));
        long offset=0;
        while(true){
            p.addValue("offset",offset);
            var candidates=jdbc.queryForList("SELECT a.* FROM ("+AlertQueries.CANDIDATES+") a ORDER BY a.[rule],a.source_id OFFSET :offset ROWS FETCH NEXT 100 ROWS ONLY",p);
            for(var candidate:candidates){
                var values=new MapSqlParameterSource(p.getValues());candidate.forEach(values::addValue);
                jdbc.update(UPDATE,values);jdbc.update(INSERT,values);
            }
            if(candidates.size()<100)break;offset+=100;
        }
        jdbc.update("UPDATE dbo.notifications SET active=0,resolved_at=:now,updated_at=:now WHERE workspace_id=:workspace AND active=1 AND last_seen<>CONVERT(UNIQUEIDENTIFIER,:generation)",p);
    }
    private static final String RECIPIENT="""
        m.workspace_id=:workspace AND m.enabled=1 AND u.enabled=1 AND
        (m.role_code IN ('OWNER','MANAGER') OR (m.role_code='STAFF' AND :rule IN ('HIGH_MAINTENANCE','TASK_OVERDUE') AND m.user_id=:assigned_user_id))
        """;
    private static final String UPDATE="""
        UPDATE n SET
          is_read=CASE WHEN n.active=0 OR n.category<>:category OR n.message<>:message THEN 0 ELSE n.is_read END,
          updated_at=CASE WHEN n.active=0 OR n.category<>:category OR n.message<>:message THEN :now ELSE n.updated_at END,
          title=:title,message=:message,category=:category,active=1,resolved_at=NULL,last_seen=CONVERT(UNIQUEIDENTIFIER,:generation)
        FROM dbo.notifications n JOIN dbo.memberships m ON m.workspace_id=n.workspace_id AND m.user_id=n.user_id
          JOIN dbo.app_users u ON u.id=m.user_id
        WHERE n.workspace_id=:workspace AND n.[rule]=:rule AND n.source_id=:source_id AND n.window_key=:window_key AND
        """+RECIPIENT;
    private static final String INSERT="""
        INSERT INTO dbo.notifications(workspace_id,user_id,property_id,[rule],type,source_id,window_key,title,message,category,is_read,active,created_at,updated_at,resolved_at,last_seen)
        SELECT :workspace,m.user_id,:property_id,:rule,:type,:source_id,:window_key,:title,:message,:category,0,1,:now,:now,NULL,CONVERT(UNIQUEIDENTIFIER,:generation)
        FROM dbo.memberships m JOIN dbo.app_users u ON u.id=m.user_id WHERE
        """+RECIPIENT+"""
        AND NOT EXISTS(SELECT 1 FROM dbo.notifications n WHERE n.workspace_id=:workspace AND n.user_id=m.user_id AND n.[rule]=:rule AND n.source_id=:source_id AND n.window_key=:window_key)
        """;
}
