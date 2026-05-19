import { randomUUID } from "node:crypto";
import { db } from "./db.js";

export type BountyStatus = "open" | "submitted" | "accepted" | "canceled";

type BountyRow = {
  id: string;
  issue_id: string;
  status: BountyStatus;
  title: string;
  question: string;
  context: string | null;
  acceptance_criteria: string;
  points: number;
  created_by: string;
  assignee_name: string | null;
  response: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  accepted_at: string | null;
  canceled_at: string | null;
};

export type BountyTask = ReturnType<typeof mapBountyRow>;

type NotificationRow = {
  id: string;
  severity: "info" | "warning" | "critical";
  event_type: string;
  dedupe_key: string;
  title: string;
  message: string;
  status: "unread" | "read";
  source_type: string | null;
  source_id: string | null;
  created_at: string;
  read_at: string | null;
};

type MemoryRow = {
  id: string;
  scope: string;
  source_type: string;
  source_id: string;
  title: string;
  content: string;
  confidence: number;
  status: "candidate" | "approved" | "revoked";
  created_at: string;
};

type ChatMessageRow = {
  id: string;
  role: "user" | "assistant";
  content: string;
  action_type: string | null;
  metadata_json: string | null;
  created_at: string;
};

type PointRow = {
  id: string;
  contributor: string;
  bounty_id: string;
  points: number;
  reason: string;
  created_at: string;
};

type PlannerRunRow = {
  id: string;
  trigger: "manual" | "automatic";
  started_at: string;
  finished_at: string;
  inspected_issues: number;
  created_actions: number;
  skipped_actions: number;
  no_op_results: number;
  queue_risks: number;
  recommended_next_step: string;
};

const mapBountyRow = (row: BountyRow) => ({
  id: row.id,
  issueId: row.issue_id,
  status: row.status,
  title: row.title,
  question: row.question,
  context: row.context,
  acceptanceCriteria: row.acceptance_criteria,
  points: row.points,
  createdBy: row.created_by,
  assigneeName: row.assignee_name,
  response: row.response,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  submittedAt: row.submitted_at,
  acceptedAt: row.accepted_at,
  canceledAt: row.canceled_at,
});

const mapNotificationRow = (row: NotificationRow) => ({
  id: row.id,
  severity: row.severity,
  eventType: row.event_type,
  dedupeKey: row.dedupe_key,
  title: row.title,
  message: row.message,
  status: row.status,
  sourceType: row.source_type,
  sourceId: row.source_id,
  createdAt: row.created_at,
  readAt: row.read_at,
});

const getNotificationByDedupeKey = (dedupeKey: string) => {
  const row = db
    .prepare("SELECT * FROM planner_notifications WHERE dedupe_key = ?")
    .get(dedupeKey) as NotificationRow | undefined;
  return row ? mapNotificationRow(row) : null;
};

const mapMemoryRow = (row: MemoryRow) => ({
  id: row.id,
  scope: row.scope,
  sourceType: row.source_type,
  sourceId: row.source_id,
  title: row.title,
  content: row.content,
  confidence: row.confidence,
  status: row.status,
  createdAt: row.created_at,
});

const mapChatMessageRow = (row: ChatMessageRow) => ({
  id: row.id,
  role: row.role,
  content: row.content,
  actionType: row.action_type,
  metadata: row.metadata_json
    ? (JSON.parse(row.metadata_json) as Record<string, unknown>)
    : null,
  createdAt: row.created_at,
});

const mapPointRow = (row: PointRow) => ({
  id: row.id,
  contributor: row.contributor,
  bountyId: row.bounty_id,
  points: row.points,
  reason: row.reason,
  createdAt: row.created_at,
});

const mapPlannerRunRow = (row: PlannerRunRow) => ({
  id: row.id,
  trigger: row.trigger,
  startedAt: row.started_at,
  finishedAt: row.finished_at,
  inspectedIssues: row.inspected_issues,
  createdActions: row.created_actions,
  skippedActions: row.skipped_actions,
  noOpResults: row.no_op_results,
  queueRisks: row.queue_risks,
  recommendedNextStep: row.recommended_next_step,
});

export const listBounties = () =>
  (
    db
      .prepare("SELECT * FROM bounty_tasks ORDER BY created_at DESC")
      .all() as BountyRow[]
  ).map(mapBountyRow);

export const getBountyById = (id: string) => {
  const row = db
    .prepare("SELECT * FROM bounty_tasks WHERE id = ?")
    .get(id) as BountyRow | undefined;
  return row ? mapBountyRow(row) : null;
};

export const findActiveBountyByIssue = (issueId: string) => {
  const row = db
    .prepare(
      "SELECT * FROM bounty_tasks WHERE issue_id = ? AND status IN ('open', 'submitted') ORDER BY created_at DESC LIMIT 1",
    )
    .get(issueId) as BountyRow | undefined;
  return row ? mapBountyRow(row) : null;
};

export const createBounty = ({
  issueId,
  title,
  question,
  context,
  acceptanceCriteria,
  points,
  createdBy,
  now,
}: {
  issueId: string;
  title: string;
  question: string;
  context?: string | null;
  acceptanceCriteria: string;
  points: number;
  createdBy: string;
  now: string;
}) => {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO bounty_tasks
      (id, issue_id, status, title, question, context, acceptance_criteria, points, created_by, created_at, updated_at)
     VALUES
      (?, ?, 'open', ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    issueId,
    title,
    question,
    context ?? null,
    acceptanceCriteria,
    points,
    createdBy,
    now,
    now,
  );
  return getBountyById(id);
};

export const submitBounty = (
  id: string,
  assigneeName: string,
  response: string,
  now: string,
) => {
  db.prepare(
    `UPDATE bounty_tasks
     SET status = 'submitted', assignee_name = ?, response = ?, submitted_at = ?, updated_at = ?
     WHERE id = ? AND status = 'open'`,
  ).run(assigneeName, response, now, now, id);
  return getBountyById(id);
};

export const acceptBounty = (id: string, now: string) => {
  const tx = db.transaction(() => {
    const bounty = getBountyById(id);
    if (!bounty || bounty.status !== "submitted" || !bounty.assigneeName) {
      return null;
    }

    db.prepare(
      "UPDATE bounty_tasks SET status = 'accepted', accepted_at = ?, updated_at = ? WHERE id = ?",
    ).run(now, now, id);

    db.prepare(
      `INSERT OR IGNORE INTO point_ledger
        (id, contributor, bounty_id, points, reason, created_at)
       VALUES
        (?, ?, ?, ?, ?, ?)`,
    ).run(
      randomUUID(),
      bounty.assigneeName,
      bounty.id,
      bounty.points,
      "bounty_accepted",
      now,
    );

    db.prepare(
      `INSERT OR IGNORE INTO planner_memories
        (id, scope, source_type, source_id, title, content, confidence, status, created_at)
       VALUES
        (?, ?, 'bounty', ?, ?, ?, 0.85, 'candidate', ?)`,
    ).run(
      randomUUID(),
      `issue:${bounty.issueId}`,
      bounty.id,
      `人类接入候选记忆: ${bounty.title}`,
      [
        `问题: ${bounty.question}`,
        `人类答案: ${bounty.response}`,
        `复用建议: 下次遇到相同阻塞时，先检查这条答案是否适用，再决定是否继续求助。`,
      ].join("\n\n"),
      now,
    );

    return getBountyById(id);
  });
  return tx();
};

export const cancelBounty = (id: string, now: string) => {
  db.prepare(
    "UPDATE bounty_tasks SET status = 'canceled', canceled_at = ?, updated_at = ? WHERE id = ? AND status IN ('open', 'submitted')",
  ).run(now, now, id);
  return getBountyById(id);
};

export const listNotifications = () =>
  (
    db
      .prepare("SELECT * FROM planner_notifications ORDER BY created_at DESC")
      .all() as NotificationRow[]
  ).map(mapNotificationRow);

export const createNotificationIfAbsent = ({
  severity,
  eventType,
  dedupeKey,
  title,
  message,
  sourceType,
  sourceId,
  now,
}: {
  severity: "info" | "warning" | "critical";
  eventType: string;
  dedupeKey: string;
  title: string;
  message: string;
  sourceType?: string | null;
  sourceId?: string | null;
  now: string;
}) => {
  const id = randomUUID();
  const result = db.prepare(
    `INSERT OR IGNORE INTO planner_notifications
      (id, severity, event_type, dedupe_key, title, message, status, source_type, source_id, created_at)
     VALUES
      (?, ?, ?, ?, ?, ?, 'unread', ?, ?, ?)`,
  ).run(
    id,
    severity,
    eventType,
    dedupeKey,
    title,
    message,
    sourceType ?? null,
    sourceId ?? null,
    now,
  );
  return {
    created: result.changes > 0,
    notification: getNotificationByDedupeKey(dedupeKey),
  };
};

export const markNotificationRead = (id: string, now: string) => {
  db.prepare(
    "UPDATE planner_notifications SET status = 'read', read_at = ? WHERE id = ?",
  ).run(now, id);
};

export const listPlannerChatMessages = (limit = 80) =>
  (
    db
      .prepare(
        "SELECT * FROM planner_chat_messages ORDER BY created_at DESC LIMIT ?",
      )
      .all(limit) as ChatMessageRow[]
  ).reverse().map(mapChatMessageRow);

export const createPlannerChatMessage = ({
  role,
  content,
  actionType,
  metadata,
  now,
}: {
  role: "user" | "assistant";
  content: string;
  actionType?: string | null;
  metadata?: Record<string, unknown> | null;
  now: string;
}) => {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO planner_chat_messages
      (id, role, content, action_type, metadata_json, created_at)
     VALUES
      (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    role,
    content,
    actionType ?? null,
    metadata ? JSON.stringify(metadata) : null,
    now,
  );
  return mapChatMessageRow(
    db
      .prepare("SELECT * FROM planner_chat_messages WHERE id = ?")
      .get(id) as ChatMessageRow,
  );
};

export const listMemories = (scope?: string, status?: MemoryRow["status"]) => {
  const clauses: string[] = [];
  const values: string[] = [];
  if (scope) {
    clauses.push("scope = ?");
    values.push(scope);
  }
  if (status) {
    clauses.push("status = ?");
    values.push(status);
  }
  const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM planner_memories ${where} ORDER BY created_at DESC`)
    .all(...values) as MemoryRow[];
  return rows.map(mapMemoryRow);
};

export const updateMemory = ({
  id,
  title,
  content,
  status,
}: {
  id: string;
  title?: string;
  content?: string;
  status?: MemoryRow["status"];
}) => {
  const current = db
    .prepare("SELECT * FROM planner_memories WHERE id = ?")
    .get(id) as MemoryRow | undefined;
  if (!current) return null;
  const nextTitle = title?.trim() || current.title;
  const nextContent = content?.trim() || current.content;
  const nextStatus = status ?? current.status;
  db.prepare(
    "UPDATE planner_memories SET title = ?, content = ?, status = ? WHERE id = ?",
  ).run(nextTitle, nextContent, nextStatus, id);
  return mapMemoryRow(
    db.prepare("SELECT * FROM planner_memories WHERE id = ?").get(id) as MemoryRow,
  );
};

export const listPointLedger = () =>
  (
    db
      .prepare("SELECT * FROM point_ledger ORDER BY created_at DESC")
      .all() as PointRow[]
  ).map(mapPointRow);

export const recordPlannerRun = ({
  trigger,
  startedAt,
  finishedAt,
  inspectedIssues,
  createdActions,
  skippedActions,
  noOpResults,
  queueRisks,
  recommendedNextStep,
}: {
  trigger: "manual" | "automatic";
  startedAt: string;
  finishedAt: string;
  inspectedIssues: number;
  createdActions: number;
  skippedActions: number;
  noOpResults: number;
  queueRisks: number;
  recommendedNextStep: string;
}) => {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO planner_runs
      (id, trigger, started_at, finished_at, inspected_issues, created_actions, skipped_actions, no_op_results, queue_risks, recommended_next_step)
     VALUES
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    trigger,
    startedAt,
    finishedAt,
    inspectedIssues,
    createdActions,
    skippedActions,
    noOpResults,
    queueRisks,
    recommendedNextStep,
  );
  return mapPlannerRunRow(
    db.prepare("SELECT * FROM planner_runs WHERE id = ?").get(id) as PlannerRunRow,
  );
};

export const listPlannerRuns = (limit = 20) =>
  (
    db
      .prepare("SELECT * FROM planner_runs ORDER BY started_at DESC LIMIT ?")
      .all(limit) as PlannerRunRow[]
  ).map(mapPlannerRunRow);
