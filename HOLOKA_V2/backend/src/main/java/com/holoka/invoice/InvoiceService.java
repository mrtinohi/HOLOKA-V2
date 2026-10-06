package com.holoka.invoice;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.contract.*;
import com.holoka.property.InventoryPolicy;
import com.holoka.tenant.TenantRepository;
import java.math.BigDecimal;
import java.time.*;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class InvoiceService {
    private final InvoiceRepository invoices;
    private final ContractRepository contracts;
    private final TenantRepository tenants;
    private final InventoryPolicy policy;
    private final LeaseCalendar calendar;
    public PageResponse<InvoiceDtos.View> list(AuthPrincipal principal,long workspace,String search,Long tenantId,Long propertyId,Long contractId,String billingMonth,InvoiceStatus status,int page,int size,String sort) {
        policy.operator(principal,workspace);
        if(tenantId!=null) tenants.findByIdAndWorkspaceId(tenantId,workspace).orElseThrow(() -> missing("Tenant"));
        if(propertyId!=null) policy.property(workspace,propertyId);
        if(contractId!=null) contract(workspace,contractId);
        var today=calendar.today(workspace);
        var spec=ListQuery.<Invoice>scope(workspace).and(ListQuery.search(search,"invoiceCode"))
            .and(ListQuery.equal("tenantId",tenantId)).and(ListQuery.equal("propertyId",propertyId)).and(ListQuery.equal("contractId",contractId))
            .and(ListQuery.equal("billingMonth",billingMonth==null?null:month(billingMonth))).and(statusFilter(status,today));
        return PageResponse.from(invoices.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","invoiceCode","billingMonth","dueDate","totalAmount","paidAmount","createdAt","updatedAt"))),i -> InvoiceDtos.View.of(i,today));
    }
    public InvoiceDtos.View get(AuthPrincipal principal,long workspace,long id){policy.operator(principal,workspace);return view(find(workspace,id));}
    @Transactional public InvoiceDtos.View create(AuthPrincipal principal,long workspace,InvoiceDtos.Write body) {
        policy.operator(principal,workspace);creating(body.version());
        long parent=contracts.parentId(body.contractId(),workspace).orElseThrow(() -> missing("Contract"));
        policy.lockProperty(workspace,parent);var c=contract(workspace,body.contractId());
        if(c.getStatus()==ContractStatus.DRAFT) throw conflict("Activate the contract before billing");
        var i=new Invoice(c);edit(i,c,body);invoices.saveAndFlush(i);policy.audit(principal,workspace,"CREATE","Invoice",i.getId());return view(i);
    }
    @Transactional public InvoiceDtos.View update(AuthPrincipal principal,long workspace,long id,InvoiceDtos.Write body) {
        policy.operator(principal,workspace);var i=locked(workspace,id);version(body.version(),i.getVersion());
        if(i.getStatus()!=InvoiceStatus.DRAFT) throw conflict("Only DRAFT invoices can be edited");
        if(body.contractId()!=i.getContractId()) throw bad("Invoice contract cannot be changed");
        edit(i,contract(workspace,i.getContractId()),body);invoices.flush();policy.audit(principal,workspace,"UPDATE","Invoice",id);return view(i);
    }
    @Transactional public InvoiceDtos.View issue(AuthPrincipal principal,long workspace,long id,long requestedVersion) {
        policy.operator(principal,workspace);var i=locked(workspace,id);version(requestedVersion,i.getVersion());
        if(i.getStatus()!=InvoiceStatus.DRAFT) throw conflict("Only DRAFT invoices can be issued");
        i.issue();invoices.flush();policy.audit(principal,workspace,"ISSUE","Invoice",id);return view(i);
    }
    @Transactional public InvoiceDtos.View cancel(AuthPrincipal principal,long workspace,long id,long requestedVersion) {
        policy.operator(principal,workspace);var i=locked(workspace,id);version(requestedVersion,i.getVersion());
        if(i.getStatus()==InvoiceStatus.CANCELLED || i.getPaidAmount().signum()!=0) throw conflict("Only unpaid invoices can be cancelled; void mistaken payments first");
        i.cancel();invoices.flush();policy.audit(principal,workspace,"CANCEL","Invoice",id);return view(i);
    }
    @Transactional public void delete(AuthPrincipal principal,long workspace,long id,long requestedVersion) {
        policy.operator(principal,workspace);var i=locked(workspace,id);version(requestedVersion,i.getVersion());
        if(i.getStatus()!=InvoiceStatus.DRAFT) throw conflict("Only DRAFT invoices can be deleted; cancel issued invoices instead");
        invoices.delete(i);invoices.flush();policy.audit(principal,workspace,"DELETE","Invoice",id);
    }
    private Invoice find(long workspace,long id){return invoices.findByIdAndWorkspaceId(id,workspace).orElseThrow(() -> missing("Invoice"));}
    private Invoice locked(long workspace,long id){return invoices.lock(id,workspace).orElseThrow(() -> missing("Invoice"));}
    private Contract contract(long workspace,long id){return contracts.findByIdAndWorkspaceId(id,workspace).orElseThrow(() -> missing("Contract"));}
    private InvoiceDtos.View view(Invoice i){return InvoiceDtos.View.of(i,calendar.today(i.getWorkspaceId()));}
    private void edit(Invoice i,Contract c,InvoiceDtos.Write b) {
        var month=month(b.billingMonth());
        if(!month.isBefore(c.getEndDate()) || !month.plusMonths(1).isAfter(c.getStartDate())) throw bad("Billing month must intersect the contract period");
        if(b.dueDate().getYear()<1 || b.dueDate().getYear()>9999) throw bad("Due date is outside the supported range");
        var total=b.rentAmount().add(b.electricityAmount()).add(b.waterAmount()).add(b.serviceAmount()).add(b.otherAmount());
        if(total.signum()<=0 || total.compareTo(new BigDecimal("99999999999999999.99"))>0) throw bad("Invoice total must be positive and fit the supported amount range");
        i.edit(code(b.invoiceCode()),month,b.dueDate(),b.rentAmount(),b.electricityAmount(),b.waterAmount(),b.serviceAmount(),b.otherAmount());
    }
    public static LocalDate month(String text) {
        if(!text.matches("[0-9]{4}-(0[1-9]|1[0-2])") || text.startsWith("0000")) throw bad("Billing month must use YYYY-MM with year 0001 to 9999");
        return YearMonth.parse(text).atDay(1);
    }
    // OVERDUE is derived at query time, so filtering and pagination agree with the response at local midnight.
    private Specification<Invoice> statusFilter(InvoiceStatus status,LocalDate today) {
        return (root,query,cb) -> {
            if(status==null) return cb.conjunction();
            if(status==InvoiceStatus.OVERDUE) return cb.and(root.get("status").in(InvoiceStatus.ISSUED,InvoiceStatus.PARTIALLY_PAID),cb.lessThan(root.get("dueDate"),today));
            var match=cb.equal(root.get("status"),status);
            return status==InvoiceStatus.ISSUED || status==InvoiceStatus.PARTIALLY_PAID ? cb.and(match,cb.greaterThanOrEqualTo(root.get("dueDate"),today)) : match;
        };
    }
}
