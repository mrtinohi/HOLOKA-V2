package com.holoka.common.persistence;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import lombok.Getter;

@Getter
@MappedSuperclass
public abstract class TimedEntity {
    @Version protected long version;
    @Column(nullable = false, columnDefinition = "datetime2(6)") protected LocalDateTime createdAt;
    @Column(nullable = false, columnDefinition = "datetime2(6)") protected LocalDateTime updatedAt;
    @PrePersist protected void created() { createdAt = updatedAt = utcNow(); }
    @PreUpdate protected void updated() { updatedAt = utcNow(); }
    protected static LocalDateTime utcNow() {
        return LocalDateTime.now(ZoneOffset.UTC).truncatedTo(java.time.temporal.ChronoUnit.MICROS);
    }
}
