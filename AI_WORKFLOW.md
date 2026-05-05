# AI Workflow Note

## Tools Used

- **Claude (Anthropic)** — Primary AI assistant throughout the build
- **GitHub Copilot** — Inline autocomplete during coding

---

All AI-generated code was reviewed, tested, and modified to ensure correctness, security, and alignment with product requirements.

## Where AI Materially Sped Up My Work

### 1. Boilerplate elimination
Setting up Express routes with consistent error handling, JWT middleware, and Multer file upload configuration would normally take 45–60 minutes of careful typing and referencing docs. With AI assistance, these were drafted in under 15 minutes and required only targeted edits.

### 2. Tiptap extension configuration
Tiptap's extension API has a lot of configuration surface. AI helped me quickly scaffold the correct extension list (StarterKit + Underline + TextAlign + Link + Placeholder) with proper options, saving significant time I would have spent in docs.

### 3. SQLite schema and query patterns
The `better-sqlite3` synchronous API has a slightly different pattern than most async ORMs. AI generated correct prepared statement patterns that I verified against the library docs before using.

### 4. Test scaffolding
The Jest + Supertest integration test structure was scaffolded by AI. I then added the specific assertions and edge cases (e.g., testing that Bob can't access Alice's document before and after sharing) that represent real product invariants.

---

## What I Changed or Rejected

### Changed: Share modal permission flow
The initial AI-generated share modal had a dropdown for permissions. I changed this to a two-button toggle (View only / Can edit) which is clearer and more product-friendly — Google Docs and Notion both use button toggles, not dropdowns, because the choice is binary.

### Changed: Auto-save timing
AI suggested 3000ms debounce for auto-save. I reduced this to 1500ms — fast enough to feel responsive, slow enough not to hammer the DB on every keystroke. Also added a final save on component unmount, which the AI draft missed.

### Rejected: Axios interceptor that redirected on any error
The initial AI-generated interceptor redirected to `/login` on any non-2xx response. I changed this to only redirect on 401, because 403/404 errors should be handled in context (e.g., showing a "not found" state in the document view, not silently redirecting).

### Rejected: Storing HTML as escaped text
An early draft stored document content as entity-escaped HTML in the database and unescaped on read. This was fragile. I switched to storing raw HTML (safe because it's never rendered as a server-side template — only injected into a controlled Tiptap editor instance) and added a 5MB body size limit.

### Changed: Dashboard layout
The AI generated a single flat list of documents. I restructured this into two sections — "My Documents" and "Shared with me" — with distinct visual treatments and role badges. This is an important product distinction that the flat list obscured.

---

## How I Verified Correctness

1. **Manual testing of all user flows** — Created docs, edited content, tested auto-save by watching the indicator, imported .txt and .docx files, shared between demo accounts in two browser windows, tested view-only enforcement.

2. **Automated tests** — Ran Jest/Supertest suite covering auth, document CRUD, and access control. Specifically tested that unauthorized users get 403, sharing grants access, and only owners can delete.

3. **Edge case verification** — Tested: sharing with yourself (blocked), sharing with nonexistent email (error message), uploading oversized files (error), importing an image as a document (rejected with clear error), revoking access then attempting to load the document in another session.

4. **Cross-browser check** — Tested in Chrome and Firefox. Tiptap has known Safari quirks with selection; noted but not blocking for this scope.

---

## Overall Assessment

AI tools reduced the time spent on repetitive structure (routes, middleware, form components) by roughly 40%. The time savings were concentrated in the backend — where patterns are well-established — rather than the frontend, where product judgment calls (layout, interaction model, visual feedback) required more human iteration. The value of AI in this build was speed on known patterns, not judgment on product decisions.
