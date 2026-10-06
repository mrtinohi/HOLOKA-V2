package com.holoka.auth;

import com.holoka.user.AppUser;
import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.time.Instant;
import java.util.*;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.oauth2.core.*;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Service;

@Service @EnableConfigurationProperties(AuthProperties.class)
public class JwtService {
    private final AuthProperties properties;
    private final NimbusJwtEncoder encoder;
    private final NimbusJwtDecoder decoder;

    public JwtService(AuthProperties properties) {
        this.properties = properties;
        byte[] secret;
        try { secret = Base64.getDecoder().decode(properties.jwtSecret()); }
        catch (IllegalArgumentException ex) { throw new IllegalStateException("JWT_SECRET must be Base64 encoded"); }
        if (secret.length < 32) throw new IllegalStateException("JWT_SECRET must contain at least 32 random bytes");
        var key = new SecretKeySpec(secret, "HmacSHA256");
        encoder = new NimbusJwtEncoder(new ImmutableSecret<>(key));
        decoder = NimbusJwtDecoder.withSecretKey(key).macAlgorithm(MacAlgorithm.HS256).build();
        OAuth2TokenValidator<Jwt> audience = jwt -> jwt.getAudience().contains("holoka-api")
            && jwt.getExpiresAt() != null && jwt.getIssuedAt() != null && "access".equals(jwt.getClaimAsString("kind"))
            ? OAuth2TokenValidatorResult.success()
            : OAuth2TokenValidatorResult.failure(new OAuth2Error("invalid_token"));
        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(JwtValidators.createDefaultWithIssuer(properties.issuer()), audience));
    }

    public String issue(AppUser user, UUID session) {
        Instant now = Instant.now();
        var claims = JwtClaimsSet.builder().issuer(properties.issuer()).audience(List.of("holoka-api"))
            .subject(user.getId().toString()).issuedAt(now).expiresAt(now.plusSeconds(properties.accessSeconds()))
            .id(UUID.randomUUID().toString()).claim("kind", "access").claim("sid", session.toString())
            .claim("ver", user.getTokenVersion()).build();
        return encoder.encode(JwtEncoderParameters.from(JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }
    public Jwt decode(String token) { return decoder.decode(token); }
}
