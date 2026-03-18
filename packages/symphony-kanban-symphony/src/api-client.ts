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
    const res = await fetch(`${base}/issues/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`transition failed: ${res.status} ${detail}`);
    }
  },
  async listWorkspaces() {
    const res = await fetch(`${base}/workspaces`);
    return res.json();
  },
  async listTags() {
    const res = await fetch(`${base}/tags`);
    return res.json();
  },
  async listWorkflows() {
    const res = await fetch(`${base}/workflows`);
    return res.json();
  },
});
