import { db } from "./db.js";

const MAX_ARTIFACT_CHARS = 200_000;

export const truncateArtifactContent = (input: string | null | undefined) => {
  if (!input) return { content: input ?? null, truncated: 0, size: 0 };
  const size = input.length;
  if (size <= MAX_ARTIFACT_CHARS) return { content: input, truncated: 0, size };
  const tail = input.slice(size - MAX_ARTIFACT_CHARS);
  return { content: tail, truncated: 1, size };
};

export const createExecution = (
  id: string,
  issueId: string,
  status: string,
  startedAt: string,
  runner: string | null,
  attempt: number,
) => {
  db.prepare(
    "INSERT INTO executions (id, issue_id, status, started_at, runner, attempt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, issueId, status, startedAt, runner, attempt, startedAt);
};

export const updateExecution = (
  id: string,
  status: string,
  finishedAt: string | null,
  errorSummary: string | null,
) => {
  db.prepare(
    "UPDATE executions SET status = ?, finished_at = ?, error_summary = ? WHERE id = ?",
  ).run(status, finishedAt, errorSummary, id);
};

export const listExecutionsByIssue = (issueId: string) =>
  db
    .prepare(
      "SELECT id, issue_id as issueId, status, started_at as startedAt, finished_at as finishedAt, error_summary as errorSummary, runner, attempt, created_at as createdAt FROM executions WHERE issue_id = ? ORDER BY started_at DESC",
    )
    .all(issueId);

export const insertArtifact = (
  id: string,
  executionId: string,
  type: string,
  content: string | null,
  summary: string | null,
  truncated: number,
  size: number,
  now: string,
) => {
  db.prepare(
    "INSERT INTO execution_artifacts (id, execution_id, type, content, summary, content_truncated, content_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, executionId, type, content, summary, truncated, size, now);
};

export const recordArtifact = (
  id: string,
  executionId: string,
  type: string,
  content: string | null,
  summary: string | null,
  now: string,
) => {
  const { content: safe, truncated, size } = truncateArtifactContent(content);
  insertArtifact(id, executionId, type, safe, summary, truncated, size, now);
  return { id, truncated: !!truncated };
};

export const listArtifacts = (executionId: string) =>
  db
    .prepare(
      "SELECT id, execution_id as executionId, type, content, summary, content_truncated as contentTruncated, content_size as contentSize, created_at as createdAt FROM execution_artifacts WHERE execution_id = ? ORDER BY created_at ASC",
    )
    .all(executionId);
