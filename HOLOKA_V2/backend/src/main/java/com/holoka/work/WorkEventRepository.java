package com.holoka.work;
import org.springframework.data.jpa.repository.*;
public interface WorkEventRepository extends JpaRepository<WorkEvent,Long>,JpaSpecificationExecutor<WorkEvent> {}
