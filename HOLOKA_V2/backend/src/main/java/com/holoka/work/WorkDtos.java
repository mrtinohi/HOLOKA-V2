package com.holoka.work;
import jakarta.validation.constraints.*;
public final class WorkDtos {
    private WorkDtos(){}
    public record Assignment(@NotNull @PositiveOrZero Long version,@Positive Long assigneeUserId,@Size(max=1000) String note){}
}
