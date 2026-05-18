import { db } from "./db.js";
const MAX_ARTIFACT_CHARS = 200_000;
export const truncateArtifactContent = (input) => {
    if (!input)
        return { content: input ?? null, truncated: 0, size: 0 };
    const size = input.length;
    if (size <= MAX_ARTIFACT_CHARS)
        return { content: input, truncated: 0, size };
    const tail = input.slice(size - MAX_ARTIFACT_CHARS);
    return { content: tail, truncated: 1, size };
};
export const createExecution = (id, issueId, status, startedAt, runner, attempt) => {
    db.prepare("INSERT INTO executions (id, issue_id, status, started_at, runner, attempt, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(id, issueId, status, startedAt, runner, attempt, startedAt);
};
export const updateExecution = (id, status, finishedAt, errorSummary) => {
    db.prepare("UPDATE executions SET status = ?, finished_at = ?, error_summary = ? WHERE id = ?").run(status, finishedAt, errorSummary, id);
};
export const listExecutionsByIssue = (issueId) => db
    .prepare("SELECT id, issue_id as issueId, status, started_at as startedAt, finished_at as finishedAt, error_summary as errorSummary, runner, attempt, created_at as createdAt FROM executions WHERE issue_id = ? ORDER BY started_at DESC")
    .all(issueId);
export const insertArtifact = (id, executionId, type, content, summary, truncated, size, now) => {
    db.prepare("INSERT INTO execution_artifacts (id, execution_id, type, content, summary, content_truncated, content_size, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, executionId, type, content, summary, truncated, size, now);
};
export const recordArtifact = (id, executionId, type, content, summary, now) => {
    const { content: safe, truncated, size } = truncateArtifactContent(content);
    insertArtifact(id, executionId, type, safe, summary, truncated, size, now);
    return { id, truncated: !!truncated };
};
export const listArtifacts = (executionId) => db
    .prepare("SELECT id, execution_id as executionId, type, content, summary, content_truncated as contentTruncated, content_size as contentSize, created_at as createdAt FROM execution_artifacts WHERE execution_id = ? ORDER BY created_at ASC")
    .all(executionId);
