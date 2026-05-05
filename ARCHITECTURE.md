# Architecture Note

## Overview

AjaiaDocs is a full-stack collaborative document editor. The goal was to ship a focused, working product within the timebox — prioritizing depth in the core editing and sharing experience over breadth of features.

---

## Stack Choices

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend framework | React + Vite | Fastest dev setup; ecosystem maturity |
| Rich text editor | Tiptap (ProseMirror-based) | Best-in-class extensibility; avoids building a lexer from scratch |
| Backend | Node.js + Express | Minimal overhead; same language as frontend |
| Database | SQLite (better-sqlite3) | Zero setup; synchronous API simplifies code; perfectly adequate for this scope |
| Auth | JWT (stateless) | Simple to implement; no session store needed |
| File parsing | mammoth | Best OSS .docx → HTML converter |
| Styling | TailwindCSS | Rapid utility-first styling without fighting CSS specificity |

---

## What I Prioritized

### 1. Editor quality
Tiptap gives a production-grade ProseMirror setup with all required formatting extensions. I configured: bold, italic, underline, strikethrough, H1–H3 headings, bullet/ordered lists, text alignment, links, and horizontal rules. The editor has placeholder text and correct CSS for rendered output.

### 2. Auto-save with clear UX feedback
Documents save automatically 1.5s after the user stops typing. A visible indicator cycles through "Unsaved → Saving… → Saved" states. A final save fires on component unmount to prevent data loss.

### 3. Sharing model clarity
The sharing system has a clean owner/editor/viewer hierarchy:
- Owners can share, revoke access, and delete documents
- Editors can edit content and attach files, but not share or delete
- Viewers see a read-only editor with a clear "View only" indicator
- The toolbar is disabled (not hidden) for viewers to maintain visual consistency

### 4. File import flow
Importing `.txt`/`.md` converts plain text to semantic HTML (respecting `# heading` and `- list` syntax). Importing `.docx` uses mammoth for high-fidelity conversion. The imported file immediately opens as an editable document, making the flow feel native.

---

## What I Deprioritized

- **Real-time collaboration (WebSockets/CRDT)** — Would require adding Socket.io or Yjs, significantly increasing scope. The auto-save model works for async collaboration.
- **Image embeds in editor** — Embedding images inline in the document requires S3/blob storage. Out of scope; images can be attached to documents instead.
- **Search/filtering** — Dashboard has a client-side search filter; no full-text search on the backend.
- **Password reset / email verification** — Not relevant for a demo scope with seeded users.
- **Rate limiting** — Would add in production (express-rate-limit is a one-liner addition).

---

## Database Schema

Three core tables:

```
users           — id, email, name, password_hash
documents       — id, title, content (HTML), owner_id, timestamps
document_shares — document_id, shared_with_id, permission (view|edit)
attachments     — id, document_id, filename, original_name, mime_type, size
```

SQLite WAL mode is enabled for better concurrent read performance. Foreign keys are enforced, with `ON DELETE CASCADE` for shares and attachments when documents or users are deleted.

---

## API Design

REST with JWT auth on all protected routes. Key endpoints:

```
POST /api/auth/login          — Returns JWT
POST /api/auth/register       — Creates user, returns JWT
GET  /api/auth/users          — Lists other users (for sharing UI)

GET    /api/documents         — Lists owned + shared docs
POST   /api/documents         — Create
GET    /api/documents/:id     — Read (with shares + attachments)
PATCH  /api/documents/:id     — Update title/content (edit+ role required)
DELETE /api/documents/:id     — Delete (owner only)

POST   /api/documents/:id/share      — Share with user by email
DELETE /api/documents/:id/share/:uid — Revoke access

POST /api/upload/import        — Import file as new document
POST /api/upload/attach/:docId — Attach file to document
GET  /api/upload/file/:name    — Serve uploaded file
DELETE /api/upload/attach/:id  — Remove attachment
```

---

## Security Notes

- Passwords are bcrypt-hashed (cost factor 10)
- JWT signed with a configurable secret; 7-day expiry
- All document endpoints verify ownership or share status before proceeding
- File uploads are validated by MIME type and capped at 10MB
- Uploaded filenames are UUID-randomized to prevent path traversal

---

## With More Time (2–4 hours)

1. **Real-time presence indicators** — Socket.io + a simple "who's viewing" overlay
2. **Document version history** — Store snapshots on each save with diff display
3. **Role-based permissions UI** — Let owners change existing share permissions from the modal
4. **PDF export** — html2pdf or Puppeteer to export the editor HTML as a PDF
5. **Full-text search** — SQLite FTS5 for server-side document search
