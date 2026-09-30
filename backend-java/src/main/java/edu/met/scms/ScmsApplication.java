package edu.met.scms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class ScmsApplication {

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(ScmsApplication.class, args);
        Environment env = ctx.getEnvironment();
        String port = env.getProperty("server.port", "5000");

        System.out.println("========================================================");
        System.out.println("  MET SCMS Backend API (Java/Spring Boot) is running!");
        System.out.println("  Health Check : http://localhost:" + port + "/api/health");
        System.out.println("  Frontend     : http://localhost:" + port + "/");
        System.out.println("========================================================");
    }
}
