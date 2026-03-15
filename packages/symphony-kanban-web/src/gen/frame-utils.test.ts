import { describe, it, expect } from "vitest";
import { slugify, inferModule, groupFrames } from "./frame-utils";

describe("frame-utils", () => {
  it("slugify creates kebab-case", () => {
    expect(slugify("Project Settings")).toBe("project-settings");
  });

  it("inferModule picks dominant keyword", () => {
    expect(inferModule("Board Overview")).toBe("board");
  });

  it("groupFrames clusters by module", () => {
    const grouped = groupFrames([
      { id: "1", name: "Board Overview" },
      { id: "2", name: "Board Settings" },
      { id: "3", name: "Project List" },
    ]);
    expect(Object.keys(grouped)).toEqual(["board", "project"]);
    expect(grouped.board.length).toBe(2);
  });
});
