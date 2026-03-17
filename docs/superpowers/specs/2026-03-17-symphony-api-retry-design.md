# Symphony API Startup Retry (Fixed Interval)

## Summary
Add a startup readiness check to the Symphony scheduler so it waits for the API to become available, retrying indefinitely at a fixed interval and logging failures at a controlled cadence.

## Goals
- Prevent `symphony-kanban-symphony` from crashing when the API is not yet running.
- Retry indefinitely at a fixed time interval until the API responds.
- Avoid log spam by emitting retry logs at a configurable cadence.

## Non-Goals
- No changes to API endpoints or server behavior.
- No global fetch retry for all API calls (startup readiness only).
- No exponential backoff (explicitly fixed interval per request).

## Proposed Approach (Recommended)
**Approach A: Startup gate**
- Introduce `waitForApiReady()` in the scheduler startup path.
- `waitForApiReady()` calls `GET /settings/scheduler` as the readiness probe.
- If the call fails (network error or non-2xx), wait `retryIntervalMs` and retry forever.
- Log every `logEvery` attempts to avoid spam.
- After success, log a single “API ready” message and proceed with the normal scheduler loop.

This is the smallest, most predictable change and aligns with “wait until API is up.”

## Behavior Details
- **Success criteria:** `GET /settings/scheduler` returns a 2xx response.
- **Failure criteria:** Fetch rejects (e.g., `ECONNREFUSED`) or response is non-2xx.
- **Retry loop:** Infinite, fixed sleep between attempts.
- **Logging:**
  - Every `logEvery` attempts: `API not ready, retrying in <ms> (attempt <n>)`
  - On success: `API ready after <n> attempts, starting scheduler`

## Configuration
New optional environment variables (with defaults):
- `API_RETRY_INTERVAL_MS` (default: `4000`)
- `API_RETRY_LOG_EVERY` (default: `5`)

These only affect the startup readiness check.

## Error Handling
- Readiness check should catch fetch errors and treat them as “not ready.”
- Non-2xx responses are treated as “not ready.”
- No exception should escape `waitForApiReady()` during startup; it keeps retrying.

## Testing
- Unit test for `waitForApiReady()`:
  - Simulate N failures then success; assert it resolves and logs only every `logEvery` attempts.
- Existing scheduler tests remain unchanged.

## Rollout / Compatibility
- Fully backward compatible.
- If users don’t set env vars, defaults apply.
- No behavior change when API is already running (only a single probe before loop).

## Open Questions
- None.
