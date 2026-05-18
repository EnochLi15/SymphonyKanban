import { db } from "./db.js";
export const listWorkspaces = () => db
    .prepare("SELECT id, name, local_path as localPath, context, created_at as createdAt, updated_at as updatedAt FROM workspaces ORDER BY created_at")
    .all();
export const createWorkspace = (id, name, localPath, context, now) => {
    db.prepare("INSERT INTO workspaces (id, name, local_path, context, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, name, localPath, context, now, now);
};
export const findWorkspaceIdByLocalPath = (localPath) => {
    const row = db
        .prepare("SELECT id FROM workspaces WHERE local_path = ?")
        .get(localPath);
    return row?.id ?? null;
};
export const updateWorkspace = (id, name, localPath, context, now) => {
    db.prepare("UPDATE workspaces SET name = ?, local_path = ?, context = ?, updated_at = ? WHERE id = ?").run(name, localPath, context, now, id);
};
export const countIssuesByWorkspace = (workspaceId) => {
    const row = db
        .prepare("SELECT COUNT(*) as count FROM issues WHERE workspace_id = ?")
        .get(workspaceId);
    return row?.count ?? 0;
};
export const deleteWorkspace = (workspaceId) => {
    db.prepare("DELETE FROM workspaces WHERE id = ?").run(workspaceId);
};
