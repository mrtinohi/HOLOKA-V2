package com.holoka.building;

import com.holoka.property.RecordStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface BuildingRepository extends JpaRepository<Building,Long>, JpaSpecificationExecutor<Building> {
    Optional<Building> findByIdAndWorkspaceId(long id,long workspaceId);
    @Query("select b.propertyId from Building b where b.id=:id and b.workspaceId=:workspaceId")
    Optional<Long> parentId(@Param("id") long id,@Param("workspaceId") long workspaceId);
    boolean existsByWorkspaceIdAndPropertyId(long workspaceId,long propertyId);
    boolean existsByWorkspaceIdAndPropertyIdAndStatus(long workspaceId,long propertyId,RecordStatus status);
}
