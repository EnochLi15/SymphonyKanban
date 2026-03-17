# Tag Workflow View Alignment (Visual Baseline + API Retained)

## Summary
Align `tag-workflow-view.vue` back to the visual structure, spacing, and copy of commit `388d1a1` while preserving the newer API-backed functionality. Extend Tag data to persist `rules` and `acceptanceCriteria`.

## Goals
- Restore the `388d1a1` layout structure and styling (three-column layout, typography, spacing, and legacy copy).
- Keep the current API wiring for tags, workflows, and scheduler settings.
- Add persistence for `rules` and `acceptanceCriteria` fields on tags.

## Non-Goals
- Reverting workflow/scheduler API behavior or endpoints.
- Redesigning other pages or refactoring shared UI components.

## Visual/Layout Design
- Base the DOM structure and class names on `388d1a1`.
- Reintroduce `tag-col`, `form-col`, and `hooks-col` structure with existing CSS tokens.
- Preserve legacy label text and headings from `388d1a1`.

## Data + Behavior Mapping
- Left tag list: still dynamic from API, using legacy button styling and active state.
- Middle column:
  - `工作流定义` textarea: editable, bound to workflow JSON text (tied to `workflowForm.configJson`).
  - `规则` textarea: editable, bound to `tagForm.rules`.
  - `验收标准` textarea: editable, bound to `tagForm.acceptanceCriteria`.
- Right column:
  - Preserve legacy “hooks” visual blocks; each block is a single plain text input.
  - `after_create` input maps to `workflowForm.configJson.after_create`.
  - `before_remove` input maps to `workflowForm.configJson.before_remove`.
  - Saving writes a normalized JSON payload with those two keys into `configJson` (no legacy compatibility logic).
  - Hooks use a single large textarea per field (no nested input border), styled to match the prior hook box color scheme.
- Buttons:
  - Keep `保存标签` to persist `name/type/color/rules/acceptanceCriteria`.
  - Keep `保存工作流规则` to persist workflow behavior.
  - Keep `保存调度配置` for scheduler settings.

## Backend/API Changes
- Database: add `rules` and `acceptance_criteria` columns to `tags` table (TEXT, nullable).
- DTO: extend `TagDTO` with `rules` and `acceptanceCriteria`.
- API: allow `createTag`/`updateTag` to accept these fields, and return them in `listTags`/`getTag`.

## Error Handling
- Empty/null fields are treated as empty strings on the UI.
- Save actions remain idempotent and should not block on optional fields.

## Testing
- Manual verification of UI layout against `388d1a1`.
- API contract checks for `rules`/`acceptanceCriteria` round-trip.

## Rollout
- Single PR with UI + API + DB migration changes.
- No feature flag required.
