---
title: Clearing Interrupted Turns
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [session-admission-and-turn-recovery, hermes-gateway, hermes-desktop, hermes-cli, state-db]
---

# Clearing Interrupted Turns (Playbook 3)

> **Symptom:** after a gateway crash, finite CLI runs exit with code **3**, Desktop shows *"Turn lost during restart"*, and messaging users are told the conversation is paused. The next gateway owner marked the in-flight turn `unknown` and **paused the session queue** (no auto-replay, no queued followers). Background: [[session-admission-and-turn-recovery]].

## CLI or TUI

1. Resume the session: `hermes --resume <session_id>`.
2. Run `/discard <admission_id>`. It invokes `prompt.resolve_unknown` with the current `execution_generation`, settles the lost turn as *interrupted*, and unlocks the queued follower.

## Messaging platforms (Telegram, Discord, Slack)

Send `/reset` (or `/new`). The route rotates to a fresh session.

## Also check

- Why the gateway died: [[diagnosing-gateway-problems]] (watchdog exit 75, `gateway_state.json`).
- Route table problems: `hermes sessions repair-routing [--apply]` ([[state-db]]).

## Open Questions

- Where do you read the `<admission_id>` for a paused session when you have no interactive client?
- Does `/discard` preserve the user's lost input for resubmission?
