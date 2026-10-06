package com.holoka.invoice;

import com.holoka.common.persistence.TimedEntity;
import com.holoka.contract.Contract;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;

@Entity @Table(name="invoices",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Invoice extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    @Column(nullable=false) private long propertyId;
    @Column(nullable=false) private long tenantId;
    @Column(nullable=false) private long roomId;
    @Column(nullable=false) private long contractId;
    @Column(nullable=false,length=40) private String invoiceCode;
    @Column(nullable=false) private LocalDate billingMonth;
    @Column(nullable=false) private LocalDate dueDate;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal rentAmount;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal electricityAmount;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal waterAmount;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal serviceAmount;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal otherAmount;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal totalAmount;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal paidAmount=BigDecimal.ZERO;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private InvoiceStatus status=InvoiceStatus.DRAFT;
    public Invoice(Contract c) {workspaceId=c.getWorkspaceId();propertyId=c.getPropertyId();tenantId=c.getTenantId();roomId=c.getRoomId();contractId=c.getId();}
    public void edit(String code,LocalDate month,LocalDate due,BigDecimal rent,BigDecimal electricity,BigDecimal water,BigDecimal service,BigDecimal other) {
        invoiceCode=code;billingMonth=month;dueDate=due;rentAmount=rent;electricityAmount=electricity;waterAmount=water;serviceAmount=service;otherAmount=other;
        totalAmount=rent.add(electricity).add(water).add(service).add(other);
    }
    public void issue(){status=InvoiceStatus.ISSUED;}
    public void cancel(){status=InvoiceStatus.CANCELLED;}
    public BigDecimal remaining(){return totalAmount.subtract(paidAmount);}
    public void applyPayment(BigDecimal delta) {
        paidAmount=paidAmount.add(delta);
        status=paidAmount.signum()==0 ? InvoiceStatus.ISSUED : paidAmount.compareTo(totalAmount)==0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID;
    }
    public InvoiceStatus effectiveStatus(LocalDate today) {
        return (status==InvoiceStatus.ISSUED || status==InvoiceStatus.PARTIALLY_PAID) && dueDate.isBefore(today) ? InvoiceStatus.OVERDUE : status;
    }
}
