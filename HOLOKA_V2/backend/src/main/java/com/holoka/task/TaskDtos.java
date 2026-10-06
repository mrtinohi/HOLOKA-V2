package com.holoka.task;
import com.holoka.work.Priority;
import jakarta.validation.constraints.*;
import java.time.*;
public final class TaskDtos {
    private TaskDtos(){}
    public record Create(@NotNull @Positive Long propertyId,@Positive Long roomId,@NotBlank @Size(max=200) String title,
        @Size(max=4000) String description,@NotNull Priority priority,@NotNull LocalDate dueDate){}
    public record Edit(@NotNull @PositiveOrZero Long version,@NotBlank @Size(max=200) String title,
        @Size(max=4000) String description,@NotNull Priority priority,@NotNull LocalDate dueDate){}
    public record Transition(@NotNull @PositiveOrZero Long version,@NotNull TaskStatus status,@Size(max=1000) String note){}
    public record View(long id,long workspaceId,long propertyId,Long roomId,String title,String description,Priority priority,TaskStatus status,
        Long assignedUserId,LocalDate dueDate,boolean overdue,LocalDateTime completedAt,long version,LocalDateTime createdAt,LocalDateTime updatedAt){
        public static View of(Task t,LocalDate today){return new View(t.getId(),t.getWorkspaceId(),t.getPropertyId(),t.getRoomId(),t.getTitle(),t.getDescription(),t.getPriority(),t.getStatus(),t.getAssignedUserId(),t.getDueDate(),(t.getStatus()==TaskStatus.TODO || t.getStatus()==TaskStatus.IN_PROGRESS) && t.getDueDate().isBefore(today),t.getCompletedAt(),t.getVersion(),t.getCreatedAt(),t.getUpdatedAt());}
    }
}
