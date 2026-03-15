# UX .pen to Vue Pages Design

Date: 2026-03-15

## Overview
Use pencil MCP to read all pages from `designs/ux.pen`, infer functional modules, and generate runnable Vue3 pages and routes in `packages/symphony-kanban-web`. This work will overwrite existing pages/routes to deliver an immediately previewable UI.

## Goals
- Extract all page-level frames from `designs/ux.pen`.
- Infer functional modules (not 1:1 frame-to-route).
- Generate Vue3 pages and routes that run and render without manual wiring.
- Overwrite existing page files and route config in `packages/symphony-kanban-web`.

## Non-Goals
- Perfect semantic fidelity to final product behavior.
- Implementing backend data or real API integration.
- Manual per-page UI tweaks beyond automated mapping.

## Assumptions
- `packages/symphony-kanban-web` is the target app and uses Vue3.
- `designs/ux.pen` contains multiple page-level frames.
- No stable naming convention exists for frames; grouping must be inferred.
- The user accepts automatic grouping with minimal follow-up questions.

## Inputs
- Pencil file: `designs/ux.pen`
- Target app: `packages/symphony-kanban-web`

## Outputs
- Vue page components (e.g., `src/pages/<module>/<Page>.vue` or similar).
- Router config updated to include module routes and default module entry routes.
- Shared UI components extracted per module where beneficial.

## Module Grouping Heuristics
- Analyze frame structure and keywords in titles or text nodes.
- Use layout similarity and repeated UI patterns to cluster frames.
- Generate a module label per cluster; fall back to heuristic names (e.g., `board`, `project`, `settings`) derived from dominant keywords.
- Provide a single default route per module: `/<module>` (maps to the most central/representative page in that module).

## Routing Strategy
- Base path: `/<module>/<page>`
- Module root: `/<module>` redirects to `/<module>/<default>`
- Ensure route names are stable and filesystem-safe.

## File/Code Generation Strategy
- Overwrite existing page files and router config.
- Favor simple, predictable file structure:
  - `src/pages/<module>/<Page>.vue`
  - `src/router/index.ts` (or existing router file)
- Generate shared UI components under `src/components/<module>/` when repeated blocks are detected.
- Use placeholder assets for missing imagery/icons to keep runtime functional.

## Mapping Pencil to Vue
- Convert frames → Vue template sections.
- Map text nodes → static text in template.
- Map rectangles/images → divs with background or img tags; placeholder when image fill not available.
- Preserve layout using flex/grid and consistent spacing from frame geometry.

## Error Handling
- If a frame fails to parse, log it and continue with remaining frames.
- If module grouping is ambiguous, select the most probable cluster and note it in a report section (stdout summary).

## Testing / Verification
- Run app build/dev to confirm pages render (if feasible).
- Basic sanity check: all routes resolve without 404.

## Rollback / Safety
- Changes are deterministic and overwrite-based; git commit will allow revert.

## Open Questions (Deferred)
- If the target router file location differs from assumptions, adapt to the existing structure discovered in repo.

