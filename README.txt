# AjaiaDocs — Collaborative Document Editor

A lightweight, full-stack collaborative document editor inspired by Google Docs. Built with React, Node.js/Express, and SQLite.

---

## Demo Accounts

| Name | Email | Password |
|------|-------|----------|
| Alice Johnson | alice@demo.com | password123 |
| Bob Smith | bob@demo.com | password123 |
| Carol White | carol@demo.com | password123 |

Alice owns a shared "Welcome" document that Bob has edit access to — perfect for demonstrating the sharing flow.

---

## Features

- **Rich text editing** — Bold, italic, underline, strikethrough, headings (H1–H3), bullet and numbered lists, text alignment, links, horizontal rules
- **Auto-save** — Content saves automatically after 1.5s of inactivity with visible save status
- **Document management** — Create, rename, delete documents from the dashboard
- **File import** — Upload `.txt`, `.md`, or `.docx` files to create a new editable document
- **File attachments** — Attach any supported file to an existing document
- **Sharing** — Share documents by email with view-only or edit access; revoke access at any time
- **Access roles** — Clear visual distinction between owned and shared documents
- **Persistence** — SQLite database; documents and sharing survive server restarts

---

## Local Setup

### Prerequisites

- Node.js 18+
- npm

### 1. Clone / unzip the project

```bash
cd ajaia-docs
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Install frontend dependencies

```bash
cd ../frontend
npm install
```

### 4. Run the backend

```bash
cd ../backend
npm run dev
# Runs on http://localhost:3001
# Database is auto-created at backend/data/ajaia.db
# Demo users are auto-seeded on first run
```

### 5. Run the frontend

```bash
cd ../frontend
npm run dev
# Runs on http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Running Tests

```bash
cd backend
npm test
```

Tests cover: auth (login, register, /me), document CRUD, access control, and sharing logic.

---

## Environment Variables

### Backend (`backend/.env`)

```env
PORT=3001
JWT_SECRET=your-secret-key-here
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001/api
```

> In development with Vite proxy, you can leave `VITE_API_URL` unset and requests go through the proxy automatically.

---

## Deployment

### Option 1: Render (recommended, free tier)

**Backend (Web Service):**
- Root: `backend/`
- Build: `npm install`
- Start: `node src/index.js`
- Add env vars: `JWT_SECRET`, `NODE_ENV=production`, `FRONTEND_URL=<your-frontend-url>`

**Frontend (Static Site):**
- Root: `frontend/`
- Build: `npm run build`
- Publish: `dist`
- Add env var: `VITE_API_URL=<your-backend-url>/api`

### Option 2: Single server (production build)

```bash
# Build frontend
cd frontend && npm run build

# Start backend (serves frontend too)
cd ../backend && NODE_ENV=production node src/index.js
```

---

## Supported File Types

| Format | Import as doc | Attach to doc |
|--------|--------------|---------------|
| `.txt` | ✅ | ✅ |
| `.md` | ✅ | ✅ |
| `.docx` | ✅ | ✅ |
| `.pdf` | ❌ | ✅ |
| `.png/.jpg/.gif/.webp` | ❌ | ✅ |

Max file size: **10MB**

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, TailwindCSS, Tiptap (rich text editor) |
| Backend | Node.js, Express |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| File parsing | mammoth (docx → HTML) |
| Testing | Jest + Supertest |

---

## Project Structure

```
ajaia-docs/
├── backend/
│   ├── src/
│   │   ├── db/database.js       # SQLite setup + seeding
│   │   ├── middleware/auth.js   # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js          # Login, register, /me, users list
│   │   │   ├── documents.js     # CRUD + sharing
│   │   │   └── upload.js        # File import + attachments
│   │   └── index.js             # Express server
│   ├── tests/api.test.js        # Integration tests
│   └── package.json
└── frontend/
    └── src/
        ├── components/
        │   ├── EditorToolbar.jsx
        │   ├── ShareModal.jsx
        │   └── AttachmentsPanel.jsx
        ├── context/AuthContext.jsx
        ├── hooks/useAutoSave.js
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── RegisterPage.jsx
        │   ├── DashboardPage.jsx
        │   └── EditorPage.jsx
        └── utils/api.js
```
