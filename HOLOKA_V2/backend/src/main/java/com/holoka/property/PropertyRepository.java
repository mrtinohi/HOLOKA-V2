package com.holoka.property;

import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface PropertyRepository extends JpaRepository<Property,Long>, JpaSpecificationExecutor<Property> {
    Optional<Property> findByIdAndWorkspaceId(long id,long workspaceId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Property p where p.id=:id and p.workspaceId=:workspaceId")
    Optional<Property> lock(@Param("id") long id,@Param("workspaceId") long workspaceId);
}
