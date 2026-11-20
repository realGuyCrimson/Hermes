---
title: Context Compression
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [auxiliary-tasks, model-configuration, prompt-caching, system-prompt-assembly, provider-resolution]
---

# Context Compression

> Lossy summarization of older conversation when the window fills. Built-in engine: `ContextCompressor` (`context.engine`). A plugin engine such as `lcm` can replace it.

## Config

| Key | Default / notes |
|---|---|
| `context.engine` | `ContextCompressor` (or plugin engine, e.g. `lcm`) |
| `compression.enabled` | `true` |
| `compression.threshold` | `0.50`, "floored at 0.75 for context windows <512K" (see note) |
| `compression.threshold_tokens` | `null` |
| `compression.model_thresholds` | `{}` |
| `compression.target_ratio` | `0.20` |
| `compression.tail_mode` | `lean` (`lean` or `legacy`) |
| `compression.protect_last_n` | `20` |
| `compression.in_place` | `true` |
| `compression.prepare_ahead` | `false` |
| `compression.codex_gpt55_autoraise` | `true`; raises trigger to **0.85** on Codex OAuth gpt-5.4/5.5/5.6 and gpt-6 Astra |
| `compression.codex_app_server_auto` | `native` |
| `compression.codex_responses_native` | `false` |

The summarizer is an auxiliary task: `auxiliary.compression` with `no_progress_timeout` 60 ([[auxiliary-tasks]]).

> **Ambiguity:** the source writes "threshold: 0.50 (floored at 0.75 for context windows <512K)". That reads as a 0.50 default whose effective value is raised to at least 0.75 on windows under 512K tokens. Resolve by: `hermes config get compression.threshold` and checking `agent.log` for the trigger point on a real session.

## Interactions

- Compression rewrites history and therefore interacts with provider prefix caching ([[prompt-caching]]).
- Context size comes from [[model-configuration]] (`model.context_length`, at least 64,000).

## Open Questions

- What are `threshold_tokens` and `model_thresholds` precedence rules relative to `threshold`?
- Does `in_place: true` rewrite the stored transcript in `state.db` or only the in-memory context?
