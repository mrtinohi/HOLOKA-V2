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
    public record Revenue(String month, BigDecimal amount) {}
    public record Occupancy(long propertyId, String name, long totalRooms, long occupiedRooms, long availableRooms, long rentableRooms) {}
    public record StatusCount(String status, long count) {}
    public record PaymentBalance(BigDecimal paid, BigDecimal outstanding) {}
    public record Charts(List<Revenue> revenue, List<Occupancy> occupancy, List<StatusCount> maintenance, PaymentBalance payments) {}
}
