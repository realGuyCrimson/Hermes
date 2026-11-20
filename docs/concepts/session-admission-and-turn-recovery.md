---
title: Session Admission and Turn Recovery
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [clearing-interrupted-turns, hermes-gateway, state-db, session-lifecycle, hermes-desktop, hermes-cli]
---

# Session Admission and Turn Recovery

> Each turn is admitted through a per-session FIFO queue tracked in `session_admissions` ([[state-db]]). If the owning gateway dies mid-turn, the next owner **does not replay it**.

## What happens after a crash

- The in-flight turn is marked **`unknown`**.
- The session FIFO is **paused**; queued followers do not run.
- Finite CLI runs exit with code **3**; Desktop shows *"Turn lost during restart"*; messaging users are told once that the conversation is paused.
- `hermes chat` exit code 3 = "lost turn owner (unknown admission state) while a finite query was queued" ([[hermes-cli]]).

## Resolution

- CLI/TUI: `hermes --resume <session_id>`, then `/discard <admission_id>` (calls `prompt.resolve_unknown` with the current `execution_generation`), settling the lost turn as *interrupted* and unlocking the follower ([[clearing-interrupted-turns]]).
- Messaging platforms: `/reset` or `/new` rotates the route to a fresh session.
- Routing repairs: `hermes sessions repair-routing [--apply]` (touches `gateway_routing`; see [[state-db]]).

## Open Questions

- How does an agent list pending `unknown` admissions and their IDs without opening an interactive session?
- Are `worker_executions` entries also left in a transitional state that `repair-routing` fixes?
