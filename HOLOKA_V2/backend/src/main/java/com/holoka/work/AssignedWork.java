package com.holoka.work;
import com.holoka.common.persistence.TimedEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.Getter;
import org.hibernate.annotations.Nationalized;

@MappedSuperclass @Getter
public abstract class AssignedWork extends TimedEntity {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) protected Long id;
    @Column(nullable=false) protected long workspaceId;
    @Column(nullable=false) protected long propertyId;
    protected Long roomId;
    protected Long assignedUserId;
    @Nationalized @Column(nullable=false,length=200) protected String title;
    @Nationalized @Column(length=4000) protected String description;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) protected Priority priority;
    @Column(columnDefinition="datetime2(6)") protected LocalDateTime completedAt;
    public void edit(String title,String description,Priority priority){this.title=title.strip();this.description=description;this.priority=priority;}
    public abstract String statusName();
}
