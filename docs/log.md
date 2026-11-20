---
title: Ingest Log
type: log
created: 2026-11-15
updated: 2026-11-15
sources: []
related: [index, hermes-admin-deep-research]
---

# Ingest Log

Append-only. Newest entries at the bottom. Format: `## [date] operation | source`.

## [2026-11-15] ingest | hermes-admin-deep-research

- **Source:** user-supplied deep-research briefing for an administrative Claude Code agent managing `~/.hermes` ([[hermes-admin-deep-research]]).
- **Emphasis confirmed by the request:** reference for setup, configuration, doctor and fixing a Hermes Agent install. All facts ingested; specific numbers, flags, paths, commands and exit codes preserved.
- **Pages created:** 1 source summary, 24 entities, 36 concepts, 18 skills, 3 strategies, plus [[index]] and this log (84 files).
- **Contradictions flagged inline:** delegation defaults ([[delegation]]); interpreter invariant vs `python -c` recipe ([[hermes-pm]], [[operational-invariants]]).
- **Ambiguities noted:** truncated `quick_commands` row ([[agent-and-display-settings]]); compression threshold wording ([[context-compression]]); flattened CLI matrix ([[hermes-cli]]); missing promotion step after `sessions recover --output` ([[repairing-state-db]]).
- **Not stored:** the raw source text (see Open Questions in [[index]]).
- **Host notes added (not from the source):** arm64/Chromium, `libatomic1`, linger, Docker-only browsers; marked `Agent note (host-specific, not from the source)`.

## Open Questions

- Run a lint pass after each future ingest: dead links, orphans, pages without Open Questions, stale `updated` dates.
