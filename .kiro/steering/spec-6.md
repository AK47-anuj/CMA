---
inclusion: manual
---
## 6. Events, Reports, Approval & Feedback Import — MET SCMS PRD §9.3, §9.4, §9.5

### 6A. Event Management (FR-EVT)
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-EVT-01 | Faculty can create an event record | P0 | Required fields validated; invalid inputs block save/submit |
| FR-EVT-02 | Event captures all required fields | P0 | Saved record preserves entered values and attachment metadata |
| FR-EVT-03 | Faculty can save a draft and later edit it | P0 | Draft editable; does not enter approval workflow until submitted |
| FR-EVT-04 | System prevents accidental duplicate submission | P0 | Repeated submit does not create multiple workflow submissions |

### Event fields
- name (string, required)
- date (ISO date, required — missing date blocks submit)
- venue (string, required)
- type (enum: `WORKSHOP | SEMINAR | GUEST_LECTURE | COMPETITION | INDUSTRIAL_VISIT`)
- guestName (string, optional)
- guestDesignation (string, optional)
- guestOrganisation (string, optional)
- speakerName (string, optional)
- studentCount (integer ≥ 0, required)
- facultyInvolved (array of names/IDs)
- objectives (string, required)
- activities (string, required)
- outcomes (string, required)
- attachments (array of file metadata)
- status: `DRAFT | SUBMITTED | APPROVED | REJECTED | ARCHIVED`
- version (integer, starts at 1, increments on resubmit)

### No fake defaults
- Remove/never add: "Biometric", "Industry Expert", "Within 7 Days", default `photosAttached: 4`
- Live preview shows ONLY typed data — no placeholder text

### 6B. Automatic Report Generation (FR-RPT)
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-RPT-01 | Generate report from event data using appropriate predefined format | P0 | Event type maps to template; all required fields appear in preview |
| FR-RPT-02 | Support templates for all 5 event types | P0 | Each configured type produces its corresponding format |
| FR-RPT-03 | Generation failures show actionable error state and preserve source data | P0 | User can retry without re-entering event info |
| FR-RPT-04 | Report versions/history retained | P1 | Previous states remain traceable |

### Templates (one per event type)
Location: `backend/src/templates/`
- `workshop.js`
- `seminar.js`
- `guestLecture.js`
- `competition.js`
- `industrialVisit.js`

Each template is a pure function: `(eventData, feedbackData?) → reportObject`

### 6C. Preview, Approval & Resubmission (FR-APR)
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-APR-01 | Faculty can preview generated report before submission | P0 | Preview reflects current saved data |
| FR-APR-02 | HOD can approve or reject submitted reports | P0 | Only HOD can decide; status changes logged |
| FR-APR-03 | Rejection requires a recorded reason | P0 | Faculty sees reason and can edit/resubmit |
| FR-APR-04 | Approval history records reviewer and date/time | P0 | History visible to authorized users |
| FR-APR-05 | Approved report becomes final for export | P0 | Final status prevents unauthorized content mutation |

### Approval workflow
`DRAFT → SUBMITTED → (HOD) → APPROVED | REJECTED → (Faculty edits) → SUBMITTED (version+1)`
- Approved reports are **immutable**
- `documentRef` and SHA-256 hash recorded on approval
- Notification records created on status changes

### 6D. Student Feedback Import
- `POST /api/events/:id/feedback` — multer upload, max 5 MB, xlsx/csv only
- Pure parser module (`backend/src/services/feedbackParser.js`):
  - Auto-detect: timestamp, rating, Likert and comment columns
  - Ignore: name/email/roll number columns
- Store **aggregates only**: count, averages, distribution, % positive, 5 anonymised comments
- Preview + confirm UI card with simple HTML/CSS bars
- "Student Feedback Analysis" section in report preview
- Clear error states for bad file format or wrong column structure
- Audit event: `FEEDBACK_IMPORTED`

### Sample data script
`scripts/make-samples.js` creates:
- `samples/feedback_sample.xlsx` (~40 responses)
- `samples/feedback_sample.csv` (~40 responses)

### Endpoints
- `POST /api/events` — create
- `GET /api/events` — list
- `GET /api/events/:id` — detail
- `PATCH /api/events/:id` — edit (DRAFT only)
- `POST /api/events/:id/submit` — submit to HOD (idempotent)
- `GET /api/events/:id/report` — get/generate report preview
- `PATCH /api/reports/:id/approve` — HOD approve
- `PATCH /api/reports/:id/reject` — HOD reject (reason required)
- `POST /api/events/:id/feedback` — upload feedback file

### User flows (from §11)
**Create Event & Report:** Start → Add Event → Validate → Save Draft → Generate Report → Preview → Submit → HOD queue

**HOD Approve:** Start → Pending Approval → Open Report → Review → Approve → Final document/export

**HOD Reject & Resubmit:** Start → Review → Reject → Enter reason → Faculty notified → Edit → Resubmit → HOD review
