# ADR-0002: Planner Console Is Queue Stewardship With Human Handoff

## Status

Accepted

## Context

The Planner Console needs a stable product contract before implementation slices
can safely extend planning reports, queue scanning, chat semantics, and human
handoff controls. The ambiguous term "planning" could mean several different
jobs: project management, autonomous task execution, human escalation, memory
review, or a global operations dashboard.

The current system already has separate concepts for Issues, scheduler
Executions, Artifacts, Bounties, Notifications, Memories, and the point ledger.
The Planner Console should compose those concepts without becoming a second
issue tracker or a hidden execution engine.

## Decision

Planner Console is a queue stewardship and human handoff center.

Its primary user job is to answer:

- What changed in the work queue since the last scan?
- Which items need attention, recovery, review, or human input?
- Which Planner actions were created, skipped, or intentionally avoided?
- What is the recommended next step for the operator?

Human handoff is a first-class part of the experience, not a separate side
feature. A Bounty represents one minimal, answerable human handoff request. The
Planner may create one only when a rule explicitly allows a side effect and the
handoff can be stated with concrete acceptance criteria.

## Supported States

Planner Console should support these visible states:

- Healthy: the queue has no urgent Planner findings.
- Watch: the Planner found stale work, waiting review, or other non-blocking
  risks.
- Handoff needed: the Planner found blocked work that requires a minimal human
  answer or permission.
- Waiting for answer: an open Bounty exists and should not be duplicated.
- Waiting for acceptance: a Bounty response has been submitted and needs
  operator acceptance before becoming durable memory or awarded points.
- Degraded: deterministic planning can still run, but model-backed chat
  explanation is unavailable because no model provider is configured.

## Button Semantics

The top-level "Run Planner" action runs one deterministic planner cycle. It must
not depend on a model provider. The cycle inspects the relevant work queue,
evaluates explicit rules, returns a report, and performs only the side effects
allowed by those rules.

The report is part of the product contract. It should include inspected issues,
matched rules, created actions, skipped actions, no-op findings, and one
recommended next step. A successful no-op is still a useful result and should be
shown as such.

## Chat Semantics

Planner chat shares the same planning-cycle meaning as the button. When the user
asks chat to run, scan, refresh, or plan, chat should invoke or reference the
same deterministic cycle rather than inventing a separate planning behavior.

When a model provider is configured, chat can explain the latest report,
summarize tradeoffs, or help shape a minimal handoff request. When no model
provider is configured, deterministic planning still works through the button,
and chat should return a clear degraded message instead of failing opaquely or
pretending to reason.

## Non-Goals

Planner Console is not:

- a replacement for the Issue board;
- a free-form autonomous developer that writes code directly;
- a global analytics dashboard for every historical metric;
- a place to store unverified agent claims as durable memory;
- a mechanism for creating duplicate Bounties for the same active blocker.

## Consequences

- Later planner slices should prefer explainable scan reports over opaque counts.
- Queue-wide insights can be added without granting side effects by default.
- Bounty creation remains a narrow human handoff action, not the whole planner.
- Model-backed chat becomes optional explanation over deterministic facts.
- Tests should distinguish created actions, skipped actions, and intentional
  no-op results.
