import { buildApi } from "./api-client.js";
import { runOpencode } from "./opencode-runner.js";

export const startScheduler = async ({
  apiBase,
  opencodeBase,
}: {
  apiBase: string;
  opencodeBase: string;
}) => {
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

    try {
      const result = await runOpencode({
        baseUrl: opencodeBase,
        issue,
        context: workspace?.context ?? null,
        workspacePath: workspace?.localPath ?? null,
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

  const loop = async () => {
    try {
      await tick();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Scheduler tick failed", error);
    }
    const settingsRes = await api.getSettings();
    const settings = settingsRes.data ?? { pollIntervalMs: 5000 };
    setTimeout(loop, settings.pollIntervalMs);
  };

  loop();
};
