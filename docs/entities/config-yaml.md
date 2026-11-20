---
title: config.yaml
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [config-precedence, secrets-vs-config-split, setting-config-values, env-file, managed-scope, remote-config-mode, backups-and-snapshots, hermes-home, model-configuration]
---

# config.yaml

> `~/.hermes/config.yaml`: the primary file for **non-secret** behaviour. Secrets belong in [[env-file]] or [[auth-json]]. Built-in defaults come from `DEFAULT_CONFIG` in `hermes_cli/config.py`.

## Rules

- Env references use `${VAR_NAME}` or `${env:VAR_NAME}`. A bare `$VAR` is never expanded ([[secrets-vs-config-split]]).
- Prefer `hermes config set/get/unset` ([[setting-config-values]]). Edit by hand only for keys whose IDs contain literal dots (per-model keys) and take a backup first.
- Automatic point-in-time backups: `backups/config/config.yaml.<reason>.<timestamp>`, newest 5 per reason. If the file becomes malformed Hermes falls back to the newest valid backup and logs a warning ([[backups-and-snapshots]]).
- Pinned keys in `/etc/hermes/config.yaml` win ([[managed-scope]]). In remote mode the local file is not read or written ([[remote-config-mode]]).
- Saved `model` / `provider` choices in `config.yaml` intentionally override stale shell exports such as `OPENAI_API_KEY` ([[config-precedence]]).

## Schema map: section to canonical page

| Section / key path | Page |
|---|---|
| `model`, `model.provider`, `base_url`, `api_mode`, `context_length`, `aliases`, `providers.<name>`, `provider_routing` | [[model-configuration]] |
| `fallback_providers`, `fallback.min_switch_reset_seconds` | [[fallback-providers]] |
| `credential_pool_strategies.<provider>` | [[credential-pools]] |
| `auxiliary.<task>` | [[auxiliary-tasks]] |
| `agent.*`, `display.*`, `quick_commands` | [[agent-and-display-settings]] |
| `agent.disabled_toolsets`, `toolsets`, `custom_toolsets` | [[toolsets-and-tool-registry]] |
| `context.engine`, `compression.*` | [[context-compression]] |
| `memory.*` | [[persistent-memory]] |
| `skills.*` | [[skills-system]] |
| `terminal.*`, `code_execution.*` | [[terminal-backends]] |
| `delegation.*` | [[delegation]] |
| `approvals.*`, `command_allowlist` | [[command-approvals]] |
| `security.*` | [[security-settings]] |
| `database.*`, `runtime.*` | [[state-db]] |
| `sessions.*`, `session.terminal_continue` | [[session-lifecycle]] |
| `checkpoints.*`, `worktrees.*` | [[checkpoints-and-worktrees]] |
| `gateway.*`, `platforms.<name>.enabled` | [[hermes-gateway]], [[profile-multiplexing]] |
| `cron.*` | [[cron-scheduler]] |
| `web.*`, `vision.*`, `image_gen.*`, `voice.*`, `stt.*`, `tts.*`, `wake_word.*` | [[web-and-media-tools]] |
| `browser.*` | [[browser-automation]] |
| `computer_use.*` | [[cua-driver]] |
| `plugins.*`, `hooks.*` | [[plugins-and-hooks]] |
| `updates.*` | [[hermes-update]] |
| `mcp_servers.<name>` | [[mcp-integration]] |
| `secrets.*` (Bitwarden, 1Password, `preserve_existing`, `profile_alias`) | [[external-secret-managers]] |
| `dashboard.*` (basic_auth, oauth) | [[hermes-interfaces]] |
| `skills.config.<skill>.<key>` | [[skills-system]] |

## Credential references written by Hermes

When Hermes writes an API key into a config slot, the raw secret goes to `.env` and `config.yaml` stores a `${VAR}` reference: see [[secrets-vs-config-split]].

## Open Questions

- The source's schema table is a selection, not a dump: how to list **all** keys? `hermes config show` and `hermes_cli/config.py::DEFAULT_CONFIG` are the likely authorities.
- Is there a JSON schema or `hermes config check` rule list that an agent can validate edits against offline?
