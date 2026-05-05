# SUBMISSION.md

## Candidate
**Tanmay Tewary** — tanmaytewary4@gmail.com

---

## What's Included

| File / Folder | Description |
|---------------|-------------|
| `backend/` | Node.js + Express API server |
| `frontend/` | React + Vite frontend |
| `README.md` | Setup instructions, features, tech stack |
| `ARCHITECTURE.md` | Architecture decisions and tradeoffs |
| `AI_WORKFLOW.md` | AI tools used and how they were applied |
| `SUBMISSION.md` | This file |
| `VIDEO.txt` | Walkthrough video link |

---

## Feature Status

| Feature | Status | Notes |
|---------|--------|-------|
| Document creation | ✅ Complete | From dashboard or via file import |
| Document renaming | ✅ Complete | Click title in editor header to rename |
| Rich text editing | ✅ Complete | Bold, italic, underline, headings, lists, alignment, links |
| Auto-save | ✅ Complete | 1.5s debounce + save on unmount |
| File import (.txt, .md, .docx) | ✅ Complete | Creates a new editable document |
| File attachments | ✅ Complete | Attach to any document; download/remove |
| Sharing by email | ✅ Complete | View or edit permission |
| Access control enforcement | ✅ Complete | API-level + UI-level |
| Owned vs shared distinction | ✅ Complete | Dashboard sections + role badges |
| Persistence | ✅ Complete | SQLite; survives server restarts |
| Authentication | ✅ Complete | JWT with bcrypt passwords |
| Automated tests | ✅ Complete | Jest + Supertest (13 tests) |
| Real-time collaboration | ❌ Deprioritized | Would need WebSockets/CRDT; noted in architecture |
| Version history | ❌ Deprioritized | Noted as "with more time" item |
| PDF export | ❌ Deprioritized | Noted as "with more time" item |

---

## Test Credentials

| User | Email | Password | Notes |
|------|-------|----------|-------|
| Alice Johnson | alice@demo.com | password123 | Owns "Welcome to AjaiaDocs"; shared with Bob |
| Bob Smith | bob@demo.com | password123 | Has edit access to Alice's welcome doc |
| Carol White | carol@demo.com | password123 | Independent user for testing sharing flows |

---

## Deployment

- **Live URL:** [Add your deployment URL here]
- **Backend:** Deployed on Render (or Railway)
- **Frontend:** Deployed on Vercel (or Render static site)

---

## What I Would Build Next (2–4 hours)

1. **Real-time presence** — Socket.io for live cursor awareness
2. **Version history** — Snapshot on save; diff view with restore
3. **PDF export** — html2pdf or server-side Puppeteer
4. **Improved permissions** — Change share level from view→edit without revoking
5. **Full-text search** — SQLite FTS5 for server-side document search
