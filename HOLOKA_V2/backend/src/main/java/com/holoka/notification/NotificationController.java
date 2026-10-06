package com.holoka.notification;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.*;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
@RestController @RequestMapping("/api/notifications") @RequiredArgsConstructor @Validated
@Tag(name="Notifications") @SecurityRequirement(name="bearerAuth")
public class NotificationController {
    private final NotificationService service;
    @GetMapping public ApiResponse<PageResponse<NotificationDtos.View>> list(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,
        @RequestParam(required=false) Boolean read,@RequestParam(required=false) Boolean active,@RequestParam(required=false) NotificationType type,
        @RequestParam(required=false) AlertCategory category,@RequestParam(required=false) String search,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,@RequestParam(defaultValue="createdAt,desc") String sort){return ApiResponse.ok(service.list(p,workspaceId,read,active,type,category,search,page,size,sort));}
    @GetMapping("/{id}") public ApiResponse<NotificationDtos.View> get(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id){return ApiResponse.ok(service.get(p,workspaceId,id));}
    @GetMapping("/unread-count") public ApiResponse<NotificationDtos.Unread> unread(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId){return ApiResponse.ok(service.unread(p,workspaceId));}
    @PatchMapping("/{id}/read") public ApiResponse<NotificationDtos.View> markRead(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id){return ApiResponse.ok(service.markRead(p,workspaceId,id));}
    @PostMapping("/read-all") public ApiResponse<NotificationDtos.Marked> markAll(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId){return ApiResponse.ok(service.markAll(p,workspaceId));}
}
