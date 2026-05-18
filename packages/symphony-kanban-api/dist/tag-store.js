import { db } from "./db.js";
export const listTags = () => db
    .prepare("SELECT id, name, type, color, rules, acceptance_criteria as acceptanceCriteria, state, behavior, workflow_definition as workflowDefinition, after_create as afterCreate, before_remove as beforeRemove, created_at as createdAt, updated_at as updatedAt FROM tags ORDER BY name")
    .all();
export const createTag = (id, name, type, color, rules, acceptanceCriteria, state, behavior, workflowDefinition, afterCreate, beforeRemove, now) => {
    db.prepare("INSERT INTO tags (id, name, type, color, rules, acceptance_criteria, state, behavior, workflow_definition, after_create, before_remove, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, name, type, color, rules, acceptanceCriteria, state, behavior, workflowDefinition, afterCreate, beforeRemove, now, now);
};
export const updateTag = (id, name, type, color, rules, acceptanceCriteria, state, behavior, workflowDefinition, afterCreate, beforeRemove, now) => {
    db.prepare("UPDATE tags SET name = ?, type = ?, color = ?, rules = ?, acceptance_criteria = ?, state = ?, behavior = ?, workflow_definition = ?, after_create = ?, before_remove = ?, updated_at = ? WHERE id = ?").run(name, type, color, rules, acceptanceCriteria, state, behavior, workflowDefinition, afterCreate, beforeRemove, now, id);
};
export const deleteTag = (id) => {
    db.prepare("DELETE FROM tags WHERE id = ?").run(id);
};
