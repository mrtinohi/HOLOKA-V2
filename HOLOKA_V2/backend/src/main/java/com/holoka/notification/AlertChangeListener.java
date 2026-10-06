package com.holoka.notification;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.slf4j.*;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.*;
@Component @RequiredArgsConstructor
@ConditionalOnProperty(name="holoka.alerts.events-enabled",havingValue="true",matchIfMissing=true)
public class AlertChangeListener {
    private static final Logger log=LoggerFactory.getLogger(AlertChangeListener.class);
    private static final Set<String> SOURCES=Set.of("Property","Building","Room","Contract","Invoice","Payment","MaintenanceRequest","Task");
    private final AlertEvaluator evaluator;
    @TransactionalEventListener(phase=TransactionPhase.AFTER_COMMIT)
    public void onChange(OperationalChange change){
        if(!SOURCES.contains(change.entity()))return;
        try{evaluator.evaluate(change.workspaceId());}
        catch(RuntimeException ex){log.error("Alert evaluation failed for workspace {}; scheduled reconciliation will retry",change.workspaceId(),ex);}
    }
}
