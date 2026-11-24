---
name: nextjs-conventions
description: Valen-specific Next.js App Router conventions for Server Components, Server Actions, BFF data access, routing, and environment isolation.
---

# Valen Next.js Conventions

Apply together with `nextjs-feature-based` and `code-quality-guardrails`.

- Prefer the App Router and React Server Components; use `'use client'` only for interactive leaf islands requiring local state or browser APIs.
- Never use `useEffect` or `useLayoutEffect` in `src/` (including custom hooks or aliases). Use Server Components, Server Actions, `useSyncExternalStore`, or event handlers.
- Never access `process.env` outside `src/lib/env.ts`; never expose backend URLs or secrets via `NEXT_PUBLIC_`.
- Keep `src/app/` thin (routes, layouts, loading/error boundaries, HTTP handlers); place feature logic, schemas, loaders, actions, and `server-only` data access in `src/features/<feature>/`.
- Validate all untrusted inputs at the boundary with Zod, and keep authorization/data access on the server.
- Use Server Actions for internal UI mutations and Route Handlers for external APIs, webhooks, OAuth callbacks, and streaming.
- Preserve existing dependencies and structure; avoid adding infrastructure before a concrete need exists.
