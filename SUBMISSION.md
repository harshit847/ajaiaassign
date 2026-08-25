# Submission

## Assignment: Collaborative Document Editor

### Deliverables

| Deliverable | Status | Location |
|------------|--------|----------|
| README.md | ✅ | `/README.md` |
| ARCHITECTURE.md | ✅ | `/ARCHITECTURE.md` |
| AI_WORKFLOW.md | ✅ | `/AI_WORKFLOW.md` |
| SUBMISSION.md | ✅ | `/SUBMISSION.md` (this file) |
| Production build | ✅ | `npm run build` succeeds |
| Automated tests | ✅ | 6 tests passing |

### How to Run

```bash
# Setup
cd collab-editor
npm install
npx prisma db push
npx prisma generate

# (Optional) Create demo users
npx tsx prisma/seed.ts

# Development
npm run dev

# Tests
npm test

# Production
npm run build
npm start

# Docker
docker build -t collab-editor .
docker run -p 3000:3000 collab-editor
```

### Walkthrough Script (3-5 minutes)

**1. Registration & Login (30s)**
- Navigate to `localhost:3000`
- Redirected to login page
- Click "Don't have an account? Sign up"
- Enter name, email, password → Create account
- Redirected to dashboard

**2. Create a Document (30s)**
- Click "+ New Document"
- Enter title "My First Doc" → Create
- Redirected to editor

**3. Rich Text Editing (60s)**
- Type some text
- Select text → Bold (B), Italic (I), Underline (U)
- Change heading level using dropdown (H1, H2, H3)
- Create a bulleted list
- Create a numbered list
- Note auto-save indicator changes to "Saved"

**4. Rename Document (20s)**
- Click on title, change to "Meeting Notes"
- Click away → title saves

**5. Import a File (30s)**
- Create a `.md` file with headings and lists
- Click "Import file" → select the .md file
- Click "Import"
- Content appears in editor

**6. Share Document (40s)**
- Click "Share" button
- Register a second user (in incognito/different browser)
- Enter second user's email → Share
- Note the share appears in the list
- Switch to second user → see document in "Shared with me"

**7. Dashboard (20s)**
- Return to first user's dashboard
- "My Documents" shows owned documents
- "Shared with me" shows shared documents
- Click any document to open

**8. Delete (15s)**
- Click "Delete" on a document
- Confirm deletion
- Document removed from list

**9. Run Tests (15s)**
- Run `npm test` in terminal
- 6 tests pass covering login/register flows

### Requirement Checklist

| # | Requirement | Implemented | How |
|---|------------|:-----------:|-----|
| 1 | Create a document | ✅ | Dashboard "+ New Document" → POST /api/documents |
| 2 | Rename a document | ✅ | Inline title editing → PATCH /api/documents/[id] |
| 3 | Edit document content | ✅ | Tiptap rich text editor with auto-save |
| 4 | Save and reopen documents | ✅ | SQLite persistence, reopen via dashboard links |
| 5a | Bold | ✅ | Tiptap bold toggle |
| 5b | Italic | ✅ | Tiptap italic toggle |
| 5c | Underline | ✅ | Tiptap underline extension |
| 5d | Headings/text size | ✅ | H1-H3 dropdown selector |
| 5e | Bulleted lists | ✅ | Tiptap bullet list |
| 5f | Numbered lists | ✅ | Tiptap ordered list |
| 6 | Upload/import file | ✅ | Import .txt/.md files → POST /api/documents/[id]/import |
| 7 | Share with another user | ✅ | Share by email → POST /api/documents/[id]/share |
| 8 | Owned vs shared docs | ✅ | Dashboard sections: "Owned by me" / "Shared with me" |
| 9 | Persist documents & sharing | ✅ | SQLite via Prisma ORM |
| 10 | Validation & error handling | ✅ | Input validation, auth guards, error states throughout |
| 11 | Automated test | ✅ | 6 Vitest tests for login/register flows |
| 12 | Production build | ✅ | `npm run build` succeeds, Dockerfile included |
| 13 | Documentation | ✅ | README.md, ARCHITECTURE.md, AI_WORKFLOW.md |

### What Was Explicitly Deprioritized

- Real-time collaboration (cursors, live editing)
- Version history
- Comments/annotations
- User avatars/profiles
- Document search
- Keyboard shortcuts
- Mobile-perfect responsive layout (desktop-first, mobile-acceptable)

### Known Limitations

1. Session tokens use a hardcoded secret — must set `SESSION_SECRET` env var for production
2. No HTTPS enforcement in development
3. File import markdown parsing is basic (no nested formatting)
4. No rate limiting on auth endpoints
