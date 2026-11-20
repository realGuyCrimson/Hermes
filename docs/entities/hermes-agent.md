---
title: Hermes Agent
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-home, hermes-gateway, hermes-interfaces, hermes-pm, hermes-cli, state-db, operational-invariants, installation-provenance, hermes-online-docs, toolsets-and-tool-registry]
---

# Hermes Agent

> An agent runtime from **Nous Research** that runs on a pinned **Python 3.14** and exposes the same session store through a CLI, a TUI, a desktop app, a web dashboard, an OpenAI-compatible API server and 25+ messaging platforms.

## Shape of the system

- **Code, tools and Python environments are separate from user state.** Application code lives in `~/.hermes/hermes-agent/`, managed binaries in `~/.hermes/tools/`, Python environments in `~/.hermes/installs/<INSTALL_KEY>/environments/`. User state is `config.yaml`, `.env`, `auth.json`, `SOUL.md` and the SQLite `state.db`. See [[hermes-home]], [[hermes-pm]].
- **One canonical writer.** Across every interface the profile's long-running [[hermes-gateway]] is the single canonical writer to [[state-db]], over a local WebSocket (`/api/ws`). Anything an admin does from the filesystem must coordinate with it ([[operational-invariants]]).
- **Interfaces:** classic CLI `hermes`, Ink TUI `hermes --tui`, Electron Desktop `hermes desktop`, Web Dashboard `:9119`, API Server `:8642`, plus messaging adapters. See [[hermes-interfaces]], [[hermes-desktop]].
- **Tools:** about 85 built-in tools in about 28 toolsets ([[toolsets-and-tool-registry]]), MCP servers ([[mcp-integration]]), browser and computer use ([[browser-automation]], [[cua-driver]]), cron ([[cron-scheduler]]).
- **Memory and identity:** [[soul-md]] (identity), [[persistent-memory]] (MEMORY.md, USER.md), [[skills-system]] (procedural skills).
- **Models:** one shared runtime provider resolver for CLI, TUI, Gateway, Cron, ACP and auxiliary calls ([[provider-resolution]]).

## Where to start as an admin

| Need | Page |
|---|---|
| Rules before touching anything | [[operational-invariants]] |
| "Something is wrong" | [[triaging-hermes-health]] |
| Where a file lives | [[hermes-home]] |
| Which command | [[hermes-cli]] |
| Which config key | [[config-yaml]] |
| Verify an unknown flag upstream | [[hermes-online-docs]] |
| Find the right page by symptom | [[index]] |

## Platform support at a glance

Tier 1: POSIX source script (Linux, macOS arm64, WSL2), Windows source script, signed Desktop bundles (macOS arm64, Windows 11 22H2+), Docker. Tier 2 best-effort: Nix/NixOS, Android/Termux APT. Details and the unsupported list: [[installation-provenance]].

## Open Questions

- Which release is installed here and how does it differ from what the source describes? (`hermes dump` / `hermes status --full` are the likely probes; not specified by the source.)
- When no gateway is running, does the CLI write to `state.db` directly or start/attach to a gateway? The source says "gateway is the canonical writer" but also describes CLI sessions failing with exit code 3 ("lost turn owner"). See [[session-admission-and-turn-recovery]].
- What is "ACP" (named as a resolver consumer and an install extra)? The source never expands it.
