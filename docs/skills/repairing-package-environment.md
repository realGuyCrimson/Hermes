---
title: Repairing the Package Environment
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-pm, operational-invariants, browser-automation, cua-driver, security-settings, updating-hermes, installation-provenance]
---

# Repairing the Package Environment

> Fix broken Python dependencies, missing extras or missing managed tools **in place**. Never delete `~/.hermes` and never use system pip/uv ([[operational-invariants]] rules 4 and 5).

## Decide

| Symptom | Action |
|---|---|
| Unsure what is wrong | `hermes pm doctor` (lockfile vs disk digests), `hermes pm status` (latest sync receipt) |
| Damaged environment | `hermes pm repair` (replays the recorded dependency union into a fresh generation, no source re-download) |
| Missing optional tool after `--skip-browser` / `--skip-computer-use` | `hermes pm install chromium` / `hermes pm install cua-driver` |
| Missing Python extra (`messaging`, `mcp`, `bedrock`, `voice`, `wake`, ...) | `hermes pm install --extra <NAME>` |
| Node or TUI fails to start (glibc Linux) | install `libatomic1` (apt/zypper), `libatomic` (dnf/yum/apk), `gcc-libs` (pacman) |
| Browser toolset fails on Debian/Ubuntu | `hermes pm install chromium`, then `npx playwright install-deps chromium` for system libraries |
| Runtime installs unwanted | `hermes config set security.allow_lazy_installs false` |

## Fallback when the wrapper cannot run

```bash
cd ~/.hermes/hermes-agent && python -c "import pm; pm.sync_venv(['<extra>'], explicit=True)"
python -c "import pm; pm.sync_venv(repair=True, explicit=True)"
python -m pm.cli doctor
```

Use these only if `hermes pm ...` is unavailable, and with the PM-managed interpreter (see the tension note in [[hermes-pm]]).

## After an update

A failed PM sync leaves the previous environment working and retries on the next launch. Check `hermes pm status` and `~/.hermes/logs/update_receipts/latest.json` (`followups`) ([[updating-hermes]]).

> **Agent note (host-specific, not from the source):** on this Ubuntu 24.04 arm64 host check `dpkg -s libatomic1` first. See [[browser-automation]] before running `hermes pm install chromium` (host rule: browsers only in Docker).

## Open Questions

- Does `hermes pm repair` need network access for unmodified locked wheels (cache)?
- Is there a dry-run for `hermes pm repair`?
