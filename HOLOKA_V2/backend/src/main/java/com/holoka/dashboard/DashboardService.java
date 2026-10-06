package com.holoka.dashboard;

import com.holoka.auth.AuthPrincipal;
import com.holoka.workspace.Role;
import com.holoka.workspace.WorkspaceAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final DashboardRepository repository;
    private final WorkspaceAccess access;

    public DashboardDtos.Overview getOverview(AuthPrincipal p, long workspace) {
        var m = access.require(p, workspace, Role.OWNER, Role.MANAGER, Role.STAFF);
        var scope = new MapSqlParameterSource()
            .addValue("workspace", workspace)
            .addValue("user", p.userId())
            .addValue("operator", m.getRole() == Role.STAFF ? 0 : 1);

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDate next30Days = today.plusDays(30);
        LocalDate monthStart = today.withDayOfMonth(1);
        LocalDate monthEnd = today.withDayOfMonth(today.lengthOfMonth());

        return repository.getOverview(scope, today, next30Days, monthStart, monthEnd);
    }
}
