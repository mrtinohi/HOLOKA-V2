package com.holoka.building;

import com.holoka.property.RecordStatus;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public final class BuildingDtos {
    private BuildingDtos() {}
    public record Write(@NotNull @Positive Long propertyId, @NotBlank @Size(max=160) String name,
        @NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String code, @Size(max=4000) String description,
        @NotNull @Min(1) @Max(300) Integer numberOfFloors, @NotNull RecordStatus status, @PositiveOrZero Long version) {}
    public record View(long id,long workspaceId,long propertyId,String name,String code,String description,int numberOfFloors,
        RecordStatus status,long version,LocalDateTime createdAt,LocalDateTime updatedAt) {
        public static View of(Building b) { return new View(b.getId(),b.getWorkspaceId(),b.getPropertyId(),b.getName(),b.getCode(),b.getDescription(),b.getNumberOfFloors(),b.getStatus(),b.getVersion(),b.getCreatedAt(),b.getUpdatedAt()); }
    }
}
