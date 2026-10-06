---
inclusion: manual
---
## 7. Document Export (PDF & Word) — MET SCMS PRD §9.8 FR-EXP, §12 NFR-DOC

### Functional Requirements
| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| FR-EXP-01 | Approved/final documents exported as PDF and Word | P0 | Files generated without overlap/truncation; required content preserved |

### What gets exported
1. **Event Reports** — PDF + Word
2. **MoM** — PDF + Word
3. **Meeting Notice** — PDF + Word (replaces Phase 6 stub)

### Libraries
- Word: `docx` npm package
- PDF: `pdfkit` npm package

### Document structure (all exports)
- MET header (institute name, department, red & white theme colours)
- Document reference number (from `documentRef` on approval record)
- Event/Meeting details section
- Body content (from report/MoM template)
- **Feedback Analysis section** (if feedback imported — event reports only)
- Action items table (MoM only)
- Approval block: approved by, date/time, role
- Page numbers (footer)
- **"DRAFT — NOT APPROVED"** watermark/header on non-approved documents
- Long text wrapped correctly — no truncation or overlap

### Endpoints
- `GET /api/events/:id/report/export/pdf`
- `GET /api/events/:id/report/export/docx`
- `GET /api/meetings/:id/mom/export/pdf`
- `GET /api/meetings/:id/mom/export/docx`
- `GET /api/meetings/:id/notice/export/pdf`
- `GET /api/meetings/:id/notice/export/docx`

### UI
- Replace old HTML-as-.doc and print-dialog buttons with proper download links
- Each export button is visible only when document is in an exportable state per policy
- Clear error state if generation fails (preserve record; allow retry)

### Audit
- Log `DOCUMENT_EXPORTED` with: actor, document type, format (pdf/docx), documentRef, timestamp

### NFR-DOC-01
QA must validate exports on:
- Representative template for each of the 5 event types
- Boundary-length content (very long text fields)
- Both approved and draft states
- Check specifically: no overlap, no clipping, no missing fields, no malformed files
