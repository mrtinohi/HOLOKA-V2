package com.holoka.payment;
import com.holoka.invoice.InvoiceDtos;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.*;
public final class PaymentDtos {
    private PaymentDtos(){}
    public record Write(@NotBlank @Pattern(regexp="[A-Za-z0-9_-]{1,40}") String paymentCode,
        @NotNull @Positive Long invoiceId,@NotNull @PositiveOrZero Long invoiceVersion,
        @NotNull @DecimalMin(value="0",inclusive=false) @Digits(integer=17,fraction=2) BigDecimal amount,
        @NotNull PaymentMethod paymentMethod,@NotNull LocalDate paymentDate,
        @Size(max=200) String reference,@Size(max=1000) String note){}
    public record Void(@NotNull @PositiveOrZero Long version,@NotNull @PositiveOrZero Long invoiceVersion,
        @NotBlank @Size(max=500) String reason){}
    public record Result(View payment,InvoiceDtos.View invoice){}
    public record View(long id,long workspaceId,long invoiceId,String paymentCode,BigDecimal amount,PaymentMethod paymentMethod,
        LocalDate paymentDate,PaymentStatus status,String reference,String note,String voidReason,long version,LocalDateTime createdAt,LocalDateTime updatedAt) {
        public static View of(Payment p){return new View(p.getId(),p.getWorkspaceId(),p.getInvoiceId(),p.getPaymentCode(),p.getAmount(),p.getPaymentMethod(),p.getPaymentDate(),p.getStatus(),p.getReference(),p.getNote(),p.getVoidReason(),p.getVersion(),p.getCreatedAt(),p.getUpdatedAt());}
    }
}
