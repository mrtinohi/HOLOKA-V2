package com.holoka.maintenance;
import com.holoka.work.Priority;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
public final class MaintenanceDtos {
    private MaintenanceDtos(){}
    public record Create(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String requestCode,
        @NotNull @Positive Long propertyId,@Positive Long buildingId,@Positive Long roomId,@Positive Long tenantId,
        @NotBlank @Size(max=200) String title,@Size(max=4000) String description,@NotNull Priority priority,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal estimatedCost){}
    public record Edit(@NotNull @PositiveOrZero Long version,@NotBlank @Size(max=200) String title,@Size(max=4000) String description,@NotNull Priority priority){}
    public record Costs(@NotNull @PositiveOrZero Long version,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal estimatedCost,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal actualCost,@NotBlank @Size(max=1000) String note){}
    public record Transition(@NotNull @PositiveOrZero Long version,@NotNull MaintenanceStatus status,@Size(max=1000) String note){}
    public record View(long id,long workspaceId,long propertyId,Long buildingId,Long roomId,Long tenantId,String requestCode,String title,String description,
        Priority priority,MaintenanceStatus status,Long assignedUserId,BigDecimal estimatedCost,BigDecimal actualCost,
        LocalDateTime reportedAt,LocalDateTime completedAt,long version,LocalDateTime createdAt,LocalDateTime updatedAt){
        public static View of(MaintenanceRequest m){return new View(m.getId(),m.getWorkspaceId(),m.getPropertyId(),m.getBuildingId(),m.getRoomId(),m.getTenantId(),m.getRequestCode(),m.getTitle(),m.getDescription(),m.getPriority(),m.getStatus(),m.getAssignedUserId(),m.getEstimatedCost(),m.getActualCost(),m.getReportedAt(),m.getCompletedAt(),m.getVersion(),m.getCreatedAt(),m.getUpdatedAt());}
    }
}
