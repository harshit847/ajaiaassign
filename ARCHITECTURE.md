# Architecture

## Overview

DocCollab is a monolithic Next.js application using the App Router pattern. All API routes, pages, and static assets live within a single deployable unit.

## Design Principles

1. **Simplicity** — Minimal dependencies, straightforward patterns
2. **Server-rendered** — API routes handle all data operations; client components handle UI
3. **Type safety** — TypeScript throughout, Prisma generates typed DB client
4. **Incremental saving** — Auto-save with debouncing prevents data loss without overwhelming the server

## Data Flow

```
Browser (React)
  ↕ fetch() calls
Next.js API Routes (/api/*)
  ↕ Prisma Client
SQLite Database
```

### Authentication Flow

1. User submits credentials to `/api/auth/login` or `/api/auth/register`
2. Server validates inputs, hashes password with bcryptjs (12 rounds)
3. Server creates HMAC-signed session token (user ID + 7-day expiry)
4. Token stored as HttpOnly cookie
5. Middleware checks cookie on protected routes, redirects to `/login` if missing
6. `useAuth()` hook fetches `/api/auth/me` to hydrate client-side user state

### Document Editing Flow

1. User opens `/docs/[id]` — page fetches document via `GET /api/documents/[id]`
2. Server checks ownership or share permission before returning content
3. Tiptap editor renders the ProseMirror JSON content
4. On every content change, a 1-second debounce triggers `PATCH /api/documents/[id]`
5. Title changes save on blur

### Sharing Flow

1. Owner clicks "Share" → sees share panel
2. Enter recipient email + permission (VIEW/EDIT) → `POST /api/documents/[id]/share`
3. Server finds user by email, creates/updates DocumentShare record
4. Shared user sees document in "Shared with me" section on dashboard
5. Owner can remove shares via `DELETE /api/documents/[id]/share`

## Database Schema

```
User ──1:N── Document (owned)
User ──1:N── DocumentShare
Document ──1:N── DocumentShare
```

- `Document.content` stores Tiptap's ProseMirror JSON as a string
- `DocumentShare` has a unique constraint on `(documentId, userId)`
- Cascade deletes ensure cleanup when owner deletes a document

## Key Decisions

### Why SQLite over Postgres/MongoDB?
Zero setup for development. Prisma abstracts the database, so swapping to Postgres in production requires only changing `DATABASE_URL` and the `provider` in `schema.prisma`.

### Why Tiptap over Draft.js or TipTap alternatives?
Tiptap is headless (no opinionated UI), has excellent React hooks (`useEditor`), built-in extensions for all required formatting, and outputs structured JSON (not HTML), making it easy to store, merge, and render.

### Why cookie-based sessions over JWT/NEXT Auth?
Simplicity. HMAC-signed cookies avoid a JWT library, and the server always validates the session. This approach meets the assignment requirements without third-party auth services.

### Why auto-save over manual save?
Better UX (no lost work), standard in modern editors. The 1-second debounce prevents excessive API calls while keeping the save nearly imperceptible.

## Security Considerations

- Passwords hashed with bcryptjs (12 salt rounds)
- Session tokens are HMAC-signed with a server secret
- HttpOnly cookies prevent XSS access to tokens
- Server-side permission checks on every document API call
- Input validation on all endpoints (email format, password length, title length)
- CORS not needed (same-origin API calls)

## Scalability Notes

This architecture is designed for the assignment scope. For production at scale:
- Swap SQLite for Postgres
- Add Redis for session storage
- Implement real-time with WebSockets (Yjs + Hocuspocus)
- Add rate limiting and CSRF protection
- Move to a managed auth provider
