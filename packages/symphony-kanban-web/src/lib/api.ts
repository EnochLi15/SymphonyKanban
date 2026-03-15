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
});
