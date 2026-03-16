import { db } from "./db.js";

export const getSchedulerSettings = () =>
  db
    .prepare(
      "SELECT id, max_concurrency as maxConcurrency, poll_interval_ms as pollIntervalMs, updated_at as updatedAt FROM scheduler_settings LIMIT 1",
    )
    .get();

export const updateSchedulerSettings = (
  maxConcurrency: number,
  pollIntervalMs: number,
  now: string,
) => {
  const row = getSchedulerSettings() as { id: string } | undefined;
  if (!row) return;
  db.prepare(
    "UPDATE scheduler_settings SET max_concurrency = ?, poll_interval_ms = ?, updated_at = ? WHERE id = ?",
  ).run(maxConcurrency, pollIntervalMs, now, row.id);
};
