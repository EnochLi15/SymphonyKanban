import { db } from "./db.js";

export const listWorkspaces = () =>
  db
    .prepare(
      "SELECT id, name, local_path as localPath, context, created_at as createdAt, updated_at as updatedAt FROM workspaces ORDER BY created_at",
    )
    .all();

export const createWorkspace = (
  id: string,
  name: string,
  localPath: string | null,
  context: string | null,
  now: string,
) => {
  db.prepare(
    "INSERT INTO workspaces (id, name, local_path, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, name, localPath, context, now, now);
};

export const updateWorkspace = (
  id: string,
  name: string,
  localPath: string | null,
  context: string | null,
  now: string,
) => {
  db.prepare(
    "UPDATE workspaces SET name = ?, local_path = ?, context = ?, updated_at = ? WHERE id = ?",
  ).run(name, localPath, context, now, id);
};

export const countIssuesByWorkspace = (workspaceId: string) => {
  const row = db
    .prepare("SELECT COUNT(*) as count FROM issues WHERE workspace_id = ?")
    .get(workspaceId) as { count: number } | undefined;
  return row?.count ?? 0;
};

export const deleteWorkspace = (workspaceId: string) => {
  db.prepare("DELETE FROM workspaces WHERE id = ?").run(workspaceId);
};
