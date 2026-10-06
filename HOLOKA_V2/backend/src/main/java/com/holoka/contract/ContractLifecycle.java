package com.holoka.contract;

import com.holoka.audit.*;
import com.holoka.property.InventoryPolicy;
import com.holoka.room.*;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.missing;

@Service @RequiredArgsConstructor
public class ContractLifecycle {
    private final InventoryPolicy policy;
    private final RoomRepository rooms;
    private final ContractRepository contracts;
    private final LeaseCalendar calendar;
    private final AuditRepository audit;

    @Transactional
    public void reconcileRoom(long workspace,long roomId) {
        var parent=rooms.parentPropertyId(roomId,workspace);
        if(parent.isEmpty()) return;
        policy.lockProperty(workspace,parent.get());
        var room=rooms.findByIdAndWorkspaceId(roomId,workspace).orElseThrow(() -> missing("Room"));
        reconcileLocked(room);
    }

    /** Caller must hold the property's write lock inside a transaction. */
    void reconcileLocked(Room room) {
        long workspace=room.getWorkspaceId();LocalDate today=calendar.today(workspace);
        var expired=contracts.expiredActive(workspace,room.getId(),today);
        for(var contract:expired) {
            contract.expire();
            audit.save(new AuditLog(workspace,null,"CONTRACT_CHANGE","Contract",contract.getId().toString(),"Contract expired at its end date"));
        }
        contracts.flush();
        boolean occupied=contracts.occupiedToday(workspace,room.getId(),today);
        var vacantAt=expired.stream().map(Contract::getEndDate).max(LocalDate::compareTo)
            .map(date -> calendar.startOfDayUtc(workspace,date)).orElseGet(calendar::now);
        var previous=room.getStatus();room.reconcileOccupancy(occupied,vacantAt);rooms.flush();
        if(previous!=room.getStatus())
            audit.save(new AuditLog(workspace,null,"UPDATE","Room",room.getId().toString(),"Contract lifecycle changed room status to "+room.getStatus()));
    }
}
