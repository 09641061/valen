# Valen

## Project status

Valen is a Next.js App Router application in `src/app`, using TypeScript, Tailwind CSS, and Bun. The current scaffold uses shadcn/ui with the Base UI preset. Preserve its existing structure and pinned dependencies; inspect the actual files before changing tooling.

## Required skills

- For Next.js architecture, implementation, review, or testing, use the `nextjs-feature-based` skill available in Pi and its relevant references.
- Before designing, implementing, reviewing, or testing any interface, read `.agents/skills/shadcn-ui/SKILL.md`. shadcn/ui is mandatory for Valen UI; prefer existing components and add missing primitives with its CLI.
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

## Testing conventions

- Co-locate schema, data-access, action, and interactive component tests within `src/features/<feature>/`.
- Use Vitest and Testing Library for pure logic and Client Component behavior. Assert through accessible roles and labels; cover invalid input, loading, error, disabled, and success states.
- Use Playwright specs under `tests/e2e/` for complete user flows, route navigation, responsive behavior, and critical CRUD journeys.
- Do not unit-test async Server Components in jsdom; verify them through Playwright. Avoid implementation-only assertions, large snapshots, skipped tests, and weakened expectations.
- Run formatting/lint, TypeScript checks, unit/component tests, and relevant Playwright tests before declaring a frontend change complete. Do not start the app unless needed for a browser-based acceptance or visual check.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
