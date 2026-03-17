import { createOpencode } from "@opencode-ai/sdk";

type OpenCodeProject = { name: string; local_path: string };

let cached: ReturnType<typeof createOpencode> | null = null;

export const listOpenCodeProjects = async () => {
  if (!cached) cached = createOpencode();
  const projects = await cached.client.project.list();
  return projects as OpenCodeProject[];
};
