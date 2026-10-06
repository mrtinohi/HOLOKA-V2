package com.holoka.task;
import com.holoka.auth.AuthPrincipal;
import com.holoka.common.api.PageResponse;
import com.holoka.common.persistence.ListQuery;
import com.holoka.contract.LeaseCalendar;
import com.holoka.work.*;
import java.time.LocalDate;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import static com.holoka.property.InventoryPolicy.*;

@Service @RequiredArgsConstructor @Transactional(readOnly=true)
public class TaskService {
    private final TaskRepository tasks;
    private final WorkPolicy policy;
    private final LeaseCalendar calendar;
    public PageResponse<TaskDtos.View> list(AuthPrincipal p,long workspace,String search,Long property,Long room,Long assigned,TaskStatus status,Priority priority,Boolean overdue,int page,int size,String sort){
        boolean staff=policy.staff(p,workspace);var today=calendar.today(workspace);
        var spec=ListQuery.<Task>scope(workspace).and(ListQuery.equal("deleted",false)).and(ListQuery.search(search,"title","description"))
            .and(ListQuery.equal("propertyId",property)).and(ListQuery.equal("roomId",room)).and(ListQuery.equal("assignedUserId",assigned))
            .and(ListQuery.equal("status",status)).and(ListQuery.equal("priority",priority));
        if(staff)spec=spec.and(ListQuery.equal("assignedUserId",p.userId()));
        if(overdue!=null)spec=spec.and((root,q,cb) -> {
            var match=cb.and(root.get("status").in(TaskStatus.TODO,TaskStatus.IN_PROGRESS),cb.lessThan(root.get("dueDate"),today));
            return overdue?match:cb.not(match);
        });
        return PageResponse.from(tasks.findAll(spec,ListQuery.page(page,size,sort,Set.of("id","title","priority","status","dueDate","completedAt","createdAt","updatedAt"))),t -> TaskDtos.View.of(t,today));
    }
    public TaskDtos.View get(AuthPrincipal p,long workspace,long id){policy.staff(p,workspace);var t=find(workspace,id);policy.visible(p,t);return view(t);}
    public PageResponse<WorkEvent.View> history(AuthPrincipal p,long workspace,long id,int page,int size){policy.staff(p,workspace);var t=find(workspace,id);policy.visible(p,t);return policy.history(t,false,page,size);}
    @Transactional public TaskDtos.View create(AuthPrincipal p,long workspace,TaskDtos.Create b){
        policy.operator(p,workspace);policy.lockProperty(workspace,b.propertyId());policy.location(workspace,b.propertyId(),null,b.roomId());validDate(b.dueDate());
        var t=new Task(workspace,b.propertyId(),b.roomId());t.edit(b.title(),description(b.description()),b.priority());t.due(b.dueDate());tasks.saveAndFlush(t);record(p,t,"CREATE",null,null);return view(t);
    }
    @Transactional public TaskDtos.View update(AuthPrincipal p,long workspace,long id,TaskDtos.Edit b){
        policy.operator(p,workspace);var t=locked(workspace,id);version(b.version(),t.getVersion());nonterminal(t);validDate(b.dueDate());
        t.edit(b.title(),description(b.description()),b.priority());t.due(b.dueDate());tasks.flush();record(p,t,"UPDATE",t.statusName(),null);return view(t);
    }
    @Transactional public TaskDtos.View assign(AuthPrincipal p,long workspace,long id,WorkDtos.Assignment b){
        policy.operator(p,workspace);var t=locked(workspace,id);version(b.version(),t.getVersion());nonterminal(t);
        if(Objects.equals(t.getAssignedUserId(),b.assigneeUserId()))throw conflict("Assignment is unchanged");
        if(b.assigneeUserId()==null && t.getStatus()!=TaskStatus.TODO)throw conflict("Work already started; reassign it to another staff member");
        policy.assignee(workspace,b.assigneeUserId());t.assign(b.assigneeUserId());tasks.flush();record(p,t,"ASSIGN",t.statusName(),b.note());return view(t);
    }
    @Transactional public TaskDtos.View transition(AuthPrincipal p,long workspace,long id,TaskDtos.Transition b){
        boolean staff=policy.staff(p,workspace);var t=locked(workspace,id);policy.visible(p,t);version(b.version(),t.getVersion());
        if(staff && b.status()==TaskStatus.CANCELLED)throw new com.holoka.common.error.BusinessException(org.springframework.http.HttpStatus.FORBIDDEN,"Only operators can cancel work");
        boolean allowed=switch(t.getStatus()){
            case TODO -> b.status()==TaskStatus.IN_PROGRESS || b.status()==TaskStatus.CANCELLED;
            case IN_PROGRESS -> b.status()==TaskStatus.COMPLETED || b.status()==TaskStatus.CANCELLED;
            default -> false;
        };
        if(!allowed)throw conflict("Invalid task status transition");
        if(b.status()!=TaskStatus.CANCELLED){if(t.getAssignedUserId()==null)throw conflict("Assign the task before starting it");policy.assignee(workspace,t.getAssignedUserId());}
        if(b.status()==TaskStatus.CANCELLED && (b.note()==null || b.note().isBlank()))throw bad("A cancellation note is required");
        String previous=t.statusName();t.transition(b.status(),calendar.now());tasks.flush();record(p,t,"TASK_CHANGE",previous,b.note());return view(t);
    }
    @Transactional public void delete(AuthPrincipal p,long workspace,long id,long requestedVersion){
        policy.operator(p,workspace);var t=locked(workspace,id);version(requestedVersion,t.getVersion());
        if(t.getStatus()!=TaskStatus.TODO)throw conflict("Only TODO tasks can be deleted; cancel started tasks instead");
        t.delete();tasks.flush();record(p,t,"DELETE",t.statusName(),null);
    }
    private void nonterminal(Task t){if(t.getStatus()==TaskStatus.COMPLETED || t.getStatus()==TaskStatus.CANCELLED)throw conflict("Closed tasks cannot be edited or reassigned");}
    private void validDate(LocalDate date){if(date.getYear()<1 || date.getYear()>9999)throw bad("Due date is outside the supported range");}
    private TaskDtos.View view(Task t){return TaskDtos.View.of(t,calendar.today(t.getWorkspaceId()));}
    private void record(AuthPrincipal p,Task t,String action,String previous,String note){policy.record(p,t,false,action,previous,note,null,null);}
    private Task find(long workspace,long id){return tasks.findByIdAndWorkspaceIdAndDeletedFalse(id,workspace).orElseThrow(() -> missing("Task"));}
    private Task locked(long workspace,long id){return tasks.lock(id,workspace).orElseThrow(() -> missing("Task"));}
}
