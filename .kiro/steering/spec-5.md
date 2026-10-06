---
inclusion: manual
---
## 5. Meetings & Minutes of Meeting (MoM) — MET SCMS PRD §9.6, §11 Meeting flow

### Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-MOM-01 | Faculty can create meeting records with all required fields | P0 | Required values validate and persist |
| FR-MOM-02 | System generates formal MoM using predefined format | P0 | Preview contains all meeting + agenda/discussion/decision/action data |
| FR-MOM-03 | Action items retain responsible person and deadline | P0 | Action item details visible in generated MoM |
| FR-MOM-04 | MoM can be exported to PDF/Word | P0 | Exported file opens successfully and reflects approved/current content |

### Meeting fields (all required unless marked optional)
- topic
- date (ISO date)
- time
- venue
- chairperson
- invitees (array of user IDs or names)
- agendaItems (array of strings)
- discussionPoints (array — one per agenda item)
- decisions (array)
- actionItems (array of `{ task, responsiblePerson, deadline }`)
- status: `SCHEDULED | HELD | CANCELLED`

### Schedule Meeting screen
- Agenda list (add/remove items)
- Invitees selector
- Chairperson field
- **Overlap warning**: warn if venue or invitee has a conflict on the same date/time
- On save: creates a calendar entry with `source: MEETING`
- Sends notification records to invitees

### Edit / Cancel / Mark Held
- Meeting can be edited before it is HELD
- Cancel → status CANCELLED; invitees notified
- Mark Held → status HELD; enables "Create MoM" action

### MoM creation
- "Create MoM" prefilled from the meeting record
- Faculty fills in discussion points, decisions, action items
- Submit to HOD for approval
- HOD can approve or reject; rejection requires a mandatory reason
- Approved MoM is immutable

### MoM bugs to avoid
- Action items MUST have `responsiblePerson` and `deadline` — not placeholders
- Discussion points must be per agenda item — not generic fake text
- Preview must show only real entered data — no lorem ipsum or fake defaults

### Notice export
- `GET /api/meetings/:id/notice` — returns 501 stub in Phase 6 (implemented in Phase 8)

### Endpoints
- `POST /api/meetings` — create
- `GET /api/meetings` — list (faculty sees own; HOD sees all)
- `GET /api/meetings/:id` — detail
- `PATCH /api/meetings/:id` — edit
- `PATCH /api/meetings/:id/cancel` — cancel
- `PATCH /api/meetings/:id/held` — mark held
- `POST /api/meetings/:id/mom` — create/update MoM draft
- `GET /api/meetings/:id/mom` — get MoM
- `POST /api/meetings/:id/mom/submit` — submit MoM to HOD
- `PATCH /api/meetings/:id/mom/approve` — HOD approve
- `PATCH /api/meetings/:id/mom/reject` — HOD reject (reason required)

### User flow (from §11)
Start → Create Meeting → Enter agenda/discussion/decisions/actions → Generate MoM → Preview → Export
