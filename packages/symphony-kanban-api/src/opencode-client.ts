import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk";

type OpenCodeProject = { name: string; local_path: string };

type OpenCodeClient = {
  project: {
    list: (options?: Record<string, unknown>) => Promise<unknown>;
  };
};

let cachedClient: OpenCodeClient | null = null;

export const __resetOpenCodeClient = () => {
  cachedClient = null;
};

export const listOpenCodeProjects = async () => {
  if (!cachedClient) {
    try {
      const server = await createOpencode();
      cachedClient = server.client as unknown as OpenCodeClient;
    } catch (error) {
      const baseUrl =
        process.env.OPENCODE_BASE_URL?.trim() || "http://localhost:4096";
      cachedClient = createOpencodeClient({ baseUrl }) as unknown as OpenCodeClient;
    }
  }
  if (!cachedClient) return [];
  const response = await cachedClient.project.list({ responseStyle: "data" });
  const projects = Array.isArray(response)
    ? response
    : (response as { data?: OpenCodeProject[] }).data ?? [];
  return projects as OpenCodeProject[];
};
