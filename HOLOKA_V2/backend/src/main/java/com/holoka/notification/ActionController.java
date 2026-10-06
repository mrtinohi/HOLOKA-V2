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
@RestController @RequestMapping("/api/actions") @RequiredArgsConstructor @Validated
@Tag(name="Action Center") @SecurityRequirement(name="bearerAuth")
public class ActionController {
    private final NotificationService service;
    @GetMapping public ApiResponse<PageResponse<NotificationDtos.Action>> list(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,
        @RequestParam(required=false) @Positive Long propertyId,@RequestParam(required=false) AlertCategory category,@RequestParam(required=false) AlertRule rule,
        @RequestParam(required=false) String search,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return ApiResponse.ok(service.actions(p,workspaceId,propertyId,category,rule,search,page,size));}
}
