import { randomUUID } from "node:crypto";
import { db } from "./db.js";

export type IssueRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  workspace_id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type IssueDTO = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: number | null;
  workspaceId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

const getTagNames = (issueId: string): string[] => {
  const tags = db
    .prepare(
      "SELECT t.name FROM tags t INNER JOIN issue_tags it ON it.tag_id = t.id WHERE it.issue_id = ? ORDER BY t.name",
    )
    .all(issueId) as Array<{ name: string }>;
  return tags.map((t) => t.name);
};

const mapIssueRow = (row: IssueRow): IssueDTO => ({
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

export const getIssueById = (id: string): IssueDTO | null => {
  const row = db
    .prepare("SELECT * FROM issues WHERE id = ? AND deleted_at IS NULL")
    .get(id) as IssueRow | undefined;
  if (!row) return null;
  return mapIssueRow(row);
};

export const getIssueByIdIncludingDeleted = (id: string): IssueDTO | null => {
  const row = db
    .prepare("SELECT * FROM issues WHERE id = ?")
    .get(id) as IssueRow | undefined;
  if (!row) return null;
  return mapIssueRow(row);
};

export const listIssues = (): IssueDTO[] => {
  const rows = db
    .prepare("SELECT * FROM issues WHERE deleted_at IS NULL ORDER BY created_at DESC")
    .all() as IssueRow[];
  return rows.map(mapIssueRow);
};

export const writeIssueEvent = (
  issueId: string,
  eventType: string,
  payload: IssueDTO,
) => {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO issue_events (id, issue_id, event_type, payload, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(randomUUID(), issueId, eventType, JSON.stringify(payload), now);
};
