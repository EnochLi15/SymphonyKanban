export type IssueStatus =
  | "Backlog"
  | "Todo"
  | "InProgress"
  | "Review"
  | "Blocked"
  | "Done";

export interface IssueDTO {
  id: string;
  title: string;
  description?: string;
  status: IssueStatus;
  priority?: number;
  workspaceId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface TagDTO {
  id: string;
  name: string;
  type?: string | null;
  color?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface WorkflowDefDTO {
  id: string;
  tagId: string;
  state: IssueStatus;
  behavior: string;
  configJson?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceDTO {
  id: string;
  name: string;
  localPath?: string | null;
  context?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ExecutionDTO {
  id: string;
  issueId: string;
  status: "running" | "succeeded" | "failed";
  startedAt: string;
  finishedAt?: string | null;
  errorSummary?: string | null;
  runner?: string | null;
  attempt: number;
  createdAt: string;
}

export interface ExecutionArtifactDTO {
  id: string;
  executionId: string;
  type: "log" | "diff" | "test" | "summary";
  content?: string | null;
  summary?: string | null;
  contentTruncated: boolean;
  contentSize: number;
  createdAt: string;
}

export interface ReviewDTO {
  issue: IssueDTO;
  execution: ExecutionDTO;
  artifacts: ExecutionArtifactDTO[];
}

export interface SchedulerSettingsDTO {
  id: string;
  maxConcurrency: number;
  pollIntervalMs: number;
  updatedAt: string;
}
