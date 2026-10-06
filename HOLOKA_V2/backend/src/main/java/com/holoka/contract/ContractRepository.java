package com.holoka.contract;

import java.time.LocalDate;
import java.util.*;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface ContractRepository extends JpaRepository<Contract,Long>,JpaSpecificationExecutor<Contract> {
    @Query("select count(c)>0 from Contract c, Room r where c.workspaceId=:workspace and c.tenantId=:tenant and c.propertyId=:property and c.status<>com.holoka.contract.ContractStatus.DRAFT and r.id=c.roomId and r.workspaceId=c.workspaceId and (:building is null or r.buildingId=:building) and (:room is null or c.roomId=:room)")
    boolean hasMaintenanceRelationship(long workspace,long tenant,long property,Long building,Long room);
    Optional<Contract> findByIdAndWorkspaceId(long id,long workspaceId);
    @Query("select c.propertyId from Contract c where c.id=:id and c.workspaceId=:workspace")
    Optional<Long> parentId(@Param("id") long id,@Param("workspace") long workspace);
    boolean existsByWorkspaceIdAndTenantId(long workspace,long tenant);
    boolean existsByWorkspaceIdAndRoomId(long workspace,long room);
    boolean existsByWorkspaceIdAndTenantIdAndStatus(long workspace,long tenant,ContractStatus status);
    boolean existsByWorkspaceIdAndRoomIdAndStatus(long workspace,long room,ContractStatus status);
    @Query("select count(c)>0 from Contract c where c.workspaceId=:workspace and c.roomId=:room and c.status=com.holoka.contract.ContractStatus.ACTIVE and c.startDate<:end and c.endDate>:start")
    boolean overlaps(@Param("workspace") long workspace,@Param("room") long room,@Param("start") LocalDate start,@Param("end") LocalDate end);
    @Query("select c from Contract c where c.workspaceId=:workspace and c.roomId=:room and c.status=com.holoka.contract.ContractStatus.ACTIVE and c.endDate<=:today")
    List<Contract> expiredActive(@Param("workspace") long workspace,@Param("room") long room,@Param("today") LocalDate today);
    @Query("select count(c)>0 from Contract c where c.workspaceId=:workspace and c.roomId=:room and c.status=com.holoka.contract.ContractStatus.ACTIVE and c.startDate<=:today and c.endDate>:today")
    boolean occupiedToday(@Param("workspace") long workspace,@Param("room") long room,@Param("today") LocalDate today);
    @Query("select r.id from Room r where r.workspaceId=:workspace and r.id>:after and (r.status=com.holoka.room.RoomStatus.OCCUPIED or exists(select c.id from Contract c where c.workspaceId=:workspace and c.roomId=r.id and c.status=com.holoka.contract.ContractStatus.ACTIVE)) order by r.id")
    List<Long> reconciliationRooms(@Param("workspace") long workspace,@Param("after") long after,Pageable pageable);
}
