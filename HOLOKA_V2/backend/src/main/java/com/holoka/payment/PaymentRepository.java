package com.holoka.payment;
import java.util.Optional;
import org.springframework.data.jpa.repository.*;
public interface PaymentRepository extends JpaRepository<Payment,Long>,JpaSpecificationExecutor<Payment> {
    Optional<Payment> findByIdAndWorkspaceId(long id,long workspaceId);
    @Query("select p.invoiceId from Payment p where p.id=:id and p.workspaceId=:workspace")
    Optional<Long> invoiceId(long id,long workspace);
}
