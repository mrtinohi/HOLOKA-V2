package com.holoka.config;

import io.swagger.v3.oas.models.*;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.*;
import org.springframework.context.annotation.*;

@Configuration
public class OpenApiConfig {
    @Bean org.springdoc.core.customizers.OpenApiCustomizer csrfHeaderDocumentation() {
        return api -> api.getPaths().values().forEach(path -> path.readOperationsMap().forEach((method, operation) -> {
            if (java.util.Set.of(PathItem.HttpMethod.POST, PathItem.HttpMethod.PUT, PathItem.HttpMethod.PATCH, PathItem.HttpMethod.DELETE).contains(method)) {
                operation.addParametersItem(new io.swagger.v3.oas.models.parameters.Parameter().in("header").name("X-XSRF-TOKEN")
                    .required(true).description("Token returned by GET /api/auth/csrf; send its XSRF-TOKEN cookie too")
                    .schema(new io.swagger.v3.oas.models.media.StringSchema()));
            }
        }));
    }
    @Bean OpenAPI holokaApi() {
        return new OpenAPI().info(new Info().title("HOLOKA API").version("0.1.0")
            .description("Implemented backend endpoints only. Fetch /api/auth/csrf and send its cookie/header before mutations. Registration and login are public; authenticated endpoints require bearer access tokens."))
            .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
    }
}
