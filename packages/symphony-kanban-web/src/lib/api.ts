export const buildApi = (base: string) => ({
  base,
  async getIssue(id: string) {
    const res = await fetch(`${base}/issues/${id}`);
    if (!res.ok) throw new Error("not_found");
    return res.json();
  },
  async listIssueEvents(id: string) {
    const res = await fetch(`${base}/issues/${id}/events`);
    if (!res.ok) throw new Error("issue_events_failed");
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
  async deleteAllIssues() {
    const res = await fetch(`${base}/issues`, { method: "DELETE" });
    if (!res.ok) throw new Error("delete_all_failed");
    return res.json();
  },
  async listWorkspaces() {
    const res = await fetch(`${base}/workspaces`);
    if (!res.ok) throw new Error("workspaces_failed");
    return res.json();
  },
  async listOpencodeProjects() {
    const res = await fetch(`${base}/workspaces/import/opencode/list`);
    if (!res.ok) throw new Error("opencode_list_failed");
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
  async createWorkspace(payload: Record<string, unknown>) {
    const res = await fetch(`${base}/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("workspace_create_failed");
    return res.json();
  },
  async importOpencodeProjects(payload: {
    projects: Array<{ name: string; localPath: string }>;
  }) {
    const res = await fetch(`${base}/workspaces/import/opencode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("opencode_import_failed");
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
  async runPlannerCycle() {
    const res = await fetch(`${base}/planner/cycle`, { method: "POST" });
    if (!res.ok) throw new Error("planner_cycle_failed");
    return res.json();
  },
  async getPlannerStatus() {
    const res = await fetch(`${base}/planner/status`);
    if (!res.ok) throw new Error("planner_status_failed");
    return res.json();
  },
  async listPlannerChatMessages() {
    const res = await fetch(`${base}/planner/chat`);
    if (!res.ok) throw new Error("planner_chat_failed");
    return res.json();
  },
  async sendPlannerChatMessage(message: string) {
    const res = await fetch(`${base}/planner/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({}));
      const error = new Error(
        errorJson.message || errorJson.error || "planner_chat_send_failed",
      ) as Error & { code?: string };
      error.code = errorJson.error;
      throw error;
    }
    return res.json();
  },
  async listBounties() {
    const res = await fetch(`${base}/bounties`);
    if (!res.ok) throw new Error("bounties_failed");
    return res.json();
  },
  async submitBounty(
    id: string,
    payload: { assigneeName: string; response: string },
  ) {
    const res = await fetch(`${base}/bounties/${id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("bounty_submit_failed");
    return res.json();
  },
  async acceptBounty(
    id: string,
    payload?: { recoveryAction?: "retry" | "keep_blocked"; applyToContext?: boolean },
  ) {
    const res = await fetch(`${base}/bounties/${id}/accept`, {
      method: "POST",
      headers: payload ? { "Content-Type": "application/json" } : undefined,
      body: payload ? JSON.stringify(payload) : undefined,
    });
    if (!res.ok) throw new Error("bounty_accept_failed");
    return res.json();
  },
  async cancelBounty(id: string) {
    const res = await fetch(`${base}/bounties/${id}/cancel`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("bounty_cancel_failed");
    return res.json();
  },
  async listPlannerNotifications() {
    const res = await fetch(`${base}/planner/notifications`);
    if (!res.ok) throw new Error("planner_notifications_failed");
    return res.json();
  },
  async markPlannerNotificationRead(id: string) {
    const res = await fetch(`${base}/planner/notifications/${id}/read`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("planner_notification_read_failed");
    return res.json();
  },
  async listPlannerMemories(scope?: string, status?: string) {
    const params = new URLSearchParams();
    if (scope) params.set("scope", scope);
    if (status) params.set("status", status);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${base}/planner/memories${query}`);
    if (!res.ok) throw new Error("planner_memories_failed");
    return res.json();
  },
  async updatePlannerMemory(
    id: string,
    payload: { title?: string; content?: string; status?: string },
  ) {
    const res = await fetch(`${base}/planner/memories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("planner_memory_update_failed");
    return res.json();
  },
  async listPointLedger() {
    const res = await fetch(`${base}/points`);
    if (!res.ok) throw new Error("points_failed");
    return res.json();
  },
});
