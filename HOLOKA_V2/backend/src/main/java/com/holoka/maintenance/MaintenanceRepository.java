package com.holoka.maintenance;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
public interface MaintenanceRepository extends JpaRepository<MaintenanceRequest,Long>,JpaSpecificationExecutor<MaintenanceRequest> {
    Optional<MaintenanceRequest> findByIdAndWorkspaceId(long id,long workspaceId);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select m from MaintenanceRequest m where m.id=:id and m.workspaceId=:workspace")
    Optional<MaintenanceRequest> lock(long id,long workspace);
}
