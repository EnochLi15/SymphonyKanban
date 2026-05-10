import { afterEach, describe, expect, it, vi } from "vitest";

const loadTheme = async () => {
  vi.resetModules();
  return import("./useTheme");
};

describe("useTheme", () => {
  afterEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("theme-dark", "theme-light");
  });

  it("defaults to light on first visit", async () => {
    const { useTheme } = await loadTheme();

    const { theme } = useTheme();

    expect(theme.value).toBe("light");
    expect(document.documentElement.classList.contains("theme-light")).toBe(true);
  });

  it("keeps a stored dark preference", async () => {
    window.localStorage.setItem("symphony-theme", "dark");
    const { useTheme } = await loadTheme();

    const { theme } = useTheme();

    expect(theme.value).toBe("dark");
    expect(document.documentElement.classList.contains("theme-dark")).toBe(true);
  });
});
