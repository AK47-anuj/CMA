# ─────────────────────────────────────────────────────────
# MET SCMS Backend — Production Dockerfile (Multi-Stage)
# ─────────────────────────────────────────────────────────
# Build:   docker build -t scms-backend .
# Run:     docker run -p 5000:5000 -v scms-data:/app/data scms-backend
# ─────────────────────────────────────────────────────────

# ── Stage 1: Build ──
FROM eclipse-temurin:17-jdk-alpine AS builder

WORKDIR /build

# Copy Maven wrapper and POM first (layer caching for dependencies)
COPY .mvn/ .mvn/
COPY mvnw.cmd mvnw pom.xml ./

# Download dependencies (cached unless pom.xml changes)
RUN chmod +x mvnw 2>/dev/null; \
    ./mvnw dependency:go-offline -B 2>/dev/null || \
    mvn dependency:go-offline -B

# Copy source and build
COPY src/ src/
RUN ./mvnw clean package -DskipTests -B 2>/dev/null || \
    mvn clean package -DskipTests -B

# ── Stage 2: Runtime ──
FROM eclipse-temurin:17-jre-alpine

LABEL maintainer="MET Bhujbal Knowledge City"
LABEL description="MET SCMS Backend API (Spring Boot)"

# Create non-root user
RUN addgroup -S scms && adduser -S scms -G scms

WORKDIR /app

# Copy the built JAR
COPY --from=builder /build/target/scms-backend-1.0.0.jar app.jar

# Copy frontend files (served as static resources)
COPY ../frontend/ /app/frontend/

# Create data directory for db.json persistence
RUN mkdir -p /app/data && chown -R scms:scms /app

USER scms

# Environment defaults
ENV PORT=5000
ENV FRONTEND_PATH=/app/frontend/
ENV DB_FILE_PATH=/app/data/db.json
ENV LOG_LEVEL=INFO
ENV CORS_ALLOWED_ORIGINS=*

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://localhost:5000/api/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
