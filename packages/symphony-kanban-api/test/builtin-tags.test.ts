import { describe, expect, it } from "vitest";
import { db } from "../src/db.js";
import { ensureBuiltinTags } from "../src/builtin-tags.js";

const findTag = (name: string) =>
  db
    .prepare(
      "SELECT id, name, rules, acceptance_criteria as acceptanceCriteria, state, behavior, workflow_definition as workflowDefinition FROM tags WHERE name = ?",
    )
    .get(name) as
    | {
        id: string;
        name: string;
        rules: string | null;
        acceptanceCriteria: string | null;
        state: string | null;
        behavior: string | null;
        workflowDefinition: string | null;
      }
    | undefined;

const clearTables = () => {
  db.prepare("DELETE FROM tags").run();
};

describe("builtin tags", () => {
  it("inserts missing built-in tags and workflows", () => {
    clearTables();
    ensureBuiltinTags();
    const tag = findTag("UserStory");
    expect(tag).toBeTruthy();
    expect(tag?.state).toBe("Todo");
    expect(tag?.behavior).toBe("story-spec");
    expect(tag?.workflowDefinition).toBeTruthy();
  });
});
