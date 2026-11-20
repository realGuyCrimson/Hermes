# Hermes maintenance

Your sole responsibility is to work with me to set up, configure, diagnose, and fix my Hermes Agent.

`../.hermes` = `~/.hermes` = HERMES_HOME: live, multi-process state; the gateway is the canonical `state.db` writer.

`docs/` = wiki distilled from one unverified briefing. Entry: `docs/index.md` (symptom → page); `[[slug]]` = `docs/**/slug.md`. Live `hermes <cmd> --help` and `hermes config show` outrank docs; unknown flag → `docs/entities/hermes-online-docs.md`.

## Invariants

Detail: `docs/concepts/operational-invariants.md`.

1. `state.db`, `-wal`, `-shm` are one image: never delete a sidecar, never copy `state.db` alone. Back up: `hermes backup`; salvage: `hermes sessions recover`.
2. **Quiesce** before `hermes doctor --fix`, `hermes sessions repair|optimize`: `hermes gateway stop`, `hermes dashboard --stop`, quit Desktop; rerun read-only `hermes doctor` until zero holder PIDs; kill only listed PIDs; afterwards start one owner (gateway or Desktop). Protocol: `docs/skills/enforcing-zero-process-barrier.md`.
3. Secrets → `.env` (UPPER_SNAKE); behaviour → `config.yaml` (dotted), referenced as `${VAR}` (bare `$VAR` never expands). Prefer `hermes config set|unset`. Never print or record secret values (`.env`, `auth.json`, `vault/`, `config get --raw`).
4. Invoke only `~/.local/bin/hermes`. Python 3.14 and tools belong to `hermes pm`: no substitute interpreter, system pip/uv. Repair: `hermes pm doctor|repair`. Never delete `~/.hermes`.
5. Named profile ⇒ `-p <name>` on every call; omission silently targets default.
6. Before config edits, rule out `/etc/hermes/*` pins and `HERMES_CONFIG_BACKEND=remote`.
7. Never restore `state.db.corrupt.*.bak` or `*.malformed-backup` over `state.db`; retain `state.db.retired-wal-*`.

## Method

- Diagnose read-only first: `hermes doctor` (no `--fix`), `status --full`, `config check`, `pm doctor`. Route: `docs/skills/triaging-hermes-health.md`.
- Back up before mutating.
- No host Chromium (global rule): never `hermes pm install chromium`. Candidate: `browser.cdp_url` → `http://127.0.0.1:9222` (untested; ask first).

## Docs upkeep

Conventions: `docs/index.md`. Bump `updated:`, append `docs/log.md`, keep zero dead links, end pages with `## Open Questions`, flag contradictions inline, label inference.
