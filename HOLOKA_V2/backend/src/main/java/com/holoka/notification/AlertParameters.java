package com.holoka.notification;
import com.holoka.contract.LeaseCalendar;
import com.holoka.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Component;
import static com.holoka.property.InventoryPolicy.missing;
@Component @RequiredArgsConstructor
public class AlertParameters {
    private final LeaseCalendar calendar;
    private final WorkspaceRepository workspaces;
    public MapSqlParameterSource forWorkspace(long workspace){
        var w=workspaces.findById(workspace).orElseThrow(() -> missing("Workspace"));var today=calendar.today(workspace);
        return new MapSqlParameterSource().addValue("workspace",workspace).addValue("today",java.sql.Date.valueOf(today))
            .addValue("soon",java.sql.Date.valueOf(today.plusDays(7))).addValue("horizon",java.sql.Date.valueOf(today.plusDays(30)))
            .addValue("vacancyDays",w.getVacancyAlertDays()).addValue("vacancyCutoff",java.sql.Timestamp.valueOf(calendar.startOfDayUtc(workspace,today.minusDays(w.getVacancyAlertDays()))));
    }
}
