package com.holoka.notification;
import java.time.*;
public final class NotificationDtos {
    private NotificationDtos(){}
    public record View(long id,long workspaceId,long propertyId,AlertRule rule,NotificationType type,long sourceId,String sourcePath,
        String title,String message,AlertCategory category,boolean read,boolean active,LocalDateTime createdAt,LocalDateTime updatedAt,LocalDateTime resolvedAt){}
    public record Unread(long unreadCount){}
    public record Marked(int updatedCount){}
    public record Action(long propertyId,AlertRule rule,NotificationType type,long sourceId,String sourcePath,String title,String message,AlertCategory category,LocalDate dueDate){}
}
