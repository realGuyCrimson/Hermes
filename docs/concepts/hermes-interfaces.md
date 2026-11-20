---
title: Hermes Interfaces and Ports
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-gateway, profile-multiplexing, hermes-desktop, hermes-cli, security-settings, agent-and-display-settings, iron-proxy]
---

# Hermes Interfaces and Ports

> Many surfaces, one session store: the [[hermes-gateway]] is the canonical writer behind all of them.

| Surface | How to start | Port / URL | Notes |
|---|---|---|---|
| Classic CLI | `hermes` | none | `display.interface: cli` |
| Ink TUI | `hermes --tui` | none | `display.interface: tui`; needs managed Node |
| Electron Desktop | `hermes desktop` | none | [[hermes-desktop]] |
| Web Dashboard | `hermes dashboard` (stop: `hermes dashboard --stop`) | **9119** | serves all profiles from one server; non-loopback bind (0.0.0.0) **fails closed** unless `dashboard.basic_auth`, `dashboard.oauth` or `HERMES_DASHBOARD_SESSION_TOKEN` is set; `--insecure` is a deprecated no-op |
| API Server (OpenAI-compatible) | gateway | **8642** | `/v1/chat/completions`; secondary profiles at `/p/<profile>/v1/chat/completions` |
| Webhooks | gateway | **8644** | `/p/<profile>/webhooks/<route>` |
| Webapp (Browser Desktop workspace) | gateway | **9120** | token files in `~/.hermes/webapp/` |
| Subscription proxy (raw OpenAI-compatible passthrough) | `hermes proxy start` | **8645** | |
| Local WebSocket | gateway | `/api/ws` | canonical writer channel |
| Messaging platforms | gateway adapters | n/a | 25+ platforms; DM pairing; `platforms.<name>.enabled` |
| iron-proxy (sandbox egress) | `hermes egress start` | **9090** (HTTPS), **9091** (plain HTTP) | [[iron-proxy]] |
| Ollama (example local model) | external | **11434** | `/v1` ([[ollama]]) |

Multiplexed profiles share the default profile's listeners via the `/p/<profile>/` prefix ([[profile-multiplexing]]).

## Open Questions

- Which config keys set host/port for each listener (the source gives defaults only)?
- Is the Webapp (9120) distinct from the Dashboard (9119) in functionality, or a later replacement?
