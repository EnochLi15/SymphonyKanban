import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { db } from "../src/db.js";
import { runPlannerChat } from "../src/planner-agent.js";

const createdIssueIds: string[] = [];
const createdBountyIds: string[] = [];
const createdChatIds: string[] = [];

const insertBlockedIssue = () => {
  const id = `planner-${Math.random().toString(36).slice(2)}`;
  const executionId = `exec-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO issues (id, title, description, status, priority, workspace_id, created_at, updated_at) VALUES (?, ?, ?, 'Blocked', 1, 'wksp-default', ?, ?)",
  ).run(id, "Planner blocked issue", "需要补充上下文", now, now);
  db.prepare(
    "INSERT INTO executions (id, issue_id, status, started_at, finished_at, error_summary, runner, attempt, created_at) VALUES (?, ?, 'failed', ?, ?, 'missing_token', 'opencode', 1, ?)",
  ).run(executionId, id, now, now, now);
  createdIssueIds.push(id);
  return id;
};

const insertIssue = (status: string, updatedAt = new Date().toISOString()) => {
  const id = `planner-${Math.random().toString(36).slice(2)}`;
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO issues (id, title, description, status, priority, workspace_id, created_at, updated_at) VALUES (?, ?, ?, ?, 2, 'wksp-default', ?, ?)",
  ).run(id, `Planner ${status} issue`, "无需人类接入", status, now, updatedAt);
  createdIssueIds.push(id);
  return id;
};

afterEach(() => {
  for (const bountyId of createdBountyIds) {
    db.prepare("DELETE FROM point_ledger WHERE bounty_id = ?").run(bountyId);
    db.prepare("DELETE FROM planner_memories WHERE source_type = 'bounty' AND source_id = ?").run(
      bountyId,
    );
    db.prepare("DELETE FROM planner_notifications WHERE source_id = ?").run(bountyId);
    db.prepare("DELETE FROM bounty_tasks WHERE id = ?").run(bountyId);
  }
  for (const issueId of createdIssueIds) {
    db.prepare("DELETE FROM planner_notifications WHERE source_id = ?").run(issueId);
    db.prepare("DELETE FROM issues WHERE id = ?").run(issueId);
  }
  for (const chatId of createdChatIds) {
    db.prepare("DELETE FROM planner_chat_messages WHERE id = ?").run(chatId);
  }
  createdBountyIds.length = 0;
  createdIssueIds.length = 0;
  createdChatIds.length = 0;
});

describe("planner bounty flow", () => {
  it("creates a bounty for a blocked issue and settles points into memory", async () => {
    const issueId = insertBlockedIssue();

    await request(app)
      .post("/planner/cycle")
      .send({ issueIds: [issueId] })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.createdBounties).toBe(1);
        expect(body.data.summary.createdActions).toBeGreaterThanOrEqual(2);
        expect(body.data.createdActions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "bounty",
              issueId,
              reason: expect.stringContaining("已创建"),
            }),
          ]),
        );
        expect(body.data.inspectedIssues[0]).toEqual(
          expect.objectContaining({
            issueId,
            matchedRules: expect.arrayContaining([
              expect.objectContaining({
                ruleId: "blocked-bounty",
                outcome: "created",
              }),
            ]),
          }),
        );
        expect(body.data.recommendedNextStep).toContain("人类接入队列");
        expect(body.data.insights).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              issueId,
              type: "blocked-needs-recovery",
              sideEffectAllowed: true,
            }),
          ]),
        );
        expect(body.data.queueRisks).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "blocked_recovery",
              issueIds: expect.arrayContaining([issueId]),
            }),
          ]),
        );
      });

    const bountyResponse = await request(app).get("/bounties").expect(200);
    const bounty = bountyResponse.body.data.find(
      (row: { issueId: string }) => row.issueId === issueId,
    );
    expect(bounty).toMatchObject({
      issueId,
      status: "open",
      points: 11,
    });
    createdBountyIds.push(bounty.id);

    await request(app)
      .post(`/bounties/${bounty.id}/submit`)
      .send({ assigneeName: "Enoch", response: "补充 MASTRA_API_KEY 后重试。" })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe("submitted");
      });

    await request(app)
      .post(`/bounties/${bounty.id}/accept`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.status).toBe("accepted");
      });

    await request(app)
      .get("/points")
      .expect(200)
      .expect(({ body }) => {
        expect(body.data).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              bountyId: bounty.id,
              contributor: "Enoch",
              points: 11,
            }),
          ]),
        );
      });

    await request(app)
      .get(`/planner/memories?scope=issue:${issueId}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.data[0]).toEqual(
          expect.objectContaining({
            sourceType: "bounty",
            sourceId: bounty.id,
            status: "approved",
          }),
        );
      });
  });

  it("reports skipped planner actions when active records already exist", async () => {
    const issueId = insertBlockedIssue();

    const firstResponse = await request(app)
      .post("/planner/cycle")
      .send({ issueIds: [issueId] })
      .expect(200);
    const bounty = firstResponse.body.data.createdActions.find(
      (action: { type: string }) => action.type === "bounty",
    );
    createdBountyIds.push(bounty.actionId);

    await request(app)
      .post("/planner/cycle")
      .send({ issueIds: [issueId] })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.createdBounties).toBe(0);
        expect(body.data.skippedActions).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "bounty",
              issueId,
              existingActionId: bounty.actionId,
              reason: expect.stringContaining("避免重复求助"),
            }),
          ]),
        );
        expect(body.data.inspectedIssues[0].matchedRules).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              ruleId: "blocked-bounty",
              outcome: "skipped",
            }),
          ]),
        );
      });
  });

  it("reports no-action planner results for non-blocked work", async () => {
    const issueId = insertIssue("Todo");

    await request(app)
      .post("/planner/cycle")
      .send({ issueIds: [issueId] })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.createdActions).toEqual([]);
        expect(body.data.skippedActions).toEqual([]);
        expect(body.data.noOpResults).toEqual([
          expect.objectContaining({
            issueId,
            status: "Todo",
            reason: expect.stringContaining("无需动作"),
          }),
        ]);
        expect(body.data.recommendedNextStep).toContain("没有需要创建");
      });
  });

  it("emits explainable insights across the full work queue without side effects", async () => {
    const staleUpdatedAt = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const issueIds = [
      insertIssue("Backlog"),
      insertIssue("Todo"),
      insertIssue("InProgress", staleUpdatedAt),
      insertIssue("Review"),
    ];

    await request(app)
      .post("/planner/cycle")
      .send({ issueIds })
      .expect(200)
      .expect(({ body }) => {
        expect(body.data.createdActions).toEqual([]);
        expect(body.data.skippedActions).toEqual([]);
        expect(body.data.insights).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ type: "backlog-needs-prioritization" }),
            expect.objectContaining({ type: "todo-ready-to-claim" }),
            expect.objectContaining({ type: "in-progress-stale" }),
            expect.objectContaining({ type: "review-waiting-human" }),
          ]),
        );
        expect(body.data.insights.every(
          (insight: { sideEffectAllowed: boolean }) => !insight.sideEffectAllowed,
        )).toBe(true);
        expect(body.data.queueRisks).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "stale_in_progress",
              issueIds: expect.arrayContaining([issueIds[2]]),
            }),
            expect.objectContaining({
              type: "review_waiting",
              issueIds: expect.arrayContaining([issueIds[3]]),
            }),
          ]),
        );
      });
  });

  it("runs deterministic planning from chat when no model provider is configured", async () => {
    const issueId = insertIssue("Todo");
    const oldModel = process.env.MASTRA_PLANNER_MODEL;
    const oldMastraModel = process.env.MASTRA_MODEL;
    const oldOpenAiKey = process.env.OPENAI_API_KEY;
    const oldPlannerKey = process.env.MASTRA_PLANNER_MODEL_API_KEY;
    const oldPlannerUrl = process.env.MASTRA_PLANNER_MODEL_URL;
    delete process.env.MASTRA_PLANNER_MODEL;
    delete process.env.MASTRA_MODEL;
    delete process.env.OPENAI_API_KEY;
    delete process.env.MASTRA_PLANNER_MODEL_API_KEY;
    delete process.env.MASTRA_PLANNER_MODEL_URL;

    try {
      const result = await runPlannerChat({
        message: "运行规划",
        issueIds: [issueId],
      });
      createdChatIds.push(...result.messages.map((message) => message.id));
      expect(result.report?.summary.inspectedIssues).toBe(1);
      expect(result.report?.noOpResults[0]).toEqual(
        expect.objectContaining({ issueId, status: "Todo" }),
      );
      expect(result.messages[1]).toEqual(
        expect.objectContaining({
          actionType: "planner_cycle_degraded",
          content: expect.stringContaining("未配置 Planner 大模型"),
        }),
      );
    } finally {
      if (oldModel) process.env.MASTRA_PLANNER_MODEL = oldModel;
      if (oldMastraModel) process.env.MASTRA_MODEL = oldMastraModel;
      if (oldOpenAiKey) process.env.OPENAI_API_KEY = oldOpenAiKey;
      if (oldPlannerKey) process.env.MASTRA_PLANNER_MODEL_API_KEY = oldPlannerKey;
      if (oldPlannerUrl) process.env.MASTRA_PLANNER_MODEL_URL = oldPlannerUrl;
    }
  });

  it("passes the latest scan report to model-backed planner chat", async () => {
    const issueId = insertIssue("Review");
    let capturedPrompt = "";

    const result = await runPlannerChat({
      message: "运行规划",
      model: "openai/test-planner",
      issueIds: [issueId],
      generate: async (prompt) => {
        capturedPrompt = prompt;
        return { text: "这次扫描发现 Review 等待人类验收。" };
      },
    });
    createdChatIds.push(...result.messages.map((message) => message.id));

    expect(result.report?.queueRisks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "review_waiting",
          issueIds: expect.arrayContaining([issueId]),
        }),
      ]),
    );
    expect(capturedPrompt).toContain("最新规划扫描报告");
    expect(capturedPrompt).toContain("review_waiting");
    expect(result.messages[1]).toEqual(
      expect.objectContaining({
        actionType: "planner_cycle_explained",
        content: "这次扫描发现 Review 等待人类验收。",
      }),
    );
  });
});
