import { describe, it, expect } from "vitest";
import { buildApi } from "./api";

describe("api", () => {
  it("builds issue routes", () => {
    const api = buildApi("http://localhost:3001");
    expect(api.base).toBe("http://localhost:3001");
  });
});
