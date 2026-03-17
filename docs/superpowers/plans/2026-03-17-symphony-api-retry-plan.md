# Symphony API Startup Retry Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure the symphony scheduler waits for the API to become available, retrying at a fixed interval with rate-limited logging, before entering the normal loop.

**Architecture:** Add a startup readiness gate `waitForApiReady` in `scheduler.ts`. It probes `/settings/scheduler` and retries indefinitely with a fixed delay; logging is controlled by a configurable cadence. `startScheduler` reads env defaults and passes config to the readiness gate.

**Tech Stack:** Node.js (fetch), TypeScript, Vitest.

---

## Chunk 1: Startup Readiness Gate

### Task 1: Add readiness helper and wire into scheduler

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-symphony/src/scheduler.ts`

- [ ] **Step 1: Write the failing unit test for readiness retry**

Add a new test in `scheduler.test.ts` (see Chunk 2) that expects `waitForApiReady` to retry and only log every N attempts. This should fail because `waitForApiReady` doesn’t exist yet.

- [ ] **Step 2: Implement `waitForApiReady` and config defaults**

Update `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-symphony/src/scheduler.ts`:

```ts
const DEFAULT_RETRY_INTERVAL_MS = 4000;
const DEFAULT_RETRY_LOG_EVERY = 5;

const toNumberOrDefault = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  return parsed;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitForApiReady = async ({
  apiBase,
  retryIntervalMs,
  logEvery,
}: {
  apiBase: string;
  retryIntervalMs: number;
  logEvery: number;
}) => {
  let attempt = 0;
  const logCadence = Math.max(1, logEvery);

  while (true) {
    attempt += 1;
    try {
      const res = await fetch(`${apiBase}/settings/scheduler`);
      if (!res.ok) {
        throw new Error(`API not ready: ${res.status}`);
      }
      // Consume JSON to match existing behavior, but ignore its contents.
      await res.json().catch(() => null);
      // eslint-disable-next-line no-console
      console.log(`API ready after ${attempt} attempts, starting scheduler`);
      return;
    } catch (error) {
      if (attempt % logCadence === 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `API not ready, retrying in ${retryIntervalMs}ms (attempt ${attempt})`,
          error,
        );
      }
      await sleep(retryIntervalMs);
    }
  }
};

export const startScheduler = async ({
  apiBase,
  opencodeBase,
  retryIntervalMs,
  retryLogEvery,
}: {
  apiBase: string;
  opencodeBase: string;
  retryIntervalMs?: number;
  retryLogEvery?: number;
}) => {
  const retryInterval =
    retryIntervalMs ??
    toNumberOrDefault(process.env.API_RETRY_INTERVAL_MS, DEFAULT_RETRY_INTERVAL_MS);
  const logEvery =
    retryLogEvery ??
    toNumberOrDefault(process.env.API_RETRY_LOG_EVERY, DEFAULT_RETRY_LOG_EVERY);

  await waitForApiReady({ apiBase, retryIntervalMs: retryInterval, logEvery });

  const api = buildApi(apiBase);
  let running = 0;
  // ... existing tick/loop unchanged
};
```

- [ ] **Step 3: Run unit test to confirm new failure is resolved**

Run:

```bash
pnpm --filter symphony-kanban-symphony test
```

Expected: the new test passes.

- [ ] **Step 4: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-symphony/src/scheduler.ts

git commit -m "feat(symphony): wait for API before starting scheduler"
```

## Chunk 2: Tests and Existing Test Updates

### Task 2: Add readiness test and update existing mocks

**Files:**
- Modify: `/Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-symphony/src/__tests__/scheduler.test.ts`

- [ ] **Step 1: Add a unit test for `waitForApiReady`**

Insert a new test case:

```ts
import { waitForApiReady } from "../scheduler.js";

it("waits for API readiness and logs on cadence", async () => {
  const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  const logSpy = vi.spyOn(console, "log").mockImplementation(() => undefined);
  vi.stubGlobal("setTimeout", ((fn: (...args: unknown[]) => void) => {
    fn();
    return 0;
  }) as typeof setTimeout);

  let attempt = 0;
  const fetchMock = vi.fn(async () => {
    attempt += 1;
    if (attempt < 3) {
      throw new Error("not ready");
    }
    return { ok: true, json: async () => ({ data: {} }) };
  });
  vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

  await waitForApiReady({ apiBase: "http://api", retryIntervalMs: 1, logEvery: 2 });

  expect(warnSpy).toHaveBeenCalledTimes(1);
  expect(String(warnSpy.mock.calls[0][0])).toContain("attempt 2");
  expect(logSpy).toHaveBeenCalledTimes(1);

  warnSpy.mockRestore();
  logSpy.mockRestore();
});
```

- [ ] **Step 2: Update existing test mocks to include `ok: true` for readiness probe**

In the "claims todo when under concurrency" test, make the settings response include `ok: true`:

```ts
const fetchMock = vi.fn(async (url: string) => ({
  ok: true,
  json: async () => {
    if (String(url).includes("/settings/scheduler")) {
      return { data: { maxConcurrency: 1, pollIntervalMs: 10 } };
    }
    if (String(url).includes("/scheduler/claim")) {
      return { data: null };
    }
    return { data: null };
  },
}));
```

- [ ] **Step 3: Run tests**

```bash
pnpm --filter symphony-kanban-symphony test
```

Expected: All tests pass.

- [ ] **Step 4: Commit**

```bash
git add /Users/enoch/Workspace/SymphonyKanban/packages/symphony-kanban-symphony/src/__tests__/scheduler.test.ts

git commit -m "test(symphony): cover API readiness retry"
```
