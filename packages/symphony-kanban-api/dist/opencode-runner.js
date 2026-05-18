import { createOpencode, createOpencodeClient } from "@opencode-ai/sdk";
let embeddedOpencodeServer = null;
export const __resetEmbeddedOpencodeServer = () => {
    embeddedOpencodeServer?.close();
    embeddedOpencodeServer = null;
};
const isDefaultLocalOpencodeBase = (baseUrl) => {
    try {
        const url = new URL(baseUrl);
        return ((url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
            (url.port === "4096" || (!url.port && url.protocol === "http:")));
    }
    catch {
        return false;
    }
};
const isFetchFailure = (error) => error instanceof Error && /fetch failed|ECONNREFUSED/.test(error.message);
const ensureEmbeddedOpencodeBase = async () => {
    if (!embeddedOpencodeServer) {
        const opencode = await createOpencode();
        embeddedOpencodeServer = opencode.server;
    }
    return embeddedOpencodeServer.url;
};
export const resolveOpencodeProjectId = (rawProjectId, workspacePath, sessionDirectory) => {
    if (workspacePath) {
        return Buffer.from(workspacePath, "utf8").toString("base64");
    }
    if (sessionDirectory) {
        return Buffer.from(sessionDirectory, "utf8").toString("base64");
    }
    if (typeof rawProjectId === "string" && rawProjectId.trim().length > 0) {
        return rawProjectId;
    }
    return null;
};
export const buildPrompt = (input) => {
    const lines = [
        `任务: ${input.issue.title}`,
        input.issue.description ? `描述: ${input.issue.description}` : "",
        input.context ? `工作区上下文:\n${input.context}` : "",
        input.issue.tags?.length ? `标签: ${input.issue.tags.join(", ")}` : "",
        input.workflowContext ? `工作流要求:\n${input.workflowContext}` : "",
    ].filter((line) => line.length > 0);
    return `${lines.join("\n\n")}\n\n请完成任务并提供日志、diff 和摘要。`;
};
const extractSummary = (messages) => {
    const lastTextMessage = [...messages].reverse().find((msg) => {
        const parts = msg?.parts ?? [];
        return parts.some((part) => part.type === "text" && part.text);
    }) ?? null;
    if (!lastTextMessage)
        return null;
    const parts = lastTextMessage.parts ?? [];
    const textParts = parts
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .filter(Boolean);
    return textParts.length ? textParts.join("\n") : null;
};
const isQuestionLike = (text) => {
    const trimmed = text.trim();
    if (!trimmed)
        return false;
    if (/[?？]\s*$/.test(trimmed))
        return true;
    return /请问|能否|是否|需要你|请提供|请补充|还需要|麻烦提供/.test(trimmed);
};
export const runOpencode = async (input) => {
    let client = createOpencodeClient({ baseUrl: input.baseUrl });
    const prompt = buildPrompt(input);
    const createSession = () => client.session.create({
        body: { title: input.issue.title },
        query: input.workspacePath ? { directory: input.workspacePath } : undefined,
    });
    let session;
    try {
        session = await createSession();
    }
    catch (error) {
        if (!isFetchFailure(error) || !isDefaultLocalOpencodeBase(input.baseUrl)) {
            throw error;
        }
        const embeddedBaseUrl = await ensureEmbeddedOpencodeBase();
        client = createOpencodeClient({ baseUrl: embeddedBaseUrl });
        session = await createSession();
    }
    const sessionId = session.data?.id ?? session.id;
    const rawProjectId = session.data?.projectID ?? session.projectID ?? null;
    const sessionDirectory = session.data?.directory ?? session.directory ?? null;
    const projectId = resolveOpencodeProjectId(rawProjectId, input.workspacePath, sessionDirectory);
    await input.onArtifact("session", sessionId, "opencode session id");
    if (projectId) {
        await input.onArtifact("opencode_project", projectId, "opencode project id");
    }
    // eslint-disable-next-line no-console
    console.log(`[opencode:${sessionId}] session created`);
    const getSessionId = (event) => event?.properties?.sessionID ??
        event?.properties?.sessionId ??
        event?.sessionID ??
        event?.sessionId;
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
    const logLines = [];
    let diffPayload = null;
    let errorSummary = null;
    let done = false;
    let lastQuestionCheck = 0;
    for await (const event of events.stream) {
        const eventSessionId = getSessionId(event);
        const isTargetSession = !eventSessionId || eventSessionId === sessionId;
        if (event?.type) {
            logLines.push(JSON.stringify(event));
            if (isTargetSession) {
                // eslint-disable-next-line no-console
                console.log(`[opencode:${sessionId}] event ${event.type}`);
            }
        }
        if (!isTargetSession)
            continue;
        if (event?.type === "session.diff") {
            diffPayload = JSON.stringify(event.properties?.diff ?? event.properties ?? event);
        }
        if (event?.type === "permission.updated") {
            errorSummary = "permission_required";
            done = true;
            break;
        }
        if (event?.type === "question.asked") {
            errorSummary = "needs_user_input";
            done = true;
            break;
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
        if (event?.type === "session.status") {
            const status = event.properties?.status;
            if (status?.type === "idle") {
                done = true;
                break;
            }
        }
        if (event?.type?.startsWith("message.part") ||
            event?.type === "message.updated") {
            const now = Date.now();
            if (now - lastQuestionCheck > 1000) {
                lastQuestionCheck = now;
                const messagesRes = await client.session.messages({
                    path: { id: sessionId },
                    query: input.workspacePath ? { directory: input.workspacePath } : undefined,
                });
                const messages = messagesRes.data ?? messagesRes ?? [];
                const latestTextMessage = [...messages].reverse().find((msg) => {
                    const parts = msg?.parts ?? [];
                    return parts.some((part) => part.type === "text" && part.text);
                });
                const parts = latestTextMessage?.parts ?? [];
                const textParts = parts
                    .filter((part) => part.type === "text")
                    .map((part) => part.text)
                    .filter(Boolean);
                const text = textParts.join("\n");
                if (text && isQuestionLike(text)) {
                    errorSummary = "needs_user_input";
                    done = true;
                    break;
                }
            }
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
    }
    else if (done) {
        const diffRes = await client.session.diff({
            path: { id: sessionId },
            query: input.workspacePath ? { directory: input.workspacePath } : undefined,
        });
        const diffData = diffRes.data ?? diffRes;
        if (diffData) {
            await input.onArtifact("diff", JSON.stringify(diffData));
        }
    }
    const messagesRes = await client.session.messages({
        path: { id: sessionId },
        query: input.workspacePath ? { directory: input.workspacePath } : undefined,
    });
    const messages = messagesRes.data ?? messagesRes ?? [];
    let summaryText = extractSummary(messages);
    if (!summaryText) {
        summaryText = errorSummary
            ? `Execution failed: ${errorSummary}`
            : "Execution completed.";
    }
    if (!errorSummary && summaryText && isQuestionLike(summaryText)) {
        errorSummary = "needs_user_input";
    }
    await input.onArtifact("summary", summaryText);
    if (errorSummary) {
        return { status: "failed", errorSummary };
    }
    return { status: "succeeded" };
};
