---
title: Terminal Backends and Code Execution
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [fixing-terminal-environment, iron-proxy, command-approvals, secret-isolation-strategy, toolsets-and-tool-registry, hermes-home, security-settings]
---

# Terminal Backends and Code Execution

> Where the agent's shell commands and `execute_code` calls run.

## `terminal.*`

| Key | Default / notes |
|---|---|
| `terminal.backend` | `local`; also `docker`, `ssh`, `modal`, `daytona`, `vercel_sandbox`, `singularity`, `sprites` |
| `terminal.cwd` | `"."` |
| `terminal.timeout` | `180` |
| `terminal.persistent_shell` | `true` |
| `terminal.auto_source_bashrc` | `true` |
| `terminal.shell_init_files` | list; **overrides** the `.bashrc` default unless `.bashrc` is in the list |
| `terminal.home_mode` | `auto`, `real`, `profile` (sets `HOME={HERMES_HOME}/home`) |
| `terminal.env_passthrough` | list of env vars to pass |
| `terminal.process_wait_auto_notify` | `true` |
| `terminal.docker_image`, `docker_forward_env` (`[]`) | Docker sandbox |
| `terminal.container_cpu` / `container_memory` / `container_disk` | `1` / `5120` / `51200` |
| `terminal.container_persistent` | `true` |

Hermes snapshots the shell with `bash -l` and auto-sources `~/.bashrc`; this causes two opposite failures, handled in [[fixing-terminal-environment]].

## Docker sandbox

One persistent container (`docker run -d ... sleep infinity`) is shared across terminal, file and `execute_code` calls. Hardening: `--cap-drop ALL` (adding `DAC_OVERRIDE`, `CHOWN`, `FOWNER`), `--security-opt no-new-privileges`, `--pids-limit 256`, size-capped tmpfs (`/tmp` 512m, `/var/tmp` 256m noexec). Persistent workspaces bind-mount from `~/.hermes/sandboxes/docker/<task_id>/`. If a container leaves root-owned files the host user cannot delete, Hermes **logs the exact `sudo rm -rf` or `docker run ... rm -rf` command** instead of deleting partially.

To keep real keys out of the sandbox use [[iron-proxy]] ([[secret-isolation-strategy]]).

## `code_execution.*`

| Key | Default |
|---|---|
| `mode` | `project` (session CWD + active venv/conda Python) or `strict` (temp staging dir + `sys.executable`) |
| `timeout` | `300` |
| `max_tool_calls` | `50` |
| `kernel_idle_timeout` | `1800` |
| `max_session_kernels` | `4` |

Outputs over 50 KB land in `~/.hermes/cache/exec/`.

Approvals are skipped on container backends and active on local/ssh ([[command-approvals]]).

## Open Questions

- What is the interplay of `terminal.home_mode: profile` with `shell_init_files` paths?
- Which of the seven backends are usable on an arm64 host (Modal, Daytona, etc. are remote)?
