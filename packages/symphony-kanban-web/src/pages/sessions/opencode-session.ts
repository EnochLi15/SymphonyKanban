import type { ExecutionArtifactDTO } from "symphony-kanban-shared";

const normalizeBase = (base: string) => base.replace(/\/+$/, "");

export const buildOpencodeSessionUrl = (
  base: string,
  projectId: string,
  sessionId: string,
): string => {
  const safeBase = normalizeBase(base);
  return `${safeBase}/${projectId}/session/${sessionId}`;
};

export const resolveOpencodeSessionUrl = (
  base: string,
  artifacts: Array<Pick<ExecutionArtifactDTO, "type" | "content">> | undefined,
): string => {
  if (!artifacts) return "";
  const sessionId = artifacts.find((artifact) => artifact.type === "session")?.content ?? "";
  const projectId =
    artifacts.find((artifact) => artifact.type === "opencode_project")?.content ?? "";
  if (!sessionId || !projectId) return "";
  return buildOpencodeSessionUrl(base, projectId, sessionId);
};
