package com.holoka.tenant;

import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface TenantRepository extends JpaRepository<Tenant,Long>,JpaSpecificationExecutor<Tenant> {
    Optional<Tenant> findByIdAndWorkspaceId(long id,long workspaceId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tenant t where t.id=:id and t.workspaceId=:workspaceId")
    Optional<Tenant> lock(@Param("id") long id,@Param("workspaceId") long workspaceId);
}
