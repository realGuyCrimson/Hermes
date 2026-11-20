---
title: Browser Vault
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [browser-automation, hermes-home, backups-and-snapshots, secret-isolation-strategy]
---

# Browser Vault

> Encrypted store for website logins and 2FA TOTP seeds, used by the `browser_vault` tool of the browser toolset ([[browser-automation]]).

## Files (`~/.hermes/vault/`)

| File | Role |
|---|---|
| `vault.json.enc` | ciphertext of credentials |
| `vault.key` | 256-bit key, mode 0600 |
| `vault.keyref` | reference to an OS-keychain entry |

## Commands

`hermes vault list`, `add`, `rm`, `sources`, `key`. Key migration: `hermes vault key migrate --to keychain` (store the key in the OS keychain) and `--to file`.

**Before migrating the machine,** migrate the key back to a file (`--to file`) so the vault stays portable.

## Agent rules

- Never print or copy `vault.key`; never back up `vault.json.enc` without its key.
- Related secret stores: [[external-secret-managers]], [[secret-isolation-strategy]].

## Open Questions

- Is the vault per profile or global? It sits directly under `HERMES_HOME` ([[hermes-home]]); the source does not say whether named profiles get their own.
- Does `hermes backup` include `vault/`? Not stated ([[backups-and-snapshots]]).
