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

@SpringBootTest @AutoConfigureMockMvc @Import(OperationsIT.ClockConfiguration.class)
class OperationsIT extends SqlServerTestSupport {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired MutableClock clock;
    private final List<Account> accounts=new ArrayList<>();
    @TestConfiguration static class ClockConfiguration {@Bean @Primary MutableClock operationsClock(){return new MutableClock();}}
    static class MutableClock extends Clock {
        volatile Instant time=Instant.parse("2026-09-29T05:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return Clock.fixed(time,zone);}
        public Instant instant(){return time;}
    }
    @BeforeEach void resetClock(){clock.time=Instant.parse("2026-09-29T05:00:00Z");}
    @AfterEach void cleanup(){
        for(var a:accounts)for(String table:List.of("work_events","maintenance_requests","tasks","contracts","tenants","rooms","buildings","properties","audit_logs"))jdbc.update("DELETE FROM dbo."+table+" WHERE workspace_id=?",a.workspace);
        for(var a:accounts){jdbc.update("DELETE FROM dbo.audit_logs WHERE actor_user_id=?",a.user);jdbc.update("DELETE FROM dbo.refresh_sessions WHERE user_id=?",a.user);jdbc.update("DELETE FROM dbo.memberships WHERE user_id=?",a.user);}
        for(var a:accounts)jdbc.update("DELETE FROM dbo.workspaces WHERE id=?",a.workspace);
        for(var a:accounts)jdbc.update("DELETE FROM dbo.app_users WHERE id=?",a.user);
    }
    @Test void maintenanceCreatesEditsAndFiltersPersistedRecords() throws Exception {
        var f=fixture();var m=create(f.a,"maintenance",maintenance(f,"REPAIR"));
        assertThat(m.path("status").asText()).isEqualTo("OPEN");assertThat(m.path("buildingId").asLong()).isEqualTo(f.building);
        var edit=Map.of("version",version(m),"title","Sửa máy lạnh","description","Phòng 101","priority","URGENT");
        m=data(call(f.a,put("/api/maintenance/"+id(m)).content(json(edit))).andExpect(status().isOk()).andReturn());
        call(f.a,get("/api/maintenance").param("search","máy lạnh").param("propertyId",Long.toString(f.property)).param("buildingId",Long.toString(f.building)).param("roomId",Long.toString(f.room)).param("priority","URGENT").param("status","OPEN").param("sort","reportedAt,desc").param("size","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(f.a,get("/api/maintenance/"+id(m)+"/history")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(2)).andExpect(jsonPath("$.data.items[0].action").value("UPDATE"));
        call(f.a,put("/api/maintenance/"+id(m)).content(json(edit))).andExpect(status().isConflict());
    }
    @Test void assignedStaffCompletesMaintenanceWithWaitingAndCostHistory() throws Exception {
        var f=fixture();var staff=staff(f);var m=create(f.a,"maintenance",maintenance(f,"WORK"));m=assign(f.a,"maintenance",m,staff.user);
        assertThat(m.path("status").asText()).isEqualTo("ASSIGNED");m=state(staff,"maintenance",m,"IN_PROGRESS",null);
        m=state(staff,"maintenance",m,"WAITING","Chờ linh kiện");m=state(staff,"maintenance",m,"IN_PROGRESS",null);
        m=data(call(f.a,patch("/api/maintenance/"+id(m)+"/costs").content(json(Map.of("version",version(m),"estimatedCost","200000.25","actualCost","190000.10","note","Hóa đơn linh kiện")))).andExpect(status().isOk()).andReturn());
        m=state(staff,"maintenance",m,"COMPLETED","Đã kiểm tra");
        assertThat(m.path("completedAt").asText()).isEqualTo("2026-09-29T05:00:00");
        assertThat(m.path("actualCost").decimalValue()).isEqualByComparingTo("190000.10");
        call(staff,get("/api/maintenance/"+id(m)+"/history")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(7)).andExpect(jsonPath("$.data.items[0].actorUserId").value(staff.user));
        call(f.a,get("/api/rooms/"+f.room)).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("AVAILABLE"));
    }
    @Test void staffOnlySeesAssignedWorkAndCannotEditAssignOrChangeCosts() throws Exception {
        var f=fixture();var s=staff(f);var mine=create(f.a,"maintenance",maintenance(f,"MINE"));var hidden=create(f.a,"maintenance",maintenance(f,"HIDDEN"));mine=assign(f.a,"maintenance",mine,s.user);
        call(s,get("/api/maintenance")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(s,get("/api/maintenance/"+id(hidden))).andExpect(status().isNotFound());call(s,get("/api/maintenance/"+id(hidden)+"/history")).andExpect(status().isNotFound());
        call(s,patch("/api/maintenance/"+id(hidden)+"/status").content(json(Map.of("version",version(hidden),"status","CANCELLED","note","No")))).andExpect(status().isNotFound());
        call(s,post("/api/maintenance").content(json(maintenance(f,"STAFF-CREATE")))).andExpect(status().isForbidden());
        call(s,patch("/api/maintenance/"+id(mine)+"/assignment").content(json(Map.of("version",version(mine),"assigneeUserId",s.user)))).andExpect(status().isForbidden());
        call(s,patch("/api/maintenance/"+id(mine)+"/costs").content(json(Map.of("version",version(mine),"estimatedCost",0,"actualCost",0,"note","No")))).andExpect(status().isForbidden());
        call(s,patch("/api/maintenance/"+id(mine)+"/status").content(json(Map.of("version",version(mine),"status","CANCELLED","note","No")))).andExpect(status().isForbidden());
        call(s,get("/api/tenants")).andExpect(status().isForbidden());call(s,get("/api/invoices")).andExpect(status().isForbidden());
    }
    @Test void reassigningImmediatelyRevokesPreviousStaffAccess() throws Exception {
        var f=fixture();var first=staff(f);var second=staff(f);var m=assign(f.a,"maintenance",create(f.a,"maintenance",maintenance(f,"SWAP")),first.user);
        m=state(first,"maintenance",m,"IN_PROGRESS",null);m=assign(f.a,"maintenance",m,second.user);
        call(first,get("/api/maintenance/"+id(m))).andExpect(status().isNotFound());call(first,get("/api/maintenance/"+id(m)+"/history")).andExpect(status().isNotFound());
        call(first,get("/api/maintenance").param("assignedUserId",Long.toString(second.user))).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        state(second,"maintenance",m,"COMPLETED",null);
    }
    @Test void rejectsInvalidAssigneesAndRevokedMembership() throws Exception {
        var f=fixture();var s=staff(f);var foreign=account();var m=create(f.a,"maintenance",maintenance(f,"ASSIGNEE"));
        call(f.a,patch("/api/maintenance/"+id(m)+"/assignment").content(json(Map.of("version",version(m),"assigneeUserId",foreign.user)))).andExpect(status().isNotFound());
        call(f.a,patch("/api/maintenance/"+id(m)+"/assignment").content(json(Map.of("version",version(m),"assigneeUserId",f.a.user)))).andExpect(status().isBadRequest());
        jdbc.update("UPDATE dbo.app_users SET enabled=0 WHERE id=?",s.user);
        call(f.a,patch("/api/maintenance/"+id(m)+"/assignment").content(json(Map.of("version",version(m),"assigneeUserId",s.user)))).andExpect(status().isBadRequest());
        jdbc.update("UPDATE dbo.app_users SET enabled=1 WHERE id=?",s.user);m=assign(f.a,"maintenance",m,s.user);
        jdbc.update("UPDATE dbo.memberships SET enabled=0 WHERE workspace_id=? AND user_id=?",f.a.workspace,s.user);
        call(s,get("/api/maintenance/"+id(m))).andExpect(status().isNotFound());
        call(f.a,patch("/api/maintenance/"+id(m)+"/status").content(json(Map.of("version",version(m),"status","IN_PROGRESS")))).andExpect(status().isNotFound());
    }
    @Test void maintenanceRejectsInvalidTransitionsAndProtectsClosedRecords() throws Exception {
        var f=fixture();var m=create(f.a,"maintenance",maintenance(f,"CLOSE"));
        call(f.a,patch("/api/maintenance/"+id(m)+"/status").content(json(Map.of("version",version(m),"status","COMPLETED")))).andExpect(status().isConflict());
        call(f.a,patch("/api/maintenance/"+id(m)+"/status").content(json(Map.of("version",version(m),"status","CANCELLED")))).andExpect(status().isBadRequest());
        m=state(f.a,"maintenance",m,"CANCELLED","Không còn cần sửa");
        call(f.a,put("/api/maintenance/"+id(m)).content(json(Map.of("version",version(m),"title","Again","priority","LOW")))).andExpect(status().isConflict());
        call(f.a,patch("/api/maintenance/"+id(m)+"/costs").content(json(Map.of("version",version(m),"estimatedCost",0,"actualCost",0,"note","No")))).andExpect(status().isConflict());
        assertThat(m.path("completedAt").isNull()).isTrue();
    }
    @Test void costCorrectionsAfterCompletionKeepTimestampAndHistory() throws Exception {
        var f=fixture();var s=staff(f);var m=assign(f.a,"maintenance",create(f.a,"maintenance",maintenance(f,"COST")),s.user);
        m=state(s,"maintenance",m,"IN_PROGRESS",null);m=state(s,"maintenance",m,"COMPLETED",null);
        var body=new HashMap<String,Object>(Map.of("version",version(m),"estimatedCost",100,"actualCost",90,"note","Final invoice"));
        body.put("actualCost",-1);call(f.a,patch("/api/maintenance/"+id(m)+"/costs").content(json(body))).andExpect(status().isBadRequest());
        body.put("actualCost","90.001");call(f.a,patch("/api/maintenance/"+id(m)+"/costs").content(json(body))).andExpect(status().isBadRequest());
        body.put("actualCost",90);clock.time=Instant.parse("2026-09-30T05:00:00Z");
        call(f.a,patch("/api/maintenance/"+id(m)+"/costs").content(json(body))).andExpect(status().isOk()).andExpect(jsonPath("$.data.completedAt").value("2026-09-29T05:00:00"));
        call(f.a,get("/api/maintenance/"+id(m)+"/history").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].actualCost").value(90));
    }
    @Test void locationAndTenantLinksCannotCrossScope() throws Exception {
        var f=fixture();var other=fixture();var body=maintenance(f,"LOCATION");body.put("roomId",other.room);
        call(f.a,post("/api/maintenance").content(json(body))).andExpect(status().isNotFound());
        body.put("roomId",f.room);body.put("buildingId",other.building);call(f.a,post("/api/maintenance").content(json(body))).andExpect(status().isNotFound());
        long t=id(create(f.a,"tenants",Map.of("fullName","Nguyễn An","phone","0901234567","status","ACTIVE")));
        body.remove("buildingId");body.put("tenantId",t);call(f.a,post("/api/maintenance").content(json(body))).andExpect(status().isBadRequest());
        create(f.a,"contracts",Map.of("contractCode","LEASE","tenantId",t,"roomId",f.room,"startDate","2026-09-01","endDate","2027-09-01","monthlyRent",5000000,"deposit",0,"status","ACTIVE"));
        create(f.a,"maintenance",body);
        var task=task(f);task.put("roomId",other.room);call(f.a,post("/api/tasks").content(json(task))).andExpect(status().isNotFound());
    }
    @Test void taskCrudDeletionPreservesHistoryAndHidesRecord() throws Exception {
        var f=fixture();var t=create(f.a,"tasks",task(f));
        t=data(call(f.a,put("/api/tasks/"+id(t)).content(json(Map.of("version",version(t),"title","Kiểm tra bình chữa cháy","priority","HIGH","dueDate","2026-10-01")))).andExpect(status().isOk()).andReturn());
        call(f.a,get("/api/tasks").param("search","chữa cháy").param("priority","HIGH").param("sort","dueDate,asc")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(f.a,delete("/api/tasks/"+id(t)).param("version",Long.toString(version(t)))).andExpect(status().isOk());
        call(f.a,get("/api/tasks/"+id(t))).andExpect(status().isNotFound());call(f.a,get("/api/tasks/"+id(t)+"/history")).andExpect(status().isNotFound());
        call(f.a,get("/api/tasks")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.work_events WHERE task_id=?",Integer.class,id(t))).isEqualTo(3);
    }
    @Test void assignedStaffCompletesTaskAndCannotDeleteOrCancelIt() throws Exception {
        var f=fixture();var s=staff(f);var t=create(f.a,"tasks",task(f));
        call(f.a,patch("/api/tasks/"+id(t)+"/status").content(json(Map.of("version",version(t),"status","IN_PROGRESS")))).andExpect(status().isConflict());
        t=assign(f.a,"tasks",t,s.user);t=state(s,"tasks",t,"IN_PROGRESS",null);
        call(s,delete("/api/tasks/"+id(t)).param("version",Long.toString(version(t)))).andExpect(status().isForbidden());
        call(f.a,delete("/api/tasks/"+id(t)).param("version",Long.toString(version(t)))).andExpect(status().isConflict());
        call(s,patch("/api/tasks/"+id(t)+"/status").content(json(Map.of("version",version(t),"status","CANCELLED","note","No")))).andExpect(status().isForbidden());
        t=state(s,"tasks",t,"COMPLETED",null);assertThat(t.path("completedAt").asText()).isEqualTo("2026-09-29T05:00:00");
        call(s,get("/api/tasks/"+id(t)+"/history")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(4));
        call(f.a,patch("/api/tasks/"+id(t)+"/status").content(json(Map.of("version",version(t),"status","TODO")))).andExpect(status().isConflict());
    }
    @Test void taskOverdueChangesAtWorkspaceMidnightAndExcludesCancelled() throws Exception {
        var f=fixture();var t=create(f.a,"tasks",task(f));clock.time=Instant.parse("2026-09-29T16:59:59Z");
        call(f.a,get("/api/tasks/"+id(t))).andExpect(status().isOk()).andExpect(jsonPath("$.data.overdue").value(false));
        clock.time=Instant.parse("2026-09-29T17:00:00Z");
        call(f.a,get("/api/tasks").param("overdue","true")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1)).andExpect(jsonPath("$.data.items[0].overdue").value(true));
        state(f.a,"tasks",t,"CANCELLED","Cancelled");
        call(f.a,get("/api/tasks").param("overdue","true")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
    }
    @Test void taskListsAndHistoryAreLimitedToCurrentAssignee() throws Exception {
        var f=fixture();var s=staff(f);var other=staff(f);var mine=assign(f.a,"tasks",create(f.a,"tasks",task(f)),s.user);var hidden=assign(f.a,"tasks",create(f.a,"tasks",task(f)),other.user);
        call(s,get("/api/tasks").param("size","1")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1)).andExpect(jsonPath("$.data.items[0].id").value(id(mine)));
        call(s,get("/api/tasks/"+id(hidden))).andExpect(status().isNotFound());call(s,get("/api/tasks/"+id(hidden)+"/history")).andExpect(status().isNotFound());
        call(s,patch("/api/tasks/"+id(hidden)+"/status").content(json(Map.of("version",version(hidden),"status","IN_PROGRESS")))).andExpect(status().isNotFound());
        call(s,post("/api/tasks").content(json(task(f)))).andExpect(status().isForbidden());
        mine=assign(f.a,"tasks",mine,other.user);call(s,get("/api/tasks/"+id(mine))).andExpect(status().isNotFound());
    }
    @Test void workspaceIsolationAndManagerAccess() throws Exception {
        var f=fixture();var outsider=account();var m=create(f.a,"maintenance",maintenance(f,"PRIVATE"));var t=create(f.a,"tasks",task(f));
        call(outsider,get("/api/maintenance/"+id(m))).andExpect(status().isNotFound());call(outsider,get("/api/tasks/"+id(t))).andExpect(status().isNotFound());
        jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'MANAGER')",f.a.workspace,outsider.user);var manager=new Account(outsider.user,f.a.workspace,outsider.bearer);
        create(manager,"tasks",task(f));create(manager,"maintenance",maintenance(f,"MANAGER"));
        state(manager,"tasks",t,"CANCELLED","Manager cancelled");
    }
    @Test void concurrentMaintenanceUpdatesHaveOneWinnerAndOneHistoryEvent() throws Exception {
        var f=fixture();var m=create(f.a,"maintenance",maintenance(f,"CONCURRENT"));var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)){
            var one=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(f.a,patch("/api/maintenance/"+id(m)+"/costs").content(json(Map.of("version",version(m),"estimatedCost",100,"actualCost",90,"note","One")))).andReturn().getResponse().getStatus();});
            var two=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(f.a,patch("/api/maintenance/"+id(m)+"/costs").content(json(Map.of("version",version(m),"estimatedCost",200,"actualCost",180,"note","Two")))).andReturn().getResponse().getStatus();});
            assertThat(List.of(one.get(20,TimeUnit.SECONDS),two.get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.work_events WHERE maintenance_id=?",Integer.class,id(m))).isEqualTo(2);
    }
    @Test void concurrentTaskCompletionAndCancellationCannotBothSucceed() throws Exception {
        var f=fixture();var s=staff(f);var created=assign(f.a,"tasks",create(f.a,"tasks",task(f)),s.user);final var t=state(s,"tasks",created,"IN_PROGRESS",null);var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)){
            var one=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(s,patch("/api/tasks/"+id(t)+"/status").content(json(Map.of("version",version(t),"status","COMPLETED")))).andReturn().getResponse().getStatus();});
            var two=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(f.a,patch("/api/tasks/"+id(t)+"/status").content(json(Map.of("version",version(t),"status","CANCELLED","note","Cancel")))).andReturn().getResponse().getStatus();});
            assertThat(List.of(one.get(20,TimeUnit.SECONDS),two.get(20,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.work_events WHERE task_id=?",Integer.class,id(t))).isEqualTo(4);
    }
    @Test void databaseConstraintsRejectForeignAssignmentsAndInvalidCompletion() throws Exception {
        var f=fixture();var other=account();var m=create(f.a,"maintenance",maintenance(f,"SQL"));var t=create(f.a,"tasks",task(f));
        assertThatThrownBy(() -> jdbc.update("UPDATE dbo.maintenance_requests SET assigned_user_id=?,status='ASSIGNED' WHERE id=?",other.user,id(m))).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("UPDATE dbo.maintenance_requests SET actual_cost=-1 WHERE id=?",id(m))).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("UPDATE dbo.tasks SET status='COMPLETED' WHERE id=?",id(t))).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("UPDATE dbo.work_events SET workspace_id=? WHERE task_id=?",other.workspace,id(t))).isInstanceOf(DataIntegrityViolationException.class);
    }
    @Test void validatesDuplicateCodesBlankTitleAndPagination() throws Exception {
        var f=fixture();create(f.a,"maintenance",maintenance(f,"DUP"));call(f.a,post("/api/maintenance").content(json(maintenance(f,"dup")))).andExpect(status().isConflict());
        var b=task(f);b.put("title"," ");call(f.a,post("/api/tasks").content(json(b))).andExpect(status().isBadRequest());
        call(f.a,get("/api/tasks").param("size","101")).andExpect(status().isBadRequest());call(f.a,get("/api/maintenance").param("sort","tenant.identityNumber,asc")).andExpect(status().isBadRequest());
        call(f.a,get("/api/maintenance").param("search","%_")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
    }
    private Map<String,Object> maintenance(Fixture f,String code){return new HashMap<>(Map.of("requestCode",code,"propertyId",f.property,"roomId",f.room,"title","Sửa vòi nước","priority","HIGH","estimatedCost",200000));}
    private Map<String,Object> task(Fixture f){return new HashMap<>(Map.of("propertyId",f.property,"roomId",f.room,"title","Kiểm tra phòng","priority","MEDIUM","dueDate","2026-09-29"));}
    private JsonNode assign(Account a,String resource,JsonNode n,Long user) throws Exception {var b=new HashMap<String,Object>();b.put("version",version(n));b.put("assigneeUserId",user);return data(call(a,patch("/api/"+resource+"/"+id(n)+"/assignment").content(json(b))).andExpect(status().isOk()).andReturn());}
    private JsonNode state(Account a,String resource,JsonNode n,String status,String note) throws Exception {var b=new HashMap<String,Object>(Map.of("version",version(n),"status",status));if(note!=null)b.put("note",note);return data(call(a,patch("/api/"+resource+"/"+id(n)+"/status").content(json(b))).andExpect(status().isOk()).andReturn());}
    private Account staff(Fixture f) throws Exception {var a=account();jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'STAFF')",f.a.workspace,a.user);return new Account(a.user,f.a.workspace,a.bearer);}
    private Fixture fixture() throws Exception {
        var a=account();long property=id(create(a,"properties",Map.of("name","An Phú","code","P","address","Thủ Đức","propertyType","ROOM_RENTAL","status","ACTIVE","ownerUserId",a.user)));
        long building=id(create(a,"buildings",Map.of("propertyId",property,"name","Tòa A","code","A","numberOfFloors",3,"status","ACTIVE")));
        long room=id(create(a,"rooms",Map.of("buildingId",building,"roomCode","101","name","Phòng 101","floor",1,"area",25,"monthlyRent",5000000,"status","AVAILABLE")));
        return new Fixture(a,property,building,room);
    }
    private Account account() throws Exception {
        var body=Map.of("fullName","Operations Tester","email",UUID.randomUUID()+"@test.invalid","password","Operations-test-password-2026!","workspaceName","Operations workspace");
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
    record Fixture(Account a,long property,long building,long room){}
}
