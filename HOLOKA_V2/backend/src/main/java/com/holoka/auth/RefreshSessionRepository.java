package com.holoka.auth;

import java.time.LocalDateTime;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface RefreshSessionRepository extends JpaRepository<RefreshSession, UUID> {
    @Query("select s.userId from RefreshSession s where s.tokenHash=:hash")
    Optional<Long> userIdForHash(@Param("hash") String hash);
    Optional<RefreshSession> findByTokenHash(String hash);
    @Modifying(flushAutomatically = true)
    @Query("update RefreshSession s set s.revokedAt=:now where s.familyId=:family and s.revokedAt is null")
    void revokeFamily(@Param("family") UUID family, @Param("now") LocalDateTime now);
    @Modifying(flushAutomatically = true)
    @Query("update RefreshSession s set s.revokedAt=:now where s.userId=:userId and s.revokedAt is null")
    void revokeAll(@Param("userId") long userId, @Param("now") LocalDateTime now);
}
