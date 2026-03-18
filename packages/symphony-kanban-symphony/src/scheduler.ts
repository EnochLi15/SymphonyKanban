import { buildApi } from "./api-client.js";
import { runOpencode } from "./opencode-runner.js";

const DEFAULT_RETRY_INTERVAL_MS = 4000;
const DEFAULT_RETRY_LOG_EVERY = 5;

type TagRow = {
  id: string;
  name: string;
  rules?: string | null;
  acceptanceCriteria?: string | null;
  workflowDefinition?: string | null;
};

const toNumberOrDefault = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (parsed <= 0) return fallback;
  return parsed;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const buildWorkflowContext = (
  issueTags: string[] | undefined,
  tags: TagRow[],
) => {
  if (!issueTags || issueTags.length === 0) return null;
  const matchedTag = tags.find((tag) => issueTags.includes(tag.name));
  if (!matchedTag) return null;
  const parts = [
    `标签: ${matchedTag.name}`,
    matchedTag.workflowDefinition
      ? `工作流定义:\n${matchedTag.workflowDefinition}`
      : "",
    matchedTag.rules ? `规则:\n${matchedTag.rules}` : "",
    matchedTag.acceptanceCriteria ? `验收标准:\n${matchedTag.acceptanceCriteria}` : "",
  ].filter((part) => part.length > 0);
  return parts.join("\n\n");
};

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

  const tick = async () => {
    const settingsRes = await api.getSettings();
    const settings = settingsRes.data ?? { maxConcurrency: 1, pollIntervalMs: 5000 };
    if (running >= settings.maxConcurrency) return;

    const claimed = await api.claimTodo();
    const issue = claimed.data;
    if (!issue) return;

    running += 1;
    const execRes = await api.createExecution({
      issueId: issue.id,
      status: "running",
      attempt: 1,
      runner: "opencode",
    });
    const executionId = execRes.data.id as string;

    const workspacesRes = await api.listWorkspaces();
    const workspaces = workspacesRes.data ?? [];
    const workspace = workspaces.find((row: any) => row.id === issue.workspaceId);
    let workflowContext: string | null = null;
    try {
      const tagsRes = await api.listTags();
      const tags = tagsRes.data ?? [];
      workflowContext = buildWorkflowContext(issue.tags, tags);
    } catch (error) {
      workflowContext = "workflow 未加载";
    }

    try {
      const result = await runOpencode({
        baseUrl: opencodeBase,
        issue,
        context: workspace?.context ?? null,
        workspacePath: workspace?.localPath ?? null,
        workflowContext,
        onArtifact: (type, content, summary) =>
          api.addArtifact(executionId, { type, content, summary }),
      });
      await api.updateExecution(executionId, {
        status: result.status,
        finishedAt: new Date().toISOString(),
        errorSummary: result.errorSummary ?? null,
      });
      if (result.status === "succeeded") {
        await api.transitionIssue(issue.id, "Review");
      } else {
        await api.transitionIssue(issue.id, "Blocked");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Scheduler transition failed", error);
    } finally {
      running -= 1;
    }
  };

  let stopped = false;
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const loop = async () => {
    if (stopped) return;
    try {
      await tick();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Scheduler tick failed", error);
    }
    if (stopped) return;
    const settingsRes = await api.getSettings();
    const settings = settingsRes.data ?? { pollIntervalMs: 5000 };
    timeout = setTimeout(loop, settings.pollIntervalMs);
  };

  loop();

  return {
    stop: () => {
      stopped = true;
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    },
  };
};
