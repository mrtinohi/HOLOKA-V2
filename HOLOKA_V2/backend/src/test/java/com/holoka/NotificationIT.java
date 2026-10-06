package com.holoka;
import com.fasterxml.jackson.databind.*;
import com.holoka.notification.*;
import com.holoka.workspace.WorkspaceRepository;
import com.holoka.property.InventoryPolicy;
import com.holoka.auth.AuthPrincipal;
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
import org.springframework.test.context.*;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.*;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc @Import(NotificationIT.ClockConfiguration.class)
class NotificationIT {
    @DynamicPropertySource static void database(DynamicPropertyRegistry registry){SqlServerTestSupport.database(registry);registry.add("holoka.alerts.events-enabled",()->true);}
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired MutableClock clock;
    @Autowired AlertEvaluator evaluator;
    @Autowired WorkspaceRepository workspaces;
    @Autowired InventoryPolicy policy;
    @Autowired PlatformTransactionManager transactionManager;
    private final List<Account> accounts=new ArrayList<>();
    private static final LocalDate TODAY=LocalDate.of(2026,9,29);
    @TestConfiguration static class ClockConfiguration {@Bean @Primary MutableClock notificationClock(){return new MutableClock();}}
    static class MutableClock extends Clock {
        volatile Instant time=Instant.parse("2026-09-29T05:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return Clock.fixed(time,zone);}
        public Instant instant(){return time;}
    }
    @BeforeEach void resetClock(){clock.time=Instant.parse("2026-09-29T05:00:00Z");}
    @AfterEach void cleanup(){
        for(var a:accounts)for(String table:List.of("notifications","work_events","maintenance_requests","tasks","payments","invoices","contracts","tenants","rooms","buildings","properties","audit_logs"))jdbc.update("DELETE FROM dbo."+table+" WHERE workspace_id=?",a.workspace);
        for(var a:accounts){jdbc.update("DELETE FROM dbo.audit_logs WHERE actor_user_id=?",a.user);jdbc.update("DELETE FROM dbo.refresh_sessions WHERE user_id=?",a.user);jdbc.update("DELETE FROM dbo.memberships WHERE user_id=?",a.user);}
        for(var a:accounts)jdbc.update("DELETE FROM dbo.workspaces WHERE id=?",a.workspace);
        for(var a:accounts)jdbc.update("DELETE FROM dbo.app_users WHERE id=?",a.user);
    }
    @Test void maintenanceWriteAutomaticallyNotifiesOperatorsAndAssignedStaff() throws Exception {
        var f=fixture();var staff=member(f,"STAFF");var manager=member(f,"MANAGER");var m=maintenance(f,"HIGH-1");
        var ownerNotice=notices(f.a).get(0);assertThat(ownerNotice.path("title").asText()).isEqualTo("Bảo trì cần ưu tiên");assertThat(notices(manager).size()).isEqualTo(1);assertThat(notices(staff).size()).isZero();
        assign(f,"maintenance",m,staff.user);assertThat(notices(staff).size()).isEqualTo(1);assertThat(notices(f.a).size()).isEqualTo(1);
        call(staff,get("/api/actions")).andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].sourcePath").value("/maintenance/"+id(m)));
    }
    @Test void overdueInvoicePartialThenFullPaymentResolvesNotification() throws Exception {
        var f=fixture();var i=invoice(f);var n=notices(f.a).get(0);assertThat(n.path("rule").asText()).isEqualTo("INVOICE_OVERDUE");
        i=pay(f,i,"PART",100).path("invoice");assertThat(notices(f.a).size()).isEqualTo(1);
        pay(f,i,"REST",900);
        call(f.a,get("/api/notifications/"+id(n))).andExpect(status().isOk()).andExpect(jsonPath("$.data.active").value(false)).andExpect(jsonPath("$.data.resolvedAt").isNotEmpty());
        call(f.a,get("/api/actions").param("rule","INVOICE_OVERDUE")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
    }
    @Test void contractHorizonEscalatesOnceThenStopsAtExpiry() throws Exception {
        var f=fixture();contract(f,TODAY.plusDays(31));assertThat(notices(f.a).size()).isZero();
        clock.time=Instant.parse("2026-09-30T05:00:00Z");evaluator.evaluate(f.a.workspace);var n=notices(f.a).get(0);
        assertThat(n.path("category").asText()).isEqualTo("UPCOMING");mark(f.a,id(n));
        clock.time=Instant.parse("2026-10-23T05:00:00Z");evaluator.evaluate(f.a.workspace);
        call(f.a,get("/api/notifications/"+id(n))).andExpect(status().isOk()).andExpect(jsonPath("$.data.category").value("NEEDS_ATTENTION")).andExpect(jsonPath("$.data.read").value(false));
        mark(f.a,id(n));evaluator.evaluate(f.a.workspace);assertThat(notices(f.a).get(0).path("read").asBoolean()).isTrue();
        clock.time=Instant.parse("2026-10-30T05:00:00Z");evaluator.evaluate(f.a.workspace);assertThat(notices(f.a).get(0).path("active").asBoolean()).isFalse();
    }
    @Test void scheduledReconciliationUsesWorkspaceMidnightForOverdueTask() throws Exception {
        var f=fixture();create(f.a,"tasks",task(f,TODAY));clock.time=Instant.parse("2026-09-29T16:59:59Z");scheduler();assertThat(notices(f.a).size()).isZero();
        clock.time=Instant.parse("2026-09-29T17:00:00Z");scheduler();assertThat(notices(f.a).size()).isEqualTo(1);
        call(f.a,get("/api/actions").param("rule","TASK_OVERDUE")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
    }
    @Test void repeatedAndConcurrentEvaluationCannotDuplicateOrResetReadState() throws Exception {
        var f=fixture();maintenance(f,"CONCURRENT");var n=notices(f.a).get(0);mark(f.a,id(n));var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)){
            var one=pool.submit(()->{barrier.await(5,TimeUnit.SECONDS);evaluator.evaluate(f.a.workspace);return true;});
            var two=pool.submit(()->{barrier.await(5,TimeUnit.SECONDS);evaluator.evaluate(f.a.workspace);return true;});
            assertThat(one.get(20,TimeUnit.SECONDS)).isTrue();assertThat(two.get(20,TimeUnit.SECONDS)).isTrue();
        }
        assertThat(notices(f.a).size()).isEqualTo(1);assertThat(notices(f.a).get(0).path("read").asBoolean()).isTrue();
        call(f.a,get("/api/notifications/unread-count")).andExpect(status().isOk()).andExpect(jsonPath("$.data.unreadCount").value(0));
    }
    @Test void readAndReadAllOnlyAffectCurrentRecipient() throws Exception {
        var f=fixture();var manager=member(f,"MANAGER");var outsider=account();maintenance(f,"ONE");maintenance(f,"TWO");var own=notices(f.a).get(0);
        call(manager,get("/api/notifications/"+id(own))).andExpect(status().isNotFound());call(manager,patch("/api/notifications/"+id(own)+"/read")).andExpect(status().isNotFound());
        call(outsider,get("/api/notifications/"+id(own))).andExpect(status().isNotFound());
        call(f.a,post("/api/notifications/read-all")).andExpect(status().isOk()).andExpect(jsonPath("$.data.updatedCount").value(2));
        call(f.a,post("/api/notifications/read-all")).andExpect(status().isOk()).andExpect(jsonPath("$.data.updatedCount").value(0));
        call(manager,get("/api/notifications/unread-count")).andExpect(status().isOk()).andExpect(jsonPath("$.data.unreadCount").value(2));
    }
    @Test void assignmentVisibilityIsImmediateEvenBeforeReconciliation() throws Exception {
        var f=fixture();var first=member(f,"STAFF");var second=member(f,"STAFF");var m=assign(f,"maintenance",maintenance(f,"SWAP"),first.user);var n=notices(first).get(0);
        jdbc.update("UPDATE dbo.maintenance_requests SET assigned_user_id=? WHERE id=?",second.user,id(m));
        call(first,get("/api/notifications/"+id(n))).andExpect(status().isNotFound());call(first,get("/api/notifications/unread-count")).andExpect(status().isOk()).andExpect(jsonPath("$.data.unreadCount").value(0));
        call(first,patch("/api/notifications/"+id(n)+"/read")).andExpect(status().isNotFound());
        call(first,get("/api/actions")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        evaluator.evaluate(f.a.workspace);assertThat(notices(second).size()).isEqualTo(1);
    }
    @Test void demotedOperatorsCannotReadOldFinancialNotifications() throws Exception {
        var f=fixture();invoice(f);var n=notices(f.a).get(0);
        jdbc.update("UPDATE dbo.memberships SET role_code='STAFF' WHERE workspace_id=? AND user_id=?",f.a.workspace,f.a.user);
        call(f.a,get("/api/notifications/"+id(n))).andExpect(status().isNotFound());call(f.a,get("/api/actions")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        call(f.a,post("/api/notifications/read-all")).andExpect(status().isOk()).andExpect(jsonPath("$.data.updatedCount").value(0));
    }
    @Test void dueDateChangesCreateNewWindowAndResolveOldWindow() throws Exception {
        var f=fixture();var t=create(f.a,"tasks",task(f,TODAY.minusDays(2)));var old=notices(f.a).get(0);
        call(f.a,put("/api/tasks/"+id(t)).content(json(Map.of("version",version(t),"title","Check","priority","MEDIUM","dueDate",TODAY.minusDays(1))))).andExpect(status().isOk());
        assertThat(notices(f.a).size()).isEqualTo(2);
        call(f.a,get("/api/notifications/"+id(old))).andExpect(status().isOk()).andExpect(jsonPath("$.data.active").value(false));
        call(f.a,get("/api/notifications").param("active","true")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
    }
    @Test void vacancyThresholdAndParentStatusAreRespected() throws Exception {
        var f=fixture();jdbc.update("UPDATE dbo.rooms SET available_since='2026-08-29T17:00:00' WHERE id=?",f.room);evaluator.evaluate(f.a.workspace);assertThat(notices(f.a).size()).isZero();
        jdbc.update("UPDATE dbo.rooms SET available_since='2026-08-29T16:59:59' WHERE id=?",f.room);evaluator.evaluate(f.a.workspace);assertThat(notices(f.a).get(0).path("rule").asText()).isEqualTo("ROOM_VACANT");
        jdbc.update("UPDATE dbo.properties SET status='INACTIVE' WHERE id=?",f.property);evaluator.evaluate(f.a.workspace);
        call(f.a,get("/api/actions").param("rule","ROOM_VACANT")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        jdbc.update("UPDATE dbo.properties SET status='ACTIVE' WHERE id=?",f.property);contract(f,TODAY.plusMonths(6));
        jdbc.update("UPDATE dbo.rooms SET status='AVAILABLE',available_since='2026-08-01T00:00:00' WHERE id=?",f.room);evaluator.evaluate(f.a.workspace);
        call(f.a,get("/api/actions").param("rule","ROOM_VACANT")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
    }
    @Test void closedAndDeletedSourcesLeaveLiveActionsAndResolveInbox() throws Exception {
        var f=fixture();var m=maintenance(f,"CANCEL");var t=create(f.a,"tasks",task(f,TODAY.minusDays(1)));assertThat(notices(f.a).size()).isEqualTo(2);
        call(f.a,patch("/api/maintenance/"+id(m)+"/status").content(json(Map.of("version",version(m),"status","CANCELLED","note","No longer needed")))).andExpect(status().isOk());
        call(f.a,delete("/api/tasks/"+id(t)).param("version",Long.toString(version(t)))).andExpect(status().isOk());
        call(f.a,get("/api/actions")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        call(f.a,get("/api/notifications").param("active","false")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(2));
    }
    @Test void listFiltersSearchAndPagingUseRealScopedRows() throws Exception {
        var f=fixture();maintenance(f,"FILTER");create(f.a,"tasks",task(f,TODAY.minusDays(1)));
        call(f.a,get("/api/notifications").param("type","MAINTENANCE").param("category","URGENT").param("read","false").param("search","FILTER").param("sort","id,asc").param("size","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(f.a,get("/api/actions").param("propertyId",Long.toString(f.property)).param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(2)).andExpect(jsonPath("$.data.items[0].category").value("URGENT"));
        call(f.a,get("/api/actions").param("search","%_")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        call(f.a,get("/api/notifications").param("sort","user_id,asc")).andExpect(status().isBadRequest());
        call(f.a,get("/api/actions").param("size","101")).andExpect(status().isBadRequest());
    }
    @Test void disabledRecipientsAndWorkspaceAreExcluded() throws Exception {
        var f=fixture();var manager=member(f,"MANAGER");jdbc.update("UPDATE dbo.memberships SET enabled=0 WHERE workspace_id=? AND user_id=?",f.a.workspace,manager.user);maintenance(f,"DISABLED");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.notifications WHERE workspace_id=? AND user_id=?",Integer.class,f.a.workspace,manager.user)).isZero();
        jdbc.update("UPDATE dbo.workspaces SET enabled=0 WHERE id=?",f.a.workspace);evaluator.evaluate(f.a.workspace);
        call(f.a,get("/api/notifications")).andExpect(status().isNotFound());call(f.a,get("/api/actions")).andExpect(status().isNotFound());
    }
    @Test void rolledBackBusinessChangesDoNotCreateNotifications() throws Exception {
        var f=fixture();var tx=new TransactionTemplate(transactionManager);
        tx.execute(status->{
            long id=jdbc.queryForObject("INSERT INTO dbo.maintenance_requests(workspace_id,property_id,request_code,title,priority,status,estimated_cost,actual_cost,reported_at) OUTPUT INSERTED.id VALUES(?,?,'ROLLBACK',N'Test','URGENT','OPEN',0,0,SYSUTCDATETIME())",Long.class,f.a.workspace,f.property);
            policy.audit(new AuthPrincipal(f.a.user,UUID.randomUUID()),f.a.workspace,"CREATE","MaintenanceRequest",id);status.setRollbackOnly();return null;
        });
        assertThat(notices(f.a).size()).isZero();assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.maintenance_requests WHERE workspace_id=?",Integer.class,f.a.workspace)).isZero();
    }
    @Test void databaseEnforcesDeliveryUniquenessAndRecipientMembership() throws Exception {
        var f=fixture();maintenance(f,"SQL");var outsider=account();long id=id(notices(f.a).get(0));
        String copy="INSERT INTO dbo.notifications(workspace_id,user_id,property_id,[rule],type,source_id,window_key,title,message,category,is_read,active,created_at,updated_at,last_seen) SELECT workspace_id,?,property_id,[rule],type,source_id,window_key,title,message,category,0,1,created_at,updated_at,last_seen FROM dbo.notifications WHERE id=?";
        assertThatThrownBy(()->jdbc.update(copy,f.a.user,id)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(()->jdbc.update(copy,outsider.user,id)).isInstanceOf(DataIntegrityViolationException.class);
    }
    private void scheduler(){new AlertScheduler(workspaces,evaluator).reconcile();}
    private JsonNode notices(Account a)throws Exception{return data(call(a,get("/api/notifications")).andExpect(status().isOk()).andReturn()).path("items");}
    private void mark(Account a,long id)throws Exception{call(a,patch("/api/notifications/"+id+"/read")).andExpect(status().isOk()).andExpect(jsonPath("$.data.read").value(true));}
    private JsonNode maintenance(Fixture f,String code)throws Exception{return create(f.a,"maintenance",Map.of("requestCode",code,"propertyId",f.property,"roomId",f.room,"title","Repair","priority","HIGH","estimatedCost",100));}
    private Map<String,Object> task(Fixture f,LocalDate due){return Map.of("propertyId",f.property,"title","Check","priority","MEDIUM","dueDate",due);}
    private JsonNode assign(Fixture f,String resource,JsonNode n,long user)throws Exception{return data(call(f.a,patch("/api/"+resource+"/"+id(n)+"/assignment").content(json(Map.of("version",version(n),"assigneeUserId",user)))).andExpect(status().isOk()).andReturn());}
    private JsonNode contract(Fixture f,LocalDate end)throws Exception{
        long tenant=id(create(f.a,"tenants",Map.of("fullName","Nguyễn An","phone","0901234567","status","ACTIVE")));
        return create(f.a,"contracts",Map.of("contractCode","LEASE","tenantId",tenant,"roomId",f.room,"startDate",TODAY.minusMonths(1),"endDate",end,"monthlyRent",1000,"deposit",0,"status","ACTIVE"));
    }
    private JsonNode invoice(Fixture f)throws Exception{
        var c=contract(f,TODAY.plusMonths(6));var i=create(f.a,"invoices",Map.of("invoiceCode","INV","contractId",id(c),"billingMonth","2026-09","dueDate",TODAY.minusDays(1),"rentAmount",1000,"electricityAmount",0,"waterAmount",0,"serviceAmount",0,"otherAmount",0));
        return data(call(f.a,post("/api/invoices/"+id(i)+"/issue").content(json(Map.of("version",version(i))))).andExpect(status().isOk()).andReturn());
    }
    private JsonNode pay(Fixture f,JsonNode i,String code,int amount)throws Exception{return create(f.a,"payments",Map.of("paymentCode",code,"invoiceId",id(i),"invoiceVersion",version(i),"amount",amount,"paymentMethod","CASH","paymentDate",TODAY));}
    private Account member(Fixture f,String role)throws Exception{var a=account();jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,?)",f.a.workspace,a.user,role);return new Account(a.user,f.a.workspace,a.bearer);}
    private Fixture fixture()throws Exception{
        var a=account();long property=id(create(a,"properties",Map.of("name","An Phú","code","P","address","Thủ Đức","propertyType","ROOM_RENTAL","status","ACTIVE","ownerUserId",a.user)));
        long building=id(create(a,"buildings",Map.of("propertyId",property,"name","Tòa A","code","A","numberOfFloors",3,"status","ACTIVE")));
        long room=id(create(a,"rooms",Map.of("buildingId",building,"roomCode","101","name","Phòng 101","floor",1,"area",25,"monthlyRent",1000,"status","AVAILABLE")));return new Fixture(a,property,room);
    }
    private Account account()throws Exception{
        var body=Map.of("fullName","Notification Tester","email",UUID.randomUUID()+"@test.invalid","password","Notification-test-password-2026!","workspaceName","Notification workspace");
        var r=mvc.perform(post("/api/auth/register").with(csrfCookie()).contentType(MediaType.APPLICATION_JSON).content(json(body))).andExpect(status().isCreated()).andReturn();var d=data(r);
        var a=new Account(d.path("user").path("id").asLong(),d.path("user").path("workspaces").get(0).path("id").asLong(),"Bearer "+d.path("accessToken").asText());accounts.add(a);return a;
    }
    private ResultActions call(Account a,MockHttpServletRequestBuilder r)throws Exception{return mvc.perform(r.param("workspaceId",Long.toString(a.workspace)).header("Authorization",a.bearer).contentType(MediaType.APPLICATION_JSON).with(csrfCookie()));}
    private RequestPostProcessor csrfCookie()throws Exception{var r=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();Cookie c=r.getResponse().getCookie("XSRF-TOKEN");String token=data(r).path("token").asText();return request->{request.setCookies(c);request.addHeader("X-XSRF-TOKEN",token);return request;};}
    private JsonNode create(Account a,String resource,Map<String,Object> b)throws Exception{return data(call(a,post("/api/"+resource).content(json(b))).andExpect(status().isCreated()).andReturn());}
    private String json(Object b)throws Exception{return mapper.writeValueAsString(b);}
    private JsonNode data(MvcResult r)throws Exception{return mapper.readTree(r.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");}
    private long id(JsonNode n){return n.path("id").asLong();}
    private long version(JsonNode n){return n.path("version").asLong();}
    record Account(long user,long workspace,String bearer){}
    record Fixture(Account a,long property,long room){}
}
