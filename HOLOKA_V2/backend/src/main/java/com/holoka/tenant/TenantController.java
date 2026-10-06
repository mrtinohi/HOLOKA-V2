package com.holoka.tenant;

import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.*;
import com.holoka.property.RecordStatus;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController @RequestMapping("/api/tenants") @RequiredArgsConstructor @Validated
@Tag(name="Tenants") @SecurityRequirement(name="bearerAuth")
public class TenantController {
    private final TenantService service;
    @GetMapping
    public ApiResponse<PageResponse<TenantDtos.Summary>> list(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@RequestParam(required=false) String search,
        @RequestParam(required=false) RecordStatus status,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
        @RequestParam(defaultValue="createdAt,desc") String sort) {
        return ApiResponse.ok(service.list(principal,workspaceId,search,status,page,size,sort));
    }
    @GetMapping("/{id}")
    public ApiResponse<TenantDtos.View> get(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id) {
        return ApiResponse.ok(service.get(principal,workspaceId,id));
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<TenantDtos.View> create(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@Valid @RequestBody TenantDtos.Write body) {
        return ApiResponse.ok(service.create(principal,workspaceId,body));
    }
    @PutMapping("/{id}")
    public ApiResponse<TenantDtos.View> update(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody TenantDtos.Write body) {
        return ApiResponse.ok(service.update(principal,workspaceId,id,body));
    }
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@RequestParam @PositiveOrZero long version) {
        service.delete(principal,workspaceId,id,version);return ApiResponse.ok(null);
    }

    private final com.holoka.contract.ContractService contracts;
    @GetMapping("/{id}/contracts")
    public ApiResponse<PageResponse<com.holoka.contract.ContractDtos.View>> history(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,
        @RequestParam(required=false) com.holoka.contract.ContractStatus status,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
        @RequestParam(defaultValue="startDate,desc") String sort) {
        return ApiResponse.ok(contracts.list(principal,workspaceId,null,id,null,null,status,page,size,sort));
    }
}
