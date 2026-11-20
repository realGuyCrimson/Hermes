---
title: Web, Vision, Image and Voice Tools
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [nous-portal, auxiliary-tasks, agent-and-display-settings, browser-automation, delegation, security-settings]
---

# Web, Vision, Image and Voice Tools

> Config for the data-in and media-out tools.

## `web.*`

| Key | Default / values |
|---|---|
| `backend` | `firecrawl`; also `searxng`, `brave`, `ddgs`, `exa`, `parallel`, `tavily`, `perplexity`, `keenable`, `xai`, `nous` |
| `search_backend`, `extract_backend` | split overrides |
| `keyless_fallback`, `keyless_rescue` | `true` |
| `provider_tier.<name>` | `free` or `paid` |
| `extract_char_limit` | `15000` |
| `extract_timeout` | `120` |
| `cache_enabled` | `true` |
| `cache_ttl_minutes` | `20` |
| `cache_exempt_hosts` | list |

Via [[nous-portal]]: `web.backend: nous`. Website blocking: [[security-settings]].

## `vision.*` and `image_gen.*`

- `vision.embed_target_bytes` 262144 (256 KB; range 64 KiB to 4 MiB), `vision.max_calls_per_image` (unset for main agent, 3 for subagents; [[delegation]]), `vision.replay_recent_images` 3. See `agent.image_input_mode` in [[agent-and-display-settings]] and `auxiliary.vision` in [[auxiliary-tasks]].
- `image_gen.provider`: `nous`, `fal`, `openai`, `openrouter`, `meta-ai`, `xai`, `krea`; `model`; `max_parallel_requests` 4; `openrouter.*`, `openai.*` sub-blocks.

## `voice.*`

`record_key` (`ctrl+b`), `max_recording_seconds` 120, `auto_tts` false, `auto_tts_mode` (`all` or `voice_only`), `silence_threshold` 200, `silence_duration` 3.0, `stop_phrases` `["stop"]`, `voice_chat_mode` (`chained` or `gpt-live`), `barge_in` true.

## `stt.*`, `tts.*`, `wake_word.*`

- `stt`: `enabled` true, `provider` (`local` default; `groq`, `openai`, `mistral`, `xai`, `elevenlabs`, `deepinfra`, `nous`), `language` `"en"`, `streaming` false, `local.model` `"base"`.
- `tts`: `provider` (`edge` default; `elevenlabs`, `openai`, `minimax`, `mistral`, `gemini`, `xai`, `deepinfra`, `neutts`, `kittentts`, `piper`, `nous`), `speed` 1.0. Piper voices are cached in `~/.hermes/cache/piper-voices/`.
- `wake_word`: `enabled` false, `surface` auto, `provider` (`auto`, `openwakeword`, `sherpa`, `porcupine`), `phrase` `"hey hermes"`, `sensitivity` 0.6, `confirmation_frames` 3. Needs the `wake` extra ([[hermes-pm]]).

## Open Questions

- Which backends need API keys and which are keyless (`keyless_fallback`)?
- What are the `image_gen.openrouter.*` / `openai.*` sub-keys?
