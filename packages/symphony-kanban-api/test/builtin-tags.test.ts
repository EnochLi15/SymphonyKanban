import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";
import { ensureBuiltinTags } from "../src/builtin-tags.js";

const findTag = (name: string) =>
  db
    .prepare(
      "SELECT id, name, rules, acceptance_criteria as acceptanceCriteria FROM tags WHERE name = ?",
    )
    .get(name) as
    | {
        id: string;
        name: string;
        rules: string | null;
        acceptanceCriteria: string | null;
      }
    | undefined;

const findWorkflow = (tagId: string) =>
  db
    .prepare(
      "SELECT id, state, behavior, config_json as configJson FROM workflow_defs WHERE tag_id = ?",
    )
    .get(tagId) as
    | {
        id: string;
        state: string;
        behavior: string;
        configJson: string | null;
      }
    | undefined;

const clearTables = () => {
  db.prepare("DELETE FROM workflow_defs").run();
  db.prepare("DELETE FROM tags").run();
};

describe("builtin tags", () => {
  it("inserts missing built-in tags and workflows", () => {
    clearTables();
    ensureBuiltinTags();
    const tag = findTag("UserStory");
    expect(tag).toBeTruthy();
    const workflow = findWorkflow(tag!.id);
    expect(workflow).toBeTruthy();
  });
});
