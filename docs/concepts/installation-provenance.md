---
title: Installation Provenance
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-doctor, hermes-update, hermes-pm, hermes-desktop, hermes-home, updating-hermes, fixing-platform-pitfalls]
---

# Installation Provenance

> How a Hermes install was delivered determines **who owns the code**, how to update it, and whether git-level edits are allowed. `hermes doctor` detects and reports it ([[hermes-doctor]]). Check it before updating or touching application files: package-owned installs (Desktop bundle, Docker, Nix, Termux) reject source-level git mutations.

## Matrix

| Method | Tier | Code location | Entry point | Default data | Update |
|---|---|---|---|---|---|
| POSIX source script (`install.sh`) | **1** (Linux, macOS arm64, WSL2) | `~/.hermes/hermes-agent/` (or `--dir`) | `~/.local/bin/hermes` wrapper | `~/.hermes/` | `hermes update` (git + PM) |
| Windows source script (`install.ps1`) | **1** (Win 10/11 x86_64, aarch64) | `%LOCALAPPDATA%\hermes\hermes-agent\` | `%LOCALAPPDATA%\hermes\bin\` | `%LOCALAPPDATA%\hermes\` | `hermes update` |
| Desktop bundle (`.dmg`, `.appinstaller`) | **1** (macOS arm64; Win 11 22H2+) | inside signed package (immutable) | packaged launchers, Windows App Execution Aliases | `~/.hermes/` or `%LOCALAPPDATA%\hermes\` | in-app updater (electron-updater, MSIX, Store) |
| Docker (`nousresearch/hermes-agent`) | **1** (x86_64, aarch64) | `/opt/hermes/` (root-owned, read-only) | image entrypoint and `hermes` shim | `/opt/data/` (host bind mount) | `docker pull` + recreate; `hermes update` exits 2 |
| Nix / NixOS (flake, modules) | **2** (best effort) | `/nix/store/...` (uv2nix derivations) | Nix profile `bin/hermes` or container shim | `~/.hermes/` or `/var/lib/hermes` (`/data` in container) | `nix profile upgrade` or `nixos-rebuild switch` |
| Android / Termux APT | **2** (aarch64 API 24; *currently broken/being fixed*) | `$PREFIX/lib/hermes-agent/` | symlinks in `$PREFIX/bin/` | `~/.hermes/` | `pkg update && pkg upgrade hermes-agent` |

## Unsupported

Intel macOS (x86_64) desktop bundles, 32-bit x86, non-aarch64 Termux, PyPI (`pip install hermes-agent`, `uv tool install`), Homebrew (`brew`), AUR. Intel Mac users install the CLI via `install.sh` and run `hermes desktop` to build from source ([[hermes-desktop]]).

## Implications

- Source installs: `hermes update` and [[hermes-pm]] manage code and environments ([[hermes-update]]).
- Others: do not `git pull`, do not rebuild environments by hand.

> **Agent note (host-specific, not from the source):** this machine is Linux arm64 (Ubuntu 24.04). The source lists Linux as Tier 1 for the POSIX source script but does not separately list arm64; the Docker row names aarch64 explicitly.

## Open Questions

- Does the Tier 1 Linux claim cover aarch64 for source installs, including every PM-managed tool?
- How does `hermes doctor` display provenance (field name), so an agent can parse it?
