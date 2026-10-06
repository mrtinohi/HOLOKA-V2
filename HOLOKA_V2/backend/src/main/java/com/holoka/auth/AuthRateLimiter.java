package com.holoka.auth;

import com.holoka.common.error.BusinessException;
import java.time.Clock;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

/** Single-instance limit. Do not trust arbitrary X-Forwarded-For headers. */
@Component
public class AuthRateLimiter {
    private final int limit;
    private final Clock clock;
    private final Map<String, Window> windows = new HashMap<>();
    @org.springframework.beans.factory.annotation.Autowired
    public AuthRateLimiter(AuthProperties properties) { this(properties.requestsPerMinute(), Clock.systemUTC()); }
    AuthRateLimiter(int limit, Clock clock) { this.limit = limit; this.clock = clock; }
    public synchronized void check(String address) {
        long minute = clock.millis() / 60_000;
        windows.entrySet().removeIf(e -> e.getValue().minute != minute);
        var window = windows.get(address);
        if (window == null) {
            if (windows.size() >= 10_000) throw limited();
            window = new Window(minute); windows.put(address, window);
        }
        if (++window.count > limit) throw limited();
    }
    private BusinessException limited() { return new BusinessException(HttpStatus.TOO_MANY_REQUESTS, "Too many authentication attempts; try again shortly"); }
    private static final class Window {
        final long minute; int count;
        Window(long minute) { this.minute = minute; }
    }
}
