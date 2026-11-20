---
title: Secret Isolation Strategy
type: strategy
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [secrets-vs-config-split, external-secret-managers, iron-proxy, terminal-backends, security-settings, browser-vault, setting-up-egress-proxy, command-approvals]
---

# Secret Isolation Strategy

> **Goal:** real credentials never reach places that can leak them: repos, logs, subprocesses, sandboxes, third-party memory providers. **Target:** the agent's tool-execution surface. **Approach:** layered controls, each independently useful.

## Layers

1. **Storage split:** secrets in `.env`/`auth.json`, behaviour in `config.yaml` with `${VAR}` references ([[secrets-vs-config-split]]).
2. **Central vaults:** keep only a bootstrap token locally ([[external-secret-managers]]).
3. **Subprocess stripping:** Hermes-managed credential variables never reach terminal, `execute_code` or cron scripts, even with `env_passthrough` ([[secrets-vs-config-split]]).
4. **Redaction and scrubbing:** `security.redact_secrets`, `errors.log` redaction, mandatory scrubbing for external memory providers ([[security-settings]]).
5. **Sandbox backends:** container backends skip approvals because the container is the boundary ([[terminal-backends]]).
6. **Egress injection:** inside Docker, provider env vars hold opaque tokens; [[iron-proxy]] swaps real keys at the host boundary ([[setting-up-egress-proxy]]).
7. **Key-scoping:** `OPENROUTER_API_KEY` only to openrouter.ai, `AI_GATEWAY_API_KEY` only to ai-gateway.vercel.sh ([[provider-resolution]]).
8. **Encrypted stores and file modes:** `vault/` ([[browser-vault]]), 0600 token files, pairing files.
9. **Approvals and hardline blocklist:** last line against exfiltration commands such as `cat .env` patterns ([[command-approvals]]).

## Weak spots

- `local` terminal backend: no container boundary; relies on stripping and approvals.
- Shell history or transcripts may contain pasted secrets; `hermes config get --raw` prints real values.

## Open Questions

- Which layers are enabled by default on a fresh install, and which need setup (egress proxy, vault)?
- How to audit that a given variable is actually stripped from a subprocess?
