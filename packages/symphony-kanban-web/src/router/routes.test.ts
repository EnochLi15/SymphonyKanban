import { describe, it, expect } from "vitest";
import { routes } from "./routes";

describe("routes", () => {
  it("has issue detail child routes", () => {
    const issueRoute = routes.find((route) => route.path === "/issues/:id");
    expect(issueRoute?.children?.map((child) => child.path)).toEqual([
      "",
      "session",
      "review",
      "error",
    ]);
  });

  it("has a bounty center route", () => {
    expect(routes.some((route) => route.path === "/bounties")).toBe(true);
  });
});
