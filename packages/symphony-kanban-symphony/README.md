# symphony-kanban-symphony

TypeScript orchestration layer. Wraps `basecamp/fizzy-popper` for scheduling and state transitions.

## Scope
- Task polling/subscription
- Scheduler + state machine
- Trigger execution via opencode-ai/sdk
- Write back execution artifacts

## Structure
- `src/` orchestration source
- `adapters/` API adapters
- `executors/` opencode executors
- `fizzy-popper/` upstream orchestration core

## Scripts (placeholder)
- `dev`
- `build`
- `test`
