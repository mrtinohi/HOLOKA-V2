package com.holoka.property;

import com.holoka.common.persistence.TimedEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name="properties", schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Property extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    @Column(nullable=false) private long ownerUserId;
    @Nationalized @Column(nullable=false,length=160) private String name;
    @Column(nullable=false,length=40) private String code;
    @Nationalized @Column(nullable=false,length=500) private String address;
    @Nationalized @Column(length=4000) private String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=30) private PropertyType propertyType;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private RecordStatus status;
    public Property(long workspaceId) { this.workspaceId=workspaceId; }
    public void update(String name, String code, String address, String description, PropertyType type, RecordStatus status, long ownerUserId) {
        this.name=name; this.code=code; this.address=address; this.description=description;
        propertyType=type; this.status=status; this.ownerUserId=ownerUserId;
    }
}
