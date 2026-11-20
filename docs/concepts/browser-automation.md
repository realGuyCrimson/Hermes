---
title: Browser Automation
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [browser-vault, hermes-pm, mcp-integration, toolsets-and-tool-registry, nous-portal, cua-driver, terminal-backends, hermes-home]
---

# Browser Automation

> The **browser toolset** (`browser_exec`, `browser_cdp`, `browser_dialog`, `browser_vault`) requires the **terminal** toolset to be enabled ([[toolsets-and-tool-registry]]).

## Backends

- **Local headless Chromium** from `~/.hermes/tools` (`hermes pm install chromium`, Chrome for Testing; [[hermes-pm]]). On Debian/Ubuntu install system libraries with `npx playwright install-deps chromium`.
- **Cloud providers** via `browser.cloud_provider`: `local`, `nous`, `browser-use`, `browserbase`, `firecrawl`. For private, LAN or loopback URLs Hermes automatically spawns a **local Chromium sidecar** even with a cloud provider.
- **External browser** by `browser.cdp_url`, or a specific `browser.executable_path`.

## `browser.*`

`cloud_provider`, `executable_path`, `user_data_dir`, `chromium_args`, `headed` (false), `command_timeout` (30), `inactivity_timeout` (120), `use_real_profile` (false), `cdp_url`.

`use_real_profile: true` copies your default browser's cookies and logins into `~/.hermes/browser-profile/<browser>/` (on Windows close Chrome before the first snapshot).

## Logins

Website logins and 2FA TOTP seeds are stored in the encrypted vault ([[browser-vault]]).

> **Agent note (host-specific, not from the source):** this machine runs browsers **only in Docker** (Ubuntu 24.04 blocks the Chromium sandbox on the host; never `--no-sandbox` on the host). Hermes' managed Chromium would be a host browser. The schema offers `browser.cdp_url` and `browser.executable_path`, so pointing them at the existing Docker CDP browser (`http://127.0.0.1:9222`) or its `chrome-docker` wrapper is the obvious fit. **Untested; confirm with the user before changing config.**

## WSL2

Bridge to signed-in Windows Chrome via MCP: see [[mcp-integration]].

## Open Questions

- Does Hermes connect to an existing CDP endpoint without restarting or taking over tabs?
- Are `browser_cdp` calls subject to approvals ([[command-approvals]])?
- Does `hermes pm install chromium` offer a linux-arm64 build ([[hermes-pm]])?
