# MET SCMS Backend API

Production-grade RESTful API service for the **MET Institute of Management Smart College Management System (SCMS)**. Built with Node.js & Express with JSON data store persistence.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example environment file or create `.env`:
```bash
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

### 3. Run the Server
```bash
# Production mode
npm start

# Development mode (with live reload)
npm run dev
```

The server will start at: `http://localhost:5000`

---

## 📡 API Endpoints

### System & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service status and uptime |
| `GET` | `/api/system/tenant` | College & department accreditation metadata |
| `GET` | `/api/system/data` | Full state synchronization payload |
| `POST` | `/api/system/reset` | Reset database to initial seed data |

### Users & Onboarding
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/users` | List all users (query params: `role`, `status`) |
| `GET` | `/api/users/:id` | Fetch specific user details |
| `POST` | `/api/users/login` | Authenticate by email or user ID |
| `POST` | `/api/users/register` | Faculty self-registration (`PENDING_HOD_APPROVAL`) |
| `PATCH` | `/api/users/:id/status` | HOD approval (`ACTIVE`) or rejection (`REJECTED`) |

### Event Reports & NAAC Dossiers
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reports` | List event dossiers (query params: `status`, `submittedByEmail`) |
| `GET` | `/api/reports/:id` | Fetch specific dossier |
| `POST` | `/api/reports` | Submit new event dossier |
| `PUT` | `/api/reports/:id` | Edit / resubmit rejected dossier |
| `PATCH` | `/api/reports/:id/status`| HOD approve (`APPROVED` with digital signature) or reject |

### Minutes of Meeting (MoM)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/meetings` | List all meeting minutes |
| `GET` | `/api/meetings/:id` | Get specific meeting record |
| `POST` | `/api/meetings` | Submit new Board of Studies / Faculty MoM |
| `PATCH` | `/api/meetings/:id/status`| Approve MoM record |

### Historical Reminders (7-Day Radar)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders` | List recurring institutional milestone reminders |
| `GET` | `/api/reminders/:id` | Get single reminder |

### Academic Calendar
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/calendar` | List department calendar events |
| `POST` | `/api/calendar` | Add new academic event to calendar |

### Compliance Audit Trail
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/audit-logs` | Immutable audit log trail for NAAC/NBA inspection |
| `POST` | `/api/audit-logs` | Create custom audit log event |

---

## 💾 Data Persistence
Changes made through API routes are automatically persisted to `src/data/db.json`. If `db.json` is deleted, the server automatically re-initializes from `src/data/initialData.js`.
