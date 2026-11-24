# Valen

## Project status

Valen is intended to be a Next.js App Router project. At setup time, the repository contains design assets but no `package.json`, TypeScript configuration, Next.js configuration, or application routes. Before implementation, inspect the actual scaffold and confirm its package manager and versions; do not assume them or generate application code without a request.

## Required skills

- For Next.js architecture, implementation, review, or testing, read `.agents/skills/nextjs-feature-based/SKILL.md` and the relevant references.
- Read the linked Cynthia domain skill when a task concerns its domain: `catalog`, `crm`, `organization`, `permissions`, or `scheduling`. Keep those domain boundaries separate.
- Go-specific skills are intentionally not linked into this project.

## Next.js conventions

- Prefer the App Router and React Server Components. Use `'use client'` only for interactive UI that requires client-side state or browser APIs.
- Keep `app/` focused on routes, layouts, and HTTP handlers. Place feature behavior in feature modules and isolate server-side data access from UI code.
- Keep authorization and data access on the server, and validate untrusted input at the boundary. Do not rely on middleware alone for authorization.
- Use Server Actions for internal UI mutations and Route Handlers for external APIs, webhooks, OAuth callbacks, and streaming.
- Co-locate focused unit and functional tests with features; keep end-to-end tests in `tests/e2e/`. Cover invalid input, authorization, and failure paths.
- Preserve the repository's existing structure and dependencies once the application is scaffolded; avoid adding infrastructure or dependencies before a concrete need exists.

## Working rules

- Preserve unrelated working-tree changes and use task branches when this directory is a Git repository.
- Never expose `.env` files, credentials, or tokens.
- Write code, comments, and repository instructions in English. Keep comments purposeful and preserve directives, licenses, and API contracts.
