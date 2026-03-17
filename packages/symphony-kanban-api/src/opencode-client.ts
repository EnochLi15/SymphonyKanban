import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk";

type OpenCodeProject = { name: string; local_path: string };

let cachedClient: {
  project: {
    list: () => Promise<OpenCodeProject[]>;
  };
} | null = null;

export const __resetOpenCodeClient = () => {
  cachedClient = null;
};

export const listOpenCodeProjects = async () => {
  if (!cachedClient) {
    try {
      const server = await createOpencode();
      cachedClient = server.client;
    } catch (error) {
      const baseUrl =
        process.env.OPENCODE_BASE_URL?.trim() || "http://127.0.0.1:4096";
      cachedClient = createOpencodeClient({ baseUrl });
    }
  }
  const projects = await cachedClient.project.list();
  return projects as OpenCodeProject[];
};
