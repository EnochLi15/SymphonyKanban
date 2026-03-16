export const buildApi = (base: string) => ({
  async claimTodo() {
    const res = await fetch(`${base}/scheduler/claim`);
    return res.json();
  },
  async createExecution(payload: Record<string, unknown>) {
    const res = await fetch(`${base}/executions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  },
  async updateExecution(id: string, payload: Record<string, unknown>) {
    await fetch(`${base}/executions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  async addArtifact(executionId: string, payload: Record<string, unknown>) {
    await fetch(`${base}/executions/${executionId}/artifacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },
  async getSettings() {
    const res = await fetch(`${base}/settings/scheduler`);
    return res.json();
  },
  async transitionIssue(id: string, toStatus: string) {
    await fetch(`${base}/issues/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus }),
    });
  },
  async listWorkspaces() {
    const res = await fetch(`${base}/workspaces`);
    return res.json();
  },
});
