package com.holoka.tenant;

import com.holoka.property.RecordStatus;
import jakarta.validation.constraints.*;
import java.time.*;

public final class TenantDtos {
    private TenantDtos() {}
    public record Write(@NotBlank @Size(max=160) String fullName,
        @NotBlank @Pattern(regexp="[+0-9() .-]{6,30}") String phone,
        @Email @Size(max=254) String email, @Pattern(regexp="[A-Za-z0-9.-]{1,40}") String identityNumber,
        LocalDate dateOfBirth, @Size(max=500) String address, @Size(max=250) String emergencyContact,
        @NotNull RecordStatus status, @PositiveOrZero Long version) {}
    public record Summary(long id,String fullName,String phone,String email,RecordStatus status,long version) {
        public static Summary of(Tenant t) { return new Summary(t.getId(),t.getFullName(),t.getPhone(),t.getEmail(),t.getStatus(),t.getVersion()); }
    }
    public record View(long id,long workspaceId,String fullName,String phone,String email,String identityNumber,LocalDate dateOfBirth,
        String address,String emergencyContact,RecordStatus status,long version,LocalDateTime createdAt,LocalDateTime updatedAt) {
        public static View of(Tenant t) { return new View(t.getId(),t.getWorkspaceId(),t.getFullName(),t.getPhone(),t.getEmail(),t.getIdentityNumber(),t.getDateOfBirth(),t.getAddress(),t.getEmergencyContact(),t.getStatus(),t.getVersion(),t.getCreatedAt(),t.getUpdatedAt()); }
    }
}
