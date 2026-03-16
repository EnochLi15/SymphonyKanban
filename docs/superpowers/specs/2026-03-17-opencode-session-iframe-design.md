# Opencode Session Iframe + Project Binding Design

## Summary
Embed the opencode session web UI in the running-task detail page using an iframe.
The session URL requires a `projectId` and `sessionId`, where `projectId` is returned
from `@opencode-ai/sdk` session creation. We will record both in execution artifacts
so the web UI can build the iframe URL.

## Goals
- Use `@opencode-ai/sdk` session.create response to capture `projectID`.
- Persist `projectId` and `sessionId` as execution artifacts.
- Render iframe at `/{projectId}/session/{sessionId}` under a configurable web base.
- Keep opencode API base and web base configurable with default port 4096.
- Gracefully handle missing session/project data in the UI.

## Non-Goals
- Rework opencode API integrations beyond artifact capture.
- Add new backend endpoints or schema changes.
- Replace polling or introduce SSE/WS.

## Architecture

### Backend (symphony runner)
- `opencode-runner` uses `client.session.create()` to create a session.
- The returned `Session` includes `projectID` per SDK type definitions.
- Record two artifacts via existing `onArtifact`:
  - `type: "session"` -> `sessionId`
  - `type: "opencode_project"` -> `projectId`

### Frontend (web)
- Running-task page consumes review aggregate (`/review/:issueId`) artifacts.
- Build iframe URL using:
  - `VITE_OPENCODE_WEB_BASE` (default `http://localhost:4096`)
  - `/{projectId}/session/{sessionId}`
- If either value is missing: show a "暂无会话" placeholder.

## Data Flow
1. Scheduler claims Todo issue and runs opencode.
2. `session.create()` returns `Session` with `id` and `projectID`.
3. Runner writes artifacts: `session`, `opencode_project`.
4. Review aggregate includes artifacts.
5. Web view builds iframe URL and renders session UI.

## Configuration
- `VITE_OPENCODE_WEB_BASE` (web UI base; default port 4096).
- `OPENCODE_BASE` remains for API runtime (existing).

## Error Handling
- Missing `projectId` or `sessionId`: do not render iframe; show placeholder.
- Errors in artifact reading: log and keep page usable.

## Testing
- Backend: unit test verifying `projectID` captured to artifact.
- Frontend: unit test for URL builder using base + projectId + sessionId.

## Impacted Files
- `packages/symphony-kanban-symphony/src/opencode-runner.ts`
- `packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue`
- `packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts`
- `packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts`
- `packages/symphony-kanban-api/src/app.ts` (no change expected)
