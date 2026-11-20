---
title: iron-proxy (egress firewall)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [setting-up-egress-proxy, secret-isolation-strategy, terminal-backends, hermes-pm, secrets-vs-config-split, hermes-home]
---

# iron-proxy (egress firewall)

> A TLS-intercepting, **credential-injecting** egress proxy. Sandboxed containers see opaque tokens instead of real API keys; iron-proxy swaps in the real keys at the host network boundary. Binary is a PM-managed tool ([[hermes-pm]]).

## How it works inside the Docker sandbox

- `HERMES_EGRESS_PROXY=1` is set.
- `HTTPS_PROXY` points to `http://host.docker.internal:9090` (plain HTTP to port **9091**).
- `/etc/ssl/certs/hermes-egress-ca.crt` is mounted and referenced by `SSL_CERT_FILE`, `REQUESTS_CA_BUNDLE`, `NODE_EXTRA_CA_CERTS`.
- Provider env vars (for example `OPENROUTER_API_KEY`) hold opaque tokens like `hermes-proxy-openrouter-...`.

## Files and commands

- `~/.hermes/proxy/proxy.yaml`, `~/.hermes/proxy/iron-proxy.log`.
- `hermes egress install`, `setup`, `start`, `status [--show-tokens]`, `reload` (hot-reload rules). Procedure: [[setting-up-egress-proxy]].

## Why it matters

It is the strongest layer of [[secret-isolation-strategy]]; sandboxes are described in [[terminal-backends]].

## Open Questions

- Is iron-proxy meaningful for the `local` terminal backend (no container to point at the proxy)?
- How are rules expressed in `proxy.yaml` (allowlist domains, token mappings)? Not described.
- Port conflicts: 9090/9091 are reserved on the host; are they configurable?
