# Symphony Kanban (Monorepo Scaffold)

This workspace hosts the monorepo-managed multi-repo layout described in `doc/2026-03-15-04-Arch-Symphony-Kanban-Layers.md`.

## Repos
- `packages/symphony-kanban-web` (Vue3 UI)
- `packages/symphony-kanban-api` (Express + SQLite)
- `packages/symphony-kanban-symphony` (Orchestration; wraps fizzy-popper)
- `packages/symphony-kanban-shared` (Shared types/DTOs)
- `packages/symphony-kanban-db` (Schema/migrations/seed)

## Notes
- Monorepo is managed with `pnpm` workspaces.
- `packages/symphony-kanban-symphony/fizzy-popper` is a clone of `basecamp/fizzy-popper`.
- Each repo is intentionally minimal and ready for incremental build-out.

## Testing
- `packages/symphony-kanban-api` uses SQLite; running tests in parallel can cause `SQLITE_BUSY`/500 errors. The API test runner is configured to run single-threaded to avoid database lock contention.

## Quick start
1. `pnpm -w install`
2. `pnpm -w dev`
