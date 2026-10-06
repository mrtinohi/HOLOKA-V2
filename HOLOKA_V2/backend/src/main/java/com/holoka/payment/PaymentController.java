package com.holoka.payment;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;

@RestController @RequestMapping("/api/payments") @RequiredArgsConstructor @Validated
@Tag(name="Payments") @SecurityRequirement(name="bearerAuth")
public class PaymentController {
    private final PaymentService service;
    @GetMapping public ApiResponse<PageResponse<PaymentDtos.View>> list(@AuthenticationPrincipal AuthPrincipal principal,
        @RequestParam @Positive long workspaceId,@RequestParam(required=false) String search,@RequestParam(required=false) @Positive Long invoiceId,
        @RequestParam(required=false) PaymentMethod paymentMethod,@RequestParam(required=false) PaymentStatus status,
        @RequestParam(required=false) LocalDate from,@RequestParam(required=false) LocalDate to,
        @RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size,@RequestParam(defaultValue="createdAt,desc") String sort) {
        return ApiResponse.ok(service.list(principal,workspaceId,search,invoiceId,paymentMethod,status,from,to,page,size,sort));
    }
    @GetMapping("/{id}") public ApiResponse<PaymentDtos.View> get(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id){return ApiResponse.ok(service.get(principal,workspaceId,id));}
    @PostMapping @ResponseStatus(HttpStatus.CREATED) public ApiResponse<PaymentDtos.Result> create(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@Valid @RequestBody PaymentDtos.Write body){return ApiResponse.ok(service.create(principal,workspaceId,body));}
    @PostMapping("/{id}/void") public ApiResponse<PaymentDtos.Result> voidPayment(@AuthenticationPrincipal AuthPrincipal principal,@RequestParam @Positive long workspaceId,@PathVariable @Positive long id,@Valid @RequestBody PaymentDtos.Void body){return ApiResponse.ok(service.voidPayment(principal,workspaceId,id,body));}
}
