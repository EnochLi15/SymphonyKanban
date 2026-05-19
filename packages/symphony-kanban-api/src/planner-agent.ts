import { Agent, Mastra, createTool } from "@mastra/core";
import { getProviderConfig, parseModelString, type MastraModelConfig } from "@mastra/core/llm";
import { z } from "zod";
import { listExecutionsByIssue } from "./execution-store.js";
import { getIssueById, listIssues } from "./issue-store.js";
import {
  createBounty,
  createPlannerChatMessage,
  createNotificationIfAbsent,
  findActiveBountyByIssue,
  listBounties,
  listMemories,
  listNotifications,
  listPlannerChatMessages,
  listPointLedger,
} from "./planner-store.js";

export const isPlannerEnabled = () =>
  process.env.MASTRA_PLANNER_ENABLED === "true" ||
  process.env.PLANNER_AGENT_ENABLED === "true";

export class PlannerModelNotConfiguredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerModelNotConfiguredError";
  }
}

const DEFAULT_PLANNER_MODEL = "openai/gpt-4o-mini";

const missingModelConfigMessage = (model: string, envVars: string[]) =>
  [
    `Planner 大模型未配置，当前模型为 ${model}。`,
    `请设置以下环境变量之一: ${envVars.join(", ")}。`,
    "也可以使用 MASTRA_PLANNER_MODEL_URL + MASTRA_PLANNER_MODEL_API_KEY 接入 OpenAI-compatible 网关。",
  ].join(" ");

export const resolvePlannerModelConfig = (): MastraModelConfig => {
  const model = process.env.MASTRA_PLANNER_MODEL ?? process.env.MASTRA_MODEL ?? DEFAULT_PLANNER_MODEL;
  const customUrl = process.env.MASTRA_PLANNER_MODEL_URL ?? process.env.MASTRA_MODEL_URL;
  const customApiKey =
    process.env.MASTRA_PLANNER_MODEL_API_KEY ?? process.env.MASTRA_MODEL_API_KEY;

  if (customUrl || customApiKey) {
    if (!customUrl || !customApiKey) {
      throw new PlannerModelNotConfiguredError(
        "OpenAI-compatible 模型需要同时设置 MASTRA_PLANNER_MODEL_URL 和 MASTRA_PLANNER_MODEL_API_KEY。",
      );
    }
    const parsed = parseModelString(model);
    return {
      providerId: process.env.MASTRA_PLANNER_MODEL_PROVIDER ?? parsed.provider ?? "planner",
      modelId: parsed.modelId,
      url: customUrl,
      apiKey: customApiKey,
    };
  }

  const parsed = parseModelString(model);
  const provider = parsed.provider ?? "openai";
  const providerConfig = getProviderConfig(provider);
  const envVars = providerConfig
    ? Array.isArray(providerConfig.apiKeyEnvVar)
      ? providerConfig.apiKeyEnvVar
      : [providerConfig.apiKeyEnvVar]
    : [`${provider.toUpperCase().replace(/-/g, "_")}_API_KEY`];

  if (!envVars.some((envVar) => Boolean(process.env[envVar]))) {
    throw new PlannerModelNotConfiguredError(missingModelConfigMessage(model, envVars));
  }

  return model as MastraModelConfig;
};

const plannerStateTool = createTool({
  id: "get_planner_state",
  description:
    "读取 Symphony Planner 当前状态，包括悬赏、通知、记忆、积分和任务概览。回答状态、风险、下一步建议前必须调用。",
  inputSchema: z.object({}),
  execute: async () => buildPlannerStateSummary(),
});

const runPlannerCycleTool = createTool({
  id: "run_planner_cycle",
  description:
    "运行一次 planner 扫描，识别阻塞任务、创建通知和最小悬赏任务。用户要求规划、扫描、检查、刷新时使用。",
  inputSchema: z.object({
    issueIds: z.array(z.string()).optional(),
  }),
  execute: async ({ context }) => runPlannerCycle({ issueIds: context.issueIds }),
});

const createBountyTool = createTool({
  id: "create_bounty",
  description:
    "创建一个人类悬赏求助任务。只在问题已经被拆成最小、可验收的求助单元时调用。",
  inputSchema: z.object({
    issueId: z.string(),
    title: z.string(),
    question: z.string(),
    context: z.string().optional(),
    acceptanceCriteria: z.string(),
    points: z.number().int().min(1).max(100).default(5),
  }),
  execute: async ({ context }) => {
    const issue = getIssueById(context.issueId);
    if (!issue) {
      return { ok: false, error: "issue_not_found" };
    }
    const bounty = createBounty({
      issueId: context.issueId,
      title: context.title,
      question: context.question,
      context: context.context ?? null,
      acceptanceCriteria: context.acceptanceCriteria,
      points: context.points,
      createdBy: "symphony-planner-agent",
      now: new Date().toISOString(),
    });
    return { ok: true, bounty };
  },
});

export const createPlannerAgent = (model: MastraModelConfig = resolvePlannerModelConfig()) =>
  new Agent({
    id: "symphony-planner-agent",
    name: "Symphony Planner Agent",
    instructions: [
      "你是 Symphony Kanban 的编排与规划 agent。",
      "你是一个真实的大模型 agent，必须基于工具返回的事实回答；不知道就说不知道并请求更多上下文。",
      "业务事实源是 Symphony API 与 SQLite repository；所有副作用必须走工具或 store 边界。",
      "你自己不实际执行开发任务；执行任务由 scheduler 通过 tmux 调度 claude-glm 完成，你负责规划、看护、识别风险和发起求助。",
      "把求助拆成一个最小、可验证的人类悬赏任务；不要把未验证的 agent 自述沉淀为事实记忆。",
      "长期记忆只保存可复用的决策、问题模式、人类答案与验收结论。",
      "用户要求扫描、刷新、运行规划时，调用 run_planner_cycle。",
      "用户要求当前状态、风险、队列、积分、记忆时，先调用 get_planner_state。",
      "用户要求创建求助时，先判断是否足够最小、可验收；足够时调用 create_bounty，不足时追问缺失信息。",
    ],
    model,
    tools: {
      getPlannerState: plannerStateTool,
      runPlannerCycle: runPlannerCycleTool,
      createBounty: createBountyTool,
    },
    defaultGenerateOptions: {
      maxSteps: 6,
      temperature: 0.2,
    },
  });

export const createPlannerMastra = (model?: MastraModelConfig) => {
  const plannerAgent = createPlannerAgent(model);

  return new Mastra({
    agents: { plannerAgent },
  });
};

const buildBlockedBountyQuestion = (issue: { title: string }) =>
  `请只解决任务“${issue.title}”当前阻塞中的一个最小问题：判断下一步需要补充的具体信息、权限或修复动作，并给出可直接放回任务上下文的答案。`;

const buildBlockedBountyContext = (
  issue: { description?: string | null },
  latestExecution?: { errorSummary?: string | null },
) =>
  [
    issue.description ? `任务描述:\n${issue.description}` : "",
    latestExecution?.errorSummary
      ? `最近失败摘要:\n${latestExecution.errorSummary}`
      : "最近失败摘要: 未记录具体错误，优先检查执行日志和工作区上下文。",
  ]
    .filter((part) => part.length > 0)
    .join("\n\n");

type PlannerActionType = "notification" | "bounty";
type PlannerRuleOutcome = "created" | "skipped" | "no_action";

type PlannerRuleResult = {
  ruleId: string;
  label: string;
  outcome: PlannerRuleOutcome;
  reason: string;
  actionType?: PlannerActionType | null;
  actionId?: string | null;
};

type PlannerInspectedIssue = {
  issueId: string;
  title: string;
  status: string;
  matchedRules: PlannerRuleResult[];
};

type PlannerCreatedAction = {
  type: PlannerActionType;
  issueId?: string | null;
  actionId?: string | null;
  title: string;
  reason: string;
};

type PlannerSkippedAction = {
  type: PlannerActionType;
  issueId?: string | null;
  existingActionId?: string | null;
  title: string;
  reason: string;
};

type PlannerNoOpResult = {
  issueId?: string | null;
  title: string;
  status?: string | null;
  reason: string;
};

const recommendNextStep = ({
  createdActions,
  skippedActions,
  noOpResults,
  inspectedIssues,
}: {
  createdActions: PlannerCreatedAction[];
  skippedActions: PlannerSkippedAction[];
  noOpResults: PlannerNoOpResult[];
  inspectedIssues: PlannerInspectedIssue[];
}) => {
  if (createdActions.some((action) => action.type === "bounty")) {
    return "查看人类接入队列，推动新建悬赏获得最小可验收答案。";
  }
  if (skippedActions.some((action) => action.type === "bounty")) {
    return "继续处理已有悬赏，避免为同一个阻塞点创建重复求助。";
  }
  if (createdActions.some((action) => action.type === "notification")) {
    return "查看 Planner 通知，确认需要关注的队列风险。";
  }
  if (inspectedIssues.length === 0) {
    return "当前没有可扫描任务，先补充工作队列或稍后再运行规划。";
  }
  if (noOpResults.length === inspectedIssues.length) {
    return "本次扫描没有需要创建的 Planner 动作，保持当前队列节奏。";
  }
  return "查看扫描报告中的跳过项和无动作项，决定是否需要人工调整任务状态。";
};

export const runPlannerCycle = ({
  now = new Date().toISOString(),
  issueIds,
}: {
  now?: string;
  issueIds?: string[];
} = {}) => {
  const issueFilter = issueIds ? new Set(issueIds) : null;
  const issues = issueFilter
    ? listIssues().filter((issue) => issueFilter.has(issue.id))
    : listIssues();
  const inspectedIssues: PlannerInspectedIssue[] = [];
  const createdActions: PlannerCreatedAction[] = [];
  const skippedActions: PlannerSkippedAction[] = [];
  const noOpResults: PlannerNoOpResult[] = [];

  for (const issue of issues) {
    const inspected: PlannerInspectedIssue = {
      issueId: issue.id,
      title: issue.title,
      status: issue.status,
      matchedRules: [],
    };
    inspectedIssues.push(inspected);

    if (issue.status !== "Blocked") {
      const reason = `任务状态为 ${issue.status}，阻塞恢复规则无需动作。`;
      inspected.matchedRules.push({
        ruleId: "blocked-human-handoff",
        label: "阻塞任务人类接入",
        outcome: "no_action",
        reason,
      });
      noOpResults.push({
        issueId: issue.id,
        title: issue.title,
        status: issue.status,
        reason,
      });
      continue;
    }

    const activeBounty = findActiveBountyByIssue(issue.id);
    const executions = listExecutionsByIssue(issue.id) as Array<{
      id: string;
      status: string;
      errorSummary?: string | null;
    }>;
    const latestExecution = executions[0];

    const blockedNotification = createNotificationIfAbsent({
      severity: "warning",
      eventType: "issue_blocked",
      dedupeKey: `issue-blocked:${issue.id}`,
      title: `任务阻塞: ${issue.title}`,
      message: "Planner 已识别到需要人类动作的阻塞任务。",
      sourceType: "issue",
      sourceId: issue.id,
      now,
    });
    if (blockedNotification.created) {
      createdActions.push({
        type: "notification",
        issueId: issue.id,
        actionId: blockedNotification.notification?.id ?? null,
        title: `任务阻塞: ${issue.title}`,
        reason: "阻塞任务需要进入 Planner 通知。该通知之前不存在。",
      });
      inspected.matchedRules.push({
        ruleId: "blocked-issue-notification",
        label: "阻塞任务通知",
        outcome: "created",
        reason: "已创建阻塞通知。",
        actionType: "notification",
        actionId: blockedNotification.notification?.id ?? null,
      });
    } else {
      skippedActions.push({
        type: "notification",
        issueId: issue.id,
        existingActionId: blockedNotification.notification?.id ?? null,
        title: `任务阻塞: ${issue.title}`,
        reason: "阻塞通知已存在，跳过重复创建。",
      });
      inspected.matchedRules.push({
        ruleId: "blocked-issue-notification",
        label: "阻塞任务通知",
        outcome: "skipped",
        reason: "阻塞通知已存在。",
        actionType: "notification",
        actionId: blockedNotification.notification?.id ?? null,
      });
    }

    if (activeBounty) {
      skippedActions.push({
        type: "bounty",
        issueId: issue.id,
        existingActionId: activeBounty.id,
        title: activeBounty.title,
        reason: "该阻塞任务已有开放或待验收悬赏，避免重复求助。",
      });
      inspected.matchedRules.push({
        ruleId: "blocked-bounty",
        label: "阻塞任务悬赏",
        outcome: "skipped",
        reason: "已存在活动悬赏。",
        actionType: "bounty",
        actionId: activeBounty.id,
      });
      continue;
    }

    const bounty = createBounty({
      issueId: issue.id,
      title: `解除阻塞: ${issue.title}`,
      question: buildBlockedBountyQuestion(issue),
      context: buildBlockedBountyContext(issue, latestExecution),
      acceptanceCriteria:
        "答案必须只解决一个明确阻塞点，并包含可验证的下一步动作或可复制到任务上下文的结论。",
      points: Math.max(5, 12 - Number(issue.priority ?? 3)),
      createdBy: "symphony-planner-agent",
      now,
    });
    if (bounty) {
      createdActions.push({
        type: "bounty",
        issueId: issue.id,
        actionId: bounty.id,
        title: bounty.title,
        reason: "阻塞任务没有活动悬赏，已创建最小人类接入请求。",
      });
      inspected.matchedRules.push({
        ruleId: "blocked-bounty",
        label: "阻塞任务悬赏",
        outcome: "created",
        reason: "已创建最小悬赏求助。",
        actionType: "bounty",
        actionId: bounty.id,
      });
      const bountyNotification = createNotificationIfAbsent({
        severity: "info",
        eventType: "bounty_created",
        dedupeKey: `bounty-created:${bounty.id}`,
        title: `已创建悬赏: ${bounty.title}`,
        message: `悬赏积分 ${bounty.points}，等待人类补充最小求助单元。`,
        sourceType: "bounty",
        sourceId: bounty.id,
        now,
      });
      if (bountyNotification.created) {
        createdActions.push({
          type: "notification",
          issueId: issue.id,
          actionId: bountyNotification.notification?.id ?? null,
          title: `已创建悬赏: ${bounty.title}`,
          reason: "新悬赏需要通知操作员接入。",
        });
        inspected.matchedRules.push({
          ruleId: "bounty-created-notification",
          label: "悬赏创建通知",
          outcome: "created",
          reason: "已创建悬赏通知。",
          actionType: "notification",
          actionId: bountyNotification.notification?.id ?? null,
        });
      } else {
        skippedActions.push({
          type: "notification",
          issueId: issue.id,
          existingActionId: bountyNotification.notification?.id ?? null,
          title: `已创建悬赏: ${bounty.title}`,
          reason: "悬赏通知已存在，跳过重复创建。",
        });
      }
    }
  }

  const createdBounties = createdActions.filter((action) => action.type === "bounty").length;
  const createdNotifications = createdActions.filter(
    (action) => action.type === "notification",
  ).length;

  return {
    generatedAt: now,
    inspectedIssues,
    createdActions,
    skippedActions,
    noOpResults,
    recommendedNextStep: recommendNextStep({
      createdActions,
      skippedActions,
      noOpResults,
      inspectedIssues,
    }),
    createdBounties,
    createdNotifications,
    summary: {
      inspectedIssues: inspectedIssues.length,
      createdActions: createdActions.length,
      skippedActions: skippedActions.length,
      noOpResults: noOpResults.length,
    },
  };
};

const buildPlannerStateSummary = () => {
  const bounties = listBounties();
  const notifications = listNotifications();
  const memories = listMemories();
  const points = listPointLedger();
  const open = bounties.filter((bounty) => bounty.status === "open").length;
  const submitted = bounties.filter((bounty) => bounty.status === "submitted").length;
  const unread = notifications.filter((notice) => notice.status === "unread").length;
  const critical = notifications.filter((notice) => notice.severity === "critical").length;
  const totalPoints = points.reduce((total, point) => total + point.points, 0);

  return {
    bounties,
    notifications,
    memories,
    points,
    open,
    submitted,
    unread,
    critical,
    totalPoints,
  };
};

const buildPlannerChatPrompt = (message: string) => {
  const state = buildPlannerStateSummary();
  const history = listPlannerChatMessages(12).map((item) => ({
    role: item.role,
    content: item.content,
    actionType: item.actionType,
    createdAt: item.createdAt,
  }));
  return [
    "用户正在 Symphony Planner Console 中与你对话。",
    "请用中文回答，简洁但要像一个能主动规划、监督、求助的 agent。",
    "当前状态快照:",
    JSON.stringify(
      {
        openBounties: state.open,
        submittedBounties: state.submitted,
        unreadNotifications: state.unread,
        criticalNotifications: state.critical,
        memories: state.memories.length,
        totalPoints: state.totalPoints,
        recentBounties: state.bounties.slice(0, 8),
        recentNotifications: state.notifications.slice(0, 8),
        recentMemories: state.memories.slice(0, 6),
      },
      null,
      2,
    ),
    "最近对话:",
    JSON.stringify(history, null, 2),
    "用户本轮消息:",
    message,
  ].join("\n\n");
};

const extractMastraText = (result: unknown) => {
  const record = result as Record<string, unknown>;
  if (typeof record.text === "string") return record.text;
  if (typeof record.output === "string") return record.output;
  if (typeof record.content === "string") return record.content;
  const object = record.object;
  if (object && typeof object === "object" && "text" in object) {
    const text = (object as { text?: unknown }).text;
    if (typeof text === "string") return text;
  }
  return JSON.stringify(result);
};

const extractMastraMetadata = (result: unknown) => {
  const record = result as Record<string, unknown>;
  return {
    finishReason: record.finishReason,
    usage: record.usage,
    steps: Array.isArray(record.steps) ? record.steps.length : undefined,
  };
};

export const runPlannerChat = async ({
  message,
  now = new Date().toISOString(),
  model,
}: {
  message: string;
  now?: string;
  model?: MastraModelConfig;
}) => {
  const cleanMessage = message.trim();
  const agentModel = model ?? resolvePlannerModelConfig();
  const agent = createPlannerAgent(agentModel);
  const userMessage = createPlannerChatMessage({
    role: "user",
    content: cleanMessage,
    now,
  });

  const result = await agent.generate(buildPlannerChatPrompt(cleanMessage));
  const reply = extractMastraText(result);
  const metadata = {
    model: typeof agentModel === "string" ? agentModel : "openai-compatible",
    mastra: extractMastraMetadata(result),
  };

  const assistantMessage = createPlannerChatMessage({
    role: "assistant",
    content: reply,
    actionType: "mastra_agent_generate",
    metadata,
    now,
  });

  return {
    messages: [userMessage, assistantMessage],
    history: listPlannerChatMessages(),
  };
};
