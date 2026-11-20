---
title: Config Precedence
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [managed-scope, remote-config-mode, config-yaml, env-file, secrets-vs-config-split, external-secret-managers, setting-config-values, model-configuration]
---

# Config Precedence

> For normal runs, settings resolve highest to lowest as below. Remote mode replaces the whole file-based stack ([[remote-config-mode]]).

| # | Source | Notes |
|---|---|---|
| 1 | **Per-invocation CLI flags** | e.g. `hermes chat --model anthropic/claude-sonnet-4 --provider openrouter` |
| 2 | **Managed Scope** `/etc/hermes/config.yaml` and `/etc/hermes/.env` | Leaf keys pinned by a sysadmin override user config, user `.env` and even pre-set shell variables ([[managed-scope]]) |
| 3 | **`~/.hermes/config.yaml`** | Saved `model`/`provider` choices intentionally override stale shell exports such as `OPENAI_API_KEY` so `hermes model` stays authoritative |
| 4 | **`~/.hermes/.env`** and external secret sources (`secrets:`) | Required for secrets; fallback for env vars ([[env-file]], [[external-secret-managers]]) |
| 5 | **Built-in defaults** | `DEFAULT_CONFIG` in `hermes_cli/config.py` |

## Nuances

- **Bridged adapter keys** (e.g. `WHATSAPP_REPLY_PREFIX`): values explicitly set in `.env`, managed `/etc/hermes/.env` or external secret managers **beat `config.yaml`**, while `config.yaml` beats an inherited parent-shell variable.
- **Secret sources among themselves:** (1) `.env`/shell unless `override_existing: true`; (2) explicitly mapped `env:` sources (1Password) over bulk project sources (Bitwarden); (3) registration order in `secrets.sources` ([[external-secret-managers]]).
- **Reload timing:** gateways re-read `.env` each turn; CLI/TUI need `/reload` or restart.
- **`hermes config set` against a pinned key is rejected** ([[setting-config-values]]).

## Quick diagnosis: "my setting has no effect"

1. Is the key pinned in `/etc/hermes/`? ([[managed-scope]])
2. Is remote mode active? ([[remote-config-mode]])
3. Is a CLI flag or a higher-priority `.env` bridge key overriding it?
4. Wrong profile ([[profile-isolation]])? Wrong file (secret vs behaviour; [[secrets-vs-config-split]])?
5. Session not reloaded?

## Open Questions

- How should an agent list the effective value and its origin (file/line) for a key? `hermes config show` / `get` may not show provenance.
- The source's order puts managed scope above config.yaml but secret-manager `override_existing: true` above `.env`; how do managed `.env` pins and vault overrides rank against each other?
