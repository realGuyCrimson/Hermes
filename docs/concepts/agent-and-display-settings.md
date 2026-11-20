---
title: Agent and Display Settings
type: concept
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [toolsets-and-tool-registry, model-configuration, auxiliary-tasks, hermes-interfaces, system-prompt-assembly, delegation, config-yaml]
---

# Agent and Display Settings

> Behavioural knobs under `agent.*` and presentation knobs under `display.*` and `quick_commands`.

## `agent.*`

| Key | Default / values |
|---|---|
| `agent.max_turns` | `500` tool-calling iterations per turn before a work summary |
| `agent.reasoning_effort` | `""` (medium); `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max`, `ultra` |
| `agent.reasoning_overrides.<model>` | per-model; escape dots with `\` |
| `agent.text_verbosity` | `low`, `medium`, `high` (OpenAI Responses routes) |
| `agent.service_tier` | `ultrafast` (for `openai.gpt-6.1-sol` on Bedrock Mantle us-east-1; [[aws-bedrock]]) |
| `agent.image_input_mode` | `auto` (pixels if the model supports vision and `auxiliary.vision` is auto, else describer), `native` (force pixels), `text` (always `vision_analyze` describer) |
| `agent.personalities` | `{}` custom `/personality <name>` presets |
| `agent.system_prompt` | `""` manual baseline addition (active when personality is `none`) |
| `agent.disabled_toolsets` | `[]` |
| `toolsets` | `["hermes-cli"]` active platform toolsets |
| `custom_toolsets.<name>` | custom bundles ([[toolsets-and-tool-registry]]) |

## `display.*` and `quick_commands`

`interface` (`cli` or `tui`), `cli_layout` (`modern` or `classic`), `skin` (`default`), `personality` (`helpful` / `none`), `details_mode` (`collapsed`), `sections` (`thinking`, `tools`, `subagents`, `activity`), `mouse_tracking` (`all`, `wheel`, `buttons`, `off`), `inline_images` (`auto`), `tool_preview_length` (`0`), `tool_progress_command` (`true`), `background_process_notifications` (`concise`). `quick_commands.<name>` defines custom slash-commands.

> **Truncated source row:** the schema table cuts off at `quick_commands.<name>: {type: exec |`. Only `type: exec` is known; the other types and fields are missing. Resolve by: `hermes config show` on an install with quick commands, or search `llms-full.txt` ([[hermes-online-docs]]).

See [[hermes-interfaces]] for the CLI/TUI/Desktop surfaces.

## Open Questions

- What is the full `quick_commands` schema?
- What values does `display.skin` accept besides `default`?
- Interaction between `agent.max_turns` (500) and `delegation.max_iterations` ([[delegation]]).
