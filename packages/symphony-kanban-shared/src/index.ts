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

export interface IssueEventDTO {
  id: string;
  issueId: string;
  eventType: string;
  payload?: unknown | null;
  createdAt: string;
}

export interface TagDTO {
  id: string;
  name: string;
  type?: string | null;
  color?: string | null;
  rules?: string | null;
  acceptanceCriteria?: string | null;
  state?: string | null;
  behavior?: string | null;
  workflowDefinition?: string | null;
  afterCreate?: string | null;
  beforeRemove?: string | null;
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
  type:
    | "log"
    | "diff"
    | "test"
    | "summary"
    | "session"
    | "opencode_project"
    | "tmux_session";
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

export type BountyStatus =
  | "open"
  | "submitted"
  | "accepted"
  | "canceled";

export interface BountyTaskDTO {
  id: string;
  issueId: string;
  status: BountyStatus;
  title: string;
  question: string;
  context?: string | null;
  acceptanceCriteria: string;
  points: number;
  createdBy: string;
  assigneeName?: string | null;
  response?: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt?: string | null;
  acceptedAt?: string | null;
  canceledAt?: string | null;
}

export interface PlannerNotificationDTO {
  id: string;
  severity: "info" | "warning" | "critical";
  eventType: string;
  dedupeKey: string;
  title: string;
  message: string;
  status: "unread" | "read";
  sourceType?: string | null;
  sourceId?: string | null;
  createdAt: string;
  readAt?: string | null;
}

export interface PlannerChatMessageDTO {
  id: string;
  role: "user" | "assistant";
  content: string;
  actionType?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface PlannerMemoryDTO {
  id: string;
  scope: string;
  sourceType: string;
  sourceId: string;
  title: string;
  content: string;
  confidence: number;
  status: "candidate" | "approved" | "revoked";
  createdAt: string;
}

export interface PointLedgerDTO {
  id: string;
  contributor: string;
  bountyId: string;
  points: number;
  reason: string;
  createdAt: string;
}

export type PlannerRuleOutcome = "created" | "skipped" | "no_action";

export interface PlannerRuleResultDTO {
  ruleId: string;
  label: string;
  outcome: PlannerRuleOutcome;
  reason: string;
  actionType?: "notification" | "bounty" | null;
  actionId?: string | null;
}

export interface PlannerInspectedIssueDTO {
  issueId: string;
  title: string;
  status: IssueStatus;
  matchedRules: PlannerRuleResultDTO[];
}

export interface PlannerCreatedActionDTO {
  type: "notification" | "bounty";
  issueId?: string | null;
  actionId?: string | null;
  title: string;
  reason: string;
}

export interface PlannerSkippedActionDTO {
  type: "notification" | "bounty";
  issueId?: string | null;
  existingActionId?: string | null;
  title: string;
  reason: string;
}

export interface PlannerNoOpResultDTO {
  issueId?: string | null;
  title: string;
  status?: IssueStatus | null;
  reason: string;
}

export interface PlannerInsightDTO {
  issueId: string;
  title: string;
  status: IssueStatus;
  type:
    | "backlog-needs-prioritization"
    | "todo-ready-to-claim"
    | "in-progress-active"
    | "in-progress-stale"
    | "review-waiting-human"
    | "blocked-needs-recovery";
  severity: "info" | "warning" | "critical";
  reason: string;
  recommendedAction: string;
  sideEffectAllowed: boolean;
}

export interface PlannerQueueRiskDTO {
  type: "stale_in_progress" | "review_waiting" | "blocked_recovery";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  issueIds: string[];
}

export interface PlannerScanReportDTO {
  generatedAt: string;
  inspectedIssues: PlannerInspectedIssueDTO[];
  insights: PlannerInsightDTO[];
  queueRisks: PlannerQueueRiskDTO[];
  createdActions: PlannerCreatedActionDTO[];
  skippedActions: PlannerSkippedActionDTO[];
  noOpResults: PlannerNoOpResultDTO[];
  recommendedNextStep: string;
  createdBounties: number;
  createdNotifications: number;
  summary: {
    inspectedIssues: number;
    insights: number;
    queueRisks: number;
    createdActions: number;
    skippedActions: number;
    noOpResults: number;
  };
}
