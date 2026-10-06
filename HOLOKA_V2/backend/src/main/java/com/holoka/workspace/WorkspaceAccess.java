package com.holoka.workspace;

import com.holoka.auth.AuthPrincipal;
import com.holoka.common.error.BusinessException;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class WorkspaceAccess {
    private final MembershipRepository memberships;
    @Transactional(readOnly = true)
    public Membership require(AuthPrincipal principal, long workspaceId, Role... allowed) {
        // Platform ADMIN does not imply access to every workspace's operational records.
        var membership = memberships.activeInWorkspace(principal.userId(), workspaceId)
            .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Workspace not found"));
        if (allowed.length > 0 && Arrays.stream(allowed).noneMatch(role -> role == membership.getRole()))
            throw new BusinessException(HttpStatus.FORBIDDEN, "Insufficient workspace permissions");
        return membership;
    }
}
