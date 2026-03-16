# Kanban Detail Routing + Column Scroll + Non-janky Polling Design

## Summary
Fix three UX issues in the Kanban web app:
1) Per-column internal scrolling when a column has many cards.
2) Issue detail pages render different components based on issue status.
3) Status updates stay fresh via polling without UI flicker or interrupting user edits.

## Goals
- Column content scrolls internally with a consistent visual style.
- Issue detail experience routes to the correct page per status.
- Polling remains enabled (5s) but does not cause UI flicker or overwrite user edits.

## Non-Goals
- Switching to SSE/WS.
- Major refactors of existing layout or store architecture.
- Changing the visual language beyond small scrollbar styling.

## Architecture
### Routing
Introduce status-specific detail routes as children of `/issues/:id`:
- `/issues/:id` -> base detail view (existing `issue-detail-view.vue`).
- `/issues/:id/session` -> session run view (`web-session-run.vue`).
- `/issues/:id/review` -> review view (`review-view.vue`).
- `/issues/:id/error` -> blocked/error handling view (`blocked-error-handling-view.vue`).

Status-to-route mapping:
- `InProgress` -> session
- `Review` -> review
- `Blocked` -> error
- `Backlog`/`Todo`/`Done` -> base detail

A small resolver in detail entry flow loads the issue, then navigates to the correct child route when needed. If already on the target route, no navigation occurs.

### Column Scrolling
Each Kanban column gets a scrollable content area while keeping the column header visible. The scrollbars use theme variables to match the current UI style.

### Polling without UI Flicker
- Keep 5s polling.
- Avoid full list replacement; update only the changed issue fields in-place.
- Do not show any loading state during polling.
- For issue detail: only refresh non-editing fields (e.g., execution status), and avoid re-syncing editable fields if the user is actively editing.

## Components / Files
- `packages/symphony-kanban-web/src/router/routes.ts`: add child routes under `/issues/:id`.
- `packages/symphony-kanban-web/src/pages/issues/issue-detail-view.vue`: add route resolution + non-janky polling behavior.
- `packages/symphony-kanban-web/src/pages/board/kanban-board-view.vue`: add column inner scroll container + scrollbar styling.
- Optional renames for clarity:
  - `issue-detail-view.vue` -> `issue-detail-base-view.vue`
  - `review-view.vue` -> `issue-detail-review-view.vue`
  - `blocked-error-handling-view.vue` -> `issue-detail-error-view.vue`
  - `web-session-run.vue` -> `issue-detail-session-view.vue`

## Data Flow
1) User opens `/issues/:id`.
2) Detail view loads issue.
3) Resolver checks `issue.status` and navigates to correct child route.
4) Polling updates execution status and server-side status in the background without replacing in-progress user edits.

## Error Handling
- If issue fetch fails: show a warning and redirect to `/board` (current behavior).
- If polling fails: log and continue (no user-visible flicker).
- If status maps to an unknown route: fall back to base detail.

## Testing
- Basic render tests for `kanban-board-view.vue` and `issue-detail-view.vue` continue to pass.
- Manual verification:
  - Column with many cards scrolls internally; header stays visible.
  - Status transitions route to the correct view.
  - Polling does not visually flicker and does not overwrite in-flight edits.

## Open Questions
None.
