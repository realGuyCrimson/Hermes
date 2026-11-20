---
title: Hermes Online Docs (llms.txt)
type: entity
created: 2026-11-15
updated: 2026-11-15
sources: [hermes-admin-deep-research]
related: [hermes-agent, hermes-cli, hermes-admin-deep-research, triaging-hermes-health]
---

# Hermes Online Docs (llms.txt)

> Where an admin agent verifies new upstream flags or edge cases on demand. Hermes generates two machine-readable documentation files on every deploy.

| File | URL | Size | Use |
|---|---|---|---|
| `llms.txt` | https://hermes-agent.nousresearch.com/docs/llms.txt | ~17 KB | curated page index; fetch this first |
| `llms-full.txt` | https://hermes-agent.nousresearch.com/docs/llms-full.txt | ~1.8 MB | full concatenated Markdown docs |

## How to use

- Read `llms.txt` to find the right page, then search `llms-full.txt` by keyword instead of loading it whole (it is large).
- Use it to settle anything this wiki marks as an open question or contradiction (for example the delegation defaults in [[delegation]]).
- Always prefer `hermes <cmd> --help` for the installed version's flags ([[hermes-cli]]); the online docs may be newer than the install.

## Open Questions

- Are the docs versioned per release, or only latest? A newer doc may not match an older install.
- Should a snapshot of `llms.txt` be stored in this wiki as a raw source for lint comparisons ([[hermes-admin-deep-research]])?
