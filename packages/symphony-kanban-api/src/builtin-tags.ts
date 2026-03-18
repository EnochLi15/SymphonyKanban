import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { db } from "./db.js";

export type BuiltinTag = {
  name: string;
  type: string | null;
  color: string | null;
  rules: string | null;
  acceptanceCriteria: string | null;
  state: string | null;
  behavior: string | null;
  workflowDefinition: string | null;
  afterCreate: string | null;
  beforeRemove: string | null;
};

type BuiltinPayload = { tags: BuiltinTag[] };

export const BUILTIN_TAG_NAMES = [
  "UserStory",
  "Bugfix",
  "CodeReview",
  "Refactor",
] as const;

const loadBuiltinTags = (): BuiltinTag[] => {
  const filePath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "data",
    "builtin-tags.json",
  );
  const raw = readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw) as BuiltinPayload;
  return Array.isArray(parsed.tags) ? parsed.tags : [];
};

export const ensureBuiltinTags = () => {
  const now = new Date().toISOString();
  const tags = loadBuiltinTags();
  const tx = db.transaction(() => {
    for (const tag of tags) {
      const existing = db
        .prepare("SELECT id FROM tags WHERE name = ? ORDER BY created_at ASC LIMIT 1")
        .get(tag.name) as { id: string } | undefined;
      const tagId = existing?.id ?? randomUUID();

      if (!existing) {
        db.prepare(
          "INSERT INTO tags (id, name, type, color, rules, acceptance_criteria, state, behavior, workflow_definition, after_create, before_remove, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          tagId,
          tag.name,
          tag.type ?? null,
          tag.color ?? null,
          tag.rules ?? null,
          tag.acceptanceCriteria ?? null,
          tag.state ?? null,
          tag.behavior ?? null,
          tag.workflowDefinition ?? null,
          tag.afterCreate ?? null,
          tag.beforeRemove ?? null,
          now,
          now,
        );
      }
    }
  });
  tx();
};
