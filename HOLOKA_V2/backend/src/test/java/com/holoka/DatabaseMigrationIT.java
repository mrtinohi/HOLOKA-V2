package com.holoka;

import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import static org.assertj.core.api.Assertions.*;

/** Opt in with -Psqlserver-it; always target a dedicated test database. */
@SpringBootTest
class DatabaseMigrationIT extends SqlServerTestSupport {
    @Autowired JdbcTemplate jdbc;
    @Autowired Flyway flyway;

    @Test void migrationIsValidAndRepeatableWithoutReapplying() {
        flyway.validate();
        assertThat(flyway.migrate().migrationsExecuted).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM dbo.flyway_schema_history WHERE success=1", Integer.class)).isEqualTo(6);
        assertThat(jdbc.queryForList("SELECT code FROM dbo.roles", String.class))
            .containsExactlyInAnyOrder("ADMIN", "OWNER", "MANAGER", "STAFF");
    }

    @Test @Transactional void preservesVietnameseAndRejectsDuplicateMembership() {
        long user = createUser();
        long workspace = createWorkspace();
        jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'OWNER')", workspace, user);
        assertThat(jdbc.queryForObject("SELECT name FROM dbo.workspaces WHERE id=?", String.class, workspace)).isEqualTo("Nhà An Phú – Thủ Đức");
        assertThatThrownBy(() -> jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'STAFF')", workspace, user))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test @Transactional void rejectsPlatformAdminMembership() {
        long user = createUser();
        long workspace = createWorkspace();
        assertThatThrownBy(() -> jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(?,?,'ADMIN')", workspace, user))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test @Transactional void rejectsOrphanRelationships() {
        assertThatThrownBy(() -> jdbc.update("INSERT INTO dbo.memberships(workspace_id,user_id,role_code) VALUES(-1,-1,'OWNER')"))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test @Transactional void rejectsCaseInsensitiveDuplicateEmail() {
        long user = createUser();
        String email = jdbc.queryForObject("SELECT email FROM dbo.app_users WHERE id=?", String.class, user);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO dbo.app_users(full_name,email,password_hash) VALUES(N'Test',?, 'test-only-not-a-real-password')", email.toUpperCase(java.util.Locale.ROOT)))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    private long createUser() {
        return jdbc.queryForObject("INSERT INTO dbo.app_users(full_name,email,password_hash) OUTPUT INSERTED.id VALUES(N'Nguyễn An',?,'test-only-not-a-real-password')", Long.class, UUID.randomUUID() + "@test.invalid");
    }

    private long createWorkspace() {
        return jdbc.queryForObject("INSERT INTO dbo.workspaces(name) OUTPUT INSERTED.id VALUES(N'Nhà An Phú – Thủ Đức')", Long.class);
    }
}
