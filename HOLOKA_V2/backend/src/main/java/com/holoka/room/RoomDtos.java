package com.holoka.room;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class RoomDtos {
    private RoomDtos() {}
    public record Write(@NotNull @Positive Long buildingId,
        @NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String roomCode,
        @NotBlank @Size(max=160) String name, @NotNull @Min(0) @Max(300) Integer floor,
        @NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=8,fraction=2) BigDecimal area,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal monthlyRent,
        @NotNull RoomStatus status, @Size(max=4000) String description, @PositiveOrZero Long version) {}
    public record View(long id,long workspaceId,long propertyId,long buildingId,String roomCode,String name,int floor,
        BigDecimal area,BigDecimal monthlyRent,RoomStatus status,String description,LocalDateTime availableSince,long version,LocalDateTime createdAt,LocalDateTime updatedAt) {
        public static View of(Room r) { return new View(r.getId(),r.getWorkspaceId(),r.getPropertyId(),r.getBuildingId(),r.getRoomCode(),r.getName(),r.getFloor(),r.getArea(),r.getMonthlyRent(),r.getStatus(),r.getDescription(),r.getAvailableSince(),r.getVersion(),r.getCreatedAt(),r.getUpdatedAt()); }
    }
}
