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
