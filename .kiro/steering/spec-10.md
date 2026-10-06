---
inclusion: manual
---
## 10. Edge Cases & Exception Handling — MET SCMS PRD §10

| Feature | Scenario | Expected System Behaviour |
|---------|----------|--------------------------|
| Event | Duplicate event/report creation | Warn where duplicate is detectable; do not duplicate on repeated submit (idempotent submit) |
| Event | Missing date | Block submission; field-level validation error |
| Event | Past/future date | Allow per configured policy; do not invent a restriction |
| Reminder | Duplicate reminder | Idempotent generation for same event+year anniversary |
| Reminder | Read/dismiss | Persist state; avoid repeated duplicate notification for same cycle |
| Reminder | Event edited after scheduling | Recalculate anniversary eligibility from authoritative event date |
| Reminder | Leap year | Apply approved anniversary policy (Feb 28 default); flag as Open Question if overridden |
| Historical data | Missing event date | Exclude from anniversary calculation; surface data-quality issue |
| Generation | Report generation failure | Preserve event data; show retry/error state |
| Attachment | Invalid file/type | Reject with supported-format guidance |
| Export | PDF/Word failure | Keep record intact; allow retry; log failure |
| Approval | HOD rejection | Require reason; return to Faculty for correction |
| Submission | Duplicate click/network retry | Idempotent submission; one workflow transition |
| Access | Unauthorized request | Deny operation; show safe error state |
| Session | Expired session | Redirect to login without losing already-saved data |
| Service | Database/store outage | Show service-unavailable state; avoid silent data loss |
| Calendar | Conflicting activities | Display conflict warning where dates/times overlap |
| Archive | Deleted/archived record | Respect lifecycle; hide from active lists while retaining history |
| Template | Unavailable template | Prevent generation; provide actionable HOD/admin error |
| Meeting | Venue/invitee overlap | Show overlap warning before saving |
| Feedback | Bad file format | Clear error state; describe expected format |
| Feedback | Wrong column structure | Clear error; do not partially import |

### Screen states required on every major screen
Every major screen MUST implement all 5 states:
1. **Loading** — spinner/skeleton while fetching
2. **Empty** — helpful message when no data exists
3. **Success** — normal content display
4. **Error** — actionable error message; preserve any entered data
5. **Unauthorized** — safe message; no sensitive data leaked

### Poor-network behaviour
Preserve locally entered unsaved information where technically feasible. Clearly indicate when a save is pending or failed.

### Failure recovery flow (from §11)
Failure → Preserve source record → Log error → User sees actionable state → Retry or continue later
