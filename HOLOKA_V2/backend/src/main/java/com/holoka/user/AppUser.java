package com.holoka.user;

import com.holoka.common.persistence.TimedEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name = "app_users", schema = "dbo")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AppUser extends TimedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Nationalized @Column(nullable = false, length = 160) private String fullName;
    @Nationalized @Column(nullable = false, length = 254) private String email;
    @Column(nullable = false, length = 255) private String passwordHash;
    @Column(nullable = false) private boolean enabled = true;
    @Column(nullable = false) private boolean platformAdmin;
    @Column(nullable = false) private long tokenVersion;

    public AppUser(String name, String email, String hash) {
        this.fullName = name; this.email = email; this.passwordHash = hash;
    }
    public void changePassword(String hash) { passwordHash = hash; tokenVersion++; }
}
