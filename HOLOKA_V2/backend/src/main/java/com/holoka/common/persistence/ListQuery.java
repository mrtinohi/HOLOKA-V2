package com.holoka.common.persistence;

import com.holoka.common.error.BusinessException;
import java.util.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;

public final class ListQuery {
    private ListQuery() {}
    public static Pageable page(int page, int size, String sort, Set<String> allowed) {
        if (page < 0 || page > 100000 || size < 1 || size > 100) throw bad("Page must be 0–100000 and size 1–100");
        String[] parts = sort.split(",", -1);
        if (parts.length != 2 || !allowed.contains(parts[0]) || !(parts[1].equals("asc") || parts[1].equals("desc")))
            throw bad("Invalid sort; use an allowed field followed by ,asc or ,desc");
        var order = Sort.by(Sort.Direction.fromString(parts[1]), parts[0]);
        if (!parts[0].equals("id")) order = order.and(Sort.by("id"));
        return PageRequest.of(page, size, order);
    }
    public static <T> Specification<T> scope(long workspaceId) {
        return (root, query, cb) -> cb.equal(root.get("workspaceId"), workspaceId);
    }
    public static <T> Specification<T> equal(String field, Object value) {
        return (root, query, cb) -> value == null ? cb.conjunction() : cb.equal(root.get(field), value);
    }
    public static <T> Specification<T> search(String value, String... fields) {
        if (value == null || value.isBlank()) return (root, query, cb) -> cb.conjunction();
        if (value.length() > 120) throw bad("Search must be at most 120 characters");
        String pattern = "%" + value.strip().toLowerCase(Locale.ROOT).replace("\\", "\\\\")
            .replace("%", "\\%").replace("_", "\\_").replace("[", "\\[") + "%";
        return (root, query, cb) -> cb.or(Arrays.stream(fields)
            .map(field -> cb.like(cb.lower(root.get(field)), pattern, '\\')).toArray(jakarta.persistence.criteria.Predicate[]::new));
    }
    public static BusinessException bad(String message) { return new BusinessException(HttpStatus.BAD_REQUEST, message); }
}
