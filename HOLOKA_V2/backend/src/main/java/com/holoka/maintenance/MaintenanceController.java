package com.holoka.maintenance;
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

@RestController @RequestMapping("/api/maintenance") @RequiredArgsConstructor @Validated
@Tag(name="Maintenance") @SecurityRequirement(name="bearerAuth")
public class MaintenanceController {
    private final MaintenanceService service;
    @GetMapping public ApiResponse<PageResponse<MaintenanceDtos.View>> list(@AuthenticationPrincipal AuthPrincipal p,
        @RequestParam @Positive long workspaceId,@RequestParam(required=false) String search,
        @RequestParam(required=false) @Positive Long propertyId,@RequestParam(required=false) @Positive Long buildingId,
        @RequestParam(required=false) @Positive Long roomId,@RequestParam(required=false) @Positive Long assignedUserId,
        @RequestParam(required=false) MaintenanceStatus status,@RequestParam(required=false) Priority priority,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,@RequestParam(defaultValue="createdAt,desc") String sort){
        return ApiResponse.ok(service.list(p,workspaceId,search,propertyId,buildingId,roomId,assignedUserId,status,priority,page,size,sort));
    }
    @GetMapping("/{id}") public ApiResponse<MaintenanceDtos.View> get(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id){return ApiResponse.ok(service.get(p,workspaceId,id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<MaintenanceDtos.View> create(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@Valid @RequestBody MaintenanceDtos.Create b){return ApiResponse.ok(service.create(p,workspaceId,b));}
    @PutMapping("/{id}") public ApiResponse<MaintenanceDtos.View> update(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody MaintenanceDtos.Edit b){return ApiResponse.ok(service.update(p,workspaceId,id,b));}
    @PatchMapping("/{id}/assignment") public ApiResponse<MaintenanceDtos.View> assign(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody WorkDtos.Assignment b){return ApiResponse.ok(service.assign(p,workspaceId,id,b));}
    @PatchMapping("/{id}/status") public ApiResponse<MaintenanceDtos.View> transition(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody MaintenanceDtos.Transition b){return ApiResponse.ok(service.transition(p,workspaceId,id,b));}
    @PatchMapping("/{id}/costs") public ApiResponse<MaintenanceDtos.View> costs(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody MaintenanceDtos.Costs b){return ApiResponse.ok(service.costs(p,workspaceId,id,b));}
    @GetMapping("/{id}/history") public ApiResponse<PageResponse<WorkEvent.View>> history(@AuthenticationPrincipal AuthPrincipal p,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size){return ApiResponse.ok(service.history(p,workspaceId,id,page,size));}
}
