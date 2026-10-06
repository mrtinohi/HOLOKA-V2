package com.holoka;

import com.fasterxml.jackson.databind.*;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.*;
import org.springframework.context.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Import(BillingIT.ClockConfiguration.class)
class BillingIT extends SqlServerTestSupport {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired MutableClock clock;
    private final List<Account> accounts=new ArrayList<>();
    @TestConfiguration static class ClockConfiguration {
        @Bean @Primary MutableClock billingClock(){return new MutableClock();}
    }
    static class MutableClock extends Clock {
        volatile Instant time=Instant.parse("2026-09-27T05:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return Clock.fixed(time,zone);}
        public Instant instant(){return time;}
    }
    @BeforeEach void resetClock(){clock.time=Instant.parse("2026-09-27T05:00:00Z");}
    @AfterEach void cleanup(){
        for(var a:accounts) for(String table:List.of("payments","invoices","contracts","tenants","rooms","buildings","properties","audit_logs"))
            jdbc.update("DELETE FROM dbo."+table+" WHERE workspace_id=?",a.workspace);
        for(var a:accounts){
            jdbc.update("DELETE FROM dbo.audit_logs WHERE actor_user_id=?",a.user);
            jdbc.update("DELETE FROM dbo.refresh_sessions WHERE user_id=?",a.user);
            jdbc.update("DELETE FROM dbo.memberships WHERE user_id=?",a.user);
        }
        for(var a:accounts) jdbc.update("DELETE FROM dbo.workspaces WHERE id=?",a.workspace);
        for(var a:accounts) jdbc.update("DELETE FROM dbo.app_users WHERE id=?",a.user);
    }
    @Test void calculatesDecimalTotalEditsDraftAndDeletes() throws Exception {
        var f=fixture();var b=invoice(f,"INV","2026-09");b.put("rentAmount","5000000.15");b.put("electricityAmount","300000.25");b.put("waterAmount","100000.10");b.put("serviceAmount","200000.30");b.put("otherAmount","399999.20");
        var i=create(f.a,"invoices",b);assertThat(i.path("totalAmount").decimalValue()).isEqualByComparingTo("6000000.00");
        b.put("version",version(i));b.put("otherAmount",0);i=data(call(f.a,put("/api/invoices/"+id(i)).content(json(b))).andExpect(status().isOk()).andReturn());
        assertThat(i.path("totalAmount").decimalValue()).isEqualByComparingTo("5600000.80");
        call(f.a,put("/api/invoices/"+id(i)).content(json(b))).andExpect(status().isConflict());
        call(f.a,delete("/api/invoices/"+id(i)).param("version",Long.toString(version(i)))).andExpect(status().isOk());
        call(f.a,get("/api/invoices/"+id(i))).andExpect(status().isNotFound());
    }
    @Test void partialThenFullPaymentUpdatesBalanceAndAudit() throws Exception {
        var f=fixture();var i=issued(f);var first=pay(f,i,"PAY-1",3000000);
        assertThat(first.path("invoice").path("status").asText()).isEqualTo("PARTIALLY_PAID");
        assertThat(first.path("invoice").path("remainingAmount").decimalValue()).isEqualByComparingTo("3000000");
        var second=pay(f,first.path("invoice"),"PAY-2",3000000);
        assertThat(second.path("invoice").path("status").asText()).isEqualTo("PAID");
        assertThat(second.path("invoice").path("remainingAmount").decimalValue()).isZero();
        call(f.a,get("/api/payments").param("invoiceId",Long.toString(id(i)))).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(2));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.audit_logs WHERE workspace_id=? AND action='PAYMENT'",Integer.class,f.a.workspace)).isEqualTo(2);
        assertLedger(f,id(i));
    }
    @Test void rejectsInvalidAmountsDatesAndOverpayment() throws Exception {
        var f=fixture();var i=issued(f);var b=payment(i,"INVALID",1);
        for(Object amount:List.of(0,-1,"0.001")){b.put("amount",amount);call(f.a,post("/api/payments").content(json(b))).andExpect(status().isBadRequest());}
        b.put("amount",6000001);call(f.a,post("/api/payments").content(json(b))).andExpect(status().isConflict());
        b.put("amount",1);b.put("paymentDate","2026-09-28");call(f.a,post("/api/payments").content(json(b))).andExpect(status().isBadRequest());
        assertLedger(f,id(i));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.payments WHERE workspace_id=?",Integer.class,f.a.workspace)).isZero();
    }
    @Test void duplicatePaymentCodeRollsBackBalanceAndStaleRetryCannotChargeAgain() throws Exception {
        var f=fixture();var i=issued(f);var result=pay(f,i,"UNIQUE",1000000);var current=result.path("invoice");
        call(f.a,post("/api/payments").content(json(payment(i,"RETRY",1000000)))).andExpect(status().isConflict());
        call(f.a,post("/api/payments").content(json(payment(current,"unique",1000000)))).andExpect(status().isConflict());
        call(f.a,get("/api/invoices/"+id(i))).andExpect(status().isOk()).andExpect(jsonPath("$.data.paidAmount").value(1000000)).andExpect(jsonPath("$.data.version").value(version(current)));
        assertLedger(f,id(i));
    }
    @Test void concurrentPaymentsHaveOneWinnerAndCannotOvercollect() throws Exception {
        var f=fixture();var i=issued(f);var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)){
            var first=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(f.a,post("/api/payments").content(json(payment(i,"ONE",4000000)))).andReturn().getResponse().getStatus();});
            var second=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(f.a,post("/api/payments").content(json(payment(i,"TWO",4000000)))).andReturn().getResponse().getStatus();});
            assertThat(List.of(first.get(20,TimeUnit.SECONDS),second.get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder(201,409);
        }
        call(f.a,get("/api/invoices/"+id(i))).andExpect(status().isOk()).andExpect(jsonPath("$.data.paidAmount").value(4000000));assertLedger(f,id(i));
    }
    @Test void overdueUsesWorkspaceMidnightAndFiltersAgreeWithDetails() throws Exception {
        var f=fixture();var i=issued(f);i=pay(f,i,"PART",100).path("invoice");
        clock.time=Instant.parse("2026-09-27T16:59:59Z");
        call(f.a,get("/api/invoices/"+id(i))).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("PARTIALLY_PAID"));
        clock.time=Instant.parse("2026-09-27T17:00:00Z");
        call(f.a,get("/api/invoices/"+id(i))).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("OVERDUE"));
        call(f.a,get("/api/invoices").param("status","OVERDUE").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(f.a,get("/api/invoices").param("status","PARTIALLY_PAID")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        i=pay(f,i,"REST",5999900).path("invoice");assertThat(i.path("status").asText()).isEqualTo("PAID");
        call(f.a,get("/api/invoices").param("status","OVERDUE")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
    }
    @Test void lifecyclePreventsEditingIssuedPayingDraftAndCancellingPaid() throws Exception {
        var f=fixture();var b=invoice(f,"INV","2026-09");var i=create(f.a,"invoices",b);
        call(f.a,post("/api/payments").content(json(payment(i,"DRAFT-PAY",1)))).andExpect(status().isConflict());
        i=transition(f,i,"issue");b.put("version",version(i));
        call(f.a,put("/api/invoices/"+id(i)).content(json(b))).andExpect(status().isConflict());
        call(f.a,delete("/api/invoices/"+id(i)).param("version",Long.toString(version(i)))).andExpect(status().isConflict());
        i=pay(f,i,"PAID",6000000).path("invoice");
        call(f.a,post("/api/invoices/"+id(i)+"/cancel").content(json(Map.of("version",version(i))))).andExpect(status().isConflict());
        call(f.a,post("/api/payments").content(json(payment(i,"EXTRA",1)))).andExpect(status().isConflict());
    }
    @Test void cancellationAllowsReplacementButPreservesHistory() throws Exception {
        var f=fixture();var i=issued(f);i=transition(f,i,"cancel");
        call(f.a,post("/api/payments").content(json(payment(i,"CANCELLED",1)))).andExpect(status().isConflict());
        var replacement=create(f.a,"invoices",invoice(f,"REPLACEMENT","2026-09"));
        assertThat(id(replacement)).isNotEqualTo(id(i));
        call(f.a,get("/api/invoices").param("status","CANCELLED")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
    }
    @Test void ownerCanVoidMistakeOnceAndRestoreOutstandingBalance() throws Exception {
        var f=fixture();var i=issued(f);var paid=pay(f,i,"MISTAKE",6000000);var p=paid.path("payment");i=paid.path("invoice");
        var body=new HashMap<String,Object>(Map.of("version",version(p),"invoiceVersion",version(i),"reason","Ghi nhận nhầm"));
        var reversed=data(call(f.a,post("/api/payments/"+id(p)+"/void").content(json(body))).andExpect(status().isOk()).andReturn());
        assertThat(reversed.path("invoice").path("status").asText()).isEqualTo("ISSUED");assertThat(reversed.path("payment").path("status").asText()).isEqualTo("VOIDED");
        body.put("version",version(reversed.path("payment")));body.put("invoiceVersion",version(reversed.path("invoice")));
        call(f.a,post("/api/payments/"+id(p)+"/void").content(json(body))).andExpect(status().isConflict());
        assertLedger(f,id(i));transition(f,reversed.path("invoice"),"cancel");
    }
    @Test void scopeAndRoleBoundariesProtectFinancialData() throws Exception {
        var f=fixture();var other=fixture();var i=issued(f);var payment=pay(f,i,"PRIVATE",100);var p=payment.path("payment");
        call(other.a,get("/api/invoices/"+id(i))).andExpect(status().isNotFound());
        call(other.a,get("/api/payments/"+id(p))).andExpect(status().isNotFound());
        call(other.a,post("/api/payments").content(json(payment(i,"FOREIGN",100)))).andExpect(status().isNotFound());
        call(other.a,post("/api/invoices").content(json(invoice(f,"FOREIGN","2026-10")))).andExpect(status().isNotFound());
        call(other.a,get("/api/payments").param("invoiceId",Long.toString(id(i)))).andExpect(status().isNotFound());
        jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'STAFF')",f.a.workspace,other.a.user);
        var staff=new Account(other.a.user,f.a.workspace,other.a.bearer);
        call(staff,get("/api/invoices")).andExpect(status().isForbidden());call(staff,get("/api/payments")).andExpect(status().isForbidden());
        jdbc.update("UPDATE dbo.memberships SET role_code='MANAGER' WHERE workspace_id=? AND user_id=?",f.a.workspace,other.a.user);
        call(staff,get("/api/invoices")).andExpect(status().isOk());
        call(staff,post("/api/payments/"+id(p)+"/void").content(json(Map.of("version",0,"invoiceVersion",version(payment.path("invoice")),"reason","No permission")))).andExpect(status().isForbidden());
        call(staff,post("/api/payments").content(json(payment(payment.path("invoice"),"MANAGER",100)))).andExpect(status().isCreated());
    }
    @Test void validatesInvoiceMonthAmountsDuplicatesAndImmutableContract() throws Exception {
        var f=fixture();var b=invoice(f,"INV","2026-09");
        for(String month:List.of("2026-13","0000-01","2025-09")){b.put("billingMonth",month);call(f.a,post("/api/invoices").content(json(b))).andExpect(status().isBadRequest());}
        b.put("billingMonth","2026-09");b.put("rentAmount",0);call(f.a,post("/api/invoices").content(json(b))).andExpect(status().isBadRequest());
        b.put("rentAmount","99999999999999999.99");b.put("otherAmount",1);call(f.a,post("/api/invoices").content(json(b))).andExpect(status().isBadRequest());
        b.put("rentAmount",6000000);b.put("otherAmount",0);var i=create(f.a,"invoices",b);
        b.put("invoiceCode","SAME-MONTH");call(f.a,post("/api/invoices").content(json(b))).andExpect(status().isConflict());
        b.put("invoiceCode","inv");b.put("billingMonth","2026-10");call(f.a,post("/api/invoices").content(json(b))).andExpect(status().isConflict());
        b.put("version",version(i));b.put("contractId",99999999);call(f.a,put("/api/invoices/"+id(i)).content(json(b))).andExpect(status().isBadRequest());
        call(f.a,get("/api/invoices").param("billingMonth","bad")).andExpect(status().isBadRequest());
    }
    @Test void draftContractsCannotBeBilledAndEndedContractsCan() throws Exception {
        var f=fixture();jdbc.update("UPDATE dbo.contracts SET status='DRAFT' WHERE id=?",f.contract);
        call(f.a,post("/api/invoices").content(json(invoice(f,"DRAFT","2026-09")))).andExpect(status().isConflict());
        jdbc.update("UPDATE dbo.contracts SET status='TERMINATED' WHERE id=?",f.contract);
        create(f.a,"invoices",invoice(f,"FINAL","2026-09"));
    }
    @Test void listSearchFiltersPaginationAndPaymentHistory() throws Exception {
        var f=fixture();var i=issued(f);create(f.a,"invoices",invoice(f,"OCTOBER","2026-10"));
        call(f.a,get("/api/invoices").param("tenantId",Long.toString(f.tenant)).param("propertyId",Long.toString(f.property)).param("contractId",Long.toString(f.contract)).param("billingMonth","2026-09").param("search","inv").param("status","ISSUED"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(f.a,get("/api/invoices").param("size","1").param("sort","billingMonth,desc")).andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].invoiceCode").value("OCTOBER"));
        pay(f,i,"CASH-ONE",100);
        call(f.a,get("/api/payments").param("search","cash").param("paymentMethod","CASH").param("status","RECORDED").param("from","2026-09-27").param("to","2026-09-27").param("sort","amount,desc"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(f.a,get("/api/payments").param("search","%_")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        call(f.a,get("/api/payments").param("from","2026-09-28").param("to","2026-09-27")).andExpect(status().isBadRequest());
    }
    @Test void databaseEnforcesScopedInvoiceAndAmountConstraints() throws Exception {
        var f=fixture();var other=fixture();var i=issued(f);
        assertThatThrownBy(() -> jdbc.update("UPDATE dbo.invoices SET tenant_id=? WHERE id=?",other.tenant,id(i))).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("UPDATE dbo.invoices SET total_amount=1 WHERE id=?",id(i))).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO dbo.payments(workspace_id,invoice_id,payment_code,amount,payment_method,payment_date,status) VALUES(?,?,'BAD',1,'CASH','2026-09-27','RECORDED')",other.a.workspace,id(i))).isInstanceOf(DataIntegrityViolationException.class);
    }
    private void assertLedger(Fixture f,long invoice){
        var paid=jdbc.queryForObject("SELECT paid_amount FROM dbo.invoices WHERE id=?",java.math.BigDecimal.class,invoice);
        var sum=jdbc.queryForObject("SELECT COALESCE(SUM(amount),0) FROM dbo.payments WHERE workspace_id=? AND invoice_id=? AND status='RECORDED'",java.math.BigDecimal.class,f.a.workspace,invoice);
        assertThat(paid).isEqualByComparingTo(sum);
    }
    private JsonNode issued(Fixture f) throws Exception {return transition(f,create(f.a,"invoices",invoice(f,"INV","2026-09")),"issue");}
    private JsonNode transition(Fixture f,JsonNode i,String action) throws Exception{return data(call(f.a,post("/api/invoices/"+id(i)+"/"+action).content(json(Map.of("version",version(i))))).andExpect(status().isOk()).andReturn());}
    private JsonNode pay(Fixture f,JsonNode i,String code,Object amount) throws Exception{return create(f.a,"payments",payment(i,code,amount));}
    private Map<String,Object> payment(JsonNode i,String code,Object amount){return new HashMap<>(Map.of("paymentCode",code,"invoiceId",id(i),"invoiceVersion",version(i),"amount",amount,"paymentMethod","CASH","paymentDate","2026-09-27"));}
    private Map<String,Object> invoice(Fixture f,String code,String month){return new HashMap<>(Map.of("invoiceCode",code,"contractId",f.contract,"billingMonth",month,"dueDate","2026-09-27","rentAmount",6000000,"electricityAmount",0,"waterAmount",0,"serviceAmount",0,"otherAmount",0));}
    private Fixture fixture() throws Exception {
        var a=account();long property=id(create(a,"properties",Map.of("name","An Phú","code","P","address","Thủ Đức","propertyType","ROOM_RENTAL","status","ACTIVE","ownerUserId",a.user)));
        long building=id(create(a,"buildings",Map.of("propertyId",property,"name","Tòa A","code","A","numberOfFloors",3,"status","ACTIVE")));
        long room=id(create(a,"rooms",Map.of("buildingId",building,"roomCode","101","name","Phòng 101","floor",1,"area",25,"monthlyRent",5000000,"status","AVAILABLE")));
        long tenant=id(create(a,"tenants",Map.of("fullName","Nguyễn An","phone","0901234567","status","ACTIVE")));
        long contract=id(create(a,"contracts",Map.of("contractCode","LEASE","tenantId",tenant,"roomId",room,"startDate","2026-09-01","endDate","2027-09-01","monthlyRent",5000000,"deposit",5000000,"status","ACTIVE")));
        return new Fixture(a,property,tenant,contract);
    }
    private Account account() throws Exception {
        var body=Map.of("fullName","Billing Tester","email",UUID.randomUUID()+"@test.invalid","password","Billing-test-password-2026!","workspaceName","Billing workspace");
        var result=mvc.perform(post("/api/auth/register").with(csrfCookie()).contentType(MediaType.APPLICATION_JSON).content(json(body))).andExpect(status().isCreated()).andReturn();
        var d=data(result);var a=new Account(d.path("user").path("id").asLong(),d.path("user").path("workspaces").get(0).path("id").asLong(),"Bearer "+d.path("accessToken").asText());accounts.add(a);return a;
    }
    private ResultActions call(Account a,MockHttpServletRequestBuilder request) throws Exception{return mvc.perform(request.param("workspaceId",Long.toString(a.workspace)).header("Authorization",a.bearer).contentType(MediaType.APPLICATION_JSON).with(csrfCookie()));}
    private RequestPostProcessor csrfCookie() throws Exception{var r=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();Cookie cookie=r.getResponse().getCookie("XSRF-TOKEN");String token=data(r).path("token").asText();return request -> {request.setCookies(cookie);request.addHeader("X-XSRF-TOKEN",token);return request;};}
    private JsonNode create(Account a,String resource,Map<String,Object> body) throws Exception{return data(call(a,post("/api/"+resource).content(json(body))).andExpect(status().isCreated()).andReturn());}
    private String json(Object body) throws Exception{return mapper.writeValueAsString(body);}
    private JsonNode data(MvcResult r) throws Exception{return mapper.readTree(r.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");}
    private long id(JsonNode n){return n.path("id").asLong();}
    private long version(JsonNode n){return n.path("version").asLong();}
    record Account(long user,long workspace,String bearer){}
    record Fixture(Account a,long property,long tenant,long contract){}
}
