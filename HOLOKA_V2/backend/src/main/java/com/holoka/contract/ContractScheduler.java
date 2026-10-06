package com.holoka.contract;

import com.holoka.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Component;

@Component @RequiredArgsConstructor @EnableScheduling
@ConditionalOnProperty(name="holoka.contracts.scheduling-enabled",havingValue="true",matchIfMissing=true)
public class ContractScheduler {
    private static final Logger log=LoggerFactory.getLogger(ContractScheduler.class);
    private final WorkspaceRepository workspaces;
    private final ContractRepository contracts;
    private final ContractLifecycle lifecycle;
    @Scheduled(initialDelayString="${holoka.contracts.initial-delay-ms:1000}",fixedDelayString="${holoka.contracts.reconcile-delay-ms:60000}")
    public void reconcile() {
        long afterWorkspace=0;
        while(true) {
            var batch=workspaces.findByIdGreaterThanOrderByIdAsc(afterWorkspace,PageRequest.of(0,100));
            if(batch.isEmpty()) return;
            for(var workspace:batch) {
                long afterRoom=0;
                while(true) {
                    var ids=contracts.reconciliationRooms(workspace.getId(),afterRoom,PageRequest.of(0,100));
                    if(ids.isEmpty()) break;
                    for(long roomId:ids) {
                        try { lifecycle.reconcileRoom(workspace.getId(),roomId); }
                        catch(RuntimeException ex) { log.error("Contract reconciliation failed for workspace {} room {}",workspace.getId(),roomId,ex); }
                    }
                    afterRoom=ids.getLast();
                }
            }
            afterWorkspace=batch.getLast().getId();
        }
    }
}
