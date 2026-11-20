# Hermes workspace: UI / UX redesign

Status: design + working interactive prototype (`prototype/`, sample data, no backend). **v2** (this revision): decluttered, one goal per screen, palette from the supplied pixel-mosaic tile.
Scope: replaces the terminal-like web dashboard chat with a chat-first workspace and re-homes every existing page.
Not in scope: the agent runtime, gateway protocol, TUI and Desktop internals. They are reused as is.

## 1. Why it feels like a terminal today

Verified in the source (`~/.hermes/hermes-agent/web/AGENTS.md`):

- The dashboard's Chat tab mounts **xterm.js + WebGL** (`web/src/pages/ChatPage.tsx`) and streams raw PTY bytes from `hermes --tui` over `/api/pty`. The "chat" is a terminal emulator.
- Around it sit ~18 config pages (Sessions, Skills, Cron, Models, Config, Env, Logs, Analytics, MCP, Plugins, Channels, Webhooks, Pairing, Profiles, Files, System, Docs, …) arranged as an admin console, one flat list, with no notion of *work in progress*.
- Nothing is addressed to the person: no inbox for approvals, no presence, no "what is my agent doing right now".

The upstream rule "do not re-implement the primary chat experience in React" exists to avoid drift from Ink. It does not hold any more: the **Desktop app already renders a native transcript** (`apps/desktop`, `@assistant-ui/react`) over the same JSON-RPC gateway through `@hermes/shared`. A native web transcript is therefore a reuse job, not a rewrite of the agent (section 11).

## 2. What we took from the five references

| Product | Idea we adopted | Where it lands |
|---|---|---|
| **Grok Bot** | The agent is a *persistent teammate*, not a session. A roster, **presence shown by the avatar** (idle / thinking / working / waiting / blocked / done), progress you can glance at, work that starts without a prompt (Routines), five primitives only (Bot, Chat, Prompt/Skill, Tool, Artifact). | Agent roster + presence avatars in the rail; Routines as a first-class space; terminology kept to Agents, Threads, Skills, Tools, Files. |
| **Codex app** | Projects → threads, parallel work, a review queue, a diff review pane next to the conversation, Local / Worktree / Cloud execution modes, a status bar under the composer (mode, branch, +/−). | Rail tree; Changes tab in the inspector; Local/Worktree chip in the header; composer status bar. |
| **T3 Code** | One calm shared sidebar, thread state at a glance, inline approvals, per-turn and branch diffs, checkpoints with message-level revert, same server on desktop / web / phone. | Thread state glyphs; approval cards inside the transcript; Checkpoint markers with Restore; Changes scope switch (This turn / Thread / vs main). |
| **MonoCode** | "Tabs are sessions. The composer is the input." An **Inbox** for things that need you; phone companion. | Inbox space with triage list + detail; composer as the single input surface; responsive layout that works at 390px. |
| **Orca** | Many agents in parallel, each in its own worktree; **chat or terminal on the same session** without losing context; usage meters; hosts. | Header switch **Chat / Terminal** on the same session; Shell tab in the inspector; Insights usage; per-thread worktree chip. |

Things deliberately *not* copied: a code-editor centre pane (Hermes is a general agent, not an IDE), per-provider tabs (Hermes owns the model layer), or a hosted-only account model.

## 3. Principles (v2)

1. **One goal per screen.** Every space opens as a *stage*: a flat colour field, a giant background title, one big illustration, one sentence, one primary action, at most four doorways. Nothing else is visible until asked for.
2. **Details live in expandable sidebars.** The left rail is a 72px icon strip that expands to agents and threads. A right-edge handle on every stage slides in a drawer (the *workbench*) holding the dense lists, forms and tables. Nothing is removed, it is one gesture away.
3. **Threads, not terminals.** The thread is a quiet transcript with a floating title, one "Details" button and one composer. Terminal is a tab inside Details and ⌘K.
4. **Show the agent, not the machinery.** Work collapses to one line ("Worked 2m 08s, 9 steps"); plan, workers and diffs are small chips that open Details.
5. **Things that need you come to you.** The Inbox stage shows one decision at a time with one primary button.
6. **Every capability keeps a home** (matrix in section 10), rare power moves live in ⌘K.
7. **Motion starts fast and ends slow.** One curve everywhere, `cubic-bezier(.16,1,.3,1)` (expo-out), 160ms for presses, 420ms for state changes, 720ms for entrances. Buttons respond on hover (lift), press (scale .965) and focus; touch targets are 44px on coarse pointers.
8. **Same on a phone.** Rail becomes a drawer, drawers become full-screen sheets, the illustration moves above the copy.

## 4. Information architecture

```
Rail (always)
  Hermes mark · theme
  Agents: All · Hermes · Scout · Ledger          ← profiles, with presence avatars + one-line status
  [New thread  ⌘N]   [Search or jump to…  ⌘K]
  Spaces: Inbox · Routines · Library · Channels · Insights
  Threads grouped by project (collapsible), state glyph + title + age
  Gateway health · History · Settings

Thread (default view)
  Header: agent avatar, editable title, project · branch · Local/Worktree · state   [Chat | Terminal] [Inspector]
  Transcript → Composer (+ queue, slash/@ menus, model / reasoning / permission chips, context meter, status bar)
  Inspector: Changes · Plan · Files · Shell · Browser · Context
```

Mapping of the old flat page list onto five spaces plus Settings:

| New space | Contains |
|---|---|
| **Threads** (rail) | Chat, Sessions (recent), project workspaces |
| **Inbox** | approvals, clarify, sudo/secret prompts, browser hand-off, finished, failed, review-ready |
| **Routines** | Cron jobs, Webhooks, Kanban board, emergency pause |
| **Library** | Skills (+ hub, bundles, curator), Memory (+ SOUL.md, journey), Tools (toolsets, MCP, plugins, hooks), Files |
| **Channels** | messaging platforms, DM pairing, API / webhook endpoints, peer agents |
| **Insights** | usage and cost, activity, logs |
| **History** | all sessions: search, filter, export, prune, import, repair entry |
| **Settings** | General, Models, Agent, Tools & terminal, Keys & secrets, Security, Profiles, System, Advanced (raw config.yaml) |

## 5. The thread (declutter pass)

Default view is deliberately bare: a floating title with a tiny state word, one **Details** button, the transcript in a 680px column over a giant ghost of the agent's name, and one composer. Work, plan, workers and diffs collapse to one quiet line and chips. The composer shows a `+` menu (attach, mention, commands, voice), the field, send, and one line underneath: model, permission mode, context used. Everything below describes what is *available*, not what is on screen at once.

**Transcript blocks** (all in the prototype):

| Block | Behaviour |
|---|---|
| User message | right-aligned soft bubble, attachments as chips |
| Work group | collapsed summary "Worked for 2m 08s · read 9 files · …"; expands to a step timeline (kind icon, label, detail, duration); a step with output expands to it; live steps show the one live dot |
| Reasoning | folded into the work group ("Thinking…" step), never dumped inline |
| Plan card | checklist with done / active / todo |
| Workers card | delegated sub-agents with model, status, duration |
| Approval card | amber header, the exact command in a code block, working directory, why, risk pill, **Allow once · Allow for this thread · Always allow… · Deny**; resolves into a quiet receipt |
| Clarify card | question with option buttons |
| Diff card | files changed, +/−, per-file expand, **Review changes** opens the inspector |
| Checkpoint | divider with **Restore** (files and conversation) |
| Notices | context compressed (186k → 41k), interrupted by you |
| Turn footer | duration · tokens · cost; hover actions: Copy, Retry, Branch from here, Undo turn |

**Composer.** One surface: attach, @ mention (files, skills, threads), / commands, model, reasoning, permission chips, context meter (opens Context), voice, send/stop. While the agent runs: Enter *queues* the message (shown above the box), ⌘↵ *steers* it into the running turn, the send button becomes Stop. Status bar underneath: mode, branch, +/−, key hints.

**States** (avatar ring + rail glyph + header pill): idle, thinking, working (live blue), waiting (amber, needs you), blocked/failed (red), done (green check).

**Terminal escape hatch.** Header switch **Chat | Terminal** shows the same session as the real TUI (xterm in production). ⌘K → "Open raw terminal". Anything not yet native stays reachable there.

## 6. Details (right drawer on demand; full-screen sheet on phones)

- **Changes**: scope switch (This turn / Thread / vs main), per-file diff, Revert all, commit message + Commit + Open PR.
- **Plan**: plan, delegated workers (model, time, cost), delegation limits.
- **Files**: project tree with modified markers, filter.
- **Shell**: a real shell in the thread's working directory + "Open full Terminal view".
- **Browser**: the agent's browser (CDP), current URL, **Take over**, attach screenshot, recent pages.
- **Context**: tokens by part (system + SOUL, memory, skills, tools, conversation), loaded skills, memory used, prompt-cache state, Compress now, and the cache warning for mid-thread model changes.

## 7. Spaces (all built in the prototype)

Each space = **stage** (the decluttered front door) + **workbench** (the full capability, in the drawer).

| Space | Stage goal | Primary action | Workbench (drawer) |
|---|---|---|---|
| Inbox | decide the next thing | Allow once / Provide / Take over / Retry (by kind) | triage list + detail, bulk, pause-all |
| Routines | see what runs next (live countdown) | New routine | schedules with run history, webhooks, kanban board |
| Library | teach Hermes something | Add a skill | skills (+hub, bundles, curator), memory and SOUL.md, tools (toolsets, MCP, plugins, hooks), files |
| Channels | reach people | Connect a platform | platform drawer and guided connect, pairing, endpoints, peers |
| Insights | know what it costs (the figure is the headline) | See the breakdown | usage and budget, activity, live logs |
| Settings | find a setting (search is the action) | search box and six quick links | nine sections plus raw config.yaml |
| History | find an old thread | Search history | table with bulk export, prune, import, state.db health |

## 8. Visual system (v2)

**Palette, sampled from the supplied tile.** Night navy `#060338` (ground and ink), gold `#f2c14e` / bright `#f8d674` (the action colour), amber `#c8821e` and brown `#8d4b13`, cream `#f6efd8`, teal `#2e8d8f`, green `#4ec28b`, aqua `#79e0d8` (live), and the frame sweep magenta `#c43cb4`, violet `#6a2aa8`, indigo `#3b2fbf`, blue `#3f6fd0`, pink `#f2b4ef`. Dark theme: navy ground, cream ink, gold primary button, aqua for "the agent is acting". Light theme: cream paper, navy ink, navy primary button.

**Colour chapters.** Each space is one flat field at full strength with its own ink: Inbox gold, Routines mint-teal, Library violet, Channels magenta, Insights blue, Settings night navy, History dusk. No gradients anywhere: colour changes in hard pixel steps, as in the tile.

**Illustration system: the mosaic.** A 33×33 pixel tile generated per space from the tile's own recipe (white-hot centre with cross and diagonal rays, gold, amber and brown rings, a multi-hue noise zone, and a framed edge that sweeps magenta to indigo to aqua), with a pixel glyph at the centre (envelope, clock, book, antenna, bars, gear, hourglass). It blooms from the centre outward on entry and twinkles; while an agent works its frame colours rotate. Agents are 9×9 tiles of the same recipe with a state ring (idle, thinking, working, waiting, blocked, done).

**Type.** One family, Plus Jakarta Sans (the sheet's General Sans is not on Google Fonts), weights 400 to 800. Three sizes do the work: the giant background title (about 17 to 20vw, weight 800, tracking −0.055em, a tone step of the field so it reads as texture), a lead sentence (clamp 28 to 52px, 700), and 15px body. Geist Mono only for code, commands, diffs and logs.

**Shape.** Square-cornered controls (3px) and cards (6px), pill shapes only for status chips. One primary button per screen.

**Motion.** Entrance: staggered rise (22px, 720ms, expo-out) with the mosaic scaling from .94; views cross-fade out in 160ms; rail and drawer use 720ms expo-out; the giant title eases up from 6%. Everything respects `prefers-reduced-motion`.

## 9. Responsive

≥1180px: rail + thread + inspector. 900–1180px: inspector overlays from the right. <900px: rail is a drawer with a 48px top bar, inspector is a sheet, split views show list then detail, tables scroll inside their own container, Chat/Terminal switch stays in ⌘K.

## 10. Capability preservation matrix

| Existing capability (dashboard page / TUI / CLI) | New home |
|---|---|
| Chat TUI, slash commands, queue/steer/interrupt | Thread composer (slash menu with the full `commands.catalog`), Terminal view |
| Tool call display, reasoning, approvals, clarify, sudo/secret prompts | Work group steps, Approval/Clarify cards, Inbox kinds |
| Model / provider switch, reasoning effort | Composer chips; Settings → Models |
| Session resume, branch, retry, undo, checkpoints, worktrees | Turn actions, Checkpoint dividers, header mode chip, History (Resume, Fork) |
| Attachments, images, voice | Composer |
| Context usage, compression, prompt-cache | Inspector → Context; `/compress` |
| Sessions page (search, export, delete, prune, import, recover) | History |
| Skills page, `hermes skills`, bundles, curator | Library → Skills |
| Memory, SOUL.md, memory providers, journey | Library → Memory |
| MCP, Plugins, hooks, toolsets | Library → Tools |
| Files page | Library → Files; inspector Files |
| Cron, `hermes cron`, kanban, webhooks, `hermes pause` | Routines |
| Channels, Pairing, `hermes send`, peers, API server, listeners | Channels |
| Analytics, Logs, `hermes journey` | Insights |
| Models, Config, Env, Profiles, System, `hermes doctor/pm/update/backup`, secrets managers, egress, approvals allowlist, dashboard auth | Settings (nine sections) + Advanced raw YAML |
| Docs page | ⌘K → Docs / `/help`; link in Settings → System |
| Managed scope / remote config / pins | Locked rows with "Set by your administrator" |

The inventory of pages, endpoints and JSON-RPC methods that backs this matrix is in `inventory.md` (generated from the source).

## 11. Implementation path (not started)

1. **Transcript + composer** in `web/` as a new `ThreadPage` reusing `@hermes/shared` JSON-RPC client and the Desktop's event reducers (`apps/desktop/src/app/...`, `@assistant-ui/react`). Keep `ChatPage` (xterm) as the **Terminal view** behind the Chat | Terminal switch, same session.
2. **Rail + routing + ⌘K** replacing the page list; keep old URLs as redirects (`/sessions` → History, `/cron` → Routines, …).
3. **Inbox** from the existing approval/clarify/secret events plus cron failures; badge from gateway state.
4. **Spaces one by one**, wiring each prototype view to its existing REST router (`hermes_cli/web_routers/*`), no new backend except an aggregated inbox query.
5. **Flip default** via `display.interface: web` once parity is verified; the old dashboard stays available for one release.

Risks: the install in `~/.hermes/hermes-agent` is managed by `hermes update`, so the work belongs in a fork or an upstream PR, not an in-place edit; Desktop and web must share reducers to avoid two transcripts drifting; approvals must stay a single source of truth with the TUI.

### Findings from the source inventory (`inventory.md`) that shape the build

- The Desktop client already has the transcript, composer, tool cards and approval handling to reuse (`apps/desktop/src/components/assistant-ui/thread/*`, `apps/desktop/src/app/chat/composer/*`) on `@hermes/shared` (`json-rpc-gateway.ts`, `gateway-events.ts`).
- Browser auth: WebSocket upgrades use one-use tickets (`POST /api/auth/ws-ticket`) or the dashboard session token; never put secrets in the page.
- Gaps in today's dashboard that the new spaces close: cron run history exists in the API (`GET /api/cron/jobs/{id}/runs`) but has no dashboard UI (Routines drawer shows it); hub skills cannot be uninstalled from the dashboard; the webhook form cannot set `skills` or `deliver_chat_id`; `/chat` opens a second JSON-RPC socket and a throwaway session only to read the model.
- To verify before building: Desktop `/undo` and `/retry` call `session.rewind`, which has no declared contract; the real mechanism looks like `session.mutate {operation:"rewind"}`.

### Deviations from the taste-skill house rules (deliberate)

- Palette: violet, indigo and a cream light theme are used because the palette comes from the supplied tile. Light ground was lowered to a bone `#f3f1ea` to stay clear of the yellow-cream tell.
- Typeface: the dealt General Sans is on Fontshare, which the artifact host blocks; Plus Jakarta Sans (Google Fonts) stands in.
- Giant background titles and full-bleed colour fields are the user's direction and the "colour chapters" idea; the app-screen meter's `app-title-size` and `colour-sprawl` were therefore allowed. Everything else passes (0 FAIL on thread, Inbox and Routines at 1440, 768 and 390).
- Monospace only for commands, diffs, logs and the terminal; shadows only on floating things (drawers, menus, dialogs).

## 12. Open questions

- Should "Agents" in the rail be profiles only, or also named sub-agents (Scout, Ledger) created from skills?
- Do we expose worktree-per-thread by default for non-code projects?
- Is a shared inbox across profiles acceptable, or per-profile only?
- Avatar style: faces (prototype) or `hermes pets`?
