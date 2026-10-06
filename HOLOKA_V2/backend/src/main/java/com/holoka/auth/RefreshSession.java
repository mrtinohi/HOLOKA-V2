package com.holoka.auth;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.*;

@Entity @Table(name = "refresh_sessions", schema = "dbo")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RefreshSession {
    @Id @Column(columnDefinition = "uniqueidentifier") private UUID id;
    @Column(nullable = false) private long userId;
    @Column(nullable = false, columnDefinition = "uniqueidentifier") private UUID familyId;
    @Column(nullable = false, columnDefinition = "char(64)") private String tokenHash;
    @Column(nullable = false, columnDefinition = "datetime2(6)") private LocalDateTime expiresAt;
    @Column(columnDefinition = "datetime2(6)") private LocalDateTime revokedAt;
    @Column(columnDefinition = "uniqueidentifier") private UUID replacedBy;
    @Column(nullable = false, columnDefinition = "datetime2(6)") private LocalDateTime createdAt;
    public RefreshSession(long userId, UUID familyId, String hash, LocalDateTime now, LocalDateTime expiry) {
        id = UUID.randomUUID(); this.userId = userId; this.familyId = familyId;
        tokenHash = hash; createdAt = now; expiresAt = expiry;
    }
    public void rotate(UUID replacement, LocalDateTime now) { replacedBy = replacement; revokedAt = now; }
}
