# Worker contract: building a Hermes view in the prototype

Prototype lives in `ui-redesign/prototype/` (static, no build step, vanilla JS, classic scripts, global `window.H`).
Read first: `prototype/css/base.css` (tokens + shared components), `prototype/js/ui.js` (helpers), `prototype/js/data.js` (shared sample data), `prototype/index.html`.
The shell/chat (`js/shell.js`, `js/chat.js`, `css/shell.css`, `css/chat.css`) belong to another author: do not edit them or any file outside your own.

## Product idea (so your screen feels right)
Hermes is a *persistent agent* (like a teammate), not a terminal. The old web UI was an xterm.js terminal; the new one is a calm, light, chat-first workspace:
left rail (agents with presence avatars, inbox, projects → threads), centre = thread, right = inspector, and secondary spaces (Inbox, Routines, Library, Channels, Insights, Settings, History) each a full view. Terminal is an optional tab, never the default.
Design direction "achromatic ledger": chrome is ink + greys, colour goes on data only. One live hue (`--live`, blue) means "agent acting right now"; amber (`--warn-*`) means "needs you"; red = failed; green = healthy/success. Flat surfaces: NO gradients, NO glows, NO shadows on things at rest, NO icons in tinted squares, NO emoji, NO uppercase tracked labels, NO KPI tiles with sparkline, NO zebra tables, NO rainbow charts. Sentence case. Numbers tabular (`.num`). Radius 10 (cards) / 7 (controls). Primary button is near-black (`.btn.primary`); only ONE primary action per screen.
Titles: page `h1` 24px/600 (use `.page-head`), section `h2` 16px/600. Body 14px. Small 12–13px muted. Real, specific, believable sample data (this is a real machine: Ubuntu arm64, gateway on :9119, profile `default`; never "Acme", "Lorem", "John Doe"). Zeros print as 0, missing as an en dash "–". Label everything in trade words ("Next run", "Delivered to", "Needs your approval"), not generic nouns.

## Contract
- Register: `H.views.<name> = { render(root, ctx){ ... } }`. `root` is an empty `div` with height:100%; you build into it and handle scrolling yourself (use `.page > .page-in` from base.css, or `.split` for list + detail).
- `ctx` = `{ route: string[] /* path segments after the view name, e.g. ['models'] for #/settings/models */, go(hash) /* e.g. ctx.go('#/thread/t-ui') */, toast(msg), openThread(id) }`.
  Sub-tabs of your view should be deep-linkable: when a tab is picked call `ctx.go('#/<name>/<tab>')` is NOT needed to re-render; just update `location.hash` via `history.replaceState(null,'','#/<name>/<tab>')` and re-render your own content. Honour `ctx.route[0]` as the initial tab.
- Files you own (nothing else): `js/views/<name>.js` and `css/<name>.css`. Prefix every CSS class with `<name>-` (e.g. `.routines-card`). Reuse base.css components first (`.btn .pill .card .row .list .tabs .seg .switch .input .select .textarea .field .tbl .kpi .split .page .page-head .sec .empty .kbd .dot .av`) and tokens only (`var(--surface)` …); never hardcode colours except via tokens. Both light and dark themes must look right (tokens handle it).
- Helpers: `H.h('div.cls#id', {attrs, onclick}, ...children)`, `H.ic('name')` / `H.icon('name')` (see `H.iconNames`), `H.avatar(agent,size,state)`, `H.pill(text,tone)`, `H.sw(on,cb,label)`, `H.tabs(items,active,cb)`, `H.seg(...)`, `H.modal(contentNode,{width})` → `{close,box}`, `H.toast(msg)`, `H.fmt.k/n/usd`. Shared data: `H.data.agents/threads/projects/inbox/models/gateway`, `H.agent(id)`, `H.thread(id)`.
- Everything on the screen must be interactive in the prototype: tabs switch, toggles toggle, buttons give feedback (toast or state change), dialogs open and close (Esc + scrim), forms validate lightly, lists filter by search. No dead buttons. No network calls. No `alert/confirm/prompt` (build confirmations inline).
- Layout: works from 1440 down to 390px wide. Below 900px stack columns; no horizontal page scroll (wide tables inside `.scroll-x`). Min touch target 34px. Keyboard reachable, visible focus (already global), `aria-label` on icon-only buttons, real `<button>`s.
- Density: each screen is filled with its real content on the first 1440×900 view (header + first rows of every block); do not leave a screen mostly empty.
- Verify: do not start any server. Run `node --check js/views/<name>.js` and re-read your code for runtime errors (typos in helper names, null refs). The orchestrator screenshots every view in a real browser afterwards.

## Report
Report what you built per tab, the sample data facts you invented (so they can be labelled as sample), any helper you wished existed, and anything you could not finish.
