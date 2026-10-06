package com.holoka.payment;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.contract.LeaseCalendar;
import com.holoka.invoice.*;
import com.holoka.property.InventoryPolicy;
import java.time.LocalDate;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class PaymentService {
    private final PaymentRepository payments;
    private final InvoiceRepository invoices;
    private final InventoryPolicy policy;
    private final LeaseCalendar calendar;
    public PageResponse<PaymentDtos.View> list(AuthPrincipal principal,long workspace,String search,Long invoiceId,PaymentMethod method,PaymentStatus status,LocalDate from,LocalDate to,int page,int size,String sort) {
        policy.operator(principal,workspace);
        if(invoiceId!=null) invoices.findByIdAndWorkspaceId(invoiceId,workspace).orElseThrow(() -> missing("Invoice"));
        if(from!=null && to!=null && from.isAfter(to)) throw bad("Payment date range is reversed");
        var spec=ListQuery.<Payment>scope(workspace).and(ListQuery.search(search,"paymentCode","reference"))
            .and(ListQuery.equal("invoiceId",invoiceId)).and(ListQuery.equal("paymentMethod",method)).and(ListQuery.equal("status",status))
            .and((root,q,cb) -> from==null?cb.conjunction():cb.greaterThanOrEqualTo(root.get("paymentDate"),from))
            .and((root,q,cb) -> to==null?cb.conjunction():cb.lessThanOrEqualTo(root.get("paymentDate"),to));
        return PageResponse.from(payments.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","paymentCode","amount","paymentDate","paymentMethod","status","createdAt","updatedAt"))),PaymentDtos.View::of);
    }
    public PaymentDtos.View get(AuthPrincipal principal,long workspace,long id){policy.operator(principal,workspace);return PaymentDtos.View.of(find(workspace,id));}
    @Transactional public PaymentDtos.Result create(AuthPrincipal principal,long workspace,PaymentDtos.Write body) {
        policy.operator(principal,workspace);var i=lockedInvoice(workspace,body.invoiceId());version(body.invoiceVersion(),i.getVersion());
        if(i.getStatus()!=InvoiceStatus.ISSUED && i.getStatus()!=InvoiceStatus.PARTIALLY_PAID) throw conflict("Payments require an issued invoice with an outstanding balance");
        if(body.amount().compareTo(i.remaining())>0) throw conflict("Payment exceeds the remaining amount");
        if(body.paymentDate().getYear()<1 || body.paymentDate().isAfter(calendar.today(workspace))) throw bad("Payment date must be a valid date on or before today");
        var p=new Payment(workspace,i.getId(),code(body.paymentCode()),body.amount(),body.paymentMethod(),body.paymentDate(),description(body.reference()),description(body.note()));
        payments.save(p);i.applyPayment(body.amount());invoices.flush();
        policy.audit(principal,workspace,"PAYMENT","Payment",p.getId());return result(p,i);
    }
    @Transactional public PaymentDtos.Result voidPayment(AuthPrincipal principal,long workspace,long id,PaymentDtos.Void body) {
        policy.owner(principal,workspace);
        long invoiceId=payments.invoiceId(id,workspace).orElseThrow(() -> missing("Payment"));
        var i=lockedInvoice(workspace,invoiceId);var p=find(workspace,id);
        version(body.version(),p.getVersion());version(body.invoiceVersion(),i.getVersion());
        if(p.getStatus()!=PaymentStatus.RECORDED) throw conflict("Payment has already been voided");
        if(i.getStatus()!=InvoiceStatus.ISSUED && i.getStatus()!=InvoiceStatus.PARTIALLY_PAID && i.getStatus()!=InvoiceStatus.PAID) throw conflict("Invoice does not permit payment reversal");
        p.voidPayment(body.reason().strip());i.applyPayment(p.getAmount().negate());invoices.flush();
        policy.audit(principal,workspace,"VOID_PAYMENT","Payment",id);return result(p,i);
    }
    private Payment find(long workspace,long id){return payments.findByIdAndWorkspaceId(id,workspace).orElseThrow(() -> missing("Payment"));}
    private Invoice lockedInvoice(long workspace,long id){return invoices.lock(id,workspace).orElseThrow(() -> missing("Invoice"));}
    private PaymentDtos.Result result(Payment p,Invoice i){return new PaymentDtos.Result(PaymentDtos.View.of(p),InvoiceDtos.View.of(i,calendar.today(i.getWorkspaceId())));}
}
