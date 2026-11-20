---
title: .env and .op.env
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [secrets-vs-config-split, config-precedence, setting-config-values, external-secret-managers, onepassword-cli, bitwarden-secrets-manager, managed-scope, remote-config-mode, provider-resolution, credential-pools]
---

# `.env` and `.op.env`

> `~/.hermes/.env` holds secrets, API keys and messaging bot tokens in `UPPER_SNAKE` form. `~/.hermes/.op.env` is an optional gitignored (mode 0600) file for the 1Password service-account token, loaded **after** `.env`.

## Behaviour

- **Reload:** running gateways re-read `.env` at the start of every turn, no restart. CLI/TUI sessions need `/reload` or a restart ([[hermes-gateway]]).
- **Written by** `hermes config set UPPER_SNAKE_KEY value`, which always targets `.env` (never `config.yaml`, even with `--force`). Denylisted variables (`HERMES_YOLO_MODE`, `PATH`) are refused ([[setting-config-values]]).
- **Bootstrap tokens** live here: `BWS_ACCESS_TOKEN` ([[bitwarden-secrets-manager]]), `OP_SERVICE_ACCOUNT_TOKEN` (here or in `.op.env`; [[onepassword-cli]]).
- **Remote config switches** can be set here: `HERMES_CONFIG_BACKEND=remote`, `HERMES_CONFIG_INSTANCE_ID` ([[remote-config-mode]]). `HERMES_MANAGED_DIR` is **ignored** in `.env`; it must be in the service launch environment ([[managed-scope]]).
- **Precedence:** below `config.yaml` for ordinary settings and above built-in defaults; `/etc/hermes/.env` pins override it ([[config-precedence]]). For internally bridged adapter keys (e.g. `WHATSAPP_REPLY_PREFIX`) a value explicitly set in `.env` beats `config.yaml`.
- **Numbered keys** (`OPENROUTER_API_KEY`, `OPENROUTER_API_KEY_2`, `_3`, ...) are auto-discovered as a credential pool ([[credential-pools]]).

## Variables named in the source (not all of them live in `.env`)

| Variable | Meaning |
|---|---|
| `OPENROUTER_API_KEY` | must start with `sk-or-`; sent only to openrouter.ai |
| `AI_GATEWAY_API_KEY` | sent only to ai-gateway.vercel.sh |
| `OPENAI_BASE_URL` | honoured **only** for the `openai-api` provider |
| `LLM_MODEL` | retired and ignored |
| `HERMES_STREAM_READ_TIMEOUT` | local-endpoint streaming read timeout (auto 1800 s) |
| `HERMES_MODEL_API_KEY`, `AUXILIARY_<TASK>_API_KEY`, `HERMES_DELEGATION_API_KEY`, `HERMES_CUSTOM_*_API_KEY`, `HERMES_PROVIDER_*_API_KEY` | Hermes-managed credential variables ([[secrets-vs-config-split]]) |
| `ANTHROPIC_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN` | override refreshable Claude Code credentials ([[provider-resolution]]) |
| `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_PROFILE` | Bedrock credential chain ([[aws-bedrock]]) |
| `HERMES_DASHBOARD_SESSION_TOKEN` | dashboard auth for non-loopback binds ([[hermes-interfaces]]) |
| `HERMES_TIMEZONE`, `DISCORD_HOME_CHANNEL` | examples of UPPER_SNAKE keys routed to `.env` |
| `HERMES_EGRESS_PROXY` | set to `1` inside the Docker sandbox by iron-proxy ([[iron-proxy]]) |

## Do not

- Put secrets in `config.yaml`.
- Print `.env` into logs or transcripts. (`errors.log` redacts secrets; transcripts are not guaranteed to.)

## Open Questions

- Is there a supported way to validate `.env` against known keys (`hermes config check`)?
- How does a named profile's `.env` interact with the root `.env` (inheritance or full isolation)? See [[profile-isolation]].
