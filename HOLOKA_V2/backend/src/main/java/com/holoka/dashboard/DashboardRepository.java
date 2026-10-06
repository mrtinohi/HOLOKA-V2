package com.holoka.dashboard;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;

@Repository
@RequiredArgsConstructor
public class DashboardRepository {

    private final NamedParameterJdbcTemplate jdbc;

    public DashboardDtos.Overview getOverview(MapSqlParameterSource scope, LocalDate today, LocalDate next30Days, LocalDate monthStart, LocalDate monthEnd) {
        scope.addValue("today", today)
             .addValue("next30Days", next30Days)
             .addValue("monthStart", monthStart)
             .addValue("monthEnd", monthEnd);

        String sql = """
            SELECT
                (SELECT COUNT(*) FROM dbo.properties WHERE workspace_id=:workspace) AS totalProperties,
                (SELECT COUNT(*) FROM dbo.buildings WHERE workspace_id=:workspace) AS totalBuildings,
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace) AS totalRooms,
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace AND status='OCCUPIED') AS occupiedRooms,
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace AND status='AVAILABLE') AS availableRooms,
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace AND status='MAINTENANCE') AS maintenanceRooms,
                
                (SELECT COALESCE(SUM(total_amount), 0) FROM dbo.invoices 
                 WHERE workspace_id=:workspace AND billing_month >= :monthStart AND billing_month <= :monthEnd) AS monthlyRevenue,
                 
                (SELECT COALESCE(SUM(actual_cost), 0) FROM dbo.maintenance_requests 
                 WHERE workspace_id=:workspace AND completed_at >= :monthStart AND completed_at <= :monthEnd) AS monthlyExpense,
                 
                (SELECT COALESCE(SUM(total_amount - (SELECT COALESCE(SUM(amount), 0) FROM dbo.payments p WHERE p.invoice_id = i.id AND p.status='COMPLETED')), 0) 
                 FROM dbo.invoices i WHERE i.workspace_id=:workspace AND i.status IN ('ISSUED', 'PARTIALLY_PAID')) AS outstandingPayments,
                 
                (SELECT COUNT(*) FROM dbo.contracts WHERE workspace_id=:workspace AND status='ACTIVE') AS activeContracts,
                
                (SELECT COUNT(*) FROM dbo.contracts WHERE workspace_id=:workspace AND status='ACTIVE' AND end_date BETWEEN :today AND :next30Days) AS contractsExpiringSoon,
                
                (SELECT COUNT(*) FROM dbo.maintenance_requests WHERE workspace_id=:workspace AND status IN ('OPEN', 'IN_PROGRESS', 'WAITING')) AS openMaintenance,
                
                (SELECT COUNT(*) FROM dbo.tasks WHERE workspace_id=:workspace AND status IN ('TODO', 'IN_PROGRESS') AND deleted=0) AS pendingTasks
        """;

        return jdbc.queryForObject(sql, scope, this::mapOverview);
    }

    private DashboardDtos.Overview mapOverview(ResultSet rs, int rowNum) throws SQLException {
        long totalRooms = rs.getLong("totalRooms");
        long occupiedRooms = rs.getLong("occupiedRooms");
        double occupancyRate = totalRooms > 0 ? (double) occupiedRooms / totalRooms * 100 : 0.0;

        return new DashboardDtos.Overview(
            rs.getLong("totalProperties"),
            rs.getLong("totalBuildings"),
            totalRooms,
            occupiedRooms,
            rs.getLong("availableRooms"),
            rs.getLong("maintenanceRooms"),
            Math.round(occupancyRate * 100.0) / 100.0,
            rs.getBigDecimal("monthlyRevenue"),
            rs.getBigDecimal("monthlyExpense"),
            rs.getBigDecimal("outstandingPayments"),
            rs.getLong("activeContracts"),
            rs.getLong("contractsExpiringSoon"),
            rs.getLong("openMaintenance"),
            rs.getLong("pendingTasks")
        );
    }
}
