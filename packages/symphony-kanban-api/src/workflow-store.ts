import { db } from "./db.js";

export const listWorkflowDefs = () =>
  db
    .prepare(
      "SELECT id, tag_id as tagId, state, behavior, config_json as configJson, created_at as createdAt, updated_at as updatedAt FROM workflow_defs ORDER BY created_at DESC",
    )
    .all();

export const createWorkflowDef = (
  id: string,
  tagId: string,
  state: string,
  behavior: string,
  configJson: string | null,
  now: string,
) => {
  db.prepare(
    "INSERT INTO workflow_defs (id, tag_id, state, behavior, config_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(id, tagId, state, behavior, configJson, now, now);
};

export const updateWorkflowDef = (
  id: string,
  state: string,
  behavior: string,
  configJson: string | null,
  now: string,
) => {
  db.prepare(
    "UPDATE workflow_defs SET state = ?, behavior = ?, config_json = ?, updated_at = ? WHERE id = ?",
  ).run(state, behavior, configJson, now, id);
};
