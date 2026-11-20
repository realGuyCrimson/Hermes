---
title: Configuring a Local Ollama Model
type: skill
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [ollama, model-configuration, provider-resolution, env-file, setting-config-values]
---

# Configuring a Local Ollama Model

> Goal: a local model that meets Hermes' **64,000-token minimum** context. Background and the `/api/show` trap: [[ollama]].

## Steps

1. **Give Ollama at least 64K context:** start with `-c 65536`, or set `num_ctx` in the Modelfile.
2. **Point Hermes at the endpoint** (custom provider, not `OPENAI_BASE_URL`, which only the `openai-api` provider honours):
   ```bash
   hermes config set model.provider custom
   hermes config set model.base_url http://localhost:11434/v1
   hermes config set model.context_length 64000
   ```
   Set the model ID with `hermes model` (or `model.default`). Assembled from documented keys; not an upstream-verified recipe ([[model-configuration]]).
3. **Streaming timeout:** local endpoints automatically raise the read timeout from 120 s to 1800 s. Adjust with `HERMES_STREAM_READ_TIMEOUT=1800` in `.env` if needed.
4. **Verify:** `hermes config get model` and a short chat; check `~/.hermes/context_length_cache.yaml` (persisted probed limits).

## Pitfalls

- Ollama's `/api/show` reports the **maximum theoretical** context, not the active `num_ctx`; set `model.context_length` explicitly.
- `LLM_MODEL` in `.env` is ignored.
- If using a named custom provider, `providers.<name>` and `model.provider: custom:<name>` ([[model-configuration]]).

## Open Questions

- Should `model.context_length` equal the Ollama `num_ctx` exactly or be lower to leave output headroom?
- Does Hermes warn when the configured length exceeds the real window?
