# Symphony Kanban Development Guide

This repository is a monorepo managing the Symphony Kanban system, which includes a Vue 3 frontend and an Express API with SQLite. The scheduler is currently fused into the API runtime as an internal module.

## Development Environment

- **Package Manager**: `pnpm` (v9+)
- **Workspace**: Managed via `pnpm-workspace.yaml` in the root.
- **Node.js**: Version 20.19.0

### Quick Start
```bash
pnpm install          # Install all dependencies
pnpm dev              # Start API and Web (via scripts/services.mjs)
pnpm build            # Build all packages
pnpm test             # Run all tests
```

### Running Specific Packages
- **API**: `cd packages/symphony-kanban-api && pnpm dev` (Port 3001)
- **Web**: `cd packages/symphony-kanban-web && pnpm dev` (Port 5173)
- **Scheduler**: `cd packages/symphony-kanban-api && SCHEDULER_ENABLED=true pnpm dev`

## Testing

All packages use **Vitest**.

### Commands
- **Run all tests**: `pnpm test`
- **Single package tests**: `pnpm -F <package-name> test` (e.g., `pnpm -F symphony-kanban-api test`)
- **Single test file**: `npx vitest run path/to/file.test.ts`
- **Watch mode**: `npx vitest` (inside the package directory)

### API Database Constraint
The API tests run single-threaded to avoid `SQLITE_BUSY` errors due to SQLite database locking. The test runner is configured with `--passWithNoTests`.

## Coding Standards

### General
- **Language**: TypeScript (Strict mode enabled)
- **Module System**: ESM (`"type": "module"`)
- **Formatting**: Standard Prettier/ESLint rules (Preserve existing indentation).

### Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `issue-store.ts`, `kanban-board-view.vue`)
- **Variables/Functions**: `camelCase`
- **Classes/Interfaces/Types**: `PascalCase`
- **Database Columns**: `snake_case` (mapped to `camelCase` in DTOs)

### TypeScript Preferences
- **Types vs Interfaces**: 
  - Use `interface` for public DTOs and models (see `packages/symphony-kanban-shared/src/index.ts`).
  - Use `type` for internal mappings, aliases, or unions (see `IssueRow` in `issue-store.ts`).
- **Strict Typing**: Avoid `any`. Use `unknown` if the type is truly unknown. No `@ts-ignore`.

### Imports
- **Extensions**: Must include `.js` extension for local imports in API and Symphony packages (ESM requirement), e.g., `import { db } from "./db.js";`.
- **Order**:
  1. Built-in Node modules (`node:crypto`, `node:path`)
  2. External dependencies (`express`, `vue`)
  3. Internal workspace packages (`@opencode-ai/sdk`)
  4. Local project files (`./issue-store.js`, `../../components/AppShell.vue`)

### Folder Structure
- `packages/symphony-kanban-web`: Vue 3 + Vite + Element Plus.
- `packages/symphony-kanban-api`: Express + SQLite + tsx.
- `packages/symphony-kanban-shared`: Common TypeScript definitions.
- `packages/symphony-kanban-symphony`: Archived standalone scheduler prototype wrapping `fizzy-popper` (not part of the default workspace runtime).
- `packages/symphony-kanban-db`: Database migrations and seeds.

### Error Handling
- **API**: Use standard HTTP status codes. Return `{ error: "code" }`. Log errors to console using `console.error` (with eslint-disable if necessary).
- **Web**: Use `ElMessage.error` for user-facing errors.

## Agent Specifics
- When modifying the API, ensure `db.transaction()` is used for multi-statement atomic operations.
- When adding new DTOs, place them in `packages/symphony-kanban-shared/src/index.ts`.
- `fizzy-popper` (inside `symphony-kanban-symphony`) has its own `AGENTS.md` with upstream core logic and is kept as reference material.

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for this repository. See `docs/agents/issue-tracker.md`.

### Triage labels

This repository uses the default five-label triage vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This repository uses a multi-context domain-docs layout via `CONTEXT-MAP.md`. See `docs/agents/domain.md`.
