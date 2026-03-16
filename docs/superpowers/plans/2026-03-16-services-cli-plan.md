# Services CLI (dev/stop/restart) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add root `pnpm dev/stop/restart` commands to start/stop/restart API, Web, and Symphony services together.

**Architecture:** A small Node script manages process start/stop and a PID file. Root `package.json` scripts delegate to this script. A `.runtime/` folder holds PID state and is gitignored.

**Tech Stack:** Node.js scripts (ESM), pnpm, concurrently.

---

## File Structure (planned)

- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-services-cli-plan/scripts/services.mjs`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-services-cli-plan/package.json`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-services-cli-plan/.gitignore`

---

## Chunk 1: Root Scripts + PID Management

### Task 1: Add services script and root pnpm commands

**Files:**
- Create: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-services-cli-plan/scripts/services.mjs`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-services-cli-plan/package.json`
- Modify: `/Users/enoch/Workspace/SymphonyKanban/.worktrees/codex-services-cli-plan/.gitignore`

- [ ] **Step 1: Write failing test (manual check)**

No automated test exists. We'll validate by running `pnpm dev`, `pnpm stop`, `pnpm restart` manually after implementation.

- [ ] **Step 2: Add `.runtime/` to `.gitignore`**

Append:

```
.runtime/
```

- [ ] **Step 3: Create `scripts/services.mjs`**

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, "..");
const runtimeDir = path.join(rootDir, ".runtime");
const pidFile = path.join(runtimeDir, "services.pids");

const services = [
  { name: "api", cwd: path.join(rootDir, "packages", "symphony-kanban-api"), cmd: "pnpm", args: ["dev"] },
  { name: "web", cwd: path.join(rootDir, "packages", "symphony-kanban-web"), cmd: "pnpm", args: ["dev"] },
  { name: "symphony", cwd: path.join(rootDir, "packages", "symphony-kanban-symphony"), cmd: "pnpm", args: ["dev"] },
];

const ensureRuntime = () => {
  fs.mkdirSync(runtimeDir, { recursive: true });
};

const readPids = () => {
  if (!fs.existsSync(pidFile)) return [];
  const raw = fs.readFileSync(pidFile, "utf-8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, pid] = line.split(":");
      return { name, pid: Number(pid) };
    });
};

const writePids = (rows) => {
  const content = rows.map((row) => `${row.name}:${row.pid}`).join("\n");
  fs.writeFileSync(pidFile, content, "utf-8");
};

const start = () => {
  if (fs.existsSync(pidFile)) {
    console.error("PID file exists. Run pnpm stop first.");
    process.exit(1);
  }
  ensureRuntime();
  const rows = services.map((service) => {
    const child = spawn(service.cmd, service.args, {
      cwd: service.cwd,
      stdio: "inherit",
      shell: true,
    });
    return { name: service.name, pid: child.pid };
  });
  writePids(rows);
};

const stop = () => {
  if (!fs.existsSync(pidFile)) {
    console.log("No PID file found. Nothing to stop.");
    return;
  }
  const rows = readPids();
  rows.forEach((row) => {
    if (!Number.isNaN(row.pid)) {
      try {
        process.kill(row.pid, "SIGTERM");
      } catch (error) {
        console.warn(`Failed to stop ${row.name}: ${error.message}`);
      }
    }
  });
  fs.unlinkSync(pidFile);
};

const restart = () => {
  stop();
  start();
};

const cmd = process.argv[2];
if (cmd === "start") start();
else if (cmd === "stop") stop();
else if (cmd === "restart") restart();
else {
  console.error("Usage: node scripts/services.mjs <start|stop|restart>");
  process.exit(1);
}
```

- [ ] **Step 4: Update root `package.json` scripts**

```json
{
  "scripts": {
    "dev": "node scripts/services.mjs start",
    "stop": "node scripts/services.mjs stop",
    "restart": "node scripts/services.mjs restart"
  }
}
```

- [ ] **Step 5: Manual verification**

Run:
- `pnpm dev` (expect API/Web/Symphony start logs)
- `pnpm stop` (expect processes terminated)
- `pnpm restart` (expect restart sequence)

- [ ] **Step 6: Commit**

```bash
git add scripts/services.mjs package.json .gitignore
git commit -m "feat: add pnpm dev/stop/restart for services"
```

