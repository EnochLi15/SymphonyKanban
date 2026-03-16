import { createOpencodeClient } from "@opencode-ai/sdk";

type RunInput = {
  baseUrl: string;
  issue: { id: string; title: string; description?: string; tags?: string[] };
  context: string | null;
  workspacePath: string | null;
  onArtifact: (type: string, content: string, summary?: string) => Promise<void>;
};

type RunResult = {
  status: "succeeded" | "failed";
  errorSummary?: string;
};

const buildPrompt = (input: RunInput) => {
  const lines = [
    `任务: ${input.issue.title}`,
    input.issue.description ? `描述: ${input.issue.description}` : "",
    input.context ? `工作区上下文:\n${input.context}` : "",
    input.issue.tags?.length ? `标签: ${input.issue.tags.join(", ")}` : "",
  ].filter((line) => line.length > 0);
  return `${lines.join("\n\n")}\n\n请完成任务并提供日志、diff 和摘要。`;
};

const extractSummary = (messages: Array<any>) => {
  const assistant = [...messages].reverse().find((msg) => msg.role === "assistant");
  if (!assistant) return null;
  const parts = assistant.parts ?? [];
  const textParts = parts
    .filter((part: any) => part.type === "text")
    .map((part: any) => part.text)
    .filter(Boolean);
  return textParts.length ? textParts.join("\n") : null;
};

export const runOpencode = async (input: RunInput): Promise<RunResult> => {
  const client = createOpencodeClient({ baseUrl: input.baseUrl });
  const prompt = buildPrompt(input);

  const session = await client.session.create({
    body: { title: input.issue.title },
    query: input.workspacePath ? { directory: input.workspacePath } : undefined,
  });
  const sessionId = (session as any).data?.id ?? (session as any).id;

  await client.session.promptAsync({
    path: { id: sessionId },
    query: input.workspacePath ? { directory: input.workspacePath } : undefined,
    body: {
      parts: [{ type: "text", text: prompt }],
    },
  });

  const events = await client.event.subscribe({
    query: input.workspacePath ? { directory: input.workspacePath } : undefined,
  });

  const logLines: string[] = [];
  let diffPayload: string | null = null;
  let errorSummary: string | null = null;
  let done = false;

  for await (const event of events.stream as AsyncGenerator<any>) {
    if (event?.type) {
      logLines.push(JSON.stringify(event));
    }
    if (event?.type === "session.diff") {
      diffPayload = JSON.stringify(event.properties?.diff ?? event.properties ?? event);
    }
    if (event?.type === "session.error") {
      errorSummary = JSON.stringify(event.properties?.error ?? "unknown error");
      done = true;
      break;
    }
    if (event?.type === "session.idle") {
      done = true;
      break;
    }
    if (event?.type === "session.compacted") {
      done = true;
      break;
    }
  }

  if (logLines.length > 0) {
    await input.onArtifact("log", logLines.join("\n"));
  }

  if (diffPayload) {
    await input.onArtifact("diff", diffPayload);
  } else if (done) {
    const diffRes = await client.session.diff({
      path: { id: sessionId },
      query: input.workspacePath ? { directory: input.workspacePath } : undefined,
    });
    const diffData = (diffRes as any).data ?? diffRes;
    if (diffData) {
      await input.onArtifact("diff", JSON.stringify(diffData));
    }
  }

  let summaryText: string | null = null;
  const messagesRes = await client.session.messages({
    path: { id: sessionId },
    query: input.workspacePath ? { directory: input.workspacePath } : undefined,
  });
  const messages = (messagesRes as any).data ?? messagesRes ?? [];
  summaryText = extractSummary(messages);
  if (!summaryText) {
    summaryText = errorSummary
      ? `Execution failed: ${errorSummary}`
      : "Execution completed.";
  }
  await input.onArtifact("summary", summaryText);

  if (errorSummary) {
    return { status: "failed", errorSummary };
  }
  return { status: "succeeded" };
};
