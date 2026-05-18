import { randomUUID } from "node:crypto";
import { db } from "./db.js";
const getTagNames = (issueId) => {
    const tags = db
        .prepare("SELECT t.name FROM tags t INNER JOIN issue_tags it ON it.tag_id = t.id WHERE it.issue_id = ? ORDER BY t.name")
        .all(issueId);
    return tags.map((t) => t.name);
};
const mapIssueRow = (row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    workspaceId: row.workspace_id,
    tags: getTagNames(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
});
export const getIssueById = (id) => {
    const row = db
        .prepare("SELECT * FROM issues WHERE id = ? AND deleted_at IS NULL")
        .get(id);
    if (!row)
        return null;
    return mapIssueRow(row);
};
export const getIssueByIdIncludingDeleted = (id) => {
    const row = db
        .prepare("SELECT * FROM issues WHERE id = ?")
        .get(id);
    if (!row)
        return null;
    return mapIssueRow(row);
};
export const listIssues = () => {
    const rows = db
        .prepare("SELECT * FROM issues WHERE deleted_at IS NULL ORDER BY created_at DESC")
        .all();
    return rows.map(mapIssueRow);
};
export const writeIssueEvent = (issueId, eventType, payload) => {
    const now = new Date().toISOString();
    db.prepare("INSERT INTO issue_events (id, issue_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)").run(randomUUID(), issueId, eventType, JSON.stringify(payload), now);
};
export const transitionIssueStatus = (issueId, status, eventType = "status_changed") => {
    const now = new Date().toISOString();
    db.prepare("UPDATE issues SET status = ?, updated_at = ? WHERE id = ?").run(status, now, issueId);
    const snapshot = getIssueById(issueId);
    if (snapshot) {
        writeIssueEvent(issueId, eventType, snapshot);
    }
    return snapshot;
};
export const claimNextTodoIssue = () => {
    const tx = db.transaction(() => {
        const row = db
            .prepare("SELECT id FROM issues WHERE status = 'Todo' AND deleted_at IS NULL ORDER BY COALESCE(priority, 1) ASC, created_at ASC LIMIT 1")
            .get();
        if (!row)
            return null;
        return transitionIssueStatus(row.id, "InProgress", "scheduler_claimed");
    });
    return tx();
};
