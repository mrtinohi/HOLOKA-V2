package com.holoka.task;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
public interface TaskRepository extends JpaRepository<Task,Long>,JpaSpecificationExecutor<Task> {
    Optional<Task> findByIdAndWorkspaceIdAndDeletedFalse(long id,long workspaceId);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select t from Task t where t.id=:id and t.workspaceId=:workspace and t.deleted=false")
    Optional<Task> lock(long id,long workspace);
}
