# DocCollab - Collaborative Document Editor

A lightweight collaborative document editor inspired by Google Docs, built with Next.js, TypeScript, and Tiptap.

## Features

- **User Authentication** — Register, login, and logout with cookie-based sessions
- **Document CRUD** — Create, read, update, and delete documents
- **Rich Text Editing** — Bold, italic, underline, headings (H1-H3), bulleted and numbered lists via Tiptap
- **Auto-Save** — Documents save automatically 1 second after you stop typing
- **File Import** — Import `.txt` and `.md` files into your documents
- **Document Sharing** — Share documents with other users (edit or view access)
- **Dashboard** — See owned and shared documents separately
- **Responsive UI** — Works on desktop and mobile
- **Validation & Error Handling** — Input validation, auth guards, user-friendly error messages

## Quick Start

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm

### Development

```bash
# Install dependencies
npm install

# Set up the database
npx prisma db push
npx prisma generate

# (Optional) Seed demo users
npx tsx prisma/seed.ts

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run Tests

```bash
npm test
```

### Production Build

```bash
npm run build
npm start
```

### Docker

```bash
docker build -t collab-editor .
docker run -p 3000:3000 collab-editor
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS |
| Editor | Tiptap (ProseMirror) |
| Database | SQLite via Prisma ORM |
| Auth | Cookie-based sessions, bcryptjs |
| Testing | Vitest, React Testing Library |
| Deployment | Docker |

## Project Structure

```
collab-editor/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Demo user seeding
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # Auth endpoints
│   │   │   └── documents/   # Document CRUD + sharing + import
│   │   ├── docs/[id]/       # Editor page
│   │   ├── login/           # Login/Register page
│   │   ├── layout.tsx       # Root layout with AuthProvider
│   │   └── page.tsx         # Dashboard
│   ├── components/
│   │   ├── Navbar.tsx       # Navigation bar
│   │   └── TiptapEditor.tsx # Rich text editor component
│   ├── lib/
│   │   ├── auth.ts          # Authentication utilities
│   │   ├── auth-context.tsx # React auth context
│   │   ├── db.ts            # Prisma client singleton
│   │   └── validation.ts    # Input validation helpers
│   └── middleware.ts        # Route protection
├── __tests__/
│   ├── login.test.tsx       # Login page tests
│   └── setup.ts             # Test setup
├── Dockerfile               # Docker build
└── vitest.config.ts         # Test configuration
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `SESSION_SECRET` | Secret for session tokens | `dev-secret-change-in-production` |
| `NODE_ENV` | Environment mode | `development` |

## License

MIT
