---
title: hermes pm (Package Manager)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [repairing-package-environment, hermes-update, security-settings, installation-provenance, operational-invariants, browser-automation, cua-driver, hermes-home, plugins-and-hooks]
---

# hermes pm (Package Manager)

> Hermes' internal manager for **binary tools** and **generationally versioned Python environments**. It replaces the single mutable `.venv` model. Python **3.14** is a pinned, PM-provisioned tool.

## What it manages

- `pm/lock.json` pins exact versions, target-specific download URLs and SHA-256 hashes for: **Python 3.14**, **Node.js (>=20)**, npm, pnpm, ripgrep, ffmpeg, `bws` (Bitwarden CLI), `iron-proxy` (egress firewall), and the two default *optional* tools **chromium** (Chrome for Testing) and **cua-driver** (computer-use driver).
- `pyproject.toml` + `uv.lock` define core Python dependencies and extras (core locks use a **3-day `exclude-newer` age gate**). `pm/pyproject.toml` + `pm/uv.lock` lock PM's own runtime.
- Hermes uses its **own verified uv pin** and ignores any `uv` on `PATH`.

## On-disk state

| Path | Meaning |
|---|---|
| `~/.hermes/tools/facts.json` | installed binary digests and environment exports |
| `~/.hermes/installs/<INSTALL_KEY>/facts.json` | active Python generation and enabled extras (`INSTALL_KEY` hashes the canonical source path) |
| `~/.hermes/installs/<INSTALL_KEY>/environments/` | per-generation virtual environments |
| `pyvenv.cfg` in each PM-built venv | contains `hermes-pm-built = true` |
| `~/.hermes/logs/update_receipts/` | sync receipts (`latest.json`); read via `hermes pm status` |

## Launch-time behaviour

On self-managed source installs, running `~/.local/bin/hermes` performs a **pre-import check** comparing PM's recorded dependency stamp with current inputs (`uv.lock`, enabled extras, plugin dependencies). If stale or missing, PM syncs a new environment generation and restarts on the managed Python 3.14. If the sync fails from a transient network problem, the **previous working environment is retained** and retried on the next launch.

On glibc Linux, managed Node.js links `libatomic.so.1`. If Node or the TUI will not start, install `libatomic1` (apt/zypper), `libatomic` (dnf/yum/apk) or `gcc-libs` (pacman).

## Commands

| Command | Use |
|---|---|
| `hermes pm doctor` (or `python -m pm.cli doctor`) | verify lockfile vs disk bytes and realized file digests |
| `hermes pm status` | latest dependency sync status and receipt |
| `hermes pm repair` (or `python -c "import pm; pm.sync_venv(repair=True, explicit=True)"`) | replay the recorded dependency union into a fresh generation, without re-downloading source |
| `hermes pm install chromium` / `cua-driver` | provision, or re-add after `--skip-browser` / `--skip-computer-use` (`--without chromium` / `--without cua-driver`), which Hermes remembers across updates |
| `hermes pm install --extra <NAME>` or `cd ~/.hermes/hermes-agent && python -c "import pm; pm.sync_venv(['messaging'], explicit=True)"` | add Python extras |

**Extras** named in the source: `all` (default for source installs), `messaging` (Telegram/Discord/Slack/voice), `mcp`, `bedrock` (boto3), `modal`, `vercel`, `voice`, `tts-premium` (elevenlabs), `wake`, `acp`.

**Lazy installs:** `security.allow_lazy_installs` (default `true`) lets packages install on demand; `false` blocks runtime auto-installs while keeping existing packages ([[security-settings]]).

## Plugin dependencies

If an enabled plugin's dependencies fail to resolve during `hermes update`, PM moves it from `plugins.enabled` to `plugins.disabled` (recorded as `plugins.disabled_by_update`) and retries on later updates ([[hermes-update]], [[plugins-and-hooks]]).

> **Contradiction (within the source):** [[operational-invariants]] rule 4 forbids substituting the Python interpreter, yet the in-source repair recipes call a bare `python -c "import pm; ..."`. Resolve by: preferring the CLI forms (`hermes pm repair`, `hermes pm install --extra <NAME>`); use the `python -c` form only if the wrapper cannot start, and then with the PM-managed 3.14 interpreter from `installs/<INSTALL_KEY>/environments/`.

> **Agent note (host-specific, not from the source):** this machine is Ubuntu 24.04 arm64. Two things to verify: (1) that `pm/lock.json` has a linux-aarch64 target for `chromium` (Chrome for Testing may lack one); (2) that `libatomic1` is installed for managed Node. Also remember the host rule to run browsers only in Docker (see [[browser-automation]]).

## Agent rules

- Do not call system `pip` or `uv`; do not create your own venv for Hermes.
- Repair in place; never delete `~/.hermes` ([[repairing-package-environment]]).
- Package-owned installs (Docker, Nix, Desktop bundle, Termux) do not use the git+PM source flow ([[installation-provenance]]).

## Open Questions

- Which interpreter should `python -c "import pm; ..."` use when the wrapper is broken, and what is its path?
- Does `pm/lock.json` include `linux-aarch64` targets for every tool, especially chromium and cua-driver (cua is probably macOS-focused; see [[cua-driver]])?
- How are `--skip-browser` / `--skip-computer-use` recorded (which facts file), and can they be inspected?
