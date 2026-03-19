# Opencode Project Session Iframe Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Capture `projectId` from `@opencode-ai/sdk` session creation, persist it as an artifact, and render the opencode web session iframe at `/{projectId}/session/{sessionId}`.

**Architecture:** The symphony runner records both `sessionId` and `projectId` as execution artifacts. The web session page reads these artifacts and builds the iframe URL from `VITE_OPENCODE_WEB_BASE` plus the required path template.

**Tech Stack:** TypeScript, Vue 3, Element Plus, Express, SQLite, Vitest, @opencode-ai/sdk

---

## File Structure

- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-symphony/src/opencode-runner.ts`
  - Capture `projectID` from SDK session creation and store as artifact.
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts`
  - Update URL builder to use `projectId` + `sessionId` path template.
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue`
  - Read `opencode_project` artifact and build iframe URL with projectId.
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts`
  - Update tests to reflect new URL template.
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-symphony/src/__tests__/scheduler.test.ts` or create a new test
  - Add failing test to ensure `projectID` artifact is recorded (TDD).

---

## Chunk 1: Backend Artifact Capture

### Task 1: Add failing test for projectId artifact

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-symphony/src/__tests__/scheduler.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it, vi } from "vitest";
import { startScheduler } from "../scheduler";

// Extend the existing scheduler test to assert projectId artifact is written
it("records opencode project id as artifact", async () => {
  const addArtifact = vi.fn().mockResolvedValue(undefined);
  const mockClient = {
    session: {
      create: vi.fn().mockResolvedValue({ data: { id: "sess-1", projectID: "proj-1" } }),
      promptAsync: vi.fn().mockResolvedValue({}),
      messages: vi.fn().mockResolvedValue({ data: [] }),
      diff: vi.fn().mockResolvedValue({ data: [] }),
    },
    event: {
      subscribe: vi.fn().mockResolvedValue({
        stream: (async function* () {
          yield { type: "session.idle", properties: {} };
        })(),
      }),
    },
  };

  // Arrange to inject the mock client into runOpencode (see implementation step)
  // Expect artifact calls to include opencode_project
  // ...
  expect(addArtifact).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ type: "opencode_project" }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-symphony test -- --reporter verbose
```
Expected: FAIL because `opencode_project` artifact isn’t written.

- [ ] **Step 3: Write minimal implementation**

Update runner to capture `projectID` from `session.create()` response and write artifact:

```ts
const session = await client.session.create({ ... });
const sessionId = (session as any).data?.id ?? (session as any).id;
const projectId = (session as any).data?.projectID ?? (session as any).projectID ?? null;
if (projectId) {
  await input.onArtifact("opencode_project", projectId, "opencode project id");
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-symphony test -- --reporter verbose
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session add \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-symphony/src/opencode-runner.ts \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-symphony/src/__tests__/scheduler.test.ts

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session commit -m "feat(symphony): record opencode project id artifact"
```

---

## Chunk 2: Frontend URL Builder + Iframe

### Task 2: Update URL builder tests (TDD)

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { buildOpencodeSessionUrl } from "./opencode-session";

it("builds url with project and session", () => {
  const url = buildOpencodeSessionUrl("http://localhost:4096", "proj-1", "sess-1");
  expect(url).toBe("http://localhost:4096/proj-1/session/sess-1");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web test -- --reporter verbose
```
Expected: FAIL until the helper signature/template is updated.

- [ ] **Step 3: Write minimal implementation**

Update URL builder to accept `(base, projectId, sessionId)` and build `/{projectId}/session/{sessionId}`.

```ts
export const buildOpencodeSessionUrl = (
  base: string,
  projectId: string,
  sessionId: string,
): string => `${normalizeBase(base)}/${encodeURIComponent(projectId)}/session/${encodeURIComponent(sessionId)}`;
```

- [ ] **Step 4: Run test to verify it passes**

Run:
```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web test -- --reporter verbose
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session add \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session commit -m "feat(web): build opencode url with project id"
```

---

### Task 3: Wire iframe to projectId + sessionId

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue`

- [ ] **Step 1: Write the failing test**

If there is no existing UI test harness for this component, add a minimal unit test or skip and document why. Prefer a simple test for computed `sessionUrl` if accessible via exported helper. If not feasible, proceed with manual verification only.

- [ ] **Step 2: Implement minimal wiring**

```ts
const projectArtifact = computed(() =>
  review.value?.artifacts.find((artifact) => artifact.type === "opencode_project"),
);
const projectId = computed(() => projectArtifact.value?.content ?? "");
const sessionUrl = computed(() =>
  projectId.value && sessionId.value
    ? buildOpencodeSessionUrl(opencodeBase, projectId.value, sessionId.value)
    : "",
);
```

- [ ] **Step 3: Manual verification**

Run app, open an InProgress issue, confirm iframe URL:
```
http://localhost:4096/{projectId}/session/{sessionId}
```

- [ ] **Step 4: Commit**

```bash
git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session add \
  /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session/packages/symphony-kanban-web/src/pages/sessions/web-session-run.vue

git -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session commit -m "feat(web): render opencode session iframe with project id"
```

---

## Chunk 3: End-to-End Verification

### Task 4: Run full test suite

- [ ] **Step 1: Run monorepo tests**

```
pnpm -C /Users/enoch/Workspace/SymphonyKanban/.worktrees/codex/opencode-project-session test
```
Expected: All tests pass.

- [ ] **Step 2: Document results**

Record test output summary in the final report.

---

## Plan Review Loop

This plan should be reviewed by a plan-document-reviewer subagent. If subagents are not available, note the limitation and proceed with user confirmation before execution.

