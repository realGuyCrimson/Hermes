---
title: Hermes Agent Admin Deep Research (source summary)
type: source
created: 2026-11-15
updated: 2026-11-15
ingested: 2026-11-15
origin: user-supplied deep-research briefing, pasted into a Claude Code session in /home/ubuntu/hermes-maintenance
sources: []
related: [hermes-agent, operational-invariants, hermes-online-docs, triaging-hermes-health]
---

# Hermes Agent Admin Deep Research (source summary)

> A long briefing titled *"Hermes Agent Architecture, Configuration, and Diagnostic Playbook for an Administrative Claude Code Agent"*. It tells a Claude Code agent how to operate as an admin copilot for a [[hermes-agent]] install where `../.hermes` is `~/.hermes` ([[hermes-home]]).

## What this source is

- Written for an agent that edits and diagnoses `~/.hermes` **from outside Hermes**, by relative path or via `~/.local/bin/hermes` ([[hermes-cli]]).
- Structure: a preamble with seven operational invariants ([[operational-invariants]]) and two doc URLs ([[hermes-online-docs]]), then ten numbered sections.
- It was **not verified** against a live install or the upstream docs during ingestion. Treat every claim as "the briefing says". The briefing gives no Hermes version or date; the only version marker is SessionDB schema **v31** ([[state-db]]).
- The pasted text carried inline citation artifacts of the form `[span_N](start_span)`. They were dropped. No wording was changed to account for them.
- The raw text is **not duplicated** in this repo. The wiki pages are the distilled form; specific numbers, flags, paths and commands are kept verbatim wherever the source gave them.

## Emphasis chosen for the ingest

The user's framing was "facts that should be easy to reference for setup / configuration / doctor / fixing my Hermes Agent". The wiki therefore favours: hard rules, exact commands and flags, defaults, exit codes, file paths, and symptom-to-fix routing ([[index]]).

## Section-to-page map

| Source section | Main wiki pages |
|---|---|
| Preamble (7 invariants, doc URLs) | [[operational-invariants]], [[hermes-online-docs]], [[hermes-agent]] |
| 1. Anatomy, layout, provenance | [[hermes-home]], [[installation-provenance]], [[profile-isolation]], [[state-db]], [[hermes-desktop]] |
| 2. Package manager, Python 3.14, updates | [[hermes-pm]], [[hermes-update]], [[repairing-package-environment]], [[updating-hermes]] |
| 3. Config architecture, secrets | [[config-precedence]], [[managed-scope]], [[remote-config-mode]], [[secrets-vs-config-split]], [[setting-config-values]], [[env-file]], [[external-secret-managers]], [[bitwarden-secrets-manager]], [[onepassword-cli]] |
| 4. config.yaml schema | [[config-yaml]] (map) plus the topic page for each section |
| 5. Models, providers, routing | [[provider-resolution]], [[model-configuration]], [[credential-pools]], [[fallback-providers]], [[auxiliary-tasks]], [[prompt-caching]], [[nous-portal]], [[aws-bedrock]], [[ollama]], [[auth-json]], [[provider-resilience-strategy]] |
| 6. Prompt, memory, skills | [[system-prompt-assembly]], [[context-files]], [[soul-md]], [[persistent-memory]], [[skills-system]], [[skill-curator]], [[importing-from-other-agents]] |
| 7. Tools, sandboxes, MCP, browser | [[toolsets-and-tool-registry]], [[command-approvals]], [[terminal-backends]], [[fixing-terminal-environment]], [[iron-proxy]], [[setting-up-egress-proxy]], [[mcp-integration]], [[testing-mcp-servers]], [[browser-automation]], [[browser-vault]], [[cua-driver]], [[secret-isolation-strategy]] |
| 8. Gateway, multiplexing, supervisors | [[hermes-gateway]], [[profile-multiplexing]], [[hermes-interfaces]], [[managing-gateway-service]], [[diagnosing-gateway-problems]], [[multi-profile-deployment-strategy]] |
| 9. Diagnostic playbooks 1-4 | [[resolving-wal-lock-refusals]], [[repairing-state-db]], [[clearing-interrupted-turns]], [[fixing-platform-pitfalls]], [[sqlite-wal-image]], [[session-admission-and-turn-recovery]], [[enforcing-zero-process-barrier]] |
| 10. CLI command matrix | [[hermes-cli]], [[hermes-doctor]], [[triaging-hermes-health]] |

## Known gaps and conflicts inside the source

- **Delegation numbers conflict.** `delegation.max_iterations` is 50 in one place and 250 in another; `max_concurrent_children` is 3 in one place and 10 in another. See [[delegation]].
- **Interpreter tension.** Invariant 4 forbids substituting the Python interpreter, yet the repair recipe uses a bare `python -c "import pm; ..."`. See [[hermes-pm]].
- **Truncated table row.** The `quick_commands.<name>` entry in the display row of the schema table is cut off mid-expression (`{type: exec |`). See [[agent-and-display-settings]].
- **Ambiguous compression threshold.** "threshold: 0.50 (floored at 0.75 for context windows <512K)". See [[context-compression]].
- **Flattened CLI matrix.** The section 10 table loses its column boundaries because commands contain `|` characters. [[hermes-cli]] gives a best-effort read/mutate split.
- **Missing procedure.** After `hermes sessions recover --output ~/recovered-state.db` the briefing does not say how to promote the recovered file. See [[repairing-state-db]].
- **Model IDs and version strings** in examples (for example `anthropic/claude-opus-4.7`, `gpt-5.5`, `gpt-6 Astra`) are quoted as the source wrote them and are not validated.

## Open Questions

- Which Hermes release does this briefing describe? Compare `hermes --version` (or `hermes dump`) against the docs at [[hermes-online-docs]] before trusting flag-level details.
- Does `llms-full.txt` contradict any claim here? A targeted grep-based verification pass (not a full read) would be the cheapest audit.
- Should the raw briefing be stored under a `raw/` folder for future re-ingest and lint? Not done in this pass.
