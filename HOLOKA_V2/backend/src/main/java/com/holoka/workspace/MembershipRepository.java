package com.holoka.workspace;

import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface MembershipRepository extends JpaRepository<Membership, Long> {
    @Query("select m from Membership m join fetch m.workspace w where m.user.id=:userId and m.enabled=true and w.enabled=true order by w.id")
    List<Membership> activeForUser(@Param("userId") long userId);
    @Query("select m from Membership m join fetch m.workspace w where m.user.id=:userId and w.id=:workspaceId and m.enabled=true and w.enabled=true")
    Optional<Membership> activeInWorkspace(@Param("userId") long userId, @Param("workspaceId") long workspaceId);
    @EntityGraph(attributePaths = "user")
    Page<Membership> findByWorkspaceIdAndEnabledTrue(long workspaceId, Pageable pageable);
}
