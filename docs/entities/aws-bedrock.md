---
title: AWS Bedrock
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [provider-resolution, hermes-pm, model-configuration, agent-and-display-settings, env-file]
---

# AWS Bedrock

> Provider slug `bedrock`. Needs `boto3` via the PM `bedrock` extra.

## Setup

```bash
cd ~/.hermes/hermes-agent && python -c "import pm; pm.sync_venv(['bedrock'], explicit=True)"
```

Preferred equivalent: `hermes pm install --extra bedrock` ([[hermes-pm]]; see the interpreter tension noted there).

## Credential resolution order

1. `AWS_BEARER_TOKEN_BEDROCK`
2. `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`
3. `AWS_PROFILE`
4. EC2 IMDS / ECS / Lambda role

## Pitfall: bare model IDs

A bare ID such as `anthropic.claude-sonnet-4-6` fails with *"Invocation of model ID ... with on-demand throughput isn't supported"*. Always prefix a cross-region or global inference profile: `us.anthropic.claude-sonnet-4-6` or `global.anthropic...`.

## Related

- Provider-confirmed context limits are cached as `bedrock_confirmed_v1` in `context_length_cache.yaml` ([[model-configuration]]).
- `agent.service_tier: ultrafast` applies to `openai.gpt-6.1-sol` on Bedrock Mantle in us-east-1 ([[agent-and-display-settings]]).

## Open Questions

- Which regions and inference-profile prefixes are valid for Hermes' model metadata probing?
- Does the Bedrock path use `chat_completions` or a dedicated mode? The three API modes in [[provider-resolution]] do not list Bedrock explicitly.
