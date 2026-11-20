# Hermes UI: make it LIVE (shared brief for workers; read fully)

The prototype in `ui-redesign/prototype/` is a finished design running on sample data. It now has to run on the REAL Hermes. Same files, two modes:
- `H.live === false` (artifact preview, file://): sample data, exactly as today. Do not break it.
- `H.live === true` (served by `hermes dashboard`): real data from the Hermes REST API / JSON-RPC. NEVER show sample content as if it were real in live mode: show real data, or an honest empty state ("No routines yet", "Couldn't load skills: <message>" with a Retry button).

Read first: `DESIGN-V2.md` (design rules; keep the look), `inventory.md` (every REST endpoint, protocol method and auth detail, with source paths), `prototype/js/api.js` (`H.live`, `H.api.get/post/put/patch/del`, `H.api.wsUrl`, `H.api.try`, `H.api.cached`), `prototype/js/data.js`, `prototype/js/stage.js`, and the module(s) you own. Backend source for exact request/response shapes: `/home/ubuntu/.hermes/hermes-agent` (read-only): routers in `hermes_cli/web_routers/*.py`, `hermes_cli/web_server*.py`; frontend reference calls in `web/src/lib/api*.ts` and `web/src/pages/*.tsx` (they show the exact shapes the old dashboard used; REUSE those shapes and endpoint paths). Desktop reference: `apps/desktop/src`.

## Safety rules (hard)
1. You may test against a PRIVATE test backend: `http://127.0.0.1:9130` (a second dashboard process sharing the real Hermes home, token auth). Token: `cat /tmp/claude-1001/-home-ubuntu-hermes-maintenance/45febc7d-a90d-4bd5-8ddb-c15d937ef52b/scratchpad/test-token.txt`; send it as header `X-Hermes-Session-Token`. This is real user data. **Only send GET requests to it.** Never POST/PUT/PATCH/DELETE to the live backend while testing: write mutation code from the source's request shapes and test it with a mocked `fetch` in node only (a small throwaway script in /tmp is fine).
2. Never print, log, store or copy secret values: env/API key values, tokens, passwords, OAuth data, credential pool entries. When you inspect responses, print keys/shape only. Never read `~/.hermes/.env`, `auth.json`, `vault/`, `dashboard-login.txt`, `google_*`. The UI must never display secrets either (show set/missing, last 4 chars only if the API already provides a masked value).
3. Do not copy real user content (message text, names, chat ids, phone numbers) into source files, comments or fixtures. Real data stays in the running page only.
4. Do not edit files you do not own (listed in your brief). Do not edit anything under `/home/ubuntu/.hermes`. Do not start/stop services. Do not run `hermes` subcommands that change state.
5. Keep every file syntactically valid at all times: edit incrementally (small Edit steps, `node --check <file>` after each), never leave a half-rewritten file. A broken file breaks the whole page for everyone.
6. Time budget: you have about 35 minutes. Get a working live version of the most important read paths first, then extend (mutations, secondary tabs). Report what is live, what is still sample-only/disabled, and what you could not verify.

## How to wire (pattern)
- At the top of your module: `const LIVE = H.live;` and keep the sample arrays untouched for `!LIVE`.
- In live mode load on render: `const data = await H.api.get('/api/...')` (inside async functions; show a skeleton or "Loading…" first), map the response into the shapes the module already renders (adapter functions named `fromApi...`), and render. Cache with `H.api.cached(path, ttlMs)` when several tabs use one endpoint.
- Every button/switch that mutates must call the real endpoint with the shape used by the old dashboard (see `web/src/lib/api*.ts`), show a toast on success/failure (`H.toast`), update the UI optimistically only if you roll back on error. If an action has no endpoint, disable it with a title explaining why ("Not available from the web yet") instead of faking success.
- Errors: `try/catch` around every request; on failure show the real error message inline with a Retry; never swallow.
- Profile scope is handled by `H.api` (adds `?profile=`).
- Relative times, byte sizes, currency: reuse helpers in the module or `H.fmt`.

## Verification you can do
- `node --check` on your files; curl GETs against :9130 to confirm shapes; mocked-fetch node tests for mutations.
- Optional browser check: `node /home/ubuntu/hermes-maintenance/ui-redesign/build.mjs` rebuilds `dist/` (served live by :9130, no restart) then use `BU_NAME=<yourname> BU_CDP_URL=http://127.0.0.1:9333 browser-harness` to open `http://127.0.0.1:9130/#/<route>` (set `cdp("Page.bringToFront")` and `cdp("Emulation.setFocusEmulationEnabled", enabled=True)` first or animations stall). Other people are editing other files at the same time: if the page is broken by someone else's file, wait a minute and retry; do not "fix" files you do not own.

## Addendum (round 2)
- NEVER run plain `node build.mjs` (it overwrites `dist/`, which the PRODUCTION dashboard serves live). Build for testing with `node build.mjs dist-stage` only; the private test backend on :9130 serves `dist-stage/` and the test browser is `BU_CDP_URL=http://127.0.0.1:9333`.
- :9130 is still GET-only for you (real data). Test every POST/PUT/DELETE and every state-changing JSON-RPC call with a mocked fetch / mocked `H.rpc` in node.
