package edu.met.scms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

/**
 * Web configuration: CORS with configurable allowed origins,
 * and frontend SPA fallback.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${scms.cors.allowed-origins:http://localhost:5000}")
    private String allowedOriginsStr;

    /**
     * CORS filter with configurable allowed origins.
     * Origins are read from the CORS_ALLOWED_ORIGINS env var (comma-separated).
     * In development, common local ports are allowed by default.
     */
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = Arrays.asList(allowedOriginsStr.split(","));
        origins.forEach(origin -> config.addAllowedOrigin(origin.trim()));

        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }

    /**
     * Fallback route: serve index.html for non-API, non-static requests
     * (mirrors Express wildcard route for SPA).
     */
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/").setViewName("forward:/index.html");
    }
}
