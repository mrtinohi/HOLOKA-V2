package com.holoka.room;

import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface RoomRepository extends JpaRepository<Room,Long>, JpaSpecificationExecutor<Room> {
    Optional<Room> findByIdAndWorkspaceId(long id,long workspaceId);
    @Query("select r.propertyId from Room r where r.id=:id and r.workspaceId=:workspaceId")
    Optional<Long> parentPropertyId(@Param("id") long id,@Param("workspaceId") long workspaceId);
    boolean existsByWorkspaceIdAndBuildingId(long workspaceId,long buildingId);
    boolean existsByWorkspaceIdAndBuildingIdAndStatusNot(long workspaceId,long buildingId,RoomStatus status);
    boolean existsByWorkspaceIdAndBuildingIdAndFloorGreaterThan(long workspaceId,long buildingId,int floor);
}
