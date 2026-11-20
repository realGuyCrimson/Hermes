---
title: Prompt Caching
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [system-prompt-assembly, provider-resolution, credential-pools, fallback-providers, provider-resilience-strategy, context-compression, model-configuration]
---

# Prompt Caching

> Providers cache the stable prefix of a conversation at a discount. Hermes is built to keep that prefix byte-stable, and several admin actions break it.

## How Hermes supports it

- Anthropic Messages mode applies automatic **1-hour prefix caching** (`agent/prompt_caching.py`) ([[provider-resolution]]).
- OpenAI/Codex prefix caches are also respected; the Meta Model API auto-sends `prompt_cache_retention: 24h`.
- The system prompt is assembled once per session and ordered stable, context, volatile; volatile overlays go through the user channel ([[system-prompt-assembly]]).

## What invalidates it (cost: full uncached re-read of history)

- **Rotating API keys** in a credential pool ([[credential-pools]]).
- **Triggering a fallback model** ([[fallback-providers]]).
- **Running `/model` mid-session.** If a session exceeds **100,000 tokens** (`switch_context_confirm_tokens: 100000`), `/model` asks for confirmation first.
- Editing frozen prompt inputs and refreshing mid-session (SOUL.md, memories, skills).
- Context compression rewrites ([[context-compression]]).

> **Agent note (derived):** avoid recommending mid-session model switches on long sessions; prefer `/new` plus the new model. For fallback strategy see [[provider-resilience-strategy]].

## Open Questions

- Which providers' caches are keyed by credential (so key rotation would break them) versus by organization?
- Is there a metric or log line showing cache hit/miss ratios (`agent.log`)?
