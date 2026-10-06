package com.holoka;

import com.fasterxml.jackson.databind.*;
import com.holoka.contract.*;
import com.holoka.workspace.WorkspaceRepository;
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

@SpringBootTest @AutoConfigureMockMvc @Import(LeaseIT.ClockConfiguration.class)
class LeaseIT extends SqlServerTestSupport {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired MutableClock clock;
    @Autowired ContractLifecycle lifecycle;
    @Autowired WorkspaceRepository workspaces;
    @Autowired ContractRepository contracts;
    private final List<Account> accounts=new ArrayList<>();
    private static final LocalDate TODAY=LocalDate.of(2026,9,27);

    @TestConfiguration static class ClockConfiguration {
        @Bean @Primary MutableClock testLeaseClock() {return new MutableClock();}
    }
    static class MutableClock extends Clock {
        volatile Instant time=Instant.parse("2026-09-27T05:00:00Z");
        public ZoneId getZone(){return ZoneOffset.UTC;}
        public Clock withZone(ZoneId zone){return Clock.fixed(time,zone);}
        public Instant instant(){return time;}
    }
    @BeforeEach void resetClock(){clock.time=Instant.parse("2026-09-27T05:00:00Z");}
    @AfterEach void cleanup() {
        for(var a:accounts) {
            jdbc.update("DELETE FROM dbo.contracts WHERE workspace_id=?",a.workspace);
            jdbc.update("DELETE FROM dbo.tenants WHERE workspace_id=?",a.workspace);
            jdbc.update("DELETE FROM dbo.rooms WHERE workspace_id=?",a.workspace);
            jdbc.update("DELETE FROM dbo.buildings WHERE workspace_id=?",a.workspace);
            jdbc.update("DELETE FROM dbo.properties WHERE workspace_id=?",a.workspace);
            jdbc.update("DELETE FROM dbo.audit_logs WHERE workspace_id=?",a.workspace);
        }
        for(var a:accounts) {
            jdbc.update("DELETE FROM dbo.audit_logs WHERE actor_user_id=?",a.user);
            jdbc.update("DELETE FROM dbo.refresh_sessions WHERE user_id=?",a.user);
            jdbc.update("DELETE FROM dbo.memberships WHERE user_id=?",a.user);
        }
        for(var a:accounts)jdbc.update("DELETE FROM dbo.workspaces WHERE id=?",a.workspace);
        for(var a:accounts)jdbc.update("DELETE FROM dbo.app_users WHERE id=?",a.user);
    }

    @Test void tenantCrudSearchPrivacyAndValidation() throws Exception {
        var a=account();var body=tenant("Nguyễn An");body.put("identityNumber","ID-123");var t=create(a,"tenants",body);
        call(a,get("/api/tenants").param("search","nguyễn").param("status","ACTIVE").param("size","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1)).andExpect(jsonPath("$.data.items[0].identityNumber").doesNotExist());
        call(a,get("/api/tenants/"+id(t))).andExpect(status().isOk()).andExpect(jsonPath("$.data.identityNumber").value("ID-123"));
        call(a,post("/api/tenants").content(json(body))).andExpect(status().isConflict());
        body.put("dateOfBirth",TODAY.plusDays(1));body.remove("identityNumber");call(a,post("/api/tenants").content(json(body))).andExpect(status().isBadRequest());
        body.remove("dateOfBirth");body.put("version",version(t));body.put("fullName","Nguyễn An Updated");
        var updated=data(call(a,put("/api/tenants/"+id(t)).content(json(body))).andExpect(status().isOk()).andReturn());
        call(a,put("/api/tenants/"+id(t)).content(json(body))).andExpect(status().isConflict());
        remove(a,"tenants",updated);call(a,get("/api/tenants/"+id(t))).andExpect(status().isNotFound());
        create(a,"tenants",tenant("Không có CCCD 1"));create(a,"tenants",tenant("Không có CCCD 2"));
    }

    @Test void draftEditingDeletionAndRentalHistory() throws Exception {
        var f=fixture();var body=contract(f,"DRAFT-1",TODAY,TODAY.plusMonths(1),"DRAFT");var c=create(f.a,"contracts",body);
        assertRoom(f,"AVAILABLE");body.put("version",version(c));body.put("monthlyRent",6000000);
        c=data(call(f.a,put("/api/contracts/"+id(c)).content(json(body))).andExpect(status().isOk()).andReturn());
        call(f.a,get("/api/tenants/"+f.tenant+"/contracts").param("status","DRAFT").param("sort","monthlyRent,desc"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].monthlyRent").value(6000000));
        call(f.a,delete("/api/tenants/"+f.tenant).param("version","0")).andExpect(status().isConflict());
        call(f.a,delete("/api/rooms/"+f.room).param("version","0")).andExpect(status().isConflict());
        remove(f.a,"contracts",c);call(f.a,get("/api/tenants/"+f.tenant+"/contracts")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test void activationOccupiesRoomTerminationFreesItAndPreservesHistory() throws Exception {
        var f=fixture();var body=contract(f,"LEASE",TODAY,TODAY.plusMonths(1),"DRAFT");var c=create(f.a,"contracts",body);
        c=transition(f,"activate",c);assertThat(c.path("status").asText()).isEqualTo("ACTIVE");assertRoom(f,"OCCUPIED");
        call(f.a,delete("/api/contracts/"+id(c)).param("version",Long.toString(version(c)))).andExpect(status().isConflict());
        c=transition(f,"terminate",c);assertThat(c.path("status").asText()).isEqualTo("TERMINATED");assertRoom(f,"AVAILABLE");
        call(f.a,get("/api/tenants/"+f.tenant+"/contracts")).andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].status").value("TERMINATED"));
        call(f.a,delete("/api/rooms/"+f.room).param("version","2")).andExpect(status().isConflict());
        call(f.a,delete("/api/tenants/"+f.tenant).param("version","0")).andExpect(status().isConflict());
    }

    @Test void adjacentPeriodsAllowedButOverlapsRejected() throws Exception {
        var f=fixture();create(f.a,"contracts",contract(f,"CURRENT",TODAY,TODAY.plusDays(10),"ACTIVE"));
        var next=create(f.a,"contracts",contract(f,"NEXT",TODAY.plusDays(10),TODAY.plusDays(20),"ACTIVE"));
        call(f.a,post("/api/contracts").content(json(contract(f,"OVERLAP",TODAY.plusDays(9),TODAY.plusDays(11),"ACTIVE"))))
            .andExpect(status().isConflict()).andExpect(jsonPath("$.message").value("Room has an overlapping active contract"));
        transition(f,"terminate",next);assertRoom(f,"OCCUPIED");
    }

    @Test void concurrentActivationCannotDoubleBookARoom() throws Exception {
        var f=fixture();var c1=create(f.a,"contracts",contract(f,"ONE",TODAY,TODAY.plusDays(10),"DRAFT"));
        var c2=create(f.a,"contracts",contract(f,"TWO",TODAY,TODAY.plusDays(10),"DRAFT"));
        var barrier=new CyclicBarrier(2);
        try(var pool=Executors.newFixedThreadPool(2)) {
            var first=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(f.a,post("/api/contracts/"+id(c1)+"/activate").content("{\"version\":0}")).andReturn().getResponse().getStatus();});
            var second=pool.submit(() -> {barrier.await(5,TimeUnit.SECONDS);return call(f.a,post("/api/contracts/"+id(c2)+"/activate").content("{\"version\":0}")).andReturn().getResponse().getStatus();});
            assertThat(List.of(first.get(15,TimeUnit.SECONDS),second.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.contracts WHERE workspace_id=? AND status='ACTIVE'",Integer.class,f.a.workspace)).isEqualTo(1);assertRoom(f,"OCCUPIED");
    }

    @Test void futureActiveLeaseReservesRoomAndStartsOnWorkspaceDate() throws Exception {
        var f=fixture();create(f.a,"contracts",contract(f,"FUTURE",TODAY.plusDays(1),TODAY.plusDays(2),"ACTIVE"));assertRoom(f,"AVAILABLE");
        var roomBody=room(f.building);roomBody.put("version",0);roomBody.put("status","MAINTENANCE");
        call(f.a,put("/api/rooms/"+f.room).content(json(roomBody))).andExpect(status().isConflict());
        clock.time=Instant.parse("2026-09-27T16:59:59Z");runScheduler();assertRoom(f,"AVAILABLE");
        clock.time=Instant.parse("2026-09-27T17:00:00Z");runScheduler();assertRoom(f,"OCCUPIED");
    }

    @Test void expirationUsesLocalMidnightAndIsIdempotent() throws Exception {
        var f=fixture();var c=create(f.a,"contracts",contract(f,"EXPIRING",TODAY,TODAY.plusDays(1),"ACTIVE"));
        clock.time=Instant.parse("2026-09-27T17:30:00Z");runScheduler();assertRoom(f,"AVAILABLE");
        call(f.a,get("/api/contracts/"+id(c))).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("EXPIRED"));
        call(f.a,get("/api/rooms/"+f.room)).andExpect(status().isOk()).andExpect(jsonPath("$.data.availableSince").value("2026-09-27T17:00:00"));
        int audits=jdbc.queryForObject("SELECT COUNT(*) FROM dbo.audit_logs WHERE workspace_id=?",Integer.class,f.a.workspace);
        runScheduler();assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.audit_logs WHERE workspace_id=?",Integer.class,f.a.workspace)).isEqualTo(audits);
    }

    @Test void backToBackLeasesKeepRoomOccupiedAtBoundary() throws Exception {
        var f=fixture();var first=create(f.a,"contracts",contract(f,"FIRST",TODAY,TODAY.plusDays(1),"ACTIVE"));
        create(f.a,"contracts",contract(f,"SECOND",TODAY.plusDays(1),TODAY.plusDays(2),"ACTIVE"));
        clock.time=Instant.parse("2026-09-27T17:00:00Z");runScheduler();assertRoom(f,"OCCUPIED");
        call(f.a,get("/api/contracts/"+id(first))).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("EXPIRED"));
    }

    @Test void rejectsInvalidDatesMoneyPastActivationAndDuplicateCodes() throws Exception {
        var f=fixture();var body=contract(f,"BAD",TODAY,TODAY,"DRAFT");call(f.a,post("/api/contracts").content(json(body))).andExpect(status().isBadRequest());
        body.put("endDate",TODAY.plusDays(10));body.put("deposit",-1);call(f.a,post("/api/contracts").content(json(body))).andExpect(status().isBadRequest());
        body.put("deposit",0);body.put("monthlyRent",1.001);call(f.a,post("/api/contracts").content(json(body))).andExpect(status().isBadRequest());
        var old=create(f.a,"contracts",contract(f,"OLD",TODAY.minusDays(10),TODAY,"DRAFT"));
        call(f.a,post("/api/contracts/"+id(old)+"/activate").content("{\"version\":0}")).andExpect(status().isConflict());
        call(f.a,post("/api/contracts").content(json(contract(f,"old",TODAY,TODAY.plusDays(2),"DRAFT")))).andExpect(status().isConflict());
        call(f.a,post("/api/contracts").content(json(contract(f,"EXPIRED",TODAY,TODAY.plusDays(2),"EXPIRED")))).andExpect(status().isBadRequest());
    }

    @Test void inactiveTenantAndUnrentableRoomCannotActivate() throws Exception {
        var f=fixture();var c=create(f.a,"contracts",contract(f,"DRAFT",TODAY,TODAY.plusDays(2),"DRAFT"));
        var body=tenant("Nguyễn An");body.put("version",0);body.put("status","INACTIVE");
        var inactive=data(call(f.a,put("/api/tenants/"+f.tenant).content(json(body))).andExpect(status().isOk()).andReturn());
        call(f.a,post("/api/contracts/"+id(c)+"/activate").content("{\"version\":0}")).andExpect(status().isConflict());
        body.put("version",version(inactive));body.put("status","ACTIVE");call(f.a,put("/api/tenants/"+f.tenant).content(json(body))).andExpect(status().isOk());
        var r=room(f.building);r.put("version",0);r.put("status","MAINTENANCE");call(f.a,put("/api/rooms/"+f.room).content(json(r))).andExpect(status().isOk());
        call(f.a,post("/api/contracts/"+id(c)+"/activate").content("{\"version\":0}")).andExpect(status().isConflict());
    }

    @Test void tenantCannotDeactivateWithActiveReservationAndContractStatusCannotBeForged() throws Exception {
        var f=fixture();var body=contract(f,"RESERVED",TODAY.plusDays(3),TODAY.plusDays(10),"ACTIVE");var c=create(f.a,"contracts",body);
        var t=tenant("Nguyễn An");t.put("version",0);t.put("status","INACTIVE");
        call(f.a,put("/api/tenants/"+f.tenant).content(json(t))).andExpect(status().isConflict());
        body.put("version",version(c));body.put("status","TERMINATED");call(f.a,put("/api/contracts/"+id(c)).content(json(body))).andExpect(status().isConflict());
        c=transition(f,"terminate",c);call(f.a,put("/api/tenants/"+f.tenant).content(json(t))).andExpect(status().isOk());
        call(f.a,post("/api/contracts/"+id(c)+"/activate").content(json(Map.of("version",version(c))))).andExpect(status().isConflict());
    }

    @Test void scopePermissionsAndForeignPartiesAreEnforced() throws Exception {
        var f=fixture();var other=fixture();var c=create(f.a,"contracts",contract(f,"PRIVATE",TODAY,TODAY.plusDays(1),"DRAFT"));
        for(String path:List.of("/api/tenants/"+f.tenant,"/api/tenants/"+f.tenant+"/contracts","/api/contracts/"+id(c)))call(other.a,get(path)).andExpect(status().isNotFound());
        var body=contract(other,"FOREIGN",TODAY,TODAY.plusDays(1),"ACTIVE");body.put("tenantId",f.tenant);
        call(other.a,post("/api/contracts").content(json(body))).andExpect(status().isNotFound());
        body.put("tenantId",other.tenant);body.put("roomId",f.room);call(other.a,post("/api/contracts").content(json(body))).andExpect(status().isNotFound());
        jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'STAFF')",f.a.workspace,other.a.user);
        var staff=new Account(other.a.user,f.a.workspace,other.a.bearer);
        call(staff,get("/api/tenants")).andExpect(status().isForbidden());call(staff,get("/api/contracts")).andExpect(status().isForbidden());
        jdbc.update("UPDATE dbo.memberships SET role_code='MANAGER' WHERE workspace_id=? AND user_id=?",f.a.workspace,other.a.user);
        call(staff,get("/api/contracts")).andExpect(status().isOk());
        call(staff,post("/api/contracts/"+id(c)+"/activate").content("{\"version\":0}")).andExpect(status().isOk());
    }

    @Test void contractFiltersVersionsAndImmutableParties() throws Exception {
        var f=fixture();var body=contract(f,"SEARCH-1",TODAY,TODAY.plusDays(5),"DRAFT");var c=create(f.a,"contracts",body);
        create(f.a,"contracts",contract(f,"SEARCH-2",TODAY.plusDays(5),TODAY.plusDays(10),"ACTIVE"));
        call(f.a,get("/api/contracts").param("tenantId",Long.toString(f.tenant)).param("roomId",Long.toString(f.room)).param("propertyId",Long.toString(f.property)).param("status","DRAFT").param("search","search"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(f.a,get("/api/contracts").param("size","1").param("sort","endDate,desc")).andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].contractCode").value("SEARCH-2"));
        body.put("version",0);body.put("terms","Updated");call(f.a,put("/api/contracts/"+id(c)).content(json(body))).andExpect(status().isOk());
        call(f.a,post("/api/contracts/"+id(c)+"/activate").content("{\"version\":0}")).andExpect(status().isConflict());
        body.put("version",1);body.put("tenantId",9999999);call(f.a,put("/api/contracts/"+id(c)).content(json(body))).andExpect(status().isBadRequest());
    }

    @Test void databaseRejectsForeignTenantAndInvalidDates() throws Exception {
        var f=fixture();var other=fixture();
        String sql="INSERT INTO dbo.contracts(workspace_id,property_id,tenant_id,room_id,contract_code,start_date,end_date,monthly_rent,deposit,status) VALUES(?,?,?,?,'INVALID',?,?,0,0,'DRAFT')";
        assertThatThrownBy(() -> jdbc.update(sql,f.a.workspace,f.property,other.tenant,f.room,TODAY,TODAY.plusDays(1))).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update(sql,f.a.workspace,f.property,f.tenant,f.room,TODAY,TODAY)).isInstanceOf(DataIntegrityViolationException.class);
    }

    private void runScheduler(){new ContractScheduler(workspaces,contracts,lifecycle).reconcile();}
    private JsonNode transition(Fixture f,String action,JsonNode c) throws Exception {return data(call(f.a,post("/api/contracts/"+id(c)+"/"+action).content(json(Map.of("version",version(c))))).andExpect(status().isOk()).andReturn());}
    private void assertRoom(Fixture f,String status) throws Exception {call(f.a,get("/api/rooms/"+f.room)).andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value(status));}
    private Fixture fixture() throws Exception {
        var a=account();long property=id(create(a,"properties",new HashMap<>(Map.of("name","An Phú","code","P","address","Thủ Đức","propertyType","ROOM_RENTAL","status","ACTIVE","ownerUserId",a.user))));
        long building=id(create(a,"buildings",new HashMap<>(Map.of("propertyId",property,"name","Tòa A","code","A","numberOfFloors",3,"status","ACTIVE"))));
        long room=id(create(a,"rooms",room(building)));long tenant=id(create(a,"tenants",tenant("Nguyễn An")));
        return new Fixture(a,property,building,room,tenant);
    }
    private Account account() throws Exception {
        var body=Map.of("fullName","Lease Tester","email",UUID.randomUUID()+"@test.invalid","password","Lease-test-password-2026!","workspaceName","Lease workspace");
        var result=mvc.perform(post("/api/auth/register").with(csrfCookie()).contentType(MediaType.APPLICATION_JSON).content(json(body))).andExpect(status().isCreated()).andReturn();
        var d=data(result);var a=new Account(d.path("user").path("id").asLong(),d.path("user").path("workspaces").get(0).path("id").asLong(),"Bearer "+d.path("accessToken").asText());accounts.add(a);return a;
    }
    private Map<String,Object> tenant(String name){return new HashMap<>(Map.of("fullName",name,"phone","0901234567","status","ACTIVE"));}
    private Map<String,Object> room(long building){return new HashMap<>(Map.of("buildingId",building,"roomCode","101","name","Phòng 101","floor",1,"area",25,"monthlyRent",5000000,"status","AVAILABLE"));}
    private Map<String,Object> contract(Fixture f,String code,LocalDate start,LocalDate end,String status){return new HashMap<>(Map.of("contractCode",code,"tenantId",f.tenant,"roomId",f.room,"startDate",start,"endDate",end,"monthlyRent",5000000,"deposit",5000000,"status",status));}
    private ResultActions call(Account a,MockHttpServletRequestBuilder request) throws Exception {return mvc.perform(request.param("workspaceId",Long.toString(a.workspace)).header("Authorization",a.bearer).contentType(MediaType.APPLICATION_JSON).with(csrfCookie()));}
    private RequestPostProcessor csrfCookie() throws Exception {var result=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();Cookie cookie=result.getResponse().getCookie("XSRF-TOKEN");String token=data(result).path("token").asText();return request -> {request.setCookies(cookie);request.addHeader("X-XSRF-TOKEN",token);return request;};}
    private JsonNode create(Account a,String resource,Map<String,Object> body) throws Exception{return data(call(a,post("/api/"+resource).content(json(body))).andExpect(status().isCreated()).andReturn());}
    private void remove(Account a,String resource,JsonNode row) throws Exception {call(a,delete("/api/"+resource+"/"+id(row)).param("version",Long.toString(version(row)))).andExpect(status().isOk());}
    private String json(Object body) throws Exception{return mapper.writeValueAsString(body);}
    private JsonNode data(MvcResult result) throws Exception{return mapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");}
    private long id(JsonNode node){return node.path("id").asLong();}
    private long version(JsonNode node){return node.path("version").asLong();}
    record Account(long user,long workspace,String bearer){}
    record Fixture(Account a,long property,long building,long room,long tenant){}
}
