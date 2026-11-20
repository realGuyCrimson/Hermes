---
title: Setting Up the Egress Proxy
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [iron-proxy, secret-isolation-strategy, terminal-backends, hermes-pm, hermes-interfaces]
---

# Setting Up the Egress Proxy

> Goal: sandboxed containers never see real API keys. Background: [[iron-proxy]], [[secret-isolation-strategy]].

## Steps

```bash
hermes egress install && hermes egress setup && hermes egress start
```

1. `install` provisions the PM-pinned `iron-proxy` binary ([[hermes-pm]]).
2. `setup` writes `~/.hermes/proxy/proxy.yaml`.
3. `start` runs the proxy on the host (HTTPS proxy port **9090**, plain HTTP **9091**).

## Verify

- `hermes egress status [--show-tokens]` (tokens are the opaque `hermes-proxy-<provider>-...` values).
- Inside a Docker-backend sandbox: `HERMES_EGRESS_PROXY=1`, `HTTPS_PROXY=http://host.docker.internal:9090`, CA bundle env vars pointing at `/etc/ssl/certs/hermes-egress-ca.crt`, provider env vars holding proxy tokens ([[terminal-backends]]).
- Logs: `~/.hermes/proxy/iron-proxy.log`.

## Change rules

`hermes egress reload` hot-reloads rules without a restart.

## Open Questions

- Is the proxy required to be running before the Docker backend starts the container, or are the env vars injected lazily?
- Ordering with firewalls that block `host.docker.internal` on Linux hosts.
