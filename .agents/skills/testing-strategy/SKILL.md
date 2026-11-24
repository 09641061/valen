---
name: testing-strategy
description: Comprehensive testing matrix for Valen covering all 20 verification types from unit, contract, fuzz, and mutation tests to E2E, usability, performance, and security testing.
---

# Valen Testing Strategy

Co-locate feature tests in `src/features/<feature>/*.test.ts(x)` and keep E2E specs in `tests/e2e/*.spec.ts`. Never unit-test `async` Server Components in jsdom, never use `.skip()`, and never substitute large snapshots for behavioral assertions.

## Testing Matrix (20 Types)

| Test Type | Purpose & Scope | Tooling / Location |
| --- | --- | --- |
| **Unit Tests** | Isolated pure logic, Zod schemas, formatters, domain rules (valid + boundary/invalid inputs). | Vitest (`*.test.ts`) |
| **Functional Tests** | Feature workflows across validation, Server Actions, and `data-access` boundaries. | Vitest + `msw` / mocks |
| **Component Tests** | Interactive `'use client'` components via accessible roles/labels and user events. | Vitest + Testing Library (`*.test.tsx`) |
| **Fuzz Tests** | Malformed, unexpected, or randomized payloads against parsers, schemas, and handlers. | `fast-check` / fuzzers |
| **Property-Based Tests** | Mathematical and domain invariants across generated input spaces (e.g. `1..n` order, non-negative prices). | `fast-check` in Vitest |
| **Contract Tests** | Ensure frontend Zod DTOs and backend OpenAPI/HTTP endpoints agree on shapes, headers, and status codes. | Zod schemas + `msw` |
| **Mutation Tests** | Verify test suites catch injected faults in critical validation and domain logic. | `@stryker-mutator/core` |
| **Static Analysis** | Enforce types, module boundaries, zero `useEffect`, zero circular deps, and `<= 250` lines. | `tsc --noEmit`, `src/architecture.test.ts` |
| **Lint Tests** | Enforce code quality, complexity (`<= 12`), unused-var, and import-boundary rules. | ESLint (`bun run lint`) |
| **Coverage Tests** | Detect untested branches in business logic, schemas, actions, and `data-access`. | `bun run test:coverage` |
| **Acceptance Tests** | End-to-end user journeys against business requirements and real persistence. | Playwright (`tests/e2e/*.spec.ts`) |
| **Regression Tests** | Ensure existing features and fixed defects keep passing on every change. | Vitest + Playwright |
| **Smoke Tests** | Confirm built app serves critical routes and health checks after startup/deploy. | Playwright / HTTP check |
| **UI/UX Tests** | Catch visual, layout, CSS, and responsive breakpoint regressions. | Playwright `toHaveScreenshot()` |
| **Usability Tests** | Verify keyboard navigation, focus management, labels, and WCAG A/AA compliance. | `@axe-core/playwright` + manual audit |
| **Performance Tests** | Measure Core Web Vitals (`LCP`, `INP`, `CLS`) and endpoint latency under load. | Lighthouse CI, `k6` |
| **Benchmark Tests** | Measure throughput/latency of hot pure functions and transformations. | `vitest bench` |
| **Penetration Tests** | Probe for secret leaks, XSS, IDOR, auth bypass, and dependency vulnerabilities. | `bun audit`, OWASP ZAP, negative tests |
| **Threat Modeling** | Identify trust boundaries, assets, and attack surfaces (STRIDE) before implementation. | `security-audit` skill |
| **Formal Verification** | Mathematically prove critical state-machine or concurrency invariants when justified. | TLA+ / Alloy (high-risk flows only) |
