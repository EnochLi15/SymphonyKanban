# Opencode Session URL Without Encoding Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove URL encoding from Opencode session iframe URL construction so IDs are embedded verbatim.

**Architecture:** Update the URL builder used by web session views to concatenate `projectId` and `sessionId` directly. Adjust unit tests to match the raw URL output while keeping existing base normalization and artifact resolution behavior.

**Tech Stack:** TypeScript, Vue 3, Vitest

---

## Chunk 1: Update URL Builder and Tests

### Task 1: Update URL builder to remove encoding

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts`

- [ ] **Step 1: Update implementation to remove encoding**

```ts
export const buildOpencodeSessionUrl = (
  base: string,
  projectId: string,
  sessionId: string,
): string => {
  const safeBase = normalizeBase(base);
  return `${safeBase}/${projectId}/session/${sessionId}`;
};
```

- [ ] **Step 2: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.ts
git commit -m "chore(web): remove opencode url encoding"
```

### Task 2: Update unit tests to expect raw IDs

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts`

- [ ] **Step 1: Update test expectations**

```ts
it("builds session url", () => {
  const url = buildOpencodeSessionUrl("http://localhost:4096", "proj-1", "sess-1");
  expect(url).toBe("http://localhost:4096/proj-1/session/sess-1");
});
```

- [ ] **Step 2: Run targeted tests**

Run: `pnpm -C /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web test -- opencode-session`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-web/src/pages/sessions/opencode-session.test.ts
git commit -m "test(web): update opencode session url expectations"
```
