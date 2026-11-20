---
title: Toolsets and Tool Registry
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [agent-and-display-settings, command-approvals, mcp-integration, browser-automation, persistent-memory, delegation, skills-system, terminal-backends]
---

# Toolsets and Tool Registry

> Hermes ships **~85 built-in tools across ~28 toolsets** (`tools/registry.py`, `toolsets.py`).

## Discovery

At startup `discover_builtin_tools()` uses **AST parsing** to find top-level `registry.register()` calls in `tools/*.py`. Import errors on optional dependencies are caught so healthy tools still load. Each tool's `check_fn()` gates schema generation (a tool whose check fails simply does not appear).

## Agent-level interception

Four stateful tools are intercepted by `agent/tool_executor.py` **before** registry dispatch: `todo` (`todo_list`), `memory` ([[persistent-memory]]), `session_search`, `delegate_task` ([[delegation]]).

## Config

`agent.disabled_toolsets` (`[]`), `toolsets` (`["hermes-cli"]`), `custom_toolsets.<name>` for custom bundles ([[agent-and-display-settings]]).

## Notable dependencies

- The **browser toolset** (`browser_exec`, `browser_cdp`, `browser_dialog`, `browser_vault`) requires the **terminal** toolset ([[browser-automation]]).
- MCP servers add dynamic toolsets `mcp-<server>` with tools `mcp__<server>__<tool>` ([[mcp-integration]]).
- Skills can gate on `requires_toolsets` / `fallback_for_toolsets` ([[skills-system]]).
- Dangerous commands pass through approvals ([[command-approvals]]); execution environments in [[terminal-backends]].

## Open Questions

- How to list all toolsets and tools of the installed version (`hermes tools`?). Not named in the source.
- Which toolset does `hermes-cli` bundle, and how does it differ per platform?
