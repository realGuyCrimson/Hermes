---
title: Hermes Desktop
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [installation-provenance, enforcing-zero-process-barrier, hermes-gateway, state-db, hermes-update, clearing-interrupted-turns, hermes-interfaces]
---

# Hermes Desktop

> The Electron desktop app (`hermes desktop`). It is a Hermes process like any other: it counts toward the zero-process barrier and can hold a retired WAL.

## Facts

- **Bundle support (Tier 1):** macOS arm64 (`.dmg`) and Windows 11 22H2+ (`.appinstaller`/MSIX). Code is inside the signed package and immutable; updates come from the in-app updater (electron-updater / MSIX / Store). User data lives in `~/.hermes/` or `%LOCALAPPDATA%\hermes\`.
- **Intel macOS (x86_64) bundles are unsupported.** Intel Mac users install the CLI via `install.sh` and run `hermes desktop` to build from source.
- **Before updating,** the updater takes `state.db.pre-update-emergency-<ts>.bak`. Inspect it with `hermes sessions recover --source <file> --inspect-only` ([[state-db]]).
- It records connections (local, remote HTTP, SSH, Hermes Cloud) in `gateway-connections.json` and `gateway-connection-tokens.json` ([[hermes-home]]).
- After a gateway crash mid-turn it shows **"Turn lost during restart"** ([[clearing-interrupted-turns]]).

## Admin rules

- For any state repair, **quit Desktop completely from its menu** first ([[enforcing-zero-process-barrier]]).
- Do not try `hermes update` against a bundle install ([[installation-provenance]]).
- After repairs, "restart a single owner first": start the gateway or open Desktop, not both ([[resolving-wal-lock-refusals]]).

## Open Questions

- Does Desktop embed and manage its own gateway, or always connect to an external one via the connection registry?
- Where does the Windows App Execution Alias put the CLI relative to `~/.local/bin/hermes` on POSIX?
