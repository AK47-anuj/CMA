---
inclusion: manual
---
## 2. Authentication, RBAC & User Management — MET SCMS PRD §9.1, §9.2, §15

### Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-AUTH-01 | Users log in with email + password | P0 | Valid credentials open correct role dashboard; invalid rejected without exposing details |
| FR-AUTH-02 | Sessions expire after configurable inactivity | P0 | Expired session requires re-login; protected pages blocked |
| FR-AUTH-03 | Login failures are auditable | P1 | Failed attempts recorded with actor/context/timestamp, no passwords stored |
| FR-ROLE-01 | Only Faculty and HOD roles exist | P0 | No third role; permissions match matrix below |
| FR-ROLE-02 | Faculty manage only permitted profile fields | P1 | Unauthorized fields/actions hidden or denied |
| FR-ADM-01 | HOD can create/activate/deactivate Faculty accounts | P0 | Changes take effect and are logged |

### Registration Flow
- New user registers as `PENDING_HOD_APPROVAL`
- HOD approves → role becomes `FACULTY`
- Google Sign-In endpoint + `GET /api/auth/config` (returns clientId if set)
- Forgot/reset/change password — reset link printed to console in dev

### Security Rules
- bcryptjs password hashing — never store plaintext, never log/return hash
- httpOnly JWT cookie (no localStorage)
- Rate limiting on `/api/auth/*`
- 5 consecutive failure lockout per account
- `requireAuth` middleware on all `/api/*` except `/api/health` and `/api/auth/*`
- `requireRole('HOD')` on HOD-only routes

### Permission Matrix
| Module / Resource | FACULTY | HOD |
|-------------------|---------|-----|
| Login / own profile | Create/read/update own permitted data | Create/read/update own permitted data |
| Event | Create/read/update own drafts; submit | Read/manage department records |
| Report | Generate/preview/edit own pre-submission; submit | Review/approve/reject; export; oversee |
| Approval | Read own status/reason; resubmit | Approve/reject |
| Meeting/MoM | Create/read/update permitted records; generate/export | Read/oversee/export |
| Academic Calendar | Read | Create/read/update/archive/manage |
| Historical reminders | Read/dismiss | Read/oversee |
| Faculty management | No | Create/activate/deactivate/manage |
| Templates | No | Create/update/archive/manage |
| Analytics | Personal/limited if approved | Department analytics |
| Audit history | Own relevant history | Department audit access |
| Settings | Own permitted preferences | Department configuration |

### HOD-only sensitive operations
Approval/rejection, faculty account management, template management, department calendar management, department analytics, operational oversight.

### Demo seed users (hashed passwords in seed script)
| Email | Role | Password |
|-------|------|----------|
| hod@met.edu | HOD | Demo1234! |
| faculty@met.edu | FACULTY | Demo1234! |
| faculty2@met.edu | FACULTY | Demo1234! |
| pending@met.edu | PENDING_HOD_APPROVAL | Demo1234! |
