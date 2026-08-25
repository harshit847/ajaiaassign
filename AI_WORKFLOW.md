# AI Workflow

## How AI Was Used

This project was built with AI assistance (OpenCode / Claude) as a development accelerator. Below is a transparent account of how AI was used, what was generated, and what required manual review.

### AI-Generated Components

1. **Database Schema** — AI proposed the initial Prisma schema based on requirements. I reviewed and adjusted field types and relations.

2. **API Routes** — All REST endpoints were scaffolded by AI following Next.js App Router conventions. I reviewed each for:
   - Input validation completeness
   - Proper auth checks
   - Error handling consistency
   - Correct Prisma queries

3. **React Components** — Login page, dashboard, navbar, and editor page were AI-generated with standard React patterns. I verified:
   - Proper state management
   - Loading/error/empty states
   - Responsive design behavior

4. **Tiptap Editor** — The rich text editor component was AI-generated using Tiptap's React integration. I confirmed:
   - All required formatting options work
   - Toolbar state reflects current selection
   - Content serialization/deserialization is correct

5. **Test Suite** — Login page tests were AI-generated using Vitest + React Testing Library. I verified assertions match actual behavior.

6. **Documentation** — README, ARCHITECTURE, and this file were AI-generated, then reviewed for accuracy.

### What Required Manual Intervention

- **Prisma versioning** — Prisma 8.x (latest) is a completely different product (platform CLI). AI initially installed the wrong version. I had to identify the issue and pin to Prisma 6.x.
- **npm timeout handling** — Several npm installs timed out. AI retry strategies and node_modules cleanup required manual intervention.
- **TypeScript errors** — Build revealed type issues in the Tiptap-to-HTML renderer. AI fixed these with appropriate type relaxation.
- **Middleware deprecation** — Next.js 16 deprecated `middleware.ts` in favor of `proxy`. AI noted the warning but kept middleware for compatibility.

### What I Reviewed and Approved

- Security: password hashing, session management, permission checks
- Architecture: data flow, state management, API design
- UX: loading states, error messages, responsive layout
- Code quality: component structure, separation of concerns

### What I Would Change With More Time

- Replace middleware with the new proxy convention
- Add comprehensive integration tests (API route tests)
- Add rate limiting on auth endpoints
- Implement CSRF protection
- Add document version history
- Real-time collaboration with Yjs

## Prompts Used

The AI was given the full assignment brief upfront, then asked to:
1. Propose architecture (reviewed and approved before implementation)
2. Implement feature-by-feature with verification between each
3. Fix issues encountered during builds and tests
4. Generate documentation

No architectural decisions were made blindly — all AI proposals were reviewed against the requirements and my understanding of best practices.
