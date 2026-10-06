package com.holoka.workspace;

import com.holoka.common.persistence.TimedEntity;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Nationalized;

@Entity @Table(name = "workspaces", schema = "dbo")
@Getter @NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Workspace extends TimedEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Nationalized @Column(nullable = false, length = 160) private String name;
    @Column(nullable = false, columnDefinition = "char(3)") private String currency = "VND";
    @Column(nullable = false, length = 80) private String timezone = "Asia/Ho_Chi_Minh";
    @Column(nullable = false) private int vacancyAlertDays = 30;
    @Column(nullable = false) private boolean enabled = true;
    public Workspace(String name) { this.name = name; }
}
