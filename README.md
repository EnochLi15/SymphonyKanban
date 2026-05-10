# Symphony Kanban (Monorepo Scaffold)

This workspace hosts the monorepo-managed Symphony Kanban app. The default
runtime is now two processes: Web plus API. The scheduler is an internal API
Module that can be enabled with `SCHEDULER_ENABLED=true`.

## Repos
- `packages/symphony-kanban-web` (Vue3 UI)
- `packages/symphony-kanban-api` (Express + SQLite + internal scheduler)
- `packages/symphony-kanban-shared` (Shared types/DTOs)
- `packages/symphony-kanban-db` (Schema/migrations/seed)
- `packages/symphony-kanban-symphony` (archived standalone scheduler prototype; not part of the default workspace runtime)

## Notes
- Monorepo is managed with `pnpm` workspaces.
- `packages/symphony-kanban-symphony/fizzy-popper` is a clone of `basecamp/fizzy-popper` kept as prototype/reference material.
- `pnpm dev` starts API and Web. To run the scheduler locally, start the API with `SCHEDULER_ENABLED=true`.
- See `docs/adr/0001-fuse-scheduler-into-api.md` for the scheduler fusion decision.

## Testing
- `packages/symphony-kanban-api` uses SQLite; running tests in parallel can cause `SQLITE_BUSY`/500 errors. The API test runner is configured to run single-threaded to avoid database lock contention.

## Quick start
1. `pnpm -w install`
2. `pnpm -w dev`
