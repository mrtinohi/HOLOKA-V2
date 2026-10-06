package com.holoka.notification;
import com.holoka.workspace.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.*;
import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor @EnableScheduling
@ConditionalOnProperty(name="holoka.alerts.scheduling-enabled",havingValue="true",matchIfMissing=true)
public class AlertScheduler {
    private static final Logger log=LoggerFactory.getLogger(AlertScheduler.class);
    private final WorkspaceRepository workspaces;
    private final AlertEvaluator evaluator;
    @Scheduled(initialDelayString="${holoka.alerts.initial-delay-ms:3000}",fixedDelayString="${holoka.alerts.reconcile-delay-ms:60000}")
    public void reconcile(){
        long after=0;
        while(true){
            var batch=workspaces.findByIdGreaterThanOrderByIdAsc(after,PageRequest.of(0,100));if(batch.isEmpty())return;
            for(var workspace:batch)if(workspace.isEnabled()){
                try{evaluator.evaluate(workspace.getId());}
                catch(RuntimeException ex){log.error("Scheduled alert evaluation failed for workspace {}",workspace.getId(),ex);}
            }
            after=batch.getLast().getId();
        }
    }
}
