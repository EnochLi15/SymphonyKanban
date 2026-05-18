import { app } from "./app.js";
import { ensureBuiltinTags } from "./builtin-tags.js";
import { startScheduler } from "./scheduler.js";
const port = process.env.PORT ? Number(process.env.PORT) : 3001;
const opencodeBase = process.env.OPENCODE_BASE ?? "http://localhost:4096";
try {
    ensureBuiltinTags();
}
catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to ensure builtin tags", error);
}
app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on :${port}`);
    if (process.env.SCHEDULER_ENABLED === "true") {
        // eslint-disable-next-line no-console
        console.log("API scheduler starting...");
        startScheduler({ opencodeBase });
    }
});
