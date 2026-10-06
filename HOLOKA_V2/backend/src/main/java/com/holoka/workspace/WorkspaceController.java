package com.holoka.workspace;

import com.holoka.auth.AuthPrincipal;
import com.holoka.auth.AuthDtos.WorkspaceView;
import com.holoka.common.api.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/workspaces") @RequiredArgsConstructor @Tag(name = "Workspaces")
@io.swagger.v3.oas.annotations.security.SecurityRequirement(name = "bearerAuth")
public class WorkspaceController {
    private final WorkspaceService service;
    @GetMapping("/{id}")
    public ApiResponse<WorkspaceView> details(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable long id) {
        return ApiResponse.ok(service.details(principal, id));
    }
    @GetMapping("/{id}/members")
    public ApiResponse<WorkspaceService.MemberPage> members(@AuthenticationPrincipal AuthPrincipal principal, @PathVariable long id,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.ok(service.members(principal, id, page, size));
    }
}
