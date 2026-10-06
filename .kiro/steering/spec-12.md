---
inclusion: manual
---
## 12. Final QA, Risks & Traceability — MET SCMS PRD §26, §21, §23

### Final Quality-Control Checklist (§26)
Before marking any phase complete, verify:
- [ ] Only FACULTY and HOD roles are used — no third role anywhere
- [ ] Historical reminders are exactly 7 days before the event anniversary
- [ ] Duplicate reminder prevention and read/dismiss states implemented
- [ ] Event report fields match PRD §9.3 (name, date, venue, type, guest, studentCount, facultyInvolved, objectives, activities, outcomes, attachments)
- [ ] MoM fields match PRD §9.6 (topic, date, time, venue, chairperson, members, agenda, discussionPoints, decisions, actionItems with responsiblePerson + deadline)
- [ ] HOD approval/rejection and Faculty resubmission workflow complete
- [ ] PDF and Word export working for reports and MoMs
- [ ] Annual academic calendar displays and is HOD-manageable
- [ ] Dashboard and analytics computed from real data
- [ ] All P0 requirements have passing tests
- [ ] Edge cases, failure/recovery and permissions implemented (spec-10)
- [ ] Security: no passwords/tokens logged or returned; server-side RBAC enforced
- [ ] No fake/hardcoded data: no "Biometric", "Industry Expert", "Within 7 Days", default photosAttached
- [ ] Every major screen has loading / empty / error / unauthorized states
- [ ] Form labels and focus states present (accessibility)

### Risks & Mitigations (§21)
| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Incorrect generated documents | Medium | High | Template validation, preview, regression tests |
| Template changes | High | Medium | Version templates; HOD-controlled change workflow |
| Reminder accuracy | Medium | High | Deterministic 7-day rule, idempotency, date-boundary tests |
| Data quality | Medium | High | Required fields, validation, data-quality review for incomplete history |
| Faculty adoption | Medium | Medium | Simple UX, minimal duplicate entry |
| HOD approval bottleneck | Medium | High | Pending queue, dashboard visibility, turnaround metrics |
| Unauthorized access | Low/Med | High | Server-side RBAC, secure sessions, audit logs |
| File corruption | Low/Med | High | Generate-test-validate, preserve source data, retry |
| Data loss | Low | High | Atomic writes, recovery testing |
| Scope creep | High | High | Stick to P0/P1/P2 gates; no features beyond spec |

### Traceability (§23)
| Business Goal | Functional Req | Acceptance |
|---------------|---------------|------------|
| Reduce docs effort | FR-EVT-01, FR-RPT-01 | Generated preview contains all source fields |
| Standardize documents | FR-RPT-02 | Each event type maps to its template |
| Formalize review | FR-APR-02–05 | Decision + reason/history captured |
| Historical awareness | FR-REM-01–05 | Exact date + duplicate prevention |
| Centralize activities | FR-CAL-01–02 | Items displayed and HOD-manageable |
| Official export | FR-EXP-01 | Valid non-corrupt file generated |

### VERIFICATION_REPORT.md format (Phase 10 output)
```markdown
# Verification Report
| Item | Status | File / Test |
|------|--------|-------------|
| FR-AUTH-01 login | Fixed | auth.test.js:L12 |
| FR-REM-01 7-day reminder | Fixed | reminder.test.js:L45 |
| ... | ... | ... |
```
Status options: **Fixed** / **Partially fixed** / **Not done**

### README.md sections (Phase 10)
1. Project overview (one paragraph)
2. Prerequisites
3. Setup (`npm install`, `.env` from `.env.example`)
4. Running (`npm start`, `npm run seed`)
5. Demo mode instructions (link to DEMO.md)
6. Running tests (`npm test`)
7. Architecture notes (brief)

### DEMO.md (5-minute walkthrough script)
Step-by-step: login as HOD → create event → submit → login as Faculty → approve → export
