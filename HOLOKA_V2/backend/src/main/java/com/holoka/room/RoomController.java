package com.holoka.room;

import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController @RequestMapping("/api/rooms") @RequiredArgsConstructor @Validated
@Tag(name="Rooms") @SecurityRequirement(name="bearerAuth")
public class RoomController {
    private final RoomService service;
    @GetMapping
    public ApiResponse<PageResponse<RoomDtos.View>> list(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId, @RequestParam(required=false) String search,
        @RequestParam(required=false) @Positive Long propertyId, @RequestParam(required=false) @Positive Long buildingId, @RequestParam(required=false) RoomStatus status,
        @RequestParam(defaultValue="0") int page, @RequestParam(defaultValue="20") int size,
        @RequestParam(defaultValue="createdAt,desc") String sort) {
        return ApiResponse.ok(service.list(principal,workspaceId,search,propertyId,buildingId,status,page,size,sort));
    }
    @GetMapping("/{id}")
    public ApiResponse<RoomDtos.View> get(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id) {
        return ApiResponse.ok(service.get(principal,workspaceId,id));
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RoomDtos.View> create(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@Valid @RequestBody RoomDtos.Write body) {
        return ApiResponse.ok(service.create(principal,workspaceId,body));
    }
    @PutMapping("/{id}")
    public ApiResponse<RoomDtos.View> update(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody RoomDtos.Write body) {
        return ApiResponse.ok(service.update(principal,workspaceId,id,body));
    }
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@RequestParam @PositiveOrZero long version) {
        service.delete(principal,workspaceId,id,version);return ApiResponse.ok(null);
    }
}
