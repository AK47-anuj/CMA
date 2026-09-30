# MET SCMS Frontend

Interactive web portal for the **MET Institute of Management Smart College Management System (SCMS)**. Built with Vanilla JavaScript, HTML5 semantic structure, Tailwind CSS, and custom styling.

---

## 📁 Directory Structure

```
frontend/
├── css/
│   └── custom.css        # Academic print layouts, watermarks, stamps, keyframe animations
├── js/
│   ├── api.js            # REST API client with auto-fallback to offline mock dataset
│   ├── app.js            # Two-role RBAC UI state manager and controller
│   ├── data.js           # Seed data store for offline / standalone execution
│   └── export.js         # Client-side Microsoft Word (.doc) and PDF document export
├── faculty.html          # Operational Dashboard for Faculty Members
├── hod.html              # Executive Nexus & Quality Gate for Head of Department
├── index.html            # Unified Multi-view Gateway (Public, HOD, and Faculty views)
└── README.md
```

---

## 🚀 Running the Frontend

### Option 1: Served by the Express Backend (Recommended)
When the backend is running (`npm start` in the `backend/` directory), open your browser at:
`http://localhost:5000/`

### Option 2: Live Server or Standalone Browser
Open `frontend/index.html` directly in any web browser, or serve using VS Code Live Server / `npx serve frontend`.
The integrated `ApiClient` will automatically detect the backend status:
- **Backend Online:** Live synchronization with Port 5000 and persistent JSON database.
- **Backend Offline:** Gracefully falls back to local data (`SCMS_DATA`), preserving full functionality.

---

## 👥 Two-Role Architecture

| Role | Default User | Capabilities |
|---|---|---|
| **HOD** | Prof. Nilesh Bread (`hod@met.edu`) | Final authority: approves/rejects faculty onboarding, signs event dossiers with digital SHA-256 seal, approves Board of Studies MoMs. |
| **Faculty** | Prof. Shubhangi Phade (`shubhangi@met.edu`) | Operational user: creates event dossiers, resubmits rejected reports, generates Minutes of Meeting (MoM), views 7-Day anniversary radar. |
