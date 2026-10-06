---
inclusion: manual
---
## 1. Foundation, Vision & Goals — MET SCMS PRD §1–5

### Product Vision
Purpose: centralized department application replacing fragmented manual documentation with structured digital records and automated official documents.

Vision: Faculty enter event or meeting information once; the system organizes the record, applies the appropriate departmental template, supports HOD review, and produces a final PDF/Word document.

One-line summary: A two-role college department management platform for events, meetings, academic activities, approvals, reminders, analytics, and automated official documentation.

### Scope
**In scope:** event management, automatic event reports, MoM generation, academic calendar, 7-day historical reminders, HOD dashboard, approval workflow, faculty management, templates, analytics, document history and exports.

**Out of scope:** student ERP functions, fee collection, attendance, payroll, admissions, examination results, public social/community features, any third user role.

### Goals (P0 = MVP)
| ID | Goal | Target |
|----|------|--------|
| G-01 | Reduce duplicate documentation effort | One structured entry feeds the generated report |
| G-02 | Standardize event documentation | Predefined event-type templates |
| G-03 | Formalize review | Every submitted report has a visible approval status |
| G-04 | Improve historical awareness | Reminder exactly 7 days before anniversary |
| G-05 | Centralize academic activities | Annual calendar includes departmental activities |
| G-06 | Enable oversight | HOD dashboard exposes pending work and trends |

### Differentiation
The key product value is the **"enter once → generate official documentation"** workflow combined with HOD approval and historical-event awareness.

### Stack (Node/Express adaptation of PRD constraints)
- Backend: Node.js + Express in `backend/`
- Frontend: vanilla HTML/CSS/JS in `frontend/`
- Store: JSON file store (atomic writes, schemaVersion, migration)
- Roles: FACULTY and HOD only — no third role
- All "today" logic via `clock.now()` in `backend/src/services/clock.js`
- Validation: zod on all inputs
- Security: helmet, httpOnly JWT cookie, server-side RBAC
- PDF: pdfkit | Word: docx
