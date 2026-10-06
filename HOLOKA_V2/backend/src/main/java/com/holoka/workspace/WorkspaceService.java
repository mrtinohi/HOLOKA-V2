package com.holoka.workspace;

import com.holoka.auth.AuthPrincipal;
import com.holoka.auth.AuthDtos.WorkspaceView;
import com.holoka.common.error.BusinessException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor @Transactional(readOnly = true)
public class WorkspaceService {
    private final WorkspaceAccess access;
    private final MembershipRepository memberships;
    public WorkspaceView details(AuthPrincipal principal, long workspaceId) {
        var membership = access.require(principal, workspaceId);
        return new WorkspaceView(workspaceId, membership.getWorkspace().getName(), membership.getRole().name());
    }
    public MemberPage members(AuthPrincipal principal, long workspaceId, int page, int size) {
        access.require(principal, workspaceId, Role.OWNER, Role.MANAGER);
        if (page < 0 || size < 1 || size > 100) throw new BusinessException(HttpStatus.BAD_REQUEST, "Page must be nonnegative and size must be between 1 and 100");
        var result = memberships.findByWorkspaceIdAndEnabledTrue(workspaceId, PageRequest.of(page, size, Sort.by("id")));
        var items = result.getContent().stream().map(m -> new MemberView(m.getUser().getId(), m.getUser().getFullName(), m.getRole().name())).toList();
        return new MemberPage(items, page, size, result.getTotalElements(), result.getTotalPages());
    }
    public record MemberView(long userId, String fullName, String role) {}
    public record MemberPage(List<MemberView> items, int page, int size, long totalElements, int totalPages) {}
}
