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
  {
    name: "api",
    cwd: path.join(rootDir, "packages", "symphony-kanban-api"),
    cmd: "pnpm",
    args: ["dev"],
  },
  {
    name: "web",
    cwd: path.join(rootDir, "packages", "symphony-kanban-web"),
    cmd: "pnpm",
    args: ["dev"],
  },
  {
    name: "symphony",
    cwd: path.join(rootDir, "packages", "symphony-kanban-symphony"),
    cmd: "pnpm",
    args: ["dev"],
  },
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
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Failed to stop ${row.name}: ${message}`);
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
