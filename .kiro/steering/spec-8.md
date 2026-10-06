---
inclusion: manual
---
## 8. Demo Mode — MET SCMS (implementation spec)

### Flag
`DEMO_MODE=true` in `.env` enables demo features.
When `false` (or unset): all demo UI is hidden and `GET/POST /api/demo/*` returns 404.

### Demo Login Panel
- "Login as HOD" button — calls the real `/api/auth/login` with HOD demo credentials
- "Login as Faculty" button — calls the real `/api/auth/login` with Faculty demo credentials
- Credentials table displayed on the panel (email + password for each demo user)
- "Reset demo data" button — calls `POST /api/demo/reset`

### Demo seed data (all dates relative to `clock.now()`)
| Item | Description |
|------|-------------|
| Reminder due in 7 days | An event whose anniversary − 7 days = clock.now() |
| Feb-29 event | An event dated Feb 29 (leap year) to test anniversary rule |
| Reports in every status | One DRAFT, one SUBMITTED, one APPROVED, one REJECTED — each using a different event type |
| Feedback imported | The APPROVED report must have feedback from `samples/feedback_sample.xlsx` |
| Meeting conflict | Two meetings with the same venue overlapping in time |
| Held meeting | One meeting with status HELD |
| Approved MoM | One MoM linked to the held meeting, status APPROVED |

### Clock control endpoint
`POST /api/demo/clock` — body: `{ "date": "YYYY-MM-DD" }`
Sets `clock.now()` to that date for the current server process.
Only available when `DEMO_MODE=true`.

### Reset endpoint
`POST /api/demo/reset` — wipes and re-seeds all demo data. Only available when `DEMO_MODE=true`.

### Walkthrough panel
- Dismissible 12-step walkthrough panel displayed on first login in demo mode
- Each step highlights a feature
- "Switch role" button: logs out current user and logs in as the other demo role (HOD ↔ Faculty)

### verify script (`scripts/verify.sh`)
Extended to:
1. Log in as HOD demo user — check one request per HOD feature (PASS/FAIL per line)
2. Log in as Faculty demo user — check one request per Faculty feature (PASS/FAIL per line)
3. Exit with non-zero code if any check FAILs

### npm run verify
Runs: `npm run seed` → start server → `scripts/verify.sh` → shut down server → report results
