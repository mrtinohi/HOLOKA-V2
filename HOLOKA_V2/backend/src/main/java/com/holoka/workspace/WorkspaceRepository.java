package com.holoka.workspace;
import org.springframework.data.jpa.repository.JpaRepository;
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    java.util.List<Workspace> findByIdGreaterThanOrderByIdAsc(long after,org.springframework.data.domain.Pageable pageable);
}
