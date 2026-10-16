package com.holoka.dashboard;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

import java.util.ArrayList;
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
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace AND status<>'INACTIVE') AS rentableRooms,
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace AND status='OCCUPIED') AS occupiedRooms,
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace AND status='AVAILABLE') AS availableRooms,
                (SELECT COUNT(*) FROM dbo.rooms WHERE workspace_id=:workspace AND status='MAINTENANCE') AS maintenanceRooms,
                
                (SELECT COALESCE(SUM(amount), 0) FROM dbo.payments 
                 WHERE workspace_id=:workspace AND status='RECORDED' AND payment_date >= :monthStart AND payment_date < :monthEnd) AS monthlyRevenue,
                 
                (SELECT COALESCE(SUM(actual_cost), 0) FROM dbo.maintenance_requests 
                 WHERE workspace_id=:workspace AND status='COMPLETED' AND completed_at >= :expenseStart AND completed_at < :expenseEnd) AS monthlyExpense,
                 
                (SELECT COALESCE(SUM(total_amount - paid_amount), 0) 
                 FROM dbo.invoices i WHERE i.workspace_id=:workspace AND i.status IN ('ISSUED', 'PARTIALLY_PAID')) AS outstandingPayments,
                 
                (SELECT COUNT(*) FROM dbo.contracts WHERE workspace_id=:workspace AND status='ACTIVE') AS activeContracts,
                
                (SELECT COUNT(*) FROM dbo.contracts WHERE workspace_id=:workspace AND status='ACTIVE' AND end_date > :today AND end_date <= :next30Days) AS contractsExpiringSoon,
                
                (SELECT COUNT(*) FROM dbo.maintenance_requests WHERE workspace_id=:workspace AND status IN ('OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING')) AS openMaintenance,
                
                (SELECT COUNT(*) FROM dbo.tasks WHERE workspace_id=:workspace AND status IN ('TODO', 'IN_PROGRESS') AND deleted=0) AS pendingTasks
        """;

        return jdbc.queryForObject(sql, scope, this::mapOverview);
    }

    private DashboardDtos.Overview mapOverview(ResultSet rs, int rowNum) throws SQLException {
        long totalRooms = rs.getLong("totalRooms");
        long occupiedRooms = rs.getLong("occupiedRooms");
        long rentableRooms = rs.getLong("rentableRooms");
        double occupancyRate = rentableRooms > 0 ? (double) occupiedRooms / rentableRooms * 100 : 0.0;

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

    public DashboardDtos.Charts charts(long workspace, LocalDate month) {
        var scope = new MapSqlParameterSource("workspace", workspace)
            .addValue("start", month.minusMonths(11)).addValue("end", month.plusMonths(1));
        var monthly = jdbc.query("""
            SELECT CONVERT(VARCHAR(7),payment_date,126) AS month,SUM(amount) AS amount
            FROM dbo.payments WHERE workspace_id=:workspace AND status='RECORDED'
              AND payment_date>=:start AND payment_date<:end
            GROUP BY CONVERT(VARCHAR(7),payment_date,126)
            """, scope, (rs,n) -> new DashboardDtos.Revenue(rs.getString("month"),rs.getBigDecimal("amount")));
        var revenue = new ArrayList<DashboardDtos.Revenue>();
        for(int i=11;i>=0;i--) {
            String label=month.minusMonths(i).toString().substring(0,7);
            revenue.add(monthly.stream().filter(r -> r.month().equals(label)).findFirst()
                .orElse(new DashboardDtos.Revenue(label,java.math.BigDecimal.ZERO)));
        }
        var occupancy = jdbc.query("""
            SELECT p.id,p.name,COUNT(r.id) AS total,
              COALESCE(SUM(CASE WHEN r.status='OCCUPIED' THEN 1 ELSE 0 END),0) AS occupied,
              COALESCE(SUM(CASE WHEN r.status='AVAILABLE' THEN 1 ELSE 0 END),0) AS available,
              COALESCE(SUM(CASE WHEN r.status<>'INACTIVE' THEN 1 ELSE 0 END),0) AS rentable
            FROM dbo.properties p LEFT JOIN dbo.rooms r ON r.property_id=p.id AND r.workspace_id=p.workspace_id
            WHERE p.workspace_id=:workspace GROUP BY p.id,p.name ORDER BY p.name,p.id
            """, scope, (rs,n) -> new DashboardDtos.Occupancy(rs.getLong("id"),rs.getString("name"),rs.getLong("total"),rs.getLong("occupied"),rs.getLong("available"),rs.getLong("rentable")));
        var maintenance = jdbc.query("SELECT status,COUNT(*) AS count FROM dbo.maintenance_requests WHERE workspace_id=:workspace GROUP BY status",scope,
            (rs,n) -> new DashboardDtos.StatusCount(rs.getString("status"),rs.getLong("count")));
        var payments = jdbc.queryForObject("""
            SELECT COALESCE(SUM(paid_amount),0) AS paid,COALESCE(SUM(total_amount-paid_amount),0) AS outstanding
            FROM dbo.invoices WHERE workspace_id=:workspace AND status NOT IN ('DRAFT','CANCELLED')
            """,scope,(rs,n) -> new DashboardDtos.PaymentBalance(rs.getBigDecimal("paid"),rs.getBigDecimal("outstanding")));
        return new DashboardDtos.Charts(revenue,occupancy,maintenance,payments);
    }
}
