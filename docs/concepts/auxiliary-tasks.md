---
title: Auxiliary Tasks
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [fallback-providers, provider-resilience-strategy, context-compression, agent-and-display-settings, secrets-vs-config-split, skill-curator, model-configuration]
---

# Auxiliary Tasks

> Layer 3 of resilience, and the home of every side job (vision, compression, titles, approvals...). Each task resolves independently: `auxiliary.<task>` then `auxiliary.<task>.fallback_chain`, then the main agent model.

## Tasks

`vision`, `compression`, `title_generation`, `approval`, `review`, `voice_chat`, `tts_audio_tags`, `triage_specifier`, `kanban_decomposer`, `profile_describer`.

## Keys per task

| Key | Default / notes |
|---|---|
| `provider` | `auto` (also `main` or a provider slug) |
| `model`, `base_url`, `api_key` | `api_key` is written as `${AUXILIARY_<TASK>_API_KEY}` ([[secrets-vs-config-split]]) |
| `timeout` | `120` |
| `no_progress_timeout` | `60` for compression |
| `extra_body` | passthrough |
| `fallback_chain` | per-task failover list |

`title_generation` adds `enabled`, `model_upgrade_enabled`, `prefer_fast_model`.

## Relationships

- `compression` feeds [[context-compression]]; `approval` backs smart approvals ([[command-approvals]]); `vision` interacts with `agent.image_input_mode` ([[agent-and-display-settings]]).
- Part of [[provider-resilience-strategy]].

## Open Questions

- Which task slot does the [[skill-curator]] use?
- Does `provider: main` mean "the current main provider including fallback state", or the configured primary?
