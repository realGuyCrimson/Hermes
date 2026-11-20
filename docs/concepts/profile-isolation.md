---
title: Profile Isolation
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-home, profile-multiplexing, auth-json, external-secret-managers, operational-invariants, multi-profile-deployment-strategy, remote-config-mode, state-db]
---

# Profile Isolation

> Named profiles are isolated subdirectories of `~/.hermes/profiles/<name>/`. Each has its own `config.yaml`, `.env`, `SOUL.md`, `state.db`, `memories/`, `skills/` and `cron/`. A command that does not name the profile **silently falls back to the default root**.

## Rules

- Pass `-p <name>` (or `--profile <name>`) on every CLI call, or set `HERMES_HOME=~/.hermes/profiles/<name>` for subprocesses ([[hermes-home]]).
- A directory under `profiles/` counts as a profile only if it holds at least one identity file: `config.yaml`, `.env`, `SOUL.md`, `profile.yaml`, `auth.json` or `state.db`.
- **`auth.json` is shared across profiles by default.** Use `--isolated-auth` to isolate ([[auth-json]]).
- **Secrets aliasing:** with `secrets.profile_alias: true`, running under profile `milla` maps vault secrets named `FOO_MILLA` onto `FOO` for credential-like suffixes ([[external-secret-managers]]).
- Profile clone/rename and other file-oriented commands are refused in [[remote-config-mode]].
- A host gateway multiplexes profiles by default ([[profile-multiplexing]]); `hermes -p <name> gateway stop` **parks** just that profile.

## Agent checklist

1. Which profile is the user talking about? Default, or a named one?
2. Does every command in the plan carry `-p`? Does the file path point under `profiles/<name>/`?
3. Is the secret/credential shared (auth.json) or per profile (`.env`)?

## Open Questions

- Is `hermes profile` the creation/listing command, and what are its flags? The source mentions clone/rename but not the full CLI.
- Does `hermes backup` back up all profiles or the selected one only ([[backups-and-snapshots]])?
