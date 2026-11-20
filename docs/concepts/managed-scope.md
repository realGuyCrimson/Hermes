---
title: Managed Scope (/etc/hermes)
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [config-precedence, setting-config-values, remote-config-mode, operational-invariants, env-file, config-yaml, triaging-hermes-health]
---

# Managed Scope (`/etc/hermes`)

> A sysadmin layer: leaf keys pinned in `/etc/hermes/config.yaml` and `/etc/hermes/.env` override user `config.yaml`, user `.env` **and pre-existing shell environment variables**. It is invariant #7: check it first ([[operational-invariants]]).

## Facts

- Files are owned by `root:root`; directory mode 0755, files 0644.
- `hermes config set` on a pinned key is **rejected**.
- Relocating the directory needs `HERMES_MANAGED_DIR` in the **service launch environment**. It is ignored if placed in `.env` or `config.yaml`.
- Managed `/etc/hermes/.env` values also beat `config.yaml` for bridged adapter keys ([[config-precedence]]).

## Detect it (derived suggestions)

> **Agent note (derived):** the source describes the layer but not a detection command. Reasonable checks: `ls -la /etc/hermes/`, read `/etc/hermes/config.yaml` (not secrets), and look for `HERMES_MANAGED_DIR` in the unit file or service environment.

If a key "will not change", look here before editing user files ([[setting-config-values]]).

## Open Questions

- Does `hermes config show` mark pinned keys, and does `hermes doctor` report managed scope?
- Are secrets in `/etc/hermes/.env` expected on shared hosts, and who rotates them?
- This is likely absent on a personal single-user server; confirm on this machine.
