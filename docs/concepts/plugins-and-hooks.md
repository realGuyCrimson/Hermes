---
title: Plugins and Hooks
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-pm, hermes-update, hermes-gateway, hermes-home, security-settings, system-prompt-assembly]
---

# Plugins and Hooks

> Three extension points: **plugins** (Python), **gateway hooks** (directory-based), **shell hooks** (command strings in config) and **outbound webhooks**.

## Plugins

- Install under `~/.hermes/plugins/`: `plugin.yaml` + `__init__.py`, or portable `plugin.json`. `model-providers/` holds provider plugins. Durable per-plugin storage: `plugin-data/`.
- Manage with `hermes plugins`.
- Config: `plugins.enabled` (`[]`), `plugins.disabled` (`[]`), `clone_timeout_seconds` 300, `hook_callback_timeout` 30, `load_timeout_seconds` 10, `entries.<id>.allow_tool_override` (false).
- `pre_llm_call` plugins can add per-turn context ([[system-prompt-assembly]]).
- If dependencies fail to resolve during `hermes update`, PM moves the plugin from `enabled` to `disabled` (`plugins.disabled_by_update`) and retries later ([[hermes-update]], [[hermes-pm]]).

## Gateway hooks

`~/.hermes/hooks/<name>/` with `HOOK.yaml` + `handler.py`. **Trusted implicitly by directory placement**; loaded at gateway startup ([[hermes-gateway]]). Example: the `boot-md` hook runs `BOOT.md` (a natural-language startup checklist) as a background one-shot agent turn on `gateway:startup`.

## Shell hooks

Defined in `config.yaml` under `hooks:`. Approved exact command strings (`{"event": "...", "command": "..."}`) are stored in `~/.hermes/shell-hooks-allowlist.json`. `hooks_auto_accept` defaults to **false**. Outbound: `hooks.outbound` is a list of webhooks.

Commands: `hermes hooks doctor`, `list`, `test <event>`, `revoke <cmd>`.

## Agent rules

- Hook and plugin directories execute code: treat additions as code review ([[security-settings]]).
- Do not enable `hooks_auto_accept` to silence prompts.

## Open Questions

- What events exist for gateway hooks and shell hooks (only `gateway:startup` is named)?
- How is `allow_tool_override` meant to be used and why is it off by default?
