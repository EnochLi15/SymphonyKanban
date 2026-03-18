import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { db } from "./db.js";

type BuiltinWorkflow = {
  state: string;
  behavior: string;
  configJson: unknown;
};

export type BuiltinTag = {
  name: string;
  type: string | null;
  color: string | null;
  rules: string | null;
  acceptanceCriteria: string | null;
  workflow: BuiltinWorkflow;
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
          "INSERT INTO tags (id, name, type, color, rules, acceptance_criteria, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        ).run(
          tagId,
          tag.name,
          tag.type ?? null,
          tag.color ?? null,
          tag.rules ?? null,
          tag.acceptanceCriteria ?? null,
          now,
          now,
        );
      }

      const workflowExisting = db
        .prepare("SELECT id FROM workflow_defs WHERE tag_id = ? LIMIT 1")
        .get(tagId) as { id: string } | undefined;

      if (!workflowExisting) {
        const configJson =
          tag.workflow?.configJson === undefined || tag.workflow?.configJson === null
            ? null
            : JSON.stringify(tag.workflow.configJson);
        db.prepare(
          "INSERT INTO workflow_defs (id, tag_id, state, behavior, config_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        ).run(
          randomUUID(),
          tagId,
          tag.workflow.state,
          tag.workflow.behavior,
          configJson,
          now,
          now,
        );
      }
    }
  });
  tx();
};
