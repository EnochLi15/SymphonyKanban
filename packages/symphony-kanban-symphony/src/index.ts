export const startSymphony = () => {
  // TODO: wire fizzy-popper scheduler + API adapters + opencode executor
  // eslint-disable-next-line no-console
  console.log("Symphony orchestrator starting...");
};

if (process.env.NODE_ENV !== "test") {
  startSymphony();
}
