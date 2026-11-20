---
title: Testing MCP Servers
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [mcp-integration, hermes-cli, command-approvals, fixing-platform-pitfalls]
---

# Testing MCP Servers

> `hermes mcp test <server>` is the automation-friendly health check.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | connected and listed tools |
| 1 | connection failed |
| 2 | argparse usage error |
| 3 | server not found in config |

## Procedure

1. `hermes mcp test <server>` and branch on the code (3: fix the name or add it with `hermes mcp add`; 1: check command, URL, tokens).
2. For OAuth servers: `hermes mcp login <name>`.
3. After editing config: `/reload-mcp` in chat (confirm prompt if `approvals.mcp_reload_confirm: true`).
4. Tune exposure with `mcp_servers.<name>.tools.include|exclude`, `prompts: false`, `resources: false` ([[mcp-integration]]).
5. For unattended or cron use, remember `trust: untrusted` tools fail closed ([[command-approvals]]).

## WSL2 and Windows Chrome

Use the cmd.exe `chrome-devtools-mcp` bridge shown in [[mcp-integration]] and [[fixing-platform-pitfalls]].

## Open Questions

- Does `hermes mcp test` exercise a tool call or only handshake and `tools/list`?
- Is there a timeout flag for slow stdio servers?
