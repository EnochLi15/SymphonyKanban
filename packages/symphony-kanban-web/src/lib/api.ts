export const buildApi = (base: string) => ({
  base,
  async getIssue(id: string) {
    const res = await fetch(`${base}/issues/${id}`);
    if (!res.ok) throw new Error("not_found");
    return res.json();
  },
  async listIssues() {
    const res = await fetch(`${base}/issues`);
    if (!res.ok) throw new Error("load_failed");
    return res.json();
  },
  async updateIssue(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`${base}/issues/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("update_failed");
    return res.json();
  },
  async deleteIssue(id: string) {
    const res = await fetch(`${base}/issues/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete_failed");
    return res.json();
  },
  async listWorkspaces() {
    const res = await fetch(`${base}/workspaces`);
    if (!res.ok) throw new Error("workspaces_failed");
    return res.json();
  },
  async listTags() {
    const res = await fetch(`${base}/tags`);
    if (!res.ok) throw new Error("tags_failed");
    return res.json();
  },
  async createTag(payload: Record<string, unknown>) {
    const res = await fetch(`${base}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("tag_create_failed");
    return res.json();
  },
  async updateTag(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`${base}/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("tag_update_failed");
    return res.json();
  },
  async deleteTag(id: string) {
    const res = await fetch(`${base}/tags/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("tag_delete_failed");
    return res.json();
  },
  async listWorkflows() {
    const res = await fetch(`${base}/workflows`);
    if (!res.ok) throw new Error("workflow_failed");
    return res.json();
  },
  async createWorkflow(payload: Record<string, unknown>) {
    const res = await fetch(`${base}/workflows`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("workflow_create_failed");
    return res.json();
  },
  async updateWorkflow(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`${base}/workflows/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("workflow_update_failed");
    return res.json();
  },
  async createWorkspace(payload: Record<string, unknown>) {
    const res = await fetch(`${base}/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("workspace_create_failed");
    return res.json();
  },
  async updateWorkspace(id: string, payload: Record<string, unknown>) {
    const res = await fetch(`${base}/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("workspace_update_failed");
    return res.json();
  },
  async checkWorkspaceDeletion(id: string) {
    const res = await fetch(`${base}/workspaces/${id}/deletion-check`);
    if (!res.ok) throw new Error("workspace_delete_check_failed");
    return res.json();
  },
  async deleteWorkspace(id: string) {
    const res = await fetch(`${base}/workspaces/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const message = errorJson.error || "workspace_delete_failed";
      const error = new Error(message) as Error & { issueCount?: number };
      error.issueCount = errorJson.issueCount;
      throw error;
    }
    return res.json();
  },
  async getReview(issueId: string) {
    const res = await fetch(`${base}/review/${issueId}`);
    if (!res.ok) throw new Error("review_failed");
    return res.json();
  },
  async listExecutions(issueId: string) {
    const res = await fetch(`${base}/issues/${issueId}/executions`);
    if (!res.ok) throw new Error("executions_failed");
    return res.json();
  },
  async transitionIssue(id: string, toStatus: string) {
    const res = await fetch(`${base}/issues/${id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toStatus }),
    });
    if (!res.ok) throw new Error("transition_failed");
    return res.json();
  },
  async retryIssue(id: string) {
    const res = await fetch(`${base}/issues/${id}/retry`, { method: "POST" });
    if (!res.ok) throw new Error("retry_failed");
    return res.json();
  },
  async getExecutionStatus(id: string) {
    const res = await fetch(`${base}/executions/${id}/status`);
    if (!res.ok) throw new Error("execution_status_failed");
    return res.json();
  },
  async getArtifacts(executionId: string) {
    const res = await fetch(`${base}/executions/${executionId}/artifacts`);
    if (!res.ok) throw new Error("artifacts_failed");
    return res.json();
  },
  async getSchedulerSettings() {
    const res = await fetch(`${base}/settings/scheduler`);
    if (!res.ok) throw new Error("scheduler_settings_failed");
    return res.json();
  },
  async updateSchedulerSettings(payload: Record<string, unknown>) {
    const res = await fetch(`${base}/settings/scheduler`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("scheduler_settings_update_failed");
    return res.json();
  },
});
