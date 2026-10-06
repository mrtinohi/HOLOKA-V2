package com.holoka.building;

import com.holoka.common.persistence.TimedEntity;
import com.holoka.property.RecordStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name="buildings",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Building extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    @Column(nullable=false) private long propertyId;
    @Nationalized @Column(nullable=false,length=160) private String name;
    @Column(nullable=false,length=40) private String code;
    @Nationalized @Column(length=4000) private String description;
    @Column(nullable=false) private int numberOfFloors;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private RecordStatus status;
    public Building(long workspaceId,long propertyId) { this.workspaceId=workspaceId; this.propertyId=propertyId; }
    public void update(String name,String code,String description,int floors,RecordStatus status) {
        this.name=name;this.code=code;this.description=description;numberOfFloors=floors;this.status=status;
    }
}
