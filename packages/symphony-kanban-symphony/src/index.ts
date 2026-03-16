import { startScheduler } from "./scheduler.js";

export const startSymphony = () => {
  const apiBase = process.env.API_BASE ?? "http://localhost:3001";
  const opencodeBase = process.env.OPENCODE_BASE ?? "http://localhost:4096";
  // eslint-disable-next-line no-console
  console.log("Symphony orchestrator starting...");
  startScheduler({ apiBase, opencodeBase });
};

if (process.env.NODE_ENV !== "test") {
  startSymphony();
}
