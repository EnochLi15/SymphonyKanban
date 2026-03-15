export type IssueView = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority?: number | null;
  workspaceId: string;
  workspaceName?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type FilterState = {
  workspaceId: string | "all";
  tags: string[];
};

export type PriorityBucket = "P0" | "P1" | "P2" | "P3";

const priorityLabels = {
  P0: "P0 重要且紧急",
  P1: "P1 重要不紧急",
  P2: "P2 紧急不重要",
  P3: "P3 不紧急不重要",
};

export const normalizePriority = (priority?: number | null): number => {
  if (priority === null || priority === undefined) return 1;
  return priority;
};

export const priorityMeta = (priority?: number | null) => {
  const value = normalizePriority(priority);
  const code = (value === 0
    ? "P0"
    : value === 1
      ? "P1"
      : value === 2
        ? "P2"
        : "P3") as PriorityBucket;
  return {
    value,
    code,
    label: priorityLabels[code],
  };
};

export const priorityLabel = (priority?: number | null): string =>
  priorityMeta(priority).label;

export const statusLabel = (status: string): string => {
  switch (status) {
    case "Backlog":
      return "待排期 (Backlog)";
    case "Todo":
      return "待办 (Todo)";
    case "InProgress":
      return "进行中 (In Progress)";
    case "Review":
      return "审核中 (Review)";
    case "Done":
      return "已完成 (Done)";
    case "Blocked":
      return "已阻塞 (Blocked)";
    default:
      return status;
  }
};

export const sortIssues = (issues: IssueView[]): IssueView[] =>
  [...issues].sort((a, b) => {
    const pa = normalizePriority(a.priority);
    const pb = normalizePriority(b.priority);
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

export const filterIssues = (issues: IssueView[], filters: FilterState): IssueView[] =>
  issues.filter((issue) => {
    const workspaceMatch =
      filters.workspaceId === "all" || issue.workspaceId === filters.workspaceId;
    const tagsMatch =
      filters.tags.length === 0 ||
      filters.tags.every((tag) => issue.tags.includes(tag));
    return workspaceMatch && tagsMatch;
  });

export const groupByStatus = (issues: IssueView[]) => {
  return {
    Backlog: issues.filter((issue) => issue.status === "Backlog"),
    Todo: issues.filter((issue) => issue.status === "Todo"),
    InProgress: issues.filter((issue) => issue.status === "InProgress"),
    Review: issues.filter((issue) => issue.status === "Review"),
    Done: issues.filter((issue) => issue.status === "Done"),
    Blocked: issues.filter((issue) => issue.status === "Blocked"),
  };
};

export const groupByPriority = (issues: IssueView[]) => {
  const buckets = {
    P0: [] as IssueView[],
    P1: [] as IssueView[],
    P2: [] as IssueView[],
    P3: [] as IssueView[],
  };
  for (const issue of issues) {
    const meta = priorityMeta(issue.priority);
    buckets[meta.code].push(issue);
  }
  return buckets;
};
