# MET Institute of Management — Smart College Management System (SCMS)

Production-grade, two-role academic management platform built for **MET Bhujbal Knowledge City**. This project is cleanly organized into independent **Frontend** and **Backend** folders.

---

## 🏗️ Project Architecture

```
CMA/
├── backend/                  # Node.js & Express RESTful API Service
│   ├── src/
│   │   ├── controllers/      # Business logic (users, reports, meetings, calendar, audit)
│   │   ├── routes/           # REST API Route definitions (/api/...)
│   │   ├── data/             # In-memory store + persistent JSON database (db.json)
│   │   └── server.js         # Express app entry point (CORS, body parser, static host)
│   ├── .env                  # Port and environment configuration
│   ├── package.json          # Backend dependencies (express, cors, dotenv, etc.)
│   └── README.md             # API endpoints documentation
│
├── frontend/                 # Client Web Application
│   ├── css/
│   │   └── custom.css        # Academic print styles, official stamps, animations
│   ├── js/
│   │   ├── api.js            # REST API client with offline fallback & status badge
│   │   ├── app.js            # Two-role RBAC UI state manager and controller
│   │   ├── data.js           # Seed data store for offline / standalone execution
│   │   └── export.js         # Word (.doc) and PDF document generation
│   ├── faculty.html          # Faculty Operational Dashboard
│   ├── hod.html              # HOD Administrative Nexus & Quality Gate
│   ├── index.html            # Main Portal with Interactive Role Switching
│   └── README.md             # Frontend guide and specifications
│
├── package.json              # Root package configuration with runner scripts
└── README.md                 # Project documentation
```

---

## ⚡ Quick Start

### 1. Start the Backend API & Server
From the root directory:
```bash
npm start
```
Or navigate into the backend folder:
```bash
cd backend
npm start
```
The server will boot on **`http://localhost:5000`**.

### 2. Access the Application
- **Unified Portal (via Backend Server):** [http://localhost:5000/](http://localhost:5000/)
- **HOD Portal:** [http://localhost:5000/hod.html](http://localhost:5000/hod.html)
- **Faculty Portal:** [http://localhost:5000/faculty.html](http://localhost:5000/faculty.html)

> 💡 **Offline / Standalone Support:** You can also open any HTML file in `frontend/` directly without the backend running. The application automatically detects server availability and falls back to local data with a real-time status badge in the bottom-right corner.

---

## 👥 Two-Role System

1. **Role 1: Head of Department (HOD)**
   - Default User: `Prof. Nilesh Bread` (`hod@met.edu`)
   - Faculty onboarding authorization (Approve / Reject)
   - Quality gate review for event reports & NAAC criterion dossiers
   - Cryptographic digital signature stamp generation
   - Minutes of Meeting (MoM) ratification

2. **Role 2: Faculty Member / Teacher**
   - Default User: `Prof. Shubhangi Phade` (`shubhangi@met.edu`)
   - Single-entry event reporting with live dossier generation
   - Resubmission workflow for rejected reports
   - Minutes of Meeting (MoM) drafting and Word (.doc) export
   - 7-Day Institutional Event Anniversary Radar
