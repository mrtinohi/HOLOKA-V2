package com.holoka.task;
import com.holoka.work.AssignedWork;
import jakarta.persistence.*;
import java.time.*;
import lombok.*;
@Entity @Table(name="tasks",schema="dbo") @Getter @NoArgsConstructor(access=AccessLevel.PROTECTED)
public class Task extends AssignedWork {
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private TaskStatus status=TaskStatus.TODO;
    @Column(nullable=false) private LocalDate dueDate;
    @Column(nullable=false) private boolean deleted;
    public Task(long workspace,long property,Long room){workspaceId=workspace;propertyId=property;roomId=room;}
    public void due(LocalDate date){dueDate=date;}
    public void assign(Long user){assignedUserId=user;}
    public void transition(TaskStatus next,LocalDateTime now){status=next;completedAt=next==TaskStatus.COMPLETED?now:null;}
    public void delete(){deleted=true;}
    @Override public String statusName(){return status.name();}
}
