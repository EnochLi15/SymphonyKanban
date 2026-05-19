import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../src/db.js";
import { buildWorkflowContext, createScheduler } from "../src/scheduler.js";

const createdIssueIds: string[] = [];
const createdTagNames: string[] = [];
let existingTodos: Array<{ id: string; status: string; updated_at: string | null }> = [];

const insertTodoIssue = ({ tag }: { tag?: string } = {}) => {
  const id = `issue-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO issues (id, title, description, status, priority, workspace_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, `Scheduler ${id}`, "", "Todo", 1, "wksp-default", now, now);
  createdIssueIds.push(id);

  if (tag) {
    const tagId = `tag-${Math.random().toString(36).slice(2)}`;
    db.prepare(
      "INSERT OR IGNORE INTO tags (id, name, rules, acceptance_criteria, workflow_definition, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ).run(tagId, tag, "rule-1", "acc-1", "flow-1", now, now);
    createdTagNames.push(tag);
    const row = db
      .prepare("SELECT id FROM tags WHERE name = ?")
      .get(tag) as { id: string };
    db.prepare("INSERT OR IGNORE INTO issue_tags (issue_id, tag_id) VALUES (?, ?)").run(
      id,
      row.id,
    );
  }

  return id;
};

beforeEach(() => {
  existingTodos = db
    .prepare("SELECT id, status, updated_at FROM issues WHERE status = 'Todo'")
    .all() as Array<{ id: string; status: string; updated_at: string | null }>;
  if (existingTodos.length > 0) {
    db.prepare("UPDATE issues SET status = 'Backlog' WHERE status = 'Todo'").run();
  }
});

afterEach(() => {
  db.prepare("DELETE FROM planner_runs").run();
  for (const id of createdIssueIds) {
    db.prepare("DELETE FROM issues WHERE id = ?").run(id);
  }
  for (const name of createdTagNames) {
    db.prepare("DELETE FROM tags WHERE name = ?").run(name);
  }
  if (existingTodos.length > 0) {
    const restore = db.prepare(
      "UPDATE issues SET status = ?, updated_at = ? WHERE id = ?",
    );
    for (const row of existingTodos) {
      restore.run(row.status, row.updated_at ?? new Date().toISOString(), row.id);
    }
  }
  createdIssueIds.length = 0;
  createdTagNames.length = 0;
  existingTodos = [];
});

describe("fused scheduler", () => {
  it("builds workflow context from matching issue tag metadata", () => {
    const context = buildWorkflowContext(["UserStory"], [
      {
        id: "tag-1",
        name: "UserStory",
        workflowDefinition: "流程定义",
        rules: "规则",
        acceptanceCriteria: "验收标准",
      },
    ]);

    expect(context).toContain("流程定义");
    expect(context).toContain("规则");
    expect(context).toContain("验收标准");
  });

  it("claims a Todo issue, records artifacts, and transitions to Review", async () => {
    const issueId = insertTodoIssue({ tag: "SchedulerUserStory" });
    let workflowContext: string | null | undefined = null;
    const scheduler = createScheduler({
      opencodeBase: "http://opencode",
      runner: async (input) => {
        workflowContext = input.workflowContext;
        await input.onArtifact("log", "ok");
        await input.onArtifact("diff", "{}");
        await input.onArtifact("summary", "done");
        return { status: "succeeded" };
      },
    });

    await scheduler.tick();

    const issue = db
      .prepare("SELECT status FROM issues WHERE id = ?")
      .get(issueId) as { status: string };
    const execution = db
      .prepare("SELECT id, status FROM executions WHERE issue_id = ?")
      .get(issueId) as { id: string; status: string };
    const artifacts = db
      .prepare("SELECT type FROM execution_artifacts WHERE execution_id = ? ORDER BY type")
      .all(execution.id) as Array<{ type: string }>;

    expect(workflowContext).toContain("flow-1");
    expect(issue.status).toBe("Review");
    expect(execution.status).toBe("succeeded");
    expect(artifacts.map((artifact) => artifact.type)).toEqual([
      "diff",
      "log",
      "summary",
    ]);
  });

  it("transitions claimed issues to Blocked when the runner fails", async () => {
    const issueId = insertTodoIssue();
    const scheduler = createScheduler({
      opencodeBase: "http://opencode",
      runner: async () => ({ status: "failed", errorSummary: "needs_user_input" }),
    });

    await scheduler.tick();

    const issue = db
      .prepare("SELECT status FROM issues WHERE id = ?")
      .get(issueId) as { status: string };
    const execution = db
      .prepare("SELECT status, error_summary as errorSummary FROM executions WHERE issue_id = ?")
      .get(issueId) as { status: string; errorSummary: string };

    expect(issue.status).toBe("Blocked");
    expect(execution.status).toBe("failed");
    expect(execution.errorSummary).toBe("needs_user_input");
  });

  it("records automatic planner runs when watch mode is enabled", async () => {
    const oldEnabled = process.env.PLANNER_AGENT_ENABLED;
    process.env.PLANNER_AGENT_ENABLED = "true";
    try {
      const scheduler = createScheduler({
        opencodeBase: "http://opencode",
        runner: async () => ({ status: "succeeded" }),
      });

      await scheduler.tick();

      const run = db
        .prepare("SELECT trigger, inspected_issues FROM planner_runs ORDER BY started_at DESC LIMIT 1")
        .get() as { trigger: string; inspected_issues: number } | undefined;
      expect(run).toEqual(
        expect.objectContaining({
          trigger: "automatic",
        }),
      );
    } finally {
      if (oldEnabled === undefined) delete process.env.PLANNER_AGENT_ENABLED;
      else process.env.PLANNER_AGENT_ENABLED = oldEnabled;
    }
  });
});
