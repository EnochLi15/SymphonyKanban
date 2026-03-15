export type FrameMeta = { id: string; name: string };

const MODULE_KEYWORDS = [
  "board",
  "project",
  "settings",
  "member",
  "user",
  "team",
  "workflow",
  "calendar",
  "report",
  "analytics",
];

export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function inferModule(name: string): string {
  const lower = name.toLowerCase();
  const match = MODULE_KEYWORDS.find((keyword) => lower.includes(keyword));
  return match ?? "general";
}

export function groupFrames(frames: FrameMeta[]): Record<string, FrameMeta[]> {
  return frames.reduce<Record<string, FrameMeta[]>>((acc, frame) => {
    const module = inferModule(frame.name);
    if (!acc[module]) acc[module] = [];
    acc[module].push(frame);
    return acc;
  }, {});
}
