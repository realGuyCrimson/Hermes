---
title: Remote Config Mode
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [config-precedence, managed-scope, operational-invariants, backups-and-snapshots, profile-isolation, env-file, auth-json, multi-profile-deployment-strategy]
---

# Remote Config Mode

> For fleet or Hermes Cloud deployments, a remote config plane **replaces local files entirely**. Invariant #7 ([[operational-invariants]]).

## Activation

- `HERMES_CONFIG_BACKEND=remote` and `HERMES_CONFIG_INSTANCE_ID` in the process environment or `.env` ([[env-file]]).
- `HERMES_CONFIG_REMOTE_URL` defaults to `https://config-config.nousresearch.com`.
- Authenticated via `auth.json` ([[auth-json]]) or `GATEWAY_RELAY_IDP_*` OAuth2 client credentials.

## Behaviour

- **Local `config.yaml` and `/etc/hermes/config.yaml` are never read or written.**
- Startup **fails closed** after about 30 s if the plane is unreachable.
- Running processes poll the plane every **5 minutes**.
- Keys locked at an upper level cannot be modified.
- **Refused commands:** `hermes config edit`, profile clone/rename, `hermes backup`, `hermes import`, snapshot restore, `gateway --config` ([[backups-and-snapshots]], [[profile-isolation]]).

## Agent rules

- If these env vars are present, stop editing `config.yaml`; changes will be ignored.
- Do not try to bypass with `--force`.

## Open Questions

- What is the command or API for changing a remote key (there is no local fallback described)?
- Are `.env` secrets still local in remote mode?
