# MET SCMS — Java Backend (Spring Boot)

Production-ready REST API backend for the MET Smart College Management System (SCMS).  
Drop-in replacement for the original Node.js/Express backend — **100% API-compatible**.

---

## Prerequisites

- **Java 17+** (JDK) — [Download Temurin](https://adoptium.net/)
- **Maven 3.8+** — [Download](https://maven.apache.org/download.cgi) (or use included `mvnw`)

---

## Quick Start (Development)

```bash
cd backend-java

# Copy and configure environment variables
cp .env.example .env

# Build and run
mvn spring-boot:run
```

The server boots on **http://localhost:5000** by default.

---

## Production Build & Run

```bash
# Build the production JAR
mvn clean package -DskipTests

# Run with environment variables
PORT=5000 \
CORS_ALLOWED_ORIGINS=https://your-domain.com \
DB_FILE_PATH=/var/data/db.json \
FRONTEND_PATH=/var/www/frontend/ \
java -jar target/scms-backend-1.0.0.jar
```

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | HTTP server port. Set automatically by most PaaS platforms. |
| `CORS_ALLOWED_ORIGINS` | **Yes** (production) | `http://localhost:5000,...` | Comma-separated allowed frontend origins |
| `FRONTEND_PATH` | No | `../frontend/` | Path to frontend static files |
| `DB_FILE_PATH` | No | `data/db.json` | Path to JSON database file |
| `LOG_LEVEL` | No | `INFO` | Logging level (TRACE/DEBUG/INFO/WARN/ERROR) |

> ⚠️ **In production**, always set `CORS_ALLOWED_ORIGINS` to your actual frontend domain(s).

---

## Docker Deployment

```bash
# Build the image
docker build -t scms-backend .

# Run with persistent data volume
docker run -d \
  -p 5000:5000 \
  -e CORS_ALLOWED_ORIGINS=https://your-domain.com \
  -v scms-data:/app/data \
  --name scms \
  scms-backend
```

---

## Health Check

```
GET /api/health
```

Returns:
```json
{
  "status": "online",
  "timestamp": "2026-09-30T09:00:00Z",
  "service": "MET SCMS Backend API",
  "version": "1.0.0"
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|--------------------------------|-------------------------------------|
| GET | `/api/health` | Health check |
| GET | `/api/users` | List users (?role=, ?status=) |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users/login` | Login by email or id |
| POST | `/api/users/register` | Register new faculty |
| PATCH | `/api/users/:id/status` | Approve / reject faculty |
| GET | `/api/reports` | List reports (?status=, ?email=) |
| GET | `/api/reports/:id` | Get report by ID |
| POST | `/api/reports` | Submit new event report |
| PUT | `/api/reports/:id` | Update / resubmit report |
| PATCH | `/api/reports/:id/status` | Approve / reject report |
| GET | `/api/meetings` | List meetings (?status=) |
| GET | `/api/meetings/:id` | Get meeting by ID |
| POST | `/api/meetings` | Create meeting (MoM) |
| PATCH | `/api/meetings/:id/status` | Approve meeting |
| GET | `/api/reminders` | List historical reminders |
| GET | `/api/reminders/:id` | Get reminder by ID |
| GET | `/api/calendar` | List calendar events |
| POST | `/api/calendar` | Add calendar event |
| GET | `/api/audit-logs` | List audit log entries |
| POST | `/api/audit-logs` | Create audit log entry |
| GET | `/api/system/tenant` | Get tenant info |
| GET | `/api/system/data` | Get all data (admin) |
| POST | `/api/system/reset` | Reset to seed data (admin) |

---

## Database

This application uses **file-based JSON persistence** (`db.json`). There is no SQL database.

- On first run, the application auto-generates `db.json` from built-in seed data
- The file location is configurable via `DB_FILE_PATH`
- **Important**: For Docker, mount a persistent volume to `/app/data` to survive container restarts

---

## Project Structure

```
backend-java/
├── pom.xml                                    # Maven build config
├── Dockerfile                                 # Production Docker image
├── .env.example                               # Environment variable template
├── src/main/
│   ├── java/edu/met/scms/
│   │   ├── ScmsApplication.java               # Spring Boot entry point
│   │   ├── config/
│   │   │   ├── WebConfig.java                 # CORS + SPA fallback
│   │   │   ├── RequestLoggingFilter.java      # Request logger
│   │   │   └── GlobalExceptionHandler.java    # Production error handling
│   │   ├── controller/                        # REST API controllers (8 files)
│   │   ├── dto/
│   │   │   └── ApiResponse.java               # Standard response wrapper
│   │   ├── model/                             # Data models / POJOs (9 files)
│   │   └── store/
│   │       └── DataStore.java                 # In-memory store + JSON persistence
│   └── resources/
│       └── application.properties             # Server config (env-var driven)
└── data/
    └── db.json                                # Runtime database (auto-generated)
```

---

## Deployment Checklist

1. ✅ Install Java JDK 17+
2. ✅ Run `mvn clean package -DskipTests`
3. ✅ Set environment variables (especially `CORS_ALLOWED_ORIGINS`)
4. ✅ Ensure `FRONTEND_PATH` points to the deployed frontend files
5. ✅ Ensure `DB_FILE_PATH` points to a writable, persistent directory
6. ✅ Run `java -jar target/scms-backend-1.0.0.jar`
7. ✅ Verify health: `curl http://your-host:PORT/api/health`
