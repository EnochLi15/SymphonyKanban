# ADR-0001: Fuse Scheduler Into API Runtime

## Status

Accepted

## Context

Symphony Kanban originally had three default runtime processes:

- Web: Vue UI for Issue, Review, Workspace, and Workflow interaction.
- API: Express and SQLite fact source for Issue, Execution, Artifact, Workspace, Tag, and scheduler settings.
- Symphony: standalone scheduler process that claimed Todo Issues through API HTTP routes, invoked the OpenCode runner, and wrote Execution and Artifact results back through API HTTP routes.

The standalone Symphony process created a process seam, but it did not yet provide enough Adapter leverage to justify that seam. Its implementation depended on API-specific REST calls and JSON shapes rather than a stable scheduler Interface. The important domain rules already lived in the API: Issue claiming, Issue transition, Execution persistence, Artifact persistence, Workspace context, and Workflow context.

Applying the deletion test: deleting the standalone Symphony package does not delete scheduler complexity. The complexity reappears naturally inside the API as a scheduler Module. Keeping it as a third process adds startup ordering, retry, HTTP client, and mock complexity without a second real Adapter.

## Decision

Keep Scheduler as a real Module, but fuse it into the API runtime.

The API process now owns:

- claiming Todo Issues;
- creating and completing Executions;
- recording Artifacts;
- reading Workspace and Workflow context;
- invoking the OpenCode runner Adapter;
- transitioning Issues to Review or Blocked.

The scheduler is opt-in at process startup with `SCHEDULER_ENABLED=true`. The default local runtime starts Web and API only.

The standalone `packages/symphony-kanban-symphony` package has been removed. Historical prototype/reference material should live in Git history or explicit docs, not in the active workspace.

## Consequences

- Locality improves: scheduler behavior and persistence rules are in the same API codebase.
- Tests can cross the scheduler Module Interface directly instead of mocking an API HTTP client.
- The public HTTP Interface can focus on Web/UI use cases; scheduler-only routes become compatibility or debug seams.
- Default development startup is simpler: Web plus API.
- The workspace no longer carries the archived standalone Scheduler package or its `fizzy-popper` clone.

## Re-split Signals

Reconsider a standalone Scheduler runtime when at least one of these becomes real:

- multiple runner Adapters beyond OpenCode, such as Codex, Claude, GitHub Actions, or external executors;
- independent scaling or crash isolation for scheduler workers;
- multiple API instances needing cross-process claim leases;
- adoption of a real `fizzy-popper` Router/Supervisor/Golden Ticket model;
- a move from SQLite to a queue-backed or Postgres-backed distributed scheduling model.
