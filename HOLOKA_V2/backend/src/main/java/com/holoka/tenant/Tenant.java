package com.holoka.tenant;

import com.holoka.common.persistence.TimedEntity;
import com.holoka.property.RecordStatus;
import jakarta.persistence.*;
import java.time.LocalDate;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name="tenants",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Tenant extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    @Nationalized @Column(nullable=false,length=160) private String fullName;
    @Column(nullable=false,length=30) private String phone;
    @Nationalized @Column(length=254) private String email;
    @Column(length=40) private String identityNumber;
    private LocalDate dateOfBirth;
    @Nationalized @Column(length=500) private String address;
    @Nationalized @Column(length=250) private String emergencyContact;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private RecordStatus status;
    public Tenant(long workspaceId) { this.workspaceId=workspaceId; }
    public void update(String name,String phone,String email,String identity,LocalDate birth,String address,String emergency,RecordStatus status) {
        fullName=name;this.phone=phone;this.email=email;identityNumber=identity;dateOfBirth=birth;
        this.address=address;emergencyContact=emergency;this.status=status;
    }
}
