package com.holoka;

import com.fasterxml.jackson.databind.*;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.*;
import org.springframework.test.web.servlet.request.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest @AutoConfigureMockMvc
class InventoryIT extends SqlServerTestSupport {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    private final List<Account> accounts=new ArrayList<>();

    @AfterEach void cleanupFixtures() {
        for(var a:accounts) {
            jdbc.update("DELETE FROM dbo.rooms WHERE workspace_id=?",a.workspace);
            jdbc.update("DELETE FROM dbo.buildings WHERE workspace_id=?",a.workspace);
            jdbc.update("DELETE FROM dbo.properties WHERE workspace_id=?",a.workspace);
        }
        for(var a:accounts) {
            jdbc.update("DELETE FROM dbo.audit_logs WHERE actor_user_id=?",a.user);
            jdbc.update("DELETE FROM dbo.refresh_sessions WHERE user_id=?",a.user);
            jdbc.update("DELETE FROM dbo.memberships WHERE user_id=?",a.user);
        }
        for(var a:accounts) jdbc.update("DELETE FROM dbo.workspaces WHERE id=?",a.workspace);
        for(var a:accounts) jdbc.update("DELETE FROM dbo.app_users WHERE id=?",a.user);
    }

    @Test void ownerCanCreateReadUpdateAndDeleteWholeHierarchy() throws Exception {
        var a=account();var pBody=property(a,"an-phu");var p=create(a,"properties",pBody);
        assertThat(p.path("code").asText()).isEqualTo("AN-PHU");
        var bBody=building(p.path("id").asLong(),"A");var b=create(a,"buildings",bBody);
        var rBody=room(b.path("id").asLong(),"A101");var r=create(a,"rooms",rBody);
        assertThat(r.path("propertyId").asLong()).isEqualTo(p.path("id").asLong());
        assertThat(r.path("availableSince").asText()).isNotBlank();
        call(a,get("/api/rooms/"+r.path("id").asLong())).andExpect(status().isOk()).andExpect(jsonPath("$.data.name").value("Phòng có ban công"));
        rBody.put("version",r.path("version").asLong());rBody.put("monthlyRent",6500000);
        var updated=data(call(a,put("/api/rooms/"+r.path("id").asLong()).content(json(rBody))).andExpect(status().isOk()).andReturn());
        assertThat(updated.path("monthlyRent").decimalValue()).isEqualByComparingTo("6500000");
        assertThat(updated.path("availableSince").asText()).isEqualTo(r.path("availableSince").asText());
        bBody.put("version",b.path("version").asLong());bBody.put("name","Tòa nhà mới");
        b=data(call(a,put("/api/buildings/"+b.path("id").asLong()).content(json(bBody))).andExpect(status().isOk()).andReturn());
        pBody.put("version",p.path("version").asLong());pBody.put("address","Quận Bình Thạnh, TP.HCM");
        p=data(call(a,put("/api/properties/"+p.path("id").asLong()).content(json(pBody))).andExpect(status().isOk()).andReturn());
        remove(a,"rooms",updated);remove(a,"buildings",b);remove(a,"properties",p);
        call(a,get("/api/properties/"+p.path("id").asLong())).andExpect(status().isNotFound());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.audit_logs WHERE workspace_id=? AND entity IN ('Property','Building','Room')",Integer.class,a.workspace)).isEqualTo(9);
    }

    @Test void foreignWorkspaceIdsAreRejectedForReadsWritesAndFilters() throws Exception {
        var a=account();var other=account();var p=create(a,"properties",property(a,"P"));var b=create(a,"buildings",building(p.path("id").asLong(),"B"));
        var r=create(a,"rooms",room(b.path("id").asLong(),"R"));
        for(String kind:List.of("properties","buildings","rooms")) {
            long id=kind.equals("properties")?p.path("id").asLong():kind.equals("buildings")?b.path("id").asLong():r.path("id").asLong();
            call(other,get("/api/"+kind+"/"+id)).andExpect(status().isNotFound());
            call(other,delete("/api/"+kind+"/"+id).param("version","0")).andExpect(status().isNotFound());
            call(other,get("/api/"+kind)).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        }
        call(other,post("/api/buildings").content(json(building(p.path("id").asLong(),"X")))).andExpect(status().isNotFound());
        call(other,post("/api/rooms").content(json(room(b.path("id").asLong(),"X")))).andExpect(status().isNotFound());
        call(other,get("/api/rooms").param("propertyId",p.path("id").asText())).andExpect(status().isNotFound());
        call(other,get("/api/buildings").param("propertyId",p.path("id").asText())).andExpect(status().isNotFound());
        mvc.perform(get("/api/properties").param("workspaceId",Long.toString(a.workspace)).header("Authorization",other.bearer)).andExpect(status().isNotFound());
    }

    @Test void managersOperateButCannotCreateDeleteOrTransferPropertiesAndStaffAreRestricted() throws Exception {
        var owner=account();var colleague=account();
        jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'MANAGER')",owner.workspace,colleague.user);
        var manager=new Account(colleague.user,owner.workspace,colleague.bearer);
        var pBody=property(owner,"P");var p=create(owner,"properties",pBody);
        call(manager,post("/api/properties").content(json(property(owner,"OTHER")))).andExpect(status().isForbidden());
        call(manager,delete("/api/properties/"+p.path("id").asLong()).param("version","0")).andExpect(status().isForbidden());
        pBody.put("version",0);pBody.put("name","Updated by manager");
        p=data(call(manager,put("/api/properties/"+p.path("id").asLong()).content(json(pBody))).andExpect(status().isOk()).andReturn());
        pBody.put("version",p.path("version").asLong());pBody.put("ownerUserId",colleague.user);
        call(manager,put("/api/properties/"+p.path("id").asLong()).content(json(pBody))).andExpect(status().isForbidden());
        var b=create(manager,"buildings",building(p.path("id").asLong(),"B"));create(manager,"rooms",room(b.path("id").asLong(),"R"));
        jdbc.update("UPDATE dbo.memberships SET role_code='STAFF' WHERE workspace_id=? AND user_id=?",owner.workspace,colleague.user);
        for(String path:List.of("/api/properties","/api/buildings","/api/rooms")) call(manager,get(path)).andExpect(status().isForbidden());
        call(manager,post("/api/rooms").content(json(room(b.path("id").asLong(),"X")))).andExpect(status().isForbidden());
    }

    @Test void validatesAmountsFloorEnumsRequiredFieldsAndDuplicateCodes() throws Exception {
        var a=account();var p=create(a,"properties",property(a,"P"));
        call(a,post("/api/properties").content(json(property(a,"p")))).andExpect(status().isConflict());
        var b=create(a,"buildings",building(p.path("id").asLong(),"B"));var rBody=room(b.path("id").asLong(),"R");
        create(a,"rooms",rBody);call(a,post("/api/rooms").content(json(rBody))).andExpect(status().isConflict());
        rBody.put("roomCode","R2");rBody.put("monthlyRent",-1);
        call(a,post("/api/rooms").content(json(rBody))).andExpect(status().isBadRequest());
        rBody.put("monthlyRent",123.456);call(a,post("/api/rooms").content(json(rBody))).andExpect(status().isBadRequest());
        rBody.put("monthlyRent",0);rBody.put("area",0);call(a,post("/api/rooms").content(json(rBody))).andExpect(status().isBadRequest());
        rBody.put("area",20);rBody.put("floor",4);call(a,post("/api/rooms").content(json(rBody))).andExpect(status().isBadRequest());
        rBody.put("floor",1);rBody.put("status","INVALID");call(a,post("/api/rooms").content(json(rBody))).andExpect(status().isBadRequest());
        var badProperty=property(a,"BAD");badProperty.remove("name");call(a,post("/api/properties").content(json(badProperty))).andExpect(status().isBadRequest());
        mvc.perform(get("/api/properties").header("Authorization",a.bearer)).andExpect(status().isBadRequest());
        call(a,get("/api/rooms").param("status","INVALID")).andExpect(status().isBadRequest());
    }

    @Test void parentLifecycleProtectsChildrenAndFloorBounds() throws Exception {
        var a=account();var pBody=property(a,"P");var p=create(a,"properties",pBody);
        var bBody=building(p.path("id").asLong(),"B");var b=create(a,"buildings",bBody);
        var rBody=room(b.path("id").asLong(),"R");rBody.put("floor",3);var r=create(a,"rooms",rBody);
        call(a,delete("/api/properties/"+p.path("id").asLong()).param("version","0")).andExpect(status().isConflict());
        call(a,delete("/api/buildings/"+b.path("id").asLong()).param("version","0")).andExpect(status().isConflict());
        pBody.put("version",0);pBody.put("status","INACTIVE");call(a,put("/api/properties/"+p.path("id").asLong()).content(json(pBody))).andExpect(status().isConflict());
        bBody.put("version",0);bBody.put("numberOfFloors",2);call(a,put("/api/buildings/"+b.path("id").asLong()).content(json(bBody))).andExpect(status().isConflict());
        bBody.put("numberOfFloors",3);bBody.put("status","INACTIVE");call(a,put("/api/buildings/"+b.path("id").asLong()).content(json(bBody))).andExpect(status().isConflict());
        rBody.put("version",0);rBody.put("status","INACTIVE");r=data(call(a,put("/api/rooms/"+r.path("id").asLong()).content(json(rBody))).andExpect(status().isOk()).andReturn());
        assertThat(r.path("availableSince").isNull()).isTrue();
        call(a,put("/api/buildings/"+b.path("id").asLong()).content(json(bBody))).andExpect(status().isOk());
        call(a,put("/api/properties/"+p.path("id").asLong()).content(json(pBody))).andExpect(status().isOk());
        rBody.put("version",r.path("version").asLong());rBody.put("status","AVAILABLE");
        call(a,put("/api/rooms/"+r.path("id").asLong()).content(json(rBody))).andExpect(status().isConflict());
        call(a,post("/api/buildings").content(json(building(p.path("id").asLong(),"NEW")))).andExpect(status().isConflict());
    }

    @Test void optimisticVersionsRejectConcurrentLostUpdates() throws Exception {
        var a=account();var p=create(a,"properties",property(a,"P"));var b=create(a,"buildings",building(p.path("id").asLong(),"B"));
        var rBody=room(b.path("id").asLong(),"R");var r=create(a,"rooms",rBody);rBody.put("version",0);rBody.put("name","Changed room");
        var barrier=new CyclicBarrier(2);String payload=json(rBody);long id=r.path("id").asLong();
        try(var pool=Executors.newFixedThreadPool(2)) {
            Callable<Integer> update=() -> {barrier.await(5,TimeUnit.SECONDS);return call(a,put("/api/rooms/"+id).content(payload)).andReturn().getResponse().getStatus();};
            var first=pool.submit(update);var second=pool.submit(update);
            assertThat(List.of(first.get(15,TimeUnit.SECONDS),second.get(15,TimeUnit.SECONDS))).containsExactlyInAnyOrder(200,409);
        }
        call(a,delete("/api/rooms/"+id).param("version","0")).andExpect(status().isConflict());
        rBody.remove("version");call(a,put("/api/rooms/"+id).content(json(rBody))).andExpect(status().isBadRequest());
        call(a,delete("/api/rooms/"+id)).andExpect(status().isBadRequest());
    }

    @Test void databaseRejectsCrossWorkspaceAndMismatchedParentReferences() throws Exception {
        var a=account();var other=account();var p=create(a,"properties",property(a,"P"));var p2=create(a,"properties",property(a,"P2"));
        var b=create(a,"buildings",building(p.path("id").asLong(),"B"));
        assertThatThrownBy(() -> jdbc.update("INSERT INTO dbo.buildings(workspace_id,property_id,name,code,number_of_floors,status) VALUES(?,?,N'Invalid','X',1,'ACTIVE')",other.workspace,p.path("id").asLong())).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO dbo.rooms(workspace_id,property_id,building_id,name,room_code,floor,area,monthly_rent,status) VALUES(?,?,?,N'Invalid','X',1,20,100,'INACTIVE')",a.workspace,p2.path("id").asLong(),b.path("id").asLong())).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test void propertyListsSearchFilterSortPaginateAndTreatWildcardsLiterally() throws Exception {
        var a=account();var special=property(a,"P1");special.put("name","An_100% [House]");create(a,"properties",special);
        var second=property(a,"P2");second.put("name","Bình An");second.put("propertyType","HOUSE");create(a,"properties",second);
        call(a,get("/api/properties").param("search","_")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(a,get("/api/properties").param("search","%")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(a,get("/api/properties").param("search","[House]")).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(a,get("/api/properties").param("search","bình").param("propertyType","HOUSE").param("status","ACTIVE"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].name").value("Bình An"));
        call(a,get("/api/properties").param("sort","code,asc").param("page","1").param("size","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].code").value("P2")).andExpect(jsonPath("$.data.totalPages").value(2));
        call(a,get("/api/properties").param("sort","owner.passwordHash,asc")).andExpect(status().isBadRequest());
        call(a,get("/api/properties").param("size","101")).andExpect(status().isBadRequest());
        call(a,get("/api/properties").param("page","-1")).andExpect(status().isBadRequest());
    }

    @Test void buildingAndRoomListsCombineScopedFiltersAndNumericSorting() throws Exception {
        var a=account();var p=create(a,"properties",property(a,"P"));var p2=create(a,"properties",property(a,"P2"));
        var b=create(a,"buildings",building(p.path("id").asLong(),"A"));create(a,"buildings",building(p2.path("id").asLong(),"A"));
        var r1=room(b.path("id").asLong(),"R1");r1.put("monthlyRent",1000);create(a,"rooms",r1);
        var r2=room(b.path("id").asLong(),"R2");r2.put("monthlyRent",2000);r2.put("status","MAINTENANCE");create(a,"rooms",r2);
        call(a,get("/api/buildings").param("propertyId",p.path("id").asText()).param("search","A").param("status","ACTIVE"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        call(a,get("/api/rooms").param("propertyId",p.path("id").asText()).param("buildingId",b.path("id").asText()).param("status","MAINTENANCE"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].roomCode").value("R2"));
        call(a,get("/api/rooms").param("sort","monthlyRent,desc").param("size","1"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.data.items[0].roomCode").value("R2")).andExpect(jsonPath("$.data.totalElements").value(2));
        call(a,get("/api/rooms").param("propertyId",p2.path("id").asText()).param("buildingId",b.path("id").asText())).andExpect(status().isBadRequest());
    }

    @Test void rejectsInvalidOwnersAndMovingExistingParents() throws Exception {
        var a=account();var other=account();var bad=property(a,"BAD");bad.put("ownerUserId",other.user);
        call(a,post("/api/properties").content(json(bad))).andExpect(status().isBadRequest());
        var p=create(a,"properties",property(a,"P"));var p2=create(a,"properties",property(a,"P2"));
        var bBody=building(p.path("id").asLong(),"B");var b=create(a,"buildings",bBody);
        var b2=create(a,"buildings",building(p2.path("id").asLong(),"B"));
        bBody.put("propertyId",p2.path("id").asLong());bBody.put("version",0);
        call(a,put("/api/buildings/"+b.path("id").asLong()).content(json(bBody))).andExpect(status().isBadRequest());
        var rBody=room(b.path("id").asLong(),"R");var r=create(a,"rooms",rBody);rBody.put("buildingId",b2.path("id").asLong());rBody.put("version",0);
        call(a,put("/api/rooms/"+r.path("id").asLong()).content(json(rBody))).andExpect(status().isBadRequest());
    }

    @Test void occupancyCannotBeForgedOrClearedByRoomCrud() throws Exception {
        var a=account();var p=create(a,"properties",property(a,"P"));var b=create(a,"buildings",building(p.path("id").asLong(),"B"));
        var body=room(b.path("id").asLong(),"R");body.put("status","OCCUPIED");
        call(a,post("/api/rooms").content(json(body))).andExpect(status().isConflict());
        body.put("status","AVAILABLE");var r=create(a,"rooms",body);body.put("version",0);body.put("status","OCCUPIED");
        call(a,put("/api/rooms/"+r.path("id").asLong()).content(json(body))).andExpect(status().isConflict());
        // Fixture represents future contract-managed state; this does not implement contracts.
        jdbc.update("UPDATE dbo.rooms SET status='OCCUPIED',available_since=NULL WHERE id=?",r.path("id").asLong());
        body.put("status","AVAILABLE");call(a,put("/api/rooms/"+r.path("id").asLong()).content(json(body))).andExpect(status().isConflict());
        call(a,delete("/api/rooms/"+r.path("id").asLong()).param("version","0")).andExpect(status().isConflict());
    }

    private Account account() throws Exception {
        var request=Map.of("fullName","Inventory Tester","email",UUID.randomUUID()+"@test.invalid","password","Inventory-test-password!","workspaceName","Inventory test workspace");
        var result=mvc.perform(post("/api/auth/register").with(csrfCookie()).contentType(MediaType.APPLICATION_JSON).content(json(request))).andExpect(status().isCreated()).andReturn();
        var d=data(result);var a=new Account(d.path("user").path("id").asLong(),d.path("user").path("workspaces").get(0).path("id").asLong(),"Bearer "+d.path("accessToken").asText());accounts.add(a);return a;
    }
    private ResultActions call(Account a,MockHttpServletRequestBuilder request) throws Exception {
        return mvc.perform(request.param("workspaceId",Long.toString(a.workspace)).header("Authorization",a.bearer).contentType(MediaType.APPLICATION_JSON).with(csrfCookie()));
    }
    private RequestPostProcessor csrfCookie() throws Exception {
        var result=mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();Cookie cookie=result.getResponse().getCookie("XSRF-TOKEN");String token=data(result).path("token").asText();
        return request -> {request.setCookies(cookie);request.addHeader("X-XSRF-TOKEN",token);return request;};
    }
    private JsonNode create(Account a,String resource,Map<String,Object> body) throws Exception {return data(call(a,post("/api/"+resource).content(json(body))).andExpect(status().isCreated()).andReturn());}
    private void remove(Account a,String resource,JsonNode record) throws Exception {call(a,delete("/api/"+resource+"/"+record.path("id").asLong()).param("version",record.path("version").asText())).andExpect(status().isOk());}
    private Map<String,Object> property(Account a,String code) {return new HashMap<>(Map.of("name","Nhà An Phú","code",code,"address","Thủ Đức, TP.HCM","propertyType","ROOM_RENTAL","status","ACTIVE","ownerUserId",a.user));}
    private Map<String,Object> building(long property,String code) {return new HashMap<>(Map.of("propertyId",property,"name","Tòa A","code",code,"numberOfFloors",3,"status","ACTIVE"));}
    private Map<String,Object> room(long building,String code) {return new HashMap<>(Map.of("buildingId",building,"roomCode",code,"name","Phòng có ban công","floor",1,"area",25.5,"monthlyRent",5000000,"status","AVAILABLE"));}
    private String json(Object value) throws Exception {return mapper.writeValueAsString(value);}
    private JsonNode data(MvcResult result) throws Exception {return mapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).path("data");}
    record Account(long user,long workspace,String bearer) {}
}
