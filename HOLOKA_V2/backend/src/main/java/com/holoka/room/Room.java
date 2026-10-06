package com.holoka.room;

import com.holoka.common.persistence.TimedEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name="rooms",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Room extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false) private long workspaceId;
    @Column(nullable=false) private long propertyId;
    @Column(nullable=false) private long buildingId;
    @Column(nullable=false,length=40) private String roomCode;
    @Nationalized @Column(nullable=false,length=160) private String name;
    @Column(nullable=false) private int floor;
    @Column(nullable=false,precision=10,scale=2) private BigDecimal area;
    @Column(nullable=false,precision=19,scale=2) private BigDecimal monthlyRent;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private RoomStatus status;
    @Nationalized @Column(length=4000) private String description;
    @Column(columnDefinition="datetime2(6)") private LocalDateTime availableSince;
    public Room(long workspaceId,long propertyId,long buildingId) { this.workspaceId=workspaceId;this.propertyId=propertyId;this.buildingId=buildingId; }
    /** Called only by the transactional contract lifecycle, under the property's lock. */
    public void reconcileOccupancy(boolean occupied,LocalDateTime vacantAt) {
        if(occupied) {
            if(status==RoomStatus.INACTIVE || status==RoomStatus.MAINTENANCE)
                throw com.holoka.property.InventoryPolicy.conflict("An active contract requires a rentable room");
            status=RoomStatus.OCCUPIED;availableSince=null;
        } else if(status==RoomStatus.OCCUPIED) {
            status=RoomStatus.AVAILABLE;availableSince=vacantAt;
        }
    }
    public void update(String code,String name,int floor,BigDecimal area,BigDecimal rent,RoomStatus status,String description) {
        roomCode=code;this.name=name;this.floor=floor;this.area=area;monthlyRent=rent;this.description=description;
        if (status != this.status) availableSince = status == RoomStatus.AVAILABLE ? utcNow() : null;
        this.status=status;
    }
}
