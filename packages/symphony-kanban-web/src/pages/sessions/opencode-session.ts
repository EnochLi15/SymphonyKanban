const normalizeBase = (base: string) => base.replace(/\/+$/, "");

export const buildOpencodeSessionUrl = (
  base: string,
  projectId: string,
  sessionId: string,
): string => {
  const safeBase = normalizeBase(base);
  return `${safeBase}/${encodeURIComponent(projectId)}/session/${encodeURIComponent(sessionId)}`;
};
