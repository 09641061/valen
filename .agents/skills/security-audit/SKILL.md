---
name: security-audit
description: Security auditing, dependency vulnerability scanning with bun audit, STRIDE threat modeling, and penetration testing for Valen.
---

# Security Audit, Threat Modeling, and Penetration Testing

Apply this skill before releasing changes, adding dependencies, or modifying server boundaries, environment configuration, or HTTP handlers.

## 1. Dependency Audit (`bun audit`)

- Run `bun audit` in CI or before releases to detect known CVEs in `bun.lock`.
- Treat `high` and `critical` advisories as release blockers unless an explicit, documented mitigation or upstream fix is tracked.
- Never install unvetted packages or bypass `bun.lock` integrity.

## 2. Threat Modeling (STRIDE)

Review every Server Action, Route Handler, `data-access` client, and DTO against:
- **Spoofing / Tampering**: Validate all untrusted inputs at the boundary with Zod; use `If-Match` ETags for optimistic concurrency.
- **Information Disclosure**: Keep `CYNTHIA_API_URL`, tokens, and `.env*` files server-only (`import "server-only"`); never expose secrets via `NEXT_PUBLIC_` or raw upstream error bodies.
- **Denial of Service / Elevation of Privilege**: Enforce authorization on the server, bound payload sizes, and avoid open-proxy patterns in BFF routes.

## 3. Penetration Testing

- Verify no client bundle contains `server-only` modules, private env vars, or direct backend URLs.
- Test negative paths: malformed JSON, invalid UUIDs, oversized inputs, stale ETags (`412`), and XSS/injection payloads in form fields.
- Pair automated checks (`bun audit`, `src/architecture.test.ts`, Playwright negative flows) with periodic manual/OWASP ZAP checks against staging.
