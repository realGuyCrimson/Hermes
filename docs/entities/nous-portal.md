---
title: Nous Portal and Tool Gateway
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [auth-json, provider-resolution, web-and-media-tools, browser-automation, model-configuration, managing-credential-pools-and-fallbacks]
---

# Nous Portal and Tool Gateway

> Nous Research's hosted inference and tool service. `hermes setup --portal` authenticates via browser OAuth (portal.nousresearch.com) and saves a **shared refresh token** in `~/.hermes/auth.json` ([[auth-json]]).

## What `--portal` configures

- `model.provider: nous`, base URL `https://inference-api.nousresearch.com/v1`.
- Routes through Nous: **Web Search, Image Generation, TTS, STT, Cloud Browser** (`*.provider: nous`, `web.backend: nous`, `browser.cloud_provider: nous`). See [[web-and-media-tools]], [[browser-automation]].

## Troubleshooting

- If the refresh token is revoked or expired, Hermes **quarantines** it locally to prevent 401 loops. Clear the quarantine with `hermes auth add nous` (or `hermes portal`).
- Inspect with `hermes portal info` and `hermes portal tools`.
- Nous Portal ignores OpenRouter-style `provider_routing` ([[model-configuration]]).

## Open Questions

- Where is the quarantine flag stored, and can it be read without clearing it?
- How does `--portal` interact with an already configured fallback chain ([[fallback-providers]])?
