---
title: Model Configuration
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [provider-resolution, fallback-providers, credential-pools, auxiliary-tasks, ollama, aws-bedrock, config-yaml, context-compression, agent-and-display-settings, setting-config-values]
---

# Model Configuration

> The `model`, `providers`, `provider_routing` blocks of `config.yaml`.

## `model.*`

| Key | Default / notes |
|---|---|
| `model` (or `model.default` / `model.model`) | `""` on fresh installs; `hermes model` converts it to a map. Example ID: `anthropic/claude-opus-4.7` |
| `model.provider` | `auto` / string, see slug list below |
| `model.base_url` | `""`; custom endpoint URL |
| `model.api_mode` | `chat_completions`, `codex_responses` or `anthropic_messages` |
| `model.context_length` | auto-detected (min **64,000**); required for Ollama custom `num_ctx` |
| `model.aliases.<alias>` | map of shorthand for `/model <alias>` (e.g. `fav: anthropic/claude-opus-4.6`) |

**Provider slugs:** `nous`, `openrouter`, `anthropic`, `openai-codex`, `openai-api`, `gemini`, `vertex`, `bedrock`, `azure-foundry`, `xai`, `xai-oauth`, `deepseek`, `zai`, `kimi-coding`, `kimi-coding-cn`, `minimax`, `minimax-cn`, `minimax-oauth`, `alibaba`, `alibaba-coding-plan`, `alibaba-token-plan`, `fireworks`, `novita`, `ai-gateway`, `router`, `arcee`, `gmi`, `nebius-token-factory`, `actual`, `kilocode`, `xiaomi`, `tencent-tokenhub`, `tencent-tokenplan`, `opencode-zen`, `opencode-go`, `commandcode`, `huggingface`, `nvidia`, `stepfun`, `ollama-cloud`, `qwen-oauth`, `lmstudio`, `custom`, `custom:<name>`.

## `providers.<name>` (named custom OpenAI-compatible)

`api: https://...`, `key_env: MY_KEY`, `request_timeout_seconds`, `stale_timeout_seconds`, `models.<id>.timeout_seconds`. Select with `model.provider: custom:<name>`. API keys written for these go to `HERMES_PROVIDER_<NAME>_<HASH>_API_KEY` ([[secrets-vs-config-split]]).

## `provider_routing` (OpenRouter only)

`sort` (`price`, `throughput`, `latency`), `only` (whitelist), `ignore` (blacklist), `order` (priority), `require_parameters` (bool), `data_collection` (`allow`, `deny`), `models.<model_id>` (per-model overrides). **Ignored on Nous Portal and direct providers.**

Per-model keys whose ID contains dots (e.g. `provider_routing.models."anthropic/claude-fable-5.1"`, `agent.reasoning_overrides`): edit `config.yaml` directly or backslash-escape (`claude-fable-5\.1`), because `hermes config set` splits unescaped dots into nested dicts ([[setting-config-values]]).

## Cache

`context_length_cache.yaml` persists provider-confirmed and probed limits across restarts ([[hermes-home]]).

## Next

Runtime behaviour: [[provider-resolution]]. Resilience: [[fallback-providers]], [[credential-pools]], [[auxiliary-tasks]].

## Open Questions

- Model ID examples in the source (`claude-opus-4.7`, `claude-fable-5.1`) are not validated; use `hermes model` to list real IDs.
- How does `model.api_mode` default when `provider: custom` points to an Anthropic-style endpoint?
