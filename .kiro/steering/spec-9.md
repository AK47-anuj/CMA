---
inclusion: manual
---
## 9. Academic Calendar, Notifications & HOD Dashboard — MET SCMS PRD §9.7 FR-CAL, §9.8 FR-NOT/FR-ANA

### 9A. Academic Calendar (FR-CAL)
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-CAL-01 | Annual calendar displays events, workshops, seminars, meetings, examinations, holidays, deadlines and other activities | P0 | Items can be opened to view details |
| FR-CAL-02 | HOD can manage calendar entries | P0 | Create/update/archive actions permission-controlled and audited |

### Calendar sources
All events in the calendar come from one of these sources (stored as `source` field):
- `EVENT` — from the events collection
- `MEETING` — from the meetings collection
- `MANUAL` — HOD-created standalone entries

### Academic year definition
1 June to 31 May (open question resolved to this default)

### Month grid display
- Render a proper month grid (not a list)
- Show correct month labels for every month — do NOT hardcode "SEP" or "OCT"
- Each cell shows items for that day; clicking opens detail

### HOD calendar management
- `POST /api/calendar` — create manual entry (HOD only)
- `PATCH /api/calendar/:id` — edit entry (HOD only)
- `PATCH /api/calendar/:id/archive` — archive entry (HOD only)
- `GET /api/calendar` — list (all authenticated users), supports `?month=YYYY-MM` filter

### 9B. Notifications (FR-NOT)
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-NOT-01 | Users receive in-application status/reminder notifications | P0 | Approval/rejection and reminders visible to intended user |

### Notification bell
- Unread count badge on bell icon
- History panel with search and filters (by type, date range)
- Notification types: `REPORT_APPROVED`, `REPORT_REJECTED`, `REMINDER`, `MEETING_INVITE`, `MEETING_CANCELLED`, `MOM_APPROVED`, `MOM_REJECTED`

### Endpoints
- `GET /api/notifications` — list for current user (supports `?unread=true`)
- `PATCH /api/notifications/:id/read` — mark read
- `PATCH /api/notifications/read-all` — mark all read

### 9C. HOD Dashboard (FR-ANA)
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-ANA-01 | Dashboard shows events, student participation, meetings, reports, pending approvals, upcoming activities, trends, categories, faculty involvement, status | P1 | Data derived from stored records; filters update results correctly |
| FR-ANA-02 | Academic-year comparisons available when sufficient data exists | P1 | Comparison clearly identifies selected academic years |

### Dashboard metrics (computed from real data — no hardcoded numbers)
- Total events this academic year (by type)
- Total student participation (sum of studentCount)
- Pending approvals count (with list)
- Reports by status (DRAFT / SUBMITTED / APPROVED / REJECTED)
- Meetings count (SCHEDULED / HELD / CANCELLED)
- Upcoming activities in next 30 days
- Faculty activity ranking (events submitted)
- Academic-year comparison chart (when ≥2 years of data)

### User flow (from §11)
Academic Calendar: Start → Calendar → Filter/view item → Open details → HOD may create/update/archive
