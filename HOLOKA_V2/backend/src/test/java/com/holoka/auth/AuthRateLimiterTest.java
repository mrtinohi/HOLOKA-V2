package com.holoka.auth;

import com.holoka.common.error.BusinessException;
import java.time.*;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class AuthRateLimiterTest {
    @Test void boundsAttemptsByAddressAndExpiresTheWindow() {
        var clock = new MutableClock(); var limiter = new AuthRateLimiter(2, clock);
        limiter.check("client-a"); limiter.check("client-a");
        assertThatThrownBy(() -> limiter.check("client-a")).isInstanceOf(BusinessException.class)
            .satisfies(ex -> assertThat(((BusinessException)ex).getStatus().value()).isEqualTo(429));
        limiter.check("client-b"); clock.instant = clock.instant.plusSeconds(60); limiter.check("client-a");
    }
    static class MutableClock extends Clock {
        Instant instant = Instant.parse("2026-01-01T00:00:00Z");
        public ZoneId getZone() { return ZoneOffset.UTC; }
        public Clock withZone(ZoneId zone) { return this; }
        public Instant instant() { return instant; }
    }
}
