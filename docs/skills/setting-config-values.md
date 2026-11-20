---
title: Setting Config Values
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [config-yaml, env-file, secrets-vs-config-split, config-precedence, managed-scope, remote-config-mode, model-configuration, backups-and-snapshots]
---

# Setting Config Values

> Prefer `hermes config` subcommands over hand edits. They validate, route to the right file, and mask secrets.

## Subcommands

`hermes config show`, `path`, `env-path`, `get <KEY> [--json] [--raw]`, `set <KEY> <VAL> [--force]`, `unset <KEY>`, `check`, `migrate`.

## Routing rules for `set`

| Key shape | Target | Notes |
|---|---|---|
| `UPPER_SNAKE` (e.g. `OPENROUTER_API_KEY`, `DISCORD_HOME_CHANNEL`, `HERMES_TIMEZONE`) | `~/.hermes/.env` | never `config.yaml`, even with `--force` |
| dotted (e.g. `terminal.backend`) | `~/.hermes/config.yaml` | type-checked against the schema |
| list/map (`custom_providers`, `model.aliases`, `plugins.enabled`) | `config.yaml` | pass YAML/JSON literals: `hermes config set plugins.enabled '["my-plugin"]'` |
| denylisted (`HERMES_YOLO_MODE`, `PATH`) | refused | |
| known key in the wrong place (e.g. `gateway.discord.foo`) | refused with a "did-you-mean" | `--force` overrides |

## Special cases

- **Dots in model IDs** (`provider_routing.models."anthropic/claude-fable-5.1"`, `agent.reasoning_overrides`): `hermes config set` splits unescaped dots. Backslash-escape (`claude-fable-5\.1`) or edit `config.yaml` directly ([[model-configuration]]).
- **`get` masks** credential-shaped keys (`api_key`, `*_TOKEN`, `*_SECRET`, `password`); `--raw` shows the value ([[secrets-vs-config-split]]).
- **Writing an API key into a config slot** stores the raw value in `.env` and `${VAR}` in `config.yaml`.

## If a set "does nothing" or is rejected

1. Managed pin in `/etc/hermes/`? ([[managed-scope]])
2. Remote mode? ([[remote-config-mode]])
3. Wrong profile or wrong precedence level? ([[config-precedence]])
4. Not reloaded: gateways re-read `.env` each turn; CLI/TUI need `/reload`.

## Safety

Config backups are automatic (`backups/config/`); a malformed file falls back to the newest valid backup ([[backups-and-snapshots]]). After hand edits run `hermes config check`; after upgrades run `hermes config migrate`.

## Open Questions

- Does `hermes config set` preserve YAML comments and ordering?
- What does `hermes config check` validate (types only, or unknown keys and deprecated ones such as `LLM_MODEL`)?
