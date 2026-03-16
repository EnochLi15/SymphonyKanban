import { db } from "./db.js";

export const listTags = () =>
  db
    .prepare(
      "SELECT id, name, type, color, created_at as createdAt, updated_at as updatedAt FROM tags ORDER BY name",
    )
    .all();

export const createTag = (
  id: string,
  name: string,
  type: string | null,
  color: string | null,
  now: string,
) => {
  db.prepare(
    "INSERT INTO tags (id, name, type, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(id, name, type, color, now, now);
};

export const updateTag = (
  id: string,
  name: string,
  type: string | null,
  color: string | null,
  now: string,
) => {
  db.prepare(
    "UPDATE tags SET name = ?, type = ?, color = ?, updated_at = ? WHERE id = ?",
  ).run(name, type, color, now, id);
};

export const deleteTag = (id: string) => {
  db.prepare("DELETE FROM tags WHERE id = ?").run(id);
};
