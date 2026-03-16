import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, "..", "db", "kanban.sqlite");

const schemaPath = path.resolve(
  __dirname,
  "..",
  "..",
  "symphony-kanban-db",
  "schema",
  "schema.sql",
);

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

export const db = new Database(dbPath);
db.pragma("foreign_keys = ON");

const schemaSql = fs.readFileSync(schemaPath, "utf-8");
db.exec(schemaSql);

const ensureColumn = (table: string, column: string, ddl: string) => {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.prepare(ddl).run();
  }
};

const issueCols = db
  .prepare("PRAGMA table_info(issues)")
  .all() as Array<{ name: string }>;
const hasDeletedAt = issueCols.some((c) => c.name === "deleted_at");
if (!hasDeletedAt) {
  db.prepare("ALTER TABLE issues ADD COLUMN deleted_at TEXT").run();
}

ensureColumn("workspaces", "local_path", "ALTER TABLE workspaces ADD COLUMN local_path TEXT");
ensureColumn("workspaces", "context", "ALTER TABLE workspaces ADD COLUMN context TEXT");
ensureColumn("workspaces", "updated_at", "ALTER TABLE workspaces ADD COLUMN updated_at TEXT");

ensureColumn("tags", "type", "ALTER TABLE tags ADD COLUMN type TEXT");
ensureColumn("tags", "color", "ALTER TABLE tags ADD COLUMN color TEXT");
ensureColumn("tags", "updated_at", "ALTER TABLE tags ADD COLUMN updated_at TEXT");

const DEFAULT_WORKSPACE_ID = "wksp-default";
const DEFAULT_WORKSPACE_NAME = "Symphony-Kanban";

const workspaceCount = db
  .prepare("SELECT COUNT(*) as count FROM workspaces")
  .get() as { count: number };

if (workspaceCount.count === 0) {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO workspaces (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
  ).run(DEFAULT_WORKSPACE_ID, DEFAULT_WORKSPACE_NAME, now, now);
}

export const defaultWorkspace = {
  id: DEFAULT_WORKSPACE_ID,
  name: DEFAULT_WORKSPACE_NAME,
};

const settingsCount = db
  .prepare("SELECT COUNT(*) as count FROM scheduler_settings")
  .get() as { count: number };

if (settingsCount.count === 0) {
  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO scheduler_settings (id, max_concurrency, poll_interval_ms, updated_at) VALUES (?, ?, ?, ?)",
  ).run("scheduler-default", 3, 5000, now);
}
