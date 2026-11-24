---
name: shadcn-ui
description: Mandatory project guidance for building and changing Valen UI with shadcn/ui, including component selection, installation, accessibility, and tests.
---

# shadcn/ui — required for Valen interfaces

Use this skill together with the Next.js feature-based skill before designing, implementing, reviewing, or testing any Valen UI.

## Non-negotiable component policy

- Build the interface with shadcn/ui. Prefer an existing component in `src/components/ui/` before adding another one.
- When a needed component is missing, inspect its current official documentation and add it with the shadcn CLI (`bunx shadcn@latest docs <component>` and `bunx shadcn@latest add <component>`). Do not hand-roll a replacement for a shadcn primitive.
- Compose shadcn primitives into domain-specific components under `src/features/<feature>/components/`. Keep domain behavior out of `src/components/ui/`.
- Customize design tokens and component variants to match the approved product reference; mandatory shadcn use does not authorize changing the reference’s layout, labels, color roles, or interaction flow.
- Use the project's configured shadcn base and icon library consistently. Use semantic elements, labelled controls, visible focus, and shadcn’s keyboard/focus behavior.
- Keep interactive UI in small Client Components. Keep routes and data loading on the server where possible.
- Follow DRI, DRY, KISS, YAGNI, and Clean Code; keep every `.ts` and `.tsx` file strictly `<= 250` lines (zero exceptions or disable comments).
- Use English-only UI copy and concise `Edit` / `Delete` action labels.

## Setup

For a new Next.js project, initialize shadcn with the official Next.js template using Bun, then add only components the feature needs. Preserve existing assets and configuration; review CLI changes rather than overwriting unrelated files. Commit the generated `components.json`, theme variables, utilities, and component source with the application.

Official references:

- Next.js installation: https://ui.shadcn.com/docs/installation/next
- CLI: https://ui.shadcn.com/docs/cli
- Component documentation: https://ui.shadcn.com/docs/components

## Validation and testing

- Test meaningful interactive Client Components with Vitest, jsdom, and Testing Library using accessible roles and labels.
- Test schema validation and Server Actions at feature boundaries, including invalid input and dependency failures.
- Use Playwright for complete navigation, responsive, and critical CRUD flows; do not substitute snapshots for behavior assertions.
- Run type-check, lint, unit/component tests, and E2E checks available in the repository. Do not add skipped tests or hide failures.
