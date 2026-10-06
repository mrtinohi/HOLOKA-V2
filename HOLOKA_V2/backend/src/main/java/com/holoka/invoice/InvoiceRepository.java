package com.holoka.invoice;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
public interface InvoiceRepository extends JpaRepository<Invoice,Long>,JpaSpecificationExecutor<Invoice> {
    Optional<Invoice> findByIdAndWorkspaceId(long id,long workspaceId);
    @Lock(LockModeType.PESSIMISTIC_WRITE) @Query("select i from Invoice i where i.id=:id and i.workspaceId=:workspace")
    Optional<Invoice> lock(long id,long workspace);
}
