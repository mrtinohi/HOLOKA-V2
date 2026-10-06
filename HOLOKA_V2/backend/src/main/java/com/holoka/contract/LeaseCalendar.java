package com.holoka.contract;

import com.holoka.workspace.WorkspaceRepository;
import java.time.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import static com.holoka.property.InventoryPolicy.missing;

@Component @RequiredArgsConstructor
public class LeaseCalendar {
    private final Clock clock;
    private final WorkspaceRepository workspaces;
    public ZoneId zone(long workspace) { return ZoneId.of(workspaces.findById(workspace).orElseThrow(() -> missing("Workspace")).getTimezone()); }
    public LocalDate today(long workspace) { return LocalDate.now(clock.withZone(zone(workspace))); }
    public LocalDateTime now() { return LocalDateTime.ofInstant(clock.instant(),ZoneOffset.UTC).truncatedTo(java.time.temporal.ChronoUnit.MICROS); }
    public LocalDateTime startOfDayUtc(long workspace,LocalDate date) { return LocalDateTime.ofInstant(date.atStartOfDay(zone(workspace)).toInstant(),ZoneOffset.UTC); }
}
