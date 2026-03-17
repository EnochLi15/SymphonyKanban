import { db } from "./db.js";

export const listTags = () =>
  db
    .prepare(
      "SELECT id, name, type, color, rules, acceptance_criteria as acceptanceCriteria, created_at as createdAt, updated_at as updatedAt FROM tags ORDER BY name",
    )
    .all();

export const createTag = (
  id: string,
  name: string,
  type: string | null,
  color: string | null,
  rules: string | null,
  acceptanceCriteria: string | null,
  now: string,
) => {
  db.prepare(
    "INSERT INTO tags (id, name, type, color, rules, acceptance_criteria, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(id, name, type, color, rules, acceptanceCriteria, now, now);
};

export const updateTag = (
  id: string,
  name: string,
  type: string | null,
  color: string | null,
  rules: string | null,
  acceptanceCriteria: string | null,
  now: string,
) => {
  db.prepare(
    "UPDATE tags SET name = ?, type = ?, color = ?, rules = ?, acceptance_criteria = ?, updated_at = ? WHERE id = ?",
  ).run(name, type, color, rules, acceptanceCriteria, now, id);
};

export const deleteTag = (id: string) => {
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
};
