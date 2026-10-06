package com.holoka.workspace;

import com.holoka.common.persistence.TimedEntity;
import com.holoka.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "memberships", schema = "dbo")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Membership extends TimedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "workspace_id") private Workspace workspace;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id") private AppUser user;
    @Enumerated(EnumType.STRING) @Column(name = "role_code", nullable = false, length = 20) private Role role;
    @Column(nullable = false) private boolean enabled = true;
    public Membership(Workspace workspace, AppUser user, Role role) {
        this.workspace = workspace; this.user = user; this.role = role;
    }
}
