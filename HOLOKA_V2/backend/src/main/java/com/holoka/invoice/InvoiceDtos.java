package com.holoka.invoice;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
public final class InvoiceDtos {
    private InvoiceDtos(){}
    public record Write(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String invoiceCode,
        @NotNull @Positive Long contractId,
        @NotBlank @Pattern(regexp="[0-9]{4}-(0[1-9]|1[0-2])") String billingMonth,
        @NotNull LocalDate dueDate,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal rentAmount,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal electricityAmount,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal waterAmount,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal serviceAmount,
        @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal otherAmount,
        @PositiveOrZero Long version){}
    public record Transition(@NotNull @PositiveOrZero Long version){}
    public record View(long id,long workspaceId,long propertyId,long tenantId,long roomId,long contractId,String invoiceCode,
        String billingMonth,LocalDate dueDate,BigDecimal rentAmount,BigDecimal electricityAmount,BigDecimal waterAmount,
        BigDecimal serviceAmount,BigDecimal otherAmount,BigDecimal totalAmount,BigDecimal paidAmount,BigDecimal remainingAmount,
        InvoiceStatus status,long version,LocalDateTime createdAt,LocalDateTime updatedAt) {
        public static View of(Invoice i,LocalDate today){return new View(i.getId(),i.getWorkspaceId(),i.getPropertyId(),i.getTenantId(),i.getRoomId(),i.getContractId(),i.getInvoiceCode(),YearMonth.from(i.getBillingMonth()).toString(),i.getDueDate(),i.getRentAmount(),i.getElectricityAmount(),i.getWaterAmount(),i.getServiceAmount(),i.getOtherAmount(),i.getTotalAmount(),i.getPaidAmount(),i.remaining(),i.effectiveStatus(today),i.getVersion(),i.getCreatedAt(),i.getUpdatedAt());}
    }
}
