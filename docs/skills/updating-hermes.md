---
title: Updating Hermes Safely
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-update, installation-provenance, backups-and-snapshots, hermes-pm, fixing-platform-pitfalls, hermes-desktop, operational-invariants]
---

# Updating Hermes Safely

> **Synthesized procedure** around the documented lifecycle in [[hermes-update]].

## Pre-flight

1. **Provenance:** `hermes doctor` (read-only). Docker, Nix, Desktop bundle and Termux do **not** use `hermes update` ([[installation-provenance]]).
2. **Managed or remote config?** Pins can interfere with config migration ([[managed-scope]], [[remote-config-mode]]).
3. **Look before you leap:** `hermes update --check` (availability) and `hermes update --plan` (service restart plan across all profiles). Both are read-only.
4. **Backup:** `hermes backup` (or `hermes update --backup` for a forced full `.zip`) ([[backups-and-snapshots]]).

## Run

```bash
hermes update --check
hermes update --plan
hermes update --backup --yes     # --yes accepts migrations non-interactively
```

Channel control: `--set-channel main|stable` (persist), `--channel main|stable` or `--branch <NAME>` (one-off). Official checkouts default to stable; forks to main.

`hermes update` snapshots state, publishes a recovery bundle, pauses running gateways, pulls, compiles the startup files and **rolls back automatically** if compilation fails.

## Post-flight

- Exit code 0 means no rollback (even if a completion step warned).
- `hermes pm status` and `~/.hermes/logs/update_receipts/latest.json`: look at `followups`. Unfinished steps retry on the next launch or `hermes update`.
- `hermes doctor`, `hermes gateway status` (the fleet gateway restart is one of the completion steps).
- Plugins disabled by update appear under `plugins.disabled` (`disabled_by_update`) ([[plugins-and-hooks]]).

## If it is stuck

- Abandoned git pack files: [[fixing-platform-pitfalls]] section 5.
- Broken environment: [[repairing-package-environment]].
- Desktop: use the in-app updater ([[hermes-desktop]]).

## Open Questions

- Is `--yes` required for cron-driven (unattended) updates and what does it accept by default?
- Which updates would require stopping the gateway manually (the source says it pauses them itself)?
