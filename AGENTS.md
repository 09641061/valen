# Valen

Next.js App Router application in `src/app`, using TypeScript, Tailwind CSS, shadcn/ui (Base UI preset), and Bun.

## Required skills

Consult the applicable skill before designing, implementing, reviewing, or testing:

- `nextjs-feature-based` and `nextjs-conventions`: mandatory for any Next.js architecture, routing, feature scaffolding, data access, Server Action, or review work.
- `shadcn-ui`: mandatory before designing, implementing, reviewing, or testing any UI.
- `code-quality-guardrails`: mandatory before creating or modifying any `.ts` or `.tsx` file (`<= 250` lines, zero `useEffect`, DRI, DRY, KISS, YAGNI, SRP, Clean Code).
- `testing` and `testing-strategy`: mandatory when planning, writing, or reviewing any test suite.
- `security-audit`: mandatory when reviewing dependencies (`bun audit`), threat models, or security boundaries.
- Cynthia domain skills (`catalog`, `crm`, `organization`, `permissions`, `scheduling`): mandatory when a task touches that domain; keep domain boundaries separate.

## Core working rules

- Preserve unrelated working-tree changes, use task branches, and never expose `.env` files, credentials, or tokens.
- Write all UI copy, labels (`Edit` / `Delete`), source code, comments, and instructions in English.
- Run `bun run validate` before declaring any change complete.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
