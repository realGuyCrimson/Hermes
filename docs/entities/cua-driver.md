---
title: cua-driver (Computer Use)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-pm, browser-automation, hermes-cli, toolsets-and-tool-registry, command-approvals]
---

# cua-driver (Computer Use)

> The computer-use driver Hermes uses to operate desktop apps **in the background without moving the OS cursor**. A default optional PM tool ([[hermes-pm]]); install with `hermes pm install cua-driver` or `hermes computer-use install [--upgrade]`.

## Config (`computer_use.*`)

| Key | Default / values |
|---|---|
| `backend` | `cua` |
| `permission_mode` | `standard` or `bounded` |
| `capability_manifest` | `~/.hermes/cua-manifest.yaml` |
| `allow_unsigned_driver` | `false` |
| `no_overlay` | bool |
| `autostart` | `false` |
| `cua_telemetry` | `false` |

## Triage

`hermes computer-use doctor [--json]` exit codes: **0** OK; **1** degraded or failed (prints fix hints); **2** binary unreachable. Permissions: `hermes computer-use permissions status [--json]` and `permissions grant`.

## macOS TCC resets

If Accessibility or Screen Recording grants (bundle `com.trycua.driver` / `CuaDriver.app`) go stale after an update:

```bash
tccutil reset Accessibility com.trycua.driver
tccutil reset ScreenCapture com.trycua.driver
hermes computer-use permissions grant
```

> **Agent note (host-specific, not from the source):** the TCC recipe is macOS-only. This machine is a headless Ubuntu 24.04 arm64 server; whether `cua-driver` has a Linux build is not stated in the source.

## Open Questions

- Which operating systems does `cua-driver` support, and is it installed by default on Linux?
- What do `permission_mode: bounded` and the capability manifest restrict, concretely?
- How does computer use interact with the approval layer ([[command-approvals]])?
