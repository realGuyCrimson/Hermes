---
title: Fixing the Terminal Environment
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [terminal-backends, hermes-home, secret-isolation-strategy, command-approvals]
---

# Fixing the Terminal Environment

> Hermes snapshots the shell with `bash -l` and auto-sources `~/.bashrc` (`terminal.auto_source_bashrc: true`). Two opposite failures follow.

## Failure 1: missing tools (`node: command not found`, Zsh or custom setups)

Add explicit init scripts:

```yaml
terminal:
  shell_init_files: ["~/.bashrc", "~/.zshrc", "~/.nvm/nvm.sh"]
```

**Setting `shell_init_files` disables the automatic `~/.bashrc` source unless `~/.bashrc` is in the list.**

## Failure 2: slow or hanging commands

Tool commands run non-interactively without a TTY. Interactive prompts (`tmux attach`, `read`) or heavy init scripts in `~/.bashrc` hang or add seconds of latency. Put an interactive guard at the **top** of `~/.bashrc`:

```bash
case $- in
  *i*) ;;      # interactive: continue
  *) return;;  # non-interactive: stop here
esac
```

## Related

- Root-owned files left by Docker bind mounts: Hermes logs the exact `sudo rm -rf` or `docker run ... rm -rf` remediation rather than deleting partially ([[terminal-backends]]).
- `terminal.home_mode: profile` sets `HOME={HERMES_HOME}/home`.
- `terminal.persistent_shell` (true), `terminal.timeout` (180).

## Open Questions

- Is `terminal.shell_init_files` evaluated per command or once at snapshot time (affects whether editing `.bashrc` needs a restart)?
- Does the interactive guard also protect `bash -l` login snapshots (profile files, not rc files)?
