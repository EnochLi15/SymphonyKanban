import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk";
let cachedClient = null;
export const __resetOpenCodeClient = () => {
    cachedClient = null;
};
export const listOpenCodeProjects = async () => {
    if (!cachedClient) {
        try {
            const server = await createOpencode();
            cachedClient = server.client;
        }
        catch (error) {
            const baseUrl = process.env.OPENCODE_BASE_URL?.trim() || "http://localhost:4096";
            cachedClient = createOpencodeClient({ baseUrl });
        }
    }
    if (!cachedClient)
        return [];
    const response = await cachedClient.project.list({ responseStyle: "data" });
    const projects = Array.isArray(response)
        ? response
        : response.data ?? [];
    return projects;
};
