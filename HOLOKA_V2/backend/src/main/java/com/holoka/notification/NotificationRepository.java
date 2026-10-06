package com.holoka.notification;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import java.sql.*;
import java.time.LocalDateTime;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.*;
import org.springframework.stereotype.Repository;
@Repository @RequiredArgsConstructor
public class NotificationRepository {
    private final NamedParameterJdbcTemplate jdbc;
    public PageResponse<NotificationDtos.View> list(MapSqlParameterSource p,Boolean read,Boolean active,NotificationType type,AlertCategory category,String search,int page,int size,String sort){
        var paging=ListQuery.page(page,size,sort,Set.of("id","createdAt","updatedAt"));
        String where=AlertQueries.INBOX_ACCESS;
        if(read!=null){where+=" AND n.is_read=:read";p.addValue("read",read);}
        if(active!=null){where+=" AND n.active=:active";p.addValue("active",active);}
        if(type!=null){where+=" AND n.type=:type";p.addValue("type",type.name());}
        if(category!=null){where+=" AND n.category=:category";p.addValue("category",category.name());}
        if(search!=null && !search.isBlank()){where+=" AND (n.title LIKE :search ESCAPE '\\' OR n.message LIKE :search ESCAPE '\\')";p.addValue("search",search(search));}
        long count=jdbc.queryForObject("SELECT COUNT_BIG(*) FROM dbo.notifications n WHERE "+where,p,Long.class);
        var order=paging.getSort().iterator().next();String column=Map.of("id","id","createdAt","created_at","updatedAt","updated_at").get(order.getProperty());
        p.addValue("offset",paging.getOffset()).addValue("size",size);
        var rows=jdbc.query("SELECT n.* FROM dbo.notifications n WHERE "+where+" ORDER BY n."+column+" "+order.getDirection().name()+(column.equals("id")?"":",n.id DESC")+" OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY",p,(rs,n)->view(rs));
        return new PageResponse<>(rows,page,size,count,(int)((count+size-1)/size));
    }
    public Optional<NotificationDtos.View> get(MapSqlParameterSource p,long id){p.addValue("id",id);return jdbc.query("SELECT n.* FROM dbo.notifications n WHERE "+AlertQueries.INBOX_ACCESS+" AND n.id=:id",p,(rs,n)->view(rs)).stream().findFirst();}
    public long unread(MapSqlParameterSource p){return jdbc.queryForObject("SELECT COUNT_BIG(*) FROM dbo.notifications n WHERE "+AlertQueries.INBOX_ACCESS+" AND n.is_read=0",p,Long.class);}
    public int markRead(MapSqlParameterSource p,Long id){if(id!=null)p.addValue("id",id);return jdbc.update("UPDATE n SET is_read=1 FROM dbo.notifications n WHERE "+AlertQueries.INBOX_ACCESS+" AND n.is_read=0"+(id==null?"":" AND n.id=:id"),p);}
    public PageResponse<NotificationDtos.Action> actions(MapSqlParameterSource p,Long property,AlertCategory category,AlertRule rule,String search,int page,int size){
        var paging=ListQuery.page(page,size,"id,asc",Set.of("id"));String where=AlertQueries.ACTION_ACCESS;
        if(property!=null){where+=" AND a.property_id=:property";p.addValue("property",property);}
        if(category!=null){where+=" AND a.category=:category";p.addValue("category",category.name());}
        if(rule!=null){where+=" AND a.[rule]=:rule";p.addValue("rule",rule.name());}
        if(search!=null && !search.isBlank()){where+=" AND (a.title LIKE :search ESCAPE '\\' OR a.message LIKE :search ESCAPE '\\')";p.addValue("search",search(search));}
        String from=" FROM ("+AlertQueries.CANDIDATES+") a WHERE "+where;
        long count=jdbc.queryForObject("SELECT COUNT_BIG(*)"+from,p,Long.class);p.addValue("offset",paging.getOffset()).addValue("size",size);
        var rows=jdbc.query("SELECT a.*"+from+" ORDER BY CASE a.category WHEN 'URGENT' THEN 0 WHEN 'NEEDS_ATTENTION' THEN 1 ELSE 2 END,a.due_date,a.[rule],a.source_id OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY",p,(rs,n)->{
            var r=AlertRule.valueOf(rs.getString("rule"));long source=rs.getLong("source_id");var due=rs.getDate("due_date");
            return new NotificationDtos.Action(rs.getLong("property_id"),r,NotificationType.valueOf(rs.getString("type")),source,r.path(source),rs.getString("title"),rs.getString("message"),AlertCategory.valueOf(rs.getString("category")),due==null?null:due.toLocalDate());
        });
        return new PageResponse<>(rows,page,size,count,(int)((count+size-1)/size));
    }
    private static String search(String text){if(text.length()>120)throw com.holoka.property.InventoryPolicy.bad("Search must be at most 120 characters");return "%"+text.strip().replace("\\","\\\\").replace("%","\\%").replace("_","\\_").replace("[","\\[")+"%";}
    private static LocalDateTime time(ResultSet rs,String name)throws SQLException{var t=rs.getTimestamp(name);return t==null?null:t.toLocalDateTime();}
    private static NotificationDtos.View view(ResultSet rs)throws SQLException{
        var rule=AlertRule.valueOf(rs.getString("rule"));long source=rs.getLong("source_id");
        return new NotificationDtos.View(rs.getLong("id"),rs.getLong("workspace_id"),rs.getLong("property_id"),rule,NotificationType.valueOf(rs.getString("type")),source,rule.path(source),rs.getString("title"),rs.getString("message"),AlertCategory.valueOf(rs.getString("category")),rs.getBoolean("is_read"),rs.getBoolean("active"),time(rs,"created_at"),time(rs,"updated_at"),time(rs,"resolved_at"));
    }
}
