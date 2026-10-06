package com.holoka.dashboard;

import java.math.BigDecimal;
import java.util.List;

public class DashboardDtos {
    public record Overview(
        long totalProperties,
        long totalBuildings,
        long totalRooms,
        long occupiedRooms,
        long availableRooms,
        long maintenanceRooms,
        double occupancyRate,
        BigDecimal monthlyRevenue,
        BigDecimal monthlyExpense,
        BigDecimal outstandingPayments,
        long activeContracts,
        long contractsExpiringSoon,
        long openMaintenance,
        long pendingTasks
    ) {}
}
