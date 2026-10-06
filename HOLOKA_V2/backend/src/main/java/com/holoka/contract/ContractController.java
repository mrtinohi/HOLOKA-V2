package com.holoka.contract;

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

@RestController @RequestMapping("/api/contracts") @RequiredArgsConstructor @Validated
@Tag(name="Contracts") @SecurityRequirement(name="bearerAuth")
public class ContractController {
    private final ContractService service;
    @GetMapping
    public ApiResponse<PageResponse<ContractDtos.View>> list(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@RequestParam(required=false) String search,
        @RequestParam(required=false) @Positive Long tenantId, @RequestParam(required=false) @Positive Long roomId,
        @RequestParam(required=false) @Positive Long propertyId, @RequestParam(required=false) ContractStatus status,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,
        @RequestParam(defaultValue="createdAt,desc") String sort) {
        return ApiResponse.ok(service.list(principal,workspaceId,search,tenantId,roomId,propertyId,status,page,size,sort));
    }
    @GetMapping("/{id}")
    public ApiResponse<ContractDtos.View> get(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id) {
        return ApiResponse.ok(service.get(principal,workspaceId,id));
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ContractDtos.View> create(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@Valid @RequestBody ContractDtos.Write body) {
        return ApiResponse.ok(service.create(principal,workspaceId,body));
    }
    @PutMapping("/{id}")
    public ApiResponse<ContractDtos.View> update(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody ContractDtos.Write body) {
        return ApiResponse.ok(service.update(principal,workspaceId,id,body));
    }
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@RequestParam @PositiveOrZero long version) {
        service.delete(principal,workspaceId,id,version);return ApiResponse.ok(null);
    }

    @PostMapping("/{id}/activate")
    public ApiResponse<ContractDtos.View> activate(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody ContractDtos.Transition body) {
        return ApiResponse.ok(service.activate(principal,workspaceId,id,body.version()));
    }

    @PostMapping("/{id}/terminate")
    public ApiResponse<ContractDtos.View> terminate(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody ContractDtos.Transition body) {
        return ApiResponse.ok(service.terminate(principal,workspaceId,id,body.version()));
    }
}
