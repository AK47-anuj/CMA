---
inclusion: manual
---
## 4. Historical Reminders — MET SCMS PRD §9.7 (FR-REM), §10 reminder rows, §11 reminder flow

### Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-REM-01 | System generates/displays a historical event reminder exactly 7 days before the anniversary date | P0 | Event dated 20-Aug-2025 → 2026 reminder date = 13-Aug-2026 |
| FR-REM-02 | Duplicate reminders prevented | P0 | At most one active reminder per event+anniversaryYear |
| FR-REM-03 | Read/dismissed state retained | P1 | User action changes state; same reminder not re-created in same cycle |
| FR-REM-04 | Incomplete historical data handled without false reminders | P0 | Records lacking valid event date excluded; surfaced for data-quality review |
| FR-REM-05 | Leap-year/date behaviour explicitly handled | P1 | Feb-29 policy applied consistently (use Feb 28 of non-leap year as default) |

### Business Rule
- Anniversary = original event date's month/day in the next (or later) calendar year
- Reminder trigger = anniversary date **minus 7 calendar days**
- Idempotency key: `eventId + anniversaryYear`
- The reminder fires once; dismissing it does not regenerate it in the same anniversary cycle

### Feb-29 Rule (institutional default until overridden)
- If event date is Feb 29, anniversary in non-leap year = **Feb 28**

### Service: `backend/src/services/reminderService.js`
Pure functions (no side effects — testable in isolation):
- `computeAnniversary(eventDate, targetYear)` → Date | null
- `shouldTrigger(anniversaryDate, today)` → boolean (true if today === anniversary − 7 days)

Scheduled job:
- `node-cron` daily at 00:05
- Catch-up on server start: check all events for missed triggers since last run

### Data quality list
Events with invalid/missing dates must be surfaced in a "Data quality" list visible to HOD — they are excluded from anniversary calculations.

### Reminder card UI (per-user)
- Countdown from `clock.now()` to the anniversary
- Last year's stats (event summary)
- "Open previous report" button
- "Clone to new event" button
- "Dismiss" button (persisted server-side)
- Per-user read/dismiss state saved on server

### Endpoints
- `GET /api/reminders` — list active reminders for current user
- `PATCH /api/reminders/:id/read` — mark read
- `PATCH /api/reminders/:id/dismiss` — dismiss

### Demo clock control
- `POST /api/demo/clock` — set `clock.now()` to any date (only when `DEMO_MODE=true`; returns 404 otherwise)

### Edge cases (from §10)
| Scenario | Expected behaviour |
|----------|-------------------|
| Duplicate reminder | Idempotent — same event+year creates at most one |
| Read/dismiss | Persist state; no re-creation in same cycle |
| Event edited after scheduling | Recalculate from authoritative event date |
| Leap year | Feb 28 fallback unless policy overrides |
| Missing event date | Exclude from calc; add to data-quality list |

### User flow (from §11)
Daily/system check → find historical events → calculate anniversary → decision: exactly 7 days? → create/display reminder → read/dismiss state
