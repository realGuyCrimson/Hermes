# Handoff: Hermes UI redesign ("Studio")

Goal (active /goal): a totally new, non-terminal UI/UX for Hermes (inspired by Grok Bot, Codex, T3, MonoCode, Orca) that keeps every Hermes capability, and is **live in the real dashboard**, not just a prototype. Palette comes from the user's pixel-mosaic tile; one goal per screen; giant ghost titles + big pixel illustrations; expandable sidebar; ease-out motion (fast start, slow end); responsive buttons; delegate to DeepSeek.

## State
- Design + prototype: done and published as a sample-only Artifact (https://claude.ai/code/artifact/0311c46b-d8e3-4e77-9880-e7c002563b56).
- Live wiring: 8 DeepSeek workers each own disjoint files (see LIVE-BRIEF.md). Shell/stages, chat (JSON-RPC + xterm Terminal tab), routines, library, channels, insights, settings, history+inbox.
- `build.mjs` -> `dist/` (what `HERMES_WEB_DIST` serves). `deploy.sh` installs the systemd drop-in `~/.config/systemd/user/hermes-dashboard.service.d/studio.conf` and restarts; `rollback.sh` removes it (stock UI back). DEPLOYED on 2026-11-19 (drop-in `studio.conf` present; production dashboard serves `dist/`). Rollback: `./rollback.sh`.
- Production dashboard (:9119) is GATED (302 to /login, cookie auth, WS via `POST /api/auth/ws-ticket`, body-less, unnamed ticket opens /api/ws and /api/pty). Login credentials were deliberately never read. Gated mode was verified on a throwaway isolated home (config in the scratchpad `gated-home/`, port 9131, own random password): password login works and the injected flags are `__HERMES_AUTH_REQUIRED__=true`, `H.live=true`.

## Private test rigs (stop when done)
- :9130 desktop-loopback backend sharing the real ~/.hermes (token in scratchpad `test-token.txt`); GET only.
- :9131 gated backend on an isolated throwaway HERMES_HOME (scratchpad `gated-home/`), user `tester`, password in scratchpad `gated-pass.txt`.
- Docker Chromium (host network) on 127.0.0.1:9333 for live screenshots (`scratchpad/live.sh`).
- Stop with `kill` on the PIDs from `pgrep -af "hermes dashboard"` (careful: never pkill -f with a pattern contained in the same command line; never touch :9119).

## Rules learned
- `shot.sh` copies the prototype unless NOCOPY=1: after editing, run it WITHOUT NOCOPY.
- Workers must keep files syntactically valid; each owns only its files; GET-only against :9130; no secrets in logs.
- Brief for each worker: LIVE-BRIEF.md. Worker dispatch: `scratchpad/dispatch.sh <name>` (writes `L-<name>.txt`).
- Rail: one collapse control only (top logo button + `[` key). The bottom "Collapse" button was removed on the user's request; do not re-add.

## Done at last write
All 8 workers integrated; every route verified live (zero console errors); gated login + REST cookie + gateway WS ticket + PTY ticket verified on an isolated throwaway home; test rigs (:9130/:9131/:9333) stopped; two worker test sessions deleted.

## Remaining (historical)
1. Collect the 8 worker reports, `node --check` everything, `node build.mjs`.
2. Verify every route on :9130 (live.sh) and the login + chat path on :9131; fix integration bugs; no sample data in live mode; zero console errors.
3. Run `./deploy.sh`, confirm `systemctl --user is-active hermes-dashboard` and the 302 gate, tell the user how to roll back.
4. Stop test rigs, remove throwaway test sessions created by the chat worker (only those), update SPEC.md.
