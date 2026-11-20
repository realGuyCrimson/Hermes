---
title: Provider Resolution and API Modes
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [model-configuration, credential-pools, fallback-providers, auxiliary-tasks, nous-portal, aws-bedrock, ollama, auth-json, env-file, prompt-caching]
---

# Provider Resolution and API Modes

> One shared runtime resolver (`hermes_cli/runtime_provider.py` and `hermes_cli/auth.py`) serves CLI, TUI, Gateway, Cron, ACP and auxiliary calls. Conversation history is normalized to OpenAI message format (system, user, assistant, tool).

## Three API modes

| Mode | Providers | Notes |
|---|---|---|
| `chat_completions` | OpenRouter, Nous Portal, custom endpoints, Ollama/vLLM/LM Studio, DeepSeek, Z.AI, Kimi, MiniMax, Alibaba DashScope, Fireworks, Novita, Vercel AI Gateway, ... | standard OpenAI-compatible |
| `codex_responses` | `openai-codex`, xAI Grok (`xai`, `xai-oauth`), Meta Model API (`api.meta.ai`, Muse Spark), Ramp Router (`router`, `api.router.com`) | self-heals if cached `encrypted_content` reasoning items fail with HTTP 400 `invalid_encrypted_content` or 401 `token_expired` (strip cached items, replay once); detects reasoning stalls (3 consecutive continuations with no visible text or tool calls) and triggers fallback (`incomplete_response`) |
| `anthropic_messages` | `anthropic`, Tencent TokenPlan, CommandCode Anthropic | `agent/anthropic_adapter.py`, automatic 1-hour prefix caching; prefers refreshable Claude Code credentials (`~/.claude/.credentials.json`) or `auth.json` OAuth over static tokens unless `ANTHROPIC_TOKEN` / `CLAUDE_CODE_OAUTH_TOKEN` is set ([[auth-json]]) |

## Key-scoping rules (leak prevention)

- `OPENROUTER_API_KEY` (must start `sk-or-`) is sent **only** to openrouter.ai endpoints.
- `AI_GATEWAY_API_KEY` is sent **only** to ai-gateway.vercel.sh.
- `OPENAI_BASE_URL` in `.env` is honoured **only** for the `openai-api` provider. For custom endpoints set `model.provider: custom` and `model.base_url` in `config.yaml` ([[model-configuration]]).
- `LLM_MODEL` in `.env` is **retired and ignored**.

## Floors and timeouts

- Minimum model context window: **64,000 tokens** ([[ollama]] for the common failure).
- Local endpoints: streaming read timeout auto-raised from 120 s to **1800 s** (`HERMES_STREAM_READ_TIMEOUT` to adjust).

## Specific providers

[[nous-portal]], [[aws-bedrock]], [[ollama]]. Resilience layers: [[credential-pools]], [[fallback-providers]], [[auxiliary-tasks]], tied together in [[provider-resilience-strategy]].

## Open Questions

- Which mode does Bedrock use, and how do Gemini/Vertex map (the source lists provider slugs without modes)?
- Is the reasoning-stall detector configurable (the "3 continuations" threshold)?
