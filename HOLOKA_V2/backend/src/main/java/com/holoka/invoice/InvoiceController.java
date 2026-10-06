package com.holoka.invoice;
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

@RestController @RequestMapping("/api/invoices") @RequiredArgsConstructor @Validated
@Tag(name="Invoices") @SecurityRequirement(name="bearerAuth")
public class InvoiceController {
    private final InvoiceService service;
    @GetMapping public ApiResponse<PageResponse<InvoiceDtos.View>> list(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@RequestParam(required=false) String search,
        @RequestParam(required=false) @Positive Long tenantId,@RequestParam(required=false) @Positive Long propertyId,
        @RequestParam(required=false) @Positive Long contractId,@RequestParam(required=false) String billingMonth,
        @RequestParam(required=false) InvoiceStatus status,@RequestParam(defaultValue="0") int page,
        @RequestParam(defaultValue="20") int size,@RequestParam(defaultValue="createdAt,desc") String sort) {
        return ApiResponse.ok(service.list(principal,workspaceId,search,tenantId,propertyId,contractId,billingMonth,status,page,size,sort));
    }
    @GetMapping("/{id}") public ApiResponse<InvoiceDtos.View> get(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id){return ApiResponse.ok(service.get(principal,workspaceId,id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<InvoiceDtos.View> create(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@Valid @RequestBody InvoiceDtos.Write body){return ApiResponse.ok(service.create(principal,workspaceId,body));}
    @PutMapping("/{id}") public ApiResponse<InvoiceDtos.View> update(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody InvoiceDtos.Write body){return ApiResponse.ok(service.update(principal,workspaceId,id,body));}
    @DeleteMapping("/{id}") public ApiResponse<Void> delete(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@RequestParam @PositiveOrZero long version){service.delete(principal,workspaceId,id,version);return ApiResponse.ok(null);}
    @PostMapping("/{id}/issue") public ApiResponse<InvoiceDtos.View> issue(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody InvoiceDtos.Transition body){return ApiResponse.ok(service.issue(principal,workspaceId,id,body.version()));}
    @PostMapping("/{id}/cancel") public ApiResponse<InvoiceDtos.View> cancel(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody InvoiceDtos.Transition body){return ApiResponse.ok(service.cancel(principal,workspaceId,id,body.version()));}
}
