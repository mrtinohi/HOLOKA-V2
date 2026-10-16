package com.holoka.dashboard;

import com.holoka.auth.AuthPrincipal;
import com.holoka.contract.LeaseCalendar;
import com.holoka.workspace.Role;
import com.holoka.workspace.WorkspaceAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class DashboardService {
    private final DashboardRepository repository;
    private final WorkspaceAccess access;
    private final LeaseCalendar calendar;

    public DashboardDtos.Overview getOverview(AuthPrincipal principal, long workspace) {
        access.require(principal, workspace, Role.OWNER, Role.MANAGER);
        var today = calendar.today(workspace);
        var first = today.withDayOfMonth(1);
        var next = first.plusMonths(1);
        var scope = new MapSqlParameterSource("workspace", workspace)
            .addValue("expenseStart", calendar.startOfDayUtc(workspace, first))
            .addValue("expenseEnd", calendar.startOfDayUtc(workspace, next));
        return repository.getOverview(scope, today, today.plusDays(30), first, next);
    }
    public DashboardDtos.Charts charts(AuthPrincipal principal, long workspace) {
        access.require(principal, workspace, Role.OWNER, Role.MANAGER);
        return repository.charts(workspace, calendar.today(workspace).withDayOfMonth(1));
    }
}
