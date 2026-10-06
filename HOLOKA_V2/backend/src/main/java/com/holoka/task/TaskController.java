package com.holoka.task;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.*;
import com.holoka.work.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController @RequestMapping("/api/tasks") @RequiredArgsConstructor @Validated
@Tag(name="Tasks") @SecurityRequirement(name="bearerAuth")
public class TaskController {
    private final TaskService service;
    @GetMapping public ApiResponse<PageResponse<TaskDtos.View>> list(@AuthenticationPrincipal AuthPrincipal p,
        @RequestParam @Positive long workspaceId,@RequestParam(required=false) String search,
        @RequestParam(required=false) @Positive Long propertyId,@RequestParam(required=false) @Positive Long roomId,
        @RequestParam(required=false) @Positive Long assignedUserId,@RequestParam(required=false) TaskStatus status,
        @RequestParam(required=false) Priority priority,@RequestParam(required=false) Boolean overdue,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,@RequestParam(defaultValue="createdAt,desc") String sort){
        return ApiResponse.ok(service.list(p,workspaceId,search,propertyId,roomId,assignedUserId,status,priority,overdue,page,size,sort));
    }
    @GetMapping("/{id}") public ApiResponse<TaskDtos.View> get(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id){return ApiResponse.ok(service.get(p,workspaceId,id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<TaskDtos.View> create(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@Valid @RequestBody TaskDtos.Create b){return ApiResponse.ok(service.create(p,workspaceId,b));}
    @PutMapping("/{id}") public ApiResponse<TaskDtos.View> update(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody TaskDtos.Edit b){return ApiResponse.ok(service.update(p,workspaceId,id,b));}
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@RequestParam @PositiveOrZero long version){service.delete(p,workspaceId,id,version);return ApiResponse.ok(null);}
    @PatchMapping("/{id}/assignment") public ApiResponse<TaskDtos.View> assign(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody WorkDtos.Assignment b){return ApiResponse.ok(service.assign(p,workspaceId,id,b));}
    @PatchMapping("/{id}/status") public ApiResponse<TaskDtos.View> transition(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody TaskDtos.Transition b){return ApiResponse.ok(service.transition(p,workspaceId,id,b));}
    @GetMapping("/{id}/history") public ApiResponse<PageResponse<WorkEvent.View>> history(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return ApiResponse.ok(service.history(p,workspaceId,id,page,size));}
}
