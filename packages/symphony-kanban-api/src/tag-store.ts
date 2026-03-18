import { db } from "./db.js";

export const listTags = () =>
  db
    .prepare(
      "SELECT id, name, type, color, rules, acceptance_criteria as acceptanceCriteria, state, behavior, workflow_definition as workflowDefinition, after_create as afterCreate, before_remove as beforeRemove, created_at as createdAt, updated_at as updatedAt FROM tags ORDER BY name",
    )
    .all();

export const createTag = (
  id: string,
  name: string,
  type: string | null,
  color: string | null,
  rules: string | null,
  acceptanceCriteria: string | null,
  state: string | null,
  behavior: string | null,
  workflowDefinition: string | null,
  afterCreate: string | null,
  beforeRemove: string | null,
  now: string,
) => {
  db.prepare(
    "INSERT INTO tags (id, name, type, color, rules, acceptance_criteria, state, behavior, workflow_definition, after_create, before_remove, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(
    id,
    name,
    type,
    color,
    rules,
    acceptanceCriteria,
    state,
    behavior,
    workflowDefinition,
    afterCreate,
    beforeRemove,
    now,
    now,
  );
};

export const updateTag = (
  id: string,
  name: string,
  type: string | null,
  color: string | null,
  rules: string | null,
  acceptanceCriteria: string | null,
  state: string | null,
  behavior: string | null,
  workflowDefinition: string | null,
  afterCreate: string | null,
  beforeRemove: string | null,
  now: string,
) => {
  db.prepare(
    "UPDATE tags SET name = ?, type = ?, color = ?, rules = ?, acceptance_criteria = ?, state = ?, behavior = ?, workflow_definition = ?, after_create = ?, before_remove = ?, updated_at = ? WHERE id = ?",
  ).run(
    name,
    type,
    color,
    rules,
    acceptanceCriteria,
    state,
    behavior,
    workflowDefinition,
    afterCreate,
    beforeRemove,
    now,
    id,
  );
};

export const deleteTag = (id: string) => {
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
};
