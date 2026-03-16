import { describe, it, expect } from "vitest";
import { routeForStatus } from "./issue-detail-routing";

describe("issue-detail-routing", () => {
  it("maps status to route suffix", () => {
    expect(routeForStatus("InProgress")).toBe("/session");
    expect(routeForStatus("Review")).toBe("/review");
    expect(routeForStatus("Blocked")).toBe("/error");
    expect(routeForStatus("Todo")).toBe("");
  });
});
