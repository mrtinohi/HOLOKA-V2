package com.holoka.contract;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;

public final class ContractDtos {
    private ContractDtos() {}
    public record Write(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String contractCode,
        @NotNull @Positive Long tenantId,@NotNull @Positive Long roomId,
        @NotNull LocalDate startDate,@NotNull LocalDate endDate,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal monthlyRent,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal deposit,
        @NotNull ContractStatus status,@Size(max=4000) String terms,@PositiveOrZero Long version) {}
    public record Transition(@NotNull @PositiveOrZero Long version) {}
    public record View(long id,long workspaceId,long propertyId,String contractCode,long tenantId,long roomId,
        LocalDate startDate,LocalDate endDate,BigDecimal monthlyRent,BigDecimal deposit,ContractStatus status,String terms,
        long version,LocalDateTime createdAt,LocalDateTime updatedAt) {
        public static View of(Contract c) { return new View(c.getId(),c.getWorkspaceId(),c.getPropertyId(),c.getContractCode(),c.getTenantId(),c.getRoomId(),c.getStartDate(),c.getEndDate(),c.getMonthlyRent(),c.getDeposit(),c.getStatus(),c.getTerms(),c.getVersion(),c.getCreatedAt(),c.getUpdatedAt()); }
    }
}
