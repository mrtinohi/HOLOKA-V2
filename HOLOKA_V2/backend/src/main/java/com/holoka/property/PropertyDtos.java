package com.holoka.property;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public final class PropertyDtos {
    private PropertyDtos() {}
    public record Write(@NotBlank @Size(max=160) String name,
        @NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String code,
        @NotBlank @Size(max=500) String address, @Size(max=4000) String description,
        @NotNull PropertyType propertyType, @NotNull RecordStatus status,
        @NotNull @Positive Long ownerUserId, @PositiveOrZero Long version) {}
    public record View(long id, long workspaceId, String name, String code, String address, String description,
        PropertyType propertyType, RecordStatus status, long ownerUserId, long version, LocalDateTime createdAt, LocalDateTime updatedAt) {
        public static View of(Property p) { return new View(p.getId(),p.getWorkspaceId(),p.getName(),p.getCode(),p.getAddress(),p.getDescription(),p.getPropertyType(),p.getStatus(),p.getOwnerUserId(),p.getVersion(),p.getCreatedAt(),p.getUpdatedAt()); }
    }
}
