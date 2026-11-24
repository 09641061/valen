---
name: code-quality-guardrails
description: Mandatory code quality, simplicity, and 250-line file-size guardrails for Valen (DRI, DRY, KISS, YAGNI, SRP, Clean Code, and three-level enforcement).
---

# Code Quality, Simplicity, and File-Length Guardrails

Read and apply this skill before creating or modifying any `.ts` or `.tsx` file in Valen.

## 1. File-Length Limit

- Every `.ts` and `.tsx` file in `src/` and `tests/` MUST be **at most 250 lines**.
- Exceeding 250 lines fails ESLint (`max-lines`), architecture tests, the Git pre-commit hook, and CI.
- Split oversized files along feature boundaries and the Single Responsibility Principle (SRP).
- **Never** bypass rules with `eslint-disable`, `@ts-ignore`, `@ts-nocheck`, or alternative configs.
- **Never** artificially compress formatting or over-fragment code into tiny single-use files just to satisfy line counts.

## 2. Mandatory Engineering Principles

| Principle | Rule |
| --- | --- |
| **DRI** | Give each module one clear, non-overlapping responsibility. |
| **DRY** | Extract shared helpers instead of duplicating non-trivial logic. |
| **KISS** | Prefer direct, straightforward solutions over clever indirection. |
| **YAGNI** | Do not add features, flags, or abstractions until actually needed. |
| **SRP** | Keep each component, module, and service focused on a single responsibility. |
| **Clean Code** | Write readable, lightweight, maintainable code with purposeful naming. |

Avoid over-engineering, unnecessary abstractions, redundant comments, unjustified dependencies, and excessive file fragmentation.

## 3. Three-Level Protection

1. **Level 1 — `AGENTS.md` and skills**: Mandatory guidance consulted before writing or modifying code.
2. **Level 2 — Guardrails and hooks**: ESLint rules (`max-lines`, `complexity`, `no-unused-vars`, `no-duplicate-imports`, `no-unreachable`, `no-restricted-syntax` for `useEffect` and `process.env`) and `.git/hooks/pre-commit`.
3. **Level 3 — Architecture tests and CI**: `src/architecture.test.ts` and `.github/workflows/ci.yml` block any violation of:
   - `<= 250` lines per `.ts` / `.tsx` file
   - Zero `useEffect` / `useLayoutEffect`
   - Feature-based architecture and cross-feature boundary isolation
   - Zero circular dependencies
   - Zero duplicated non-trivial code blocks
   - Zero dead code or unused imports
   - Controlled cyclomatic complexity
   - Private environment variable protection
