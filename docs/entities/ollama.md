---
title: Ollama (local endpoint)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [configuring-local-ollama, model-configuration, provider-resolution, env-file]
---

# Ollama (local endpoint)

> A local OpenAI-compatible server at `http://localhost:11434/v1`. Hermes needs a context window of **at least 64,000 tokens**, and Ollama is the classic place this goes wrong.

## The trap

Ollama's `/api/show` reports a model's **maximum theoretical context**, not the active `num_ctx`. Hermes therefore cannot trust it.

## Required settings

1. Start Ollama with at least 64K context (`-c 65536`, or `num_ctx` in a Modelfile).
2. Set `model.context_length: 64000` (or the matching size) in `config.yaml`.

Local endpoints automatically raise the streaming read timeout from 120 s to **1800 s**; adjust further with `HERMES_STREAM_READ_TIMEOUT=1800` in `.env`.

Use `model.provider: custom` with `model.base_url` ([[model-configuration]]). There is also a separate `ollama-cloud` provider slug. Procedure: [[configuring-local-ollama]].

## Open Questions

- Does Hermes validate `context_length` against the real `num_ctx`, or only against the 64,000 floor?
- Are LM Studio (`lmstudio` slug) and vLLM handled with the same timeout auto-raise?
