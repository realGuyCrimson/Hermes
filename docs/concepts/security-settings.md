---
title: Security Settings
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [secrets-vs-config-split, command-approvals, hermes-pm, persistent-memory, context-files, secret-isolation-strategy, browser-automation, iron-proxy]
---

# Security Settings

> The `security.*` block plus the other guardrails scattered through Hermes.

## `security.*`

| Key | Default / notes |
|---|---|
| `redact_secrets` | `true` |
| `allow_lazy_installs` | `true`; `false` blocks runtime auto-installs while keeping installed packages ([[hermes-pm]]) |
| `allow_private_urls` | `false` in the gateway |
| `allow_data_training_tiers_noninteractive` | `false` |
| `website_blocklist` | `enabled: false`, `domains: []`, `shared_files: []` |

## Related guardrails

- Hardline blocklist and approvals ([[command-approvals]]).
- Prompt-injection scanning of context files ([[context-files]]).
- Mandatory secret scrubbing for external memory providers even if `redact_secrets: false` ([[persistent-memory]]).
- `errors.log` auto-redacts secrets.
- Credential vars stripped from subprocesses ([[secrets-vs-config-split]]).
- Egress credential injection ([[iron-proxy]]), encrypted vault ([[browser-vault]]), file modes 0600 for token files ([[hermes-home]]).
- Dashboard non-loopback binds fail closed without an auth provider ([[hermes-interfaces]]).

Layered view: [[secret-isolation-strategy]].

## Open Questions

- What does `allow_data_training_tiers_noninteractive` gate (OpenRouter `data_collection`, provider free tiers)?
- Is `website_blocklist.shared_files` a path to shared lists (team-managed)?
