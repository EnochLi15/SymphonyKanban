import { randomUUID } from "node:crypto";
import { createExecution, recordArtifact, updateExecution, } from "./execution-store.js";
import { claimNextTodoIssue, transitionIssueStatus } from "./issue-store.js";
import { runOpencode } from "./opencode-runner.js";
import { getSchedulerSettings } from "./settings-store.js";
import { listTags } from "./tag-store.js";
import { listWorkspaces } from "./workspace-store.js";
const defaultSettings = {
    maxConcurrency: 1,
    pollIntervalMs: 5000,
};
const readSettings = () => {
    const settings = getSchedulerSettings();
    return settings ?? defaultSettings;
};
export const buildWorkflowContext = (issueTags, tags) => {
    if (!issueTags || issueTags.length === 0)
        return null;
    const matchedTag = tags.find((tag) => issueTags.includes(tag.name));
    if (!matchedTag)
        return null;
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
export const createScheduler = ({ opencodeBase, runner = runOpencode, }) => {
    let running = 0;
    const tick = async () => {
        const settings = readSettings();
        if (running >= settings.maxConcurrency)
            return;
        const issue = claimNextTodoIssue();
        if (!issue)
            return;
        running += 1;
        const now = new Date().toISOString();
        const executionId = randomUUID();
        createExecution(executionId, issue.id, "running", now, "opencode", 1);
        const workspaces = listWorkspaces();
        const workspace = workspaces.find((row) => row.id === issue.workspaceId);
        let workflowContext = null;
        try {
            workflowContext = buildWorkflowContext(issue.tags, listTags());
        }
        catch {
            workflowContext = "workflow 未加载";
        }
        try {
            const result = await runner({
                baseUrl: opencodeBase,
                issue,
                context: workspace?.context ?? null,
                workspacePath: workspace?.localPath ?? null,
                workflowContext,
                onArtifact: async (type, content, summary) => {
                    recordArtifact(randomUUID(), executionId, type, content, summary ?? null, new Date().toISOString());
                },
            });
            updateExecution(executionId, result.status, new Date().toISOString(), result.errorSummary ?? null);
            transitionIssueStatus(issue.id, result.status === "succeeded" ? "Review" : "Blocked", "scheduler_completed");
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            updateExecution(executionId, "failed", new Date().toISOString(), message);
            transitionIssueStatus(issue.id, "Blocked", "scheduler_failed");
            // eslint-disable-next-line no-console
            console.error("Scheduler tick failed", error);
        }
        finally {
            running -= 1;
        }
    };
    return {
        tick,
        getRunningCount: () => running,
    };
};
export const startScheduler = ({ opencodeBase }) => {
    const scheduler = createScheduler({ opencodeBase });
    let stopped = false;
    let timeout = null;
    const loop = async () => {
        if (stopped)
            return;
        await scheduler.tick();
        if (stopped)
            return;
        const settings = readSettings();
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
