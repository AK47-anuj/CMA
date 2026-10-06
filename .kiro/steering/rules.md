---
inclusion: always
---
# MET SCMS rules
Node/Express backend in backend/, vanilla JS frontend in frontend/. Ignore backend-java/ (legacy).
- Only two roles: FACULTY and HOD. Authorization on the server; submittedBy/approvedBy come from the session.
- All "today" logic uses clock.now() (backend/src/services/clock.js).
- No hard-coded fake data. Validate with zod. Rejection requires a reason.
- Never log passwords or tokens. Never return passwordHash.
- Read only the #spec files named in the prompt. Open only the files you need (grep first).
- Run only the tests for the code you changed, then full `npm test` once at the end.
- Do not open a browser or take screenshots. Do not create specs, docs or extra files that were not requested.
- Do not ask questions. Pick the simplest option and note it in TASKS.md under Assumptions.
- When finished: tick the item in TASKS.md, give a 5-line summary, STOP.
