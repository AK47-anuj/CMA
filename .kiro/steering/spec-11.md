---
inclusion: manual
---
## 11. Audit, Operational Logging & Observability — MET SCMS PRD §18, §12 NFR-OBS

### Auditable actions (FR-AUD-01, P0)
Every one of these actions MUST create an audit log entry:
- login / logout
- failed login (with lockout status)
- role/account changes (HOD creates/activates/deactivates Faculty)
- event created / updated / deleted / archived
- report submitted
- report approved / rejected (with reason)
- report resubmitted (with version number)
- MoM submitted / approved / rejected
- meeting created / edited / cancelled / held
- template created / updated / archived
- calendar entry created / updated / archived
- document generated (report or MoM)
- document exported (PDF or Word)
- feedback imported (`FEEDBACK_IMPORTED`)
- reminder generated
- data deletion / archive

### Audit record fields
Each record must include:
| Field | Description |
|-------|-------------|
| `id` | Unique identifier |
| `actor` | User ID + role performing the action |
| `timestamp` | ISO timestamp from `clock.now()` |
| `action` | Action name constant (e.g. `REPORT_APPROVED`) |
| `entity` | Collection name + entity ID |
| `before` | Snapshot of relevant fields before change (where applicable) |
| `after` | Snapshot of relevant fields after change (where applicable) |
| `reason` | Free-text reason (required for rejection actions) |
| `context` | Safe diagnostic context (no secrets) |

### Secrets policy
- **Passwords MUST NEVER be logged** — not even hashed form
- Tokens MUST NOT appear in logs
- Log the user ID, not credentials

### NFR-OBS-01
Critical failures that MUST be logged:
- Authentication failures
- Workflow state transition failures
- Report/MoM generation failures
- Document export failures

### Audit log storage
- Append-only collection in the JSON store (`auditLog`)
- Never mutate or delete audit entries
- `GET /api/audit` — HOD only; supports filters: actor, action, entity, date range
- `GET /api/audit/:id` — HOD only; single entry detail

### Operational log format (server console)
```
[TIMESTAMP] [LEVEL] [ACTION] entityId=X actor=Y
```
No sensitive values in any log output.
