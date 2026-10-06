package com.holoka.contract;

import com.holoka.common.persistence.TimedEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name="contracts",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Contract extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    @Column(nullable=false) private long propertyId;
    @Column(nullable=false) private long tenantId;
    @Column(nullable=false) private long roomId;
    @Column(nullable=false,length=40) private String contractCode;
    @Column(nullable=false) private LocalDate startDate;
    @Column(nullable=false) private LocalDate endDate;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal monthlyRent;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal deposit;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private ContractStatus status=ContractStatus.DRAFT;
    @Nationalized @Column(length=4000) private String terms;
    public Contract(long workspace,long property,long tenant,long room) { workspaceId=workspace;propertyId=property;tenantId=tenant;roomId=room; }
    public void edit(String code,LocalDate start,LocalDate end,BigDecimal rent,BigDecimal deposit,String terms) {
        contractCode=code;startDate=start;endDate=end;monthlyRent=rent;this.deposit=deposit;this.terms=terms;
    }
    public void activate() { status=ContractStatus.ACTIVE; }
    public void expire() { status=ContractStatus.EXPIRED; }
    public void terminate() { status=ContractStatus.TERMINATED; }
}
