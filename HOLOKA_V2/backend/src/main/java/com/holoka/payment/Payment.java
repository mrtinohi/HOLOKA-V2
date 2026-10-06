package com.holoka.payment;
import com.holoka.common.persistence.TimedEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;
import org.hibernate.annotations.Nationalized;
@Entity @Table(name="payments",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Payment extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    @Column(nullable=false) private long invoiceId;
    @Column(nullable=false,length=40) private String paymentCode;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal amount;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private PaymentMethod paymentMethod;
    @Column(nullable=false) private LocalDate paymentDate;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private PaymentStatus status=PaymentStatus.RECORDED;
    @Nationalized @Column(length=200) private String reference;
    @Nationalized @Column(length=1000) private String note;
    @Nationalized @Column(length=500) private String voidReason;
    public Payment(long workspace,long invoice,String code,BigDecimal amount,PaymentMethod method,LocalDate date,String reference,String note) {
        workspaceId=workspace;invoiceId=invoice;paymentCode=code;this.amount=amount;paymentMethod=method;paymentDate=date;this.reference=reference;this.note=note;
    }
    public void voidPayment(String reason){status=PaymentStatus.VOIDED;voidReason=reason;}
}
