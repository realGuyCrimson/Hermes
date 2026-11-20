# Hermes dashboard + chat protocol: capability inventory

Source tree: `/home/ubuntu/.hermes/hermes-agent` (read-only). This file is derived from the source, not from running the app.
Purpose: nothing in the current dashboard, TUI gateway, or Desktop transcript may be dropped when the web UI is redesigned.

Conventions used below:

- Paths are repo-relative. `web/src/` is the dashboard frontend (`~/.hermes/hermes-agent/web/src`), `routers/` is `hermes_cli/web_routers/`.
- "REST" rows name the backend route (`METHOD path`); the frontend call site is the page/lib file in the same row.
- "Profile-scoped" means `fetchJSON` appends `?profile=<name>` for the endpoint families listed in `web/src/lib/api-request-scope.ts` (`PROFILE_SCOPED_PREFIXES`), driven by the global profile switcher (`web/src/App.tsx`, `web/src/components/ProfileSwitcher.tsx`).
- Exact JSON-RPC wire shapes live in `tui_gateway/contracts/*.py`; TypeScript copies are generated into `apps/shared/src/gateway-contract.generated.ts`.

## Source map (read these first)

| Area | Files |
|---|---|
| Dashboard shell / routes | `web/src/App.tsx`, `web/src/i18n/en.ts` |
| REST client (all endpoints) | `web/src/lib/api.ts`, `api-aux.ts`, `api-files.ts`, `api-plugins.ts`, `api-profiles.ts`, `api-webhooks.ts`, `api-messaging.ts`, `session-mutations.ts` |
| REST routers | `hermes_cli/web_routers/*.py`, mounted in `hermes_cli/web_server.py` (~line 797–875) |
| PTY + dashboard WebSockets | `hermes_cli/web_routers/chat_ws.py`, `hermes_cli/web_server_chat.py`, `hermes_cli/pty_bridge.py` |
| Dashboard auth | `hermes_cli/dashboard_auth/` (`middleware.py`, `routes.py`, `ws_tickets.py`, `native_http.py`) |
| Chat JSON-RPC backend | `tui_gateway/server.py`, `methods_*.py`, `contracts/` |
| Chat JSON-RPC client (shared) | `apps/shared/src/json-rpc-gateway.ts`, `json-rpc-channel.ts`, `gateway-events.ts`, `websocket-url.ts` |
| Native transcript/composer | `apps/desktop/src/components/assistant-ui/thread/*`, `apps/desktop/src/app/chat/composer/*` |

---

## 1. Dashboard pages

Routes are declared in `web/src/App.tsx` (`BUILTIN_ROUTES_CORE`); the nav order is `BUILTIN_NAV_REST`. Plugin manifests add tabs at `/dashboard-plugins/...` and plugin-owned paths (`GET /api/dashboard/plugins`, `web/src/plugins/`).

### 1.0 Shell capabilities around every page

| Capability | Where | REST |
|---|---|---|
| Profile switcher (machine-level management scope) | `web/src/components/ProfileSwitcher.tsx` | `GET /api/profiles`, `GET /api/profiles/active`, `POST /api/profiles/active` |
| Gateway status strip + active session count | `web/src/components/SidebarStatusStrip.tsx`, `SidebarFooter.tsx` | `GET /api/status` |
| Theme / font | `web/src/components/ThemeSwitcher.tsx` | `GET /api/dashboard/themes`, `PUT /api/dashboard/theme`, `GET/PUT /api/dashboard/font` |
| Model picker + reasoning effort | `web/src/components/ModelPickerDialog.tsx`, `ReasoningPicker.tsx` | `GET /api/model/options`, `GET /api/model/info`, `POST /api/model/set`, `GET/PUT /api/config` |
| Toolset config drawer | `web/src/components/ToolsetConfigDrawer.tsx` | `GET /api/tools/toolsets`, `PUT /api/tools/toolsets/{name}`, `GET .../config`, `PUT .../provider`, `PUT .../env`, `POST .../post-setup`, `GET /api/actions/{name}/status` |
| Language | `web/src/components/LanguageSwitcher.tsx` | none (client i18n catalogs in `web/src/i18n/`) |
| Shared-metrics consent banner | `web/src/components/SharedMetricsConsentBanner.tsx` | `GET/PUT /api/shared-metrics/consent` |
| Memory/disk pressure banners, multiplex warning | `web/src/components/MemoryPressureBanner.tsx`, `MultiplexStandaloneBanner.tsx`, `ProfileScopeBanner.tsx` | `GET /api/status` |
| Auth widget / login state | `web/src/components/AuthWidget.tsx` | `GET /api/auth/me`, `POST /auth/logout` |
| Console modal | `web/src/components/HermesConsoleModal.tsx` | WebSocket `/api/console` |
| Dashboard plugin slots | `web/src/plugins/` (`PluginSlot`) | plugin REST under `/api/plugins/<plugin>/...` |

### 1.1 `/chat` — Chat (`web/src/pages/ChatPage.tsx`)

The page mounts xterm.js (WebGL, fit, unicode11) over a PTY running the real `hermes --tui`. The terminal owns transcript, composer, slash commands, approvals and prompts; React only frames it and adds side panels.

| What the user can do | UI | REST / WS |
|---|---|---|
| Chat in the embedded TUI (all slash commands, approvals, clarifications, secrets, tool output, streaming) | xterm terminal | `WS /api/pty` with `token=` (loopback) or `ticket=` (gated), plus `channel`, `attach`, optional `resume`, `cwd`, `profile`, `fresh` (`routers/chat_ws.py:475`) |
| Resume a session in chat | `?resume=<id>` route param; page resolves latest compression descendant | `GET /api/sessions/{id}`, `GET /api/sessions/{id}/latest-descendant` |
| Switch recent conversations / start a new one | `web/src/components/ChatSessionList.tsx` (read-only list + select/new) | `GET /api/sessions` |
| Choose workspace for a new chat | `web/src/components/ChatWorkspacePicker.tsx`, `web/src/lib/chat-workspaces.ts` | `GET /api/chat/workspaces` |
| Live title, connection badge, credential warning, model badge | `web/src/components/ChatSidebar.tsx` (JSON-RPC sidecar + event feed) | `WS /api/ws` (`session.create`, `session.info`), `WS /api/events?channel=` |
| Change model / reasoning for the next chat | `ModelPickerDialog`, `ReasoningPicker` (sidebar) | `GET /api/model/options`, `GET /api/model/info`, `POST /api/model/set`, `GET/PUT /api/config` |
| Collapse the side panel; keep the PTY alive across tab switches | `web/src/lib/chat-panel-collapsed.ts`; persistent host in `App.tsx` | — |
| Terminal resize | in-band `\x1b[RESIZE:<cols>;<rows>]` | `WS /api/pty` (`web_server_chat.py`) |
| Image paste/drop into the chat | `web/src/lib/chatImagePaste.ts`, `chat-image-drop.ts` | `POST /api/chat/image-upload` (the TUI itself owns other attachments) |

### 1.2 `/sessions` — Sessions (`web/src/pages/SessionsPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| Overview: stats, source breakdown, newest sessions, live poll every 5 s | Overview tab | `GET /api/status`, `GET /api/sessions?limit=50`, `GET /api/sessions/stats` |
| Browse history with pagination | History tab + `SessionsPagination` | `GET /api/sessions?limit=&offset=&order=created` |
| Full-text search across message content | search input (debounced) | `GET /api/sessions/search?q=` |
| Filter by source category (Chats / Automation / All) and individual sources (cli, tui, telegram, discord, slack, whatsapp, signal, matrix, email, sms, cron, tool, oneshot, api_server, acp, hermes_flow, vulcan_delegate, webhook) | source menu; `SessionsPage_sources.tsx` | `GET /api/sessions/stats` (`by_source`) + query filters |
| Rename inline | row edit | `PATCH /api/sessions/{id}` `{title, expected_generation}` |
| Delete one / bulk delete / delete all empty | row action + selection bar | `DELETE /api/sessions/{id}`, `POST /api/sessions/bulk-delete` `{ids}`, `GET /api/sessions/empty/count`, `DELETE /api/sessions/empty` |
| Prune archived sessions older than N days | Prune dialog | `POST /api/sessions/prune` `{older_than_days, source?}` |
| Import exported sessions (JSON/JSONL) | file input | `POST /api/sessions/import` |
| Export a session | row action, opens download URL | `GET /api/sessions/{id}/export` |
| Open a session in Chat | “Resume in Chat” → `/chat?resume=<id>` | — |
| Read a session's messages (inline detail) | detail drawer | `GET /api/sessions/{id}/messages` |

### 1.3 `/files` — Files (`web/src/pages/FilesPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| Browse a directory tree by path | path bar / breadcrumbs | `GET /api/files?path=` |
| Open / download a file (base64 data URL) | row click / download | `GET /api/files/read?path=` |
| Upload one or many files (drag-drop or picker) | Upload button, drop zone | `POST /api/files/upload-stream` |
| Create a folder | Create dialog | `POST /api/files/mkdir` |
| Delete file/folder (recursive) | confirm dialog | `DELETE /api/files` body `{path, recursive}` |

No rename/move, no text editor, no chmod. See §6.

### 1.4 `/analytics` — Analytics (`web/src/pages/AnalyticsPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| Pick period 7 / 30 / 90 days | segmented control | `GET /api/analytics/usage?days=` |
| See totals (tokens, sessions, API calls) | stat cards | same |
| Daily token chart and daily breakdown table (sortable) | chart + table | same |
| Per-model breakdown (tokens, sessions, API calls, cost) | table | `GET /api/analytics/models?days=` |
| Top skills by agent loads / edits / last used | table | `GET /api/analytics/usage` (`skills`) |

### 1.5 `/models` — Models (`web/src/pages/ModelsPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| See/assign the main model and per-task auxiliary models (titling, summarization, vision, voice chat, …) | `Model Settings` card, per-row picker | `GET /api/model/info`, `GET /api/model/auxiliary`, `GET /api/model/options`, `POST /api/model/set` `{scope: main\|auxiliary, provider, model, task?, reasoning_effort?}` |
| Edit Mixture-of-Agents presets (reference models, aggregator, temperatures, timeout, degraded-reference policy) | MoA card + nested model picker | `GET /api/model/moa`, `PUT /api/model/moa` |
| Connect/disconnect OAuth providers (PKCE, device code, external CLI) | `web/src/components/OAuthProvidersCard.tsx`, `OAuthLoginModal.tsx` | `GET /api/providers/oauth`, `POST .../{id}/start`, `POST .../{id}/submit`, `GET .../{id}/poll/{session}`, `DELETE .../{id}`, `DELETE /api/providers/oauth/sessions/{id}` |
| Model usage analytics (tokens, cost, sessions, tool calls) gated by `dashboard.show_token_analytics` | analytics block | `GET /api/analytics/models?days=`, `GET /api/config` |
| Provider capability/pricing info | `ModelInfoCard` | `GET /api/model/info` |

### 1.6 `/config` — Config (`web/src/pages/ConfigPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| Edit every config field through a generated form, grouped by category (general, agent, terminal, display, delegation, memory, compression, security, browser, voice, tts, stt, logging, discord, auxiliary) | sections + `AutoField` | `GET /api/config`, `GET /api/config/schema`, `GET /api/config/defaults`, `PUT /api/config` |
| Search fields by key/label/description | search box | — |
| Reset a category to defaults (form only) | per-section reset | `GET /api/config/defaults` |
| Export config as JSON / import JSON | header actions | `GET /api/config`, `PUT /api/config` |
| Edit raw YAML with a code editor | Raw YAML tab | `GET /api/config/raw`, `PUT /api/config/raw` |

### 1.7 `/env` — Keys (`web/src/pages/EnvPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| See all `.env` variables grouped by provider, with set/unset and masked preview | provider cards | `GET /api/env` |
| Set / replace / clear a value | inline field, confirm on clear | `PUT /api/env` `{key,value}`, `DELETE /api/env` body `{key}` |
| Reveal a real value | eye button | `POST /api/env/reveal` `{key}` |
| Add an arbitrary custom key | Custom Keys section | `PUT /api/env` |
| Show/hide advanced (non-primary) provider keys | toggle | — |
| Connect providers by OAuth instead of key | `OAuthProvidersCard` | same OAuth routes as §1.5 |

### 1.8 `/logs` — Logs (`web/src/pages/LogsPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| Pick a log file, level, component prefix, line count | filter row | `GET /api/logs?file=&lines=&level=&component=` |
| Auto-refresh | switch | same |
| Read classified/colored lines | `web/src/lib/log-classify.ts` | same |

### 1.9 `/cron` — Cron (`web/src/pages/CronPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| List jobs with last/next run, overdue and stale-scheduler warnings | `Scheduled Jobs` | `GET /api/cron/jobs?profile=all`, `GET /api/cron/delivery-targets` |
| Create a job: name, prompt or script, schedule (interval/daily/weekly/monthly/once/cron), deliver-to, skills, toolsets, provider/model, base URL, working dir, job ids, script-only mode, enabled | builder `ScheduleBuilder` | `POST /api/cron/jobs` |
| Edit a job | inline edit | `PUT /api/cron/jobs/{id}` |
| Pause / resume / trigger now / delete | row actions | `POST .../{id}/pause`, `.../resume`, `.../trigger`, `DELETE .../{id}` |
| Create from an automation blueprint | `web/src/components/AutomationBlueprints.tsx` | `GET /api/cron/blueprints`, `POST /api/cron/blueprints/instantiate` |
| Load skills/toolsets/model options for the form | pickers | `GET /api/skills`, `GET /api/tools/toolsets`, `GET /api/model/options` |

### 1.10 `/skills` — Skills (`web/src/pages/SkillsPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| List installed skills with category, description, enabled state | grid/list + filters | `GET /api/skills` |
| Enable/disable a skill | toggle | `PUT /api/skills/toggle` `{name,enabled}` |
| Read/edit skill content, create a new skill | `SkillEditorDialog` | `GET /api/skills/content?name=`, `POST /api/skills`, `PUT /api/skills/content` |
| List/enable toolsets and per-toolset config | Toolsets section + `ToolsetConfigDrawer` | `GET /api/tools/toolsets`, `PUT /api/tools/toolsets/{name}`, `GET .../config`, `PUT .../provider`, `PUT .../env`, `POST .../post-setup` |
| Search the skills hub, preview, scan, install, update all | hub panel | `GET /api/skills/hub/search`, `.../sources`, `.../preview`, `.../scan`, `POST .../install`, `POST .../update` |
| Watch a long hub install | action log | `GET /api/actions/{name}/status` |
| Scope everything to another profile | profile selector | `?profile=` on the above |

### 1.11 `/plugins` — Plugins (`web/src/pages/PluginsPage.tsx`, `PluginsPage_updateAll.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| List installed plugins (version, source, runtime status, dashboard tab, auth required, env requirements) | plugin list | `GET /api/dashboard/plugins`, `GET /api/dashboard/plugins/hub` |
| Rescan the SPA plugin registry / dashboard extensions | header action | `GET /api/dashboard/plugins/rescan` |
| Install an agent plugin from owner/repo or Git URL; force reinstall; enable after install | install card | `POST /api/dashboard/agent-plugins/install` |
| Enable / disable / update / remove a plugin | row actions | `POST .../agent-plugins/{name}/enable`, `.../disable`, `.../update`, `DELETE .../{name}` |
| Update all, auto-update toggle | header + switch | `POST /api/dashboard/agent-plugins/update-all`, `GET/PUT /api/dashboard/plugins/auto-update` |
| Browse the curated plugin catalog and install pinned entries | catalog | `GET /api/dashboard/plugins/catalog`, `POST .../agent-plugins/install` |
| Show/hide a dashboard-only extension in the sidebar | visibility toggle | `POST /api/dashboard/plugins/{name}/visibility` |
| Set runtime memory provider and context engine (writes `memory.provider`, `context.engine`) | provider card | `PUT /api/dashboard/plugin-providers`; memory setup `GET/PUT /api/memory/providers/{name}/config`, `POST .../setup`, `PUT /api/memory/provider` |
| Open a plugin's dashboard tab | link | `/dashboard-plugins/...` |

### 1.12 `/mcp` — MCP (`web/src/pages/McpPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| List MCP servers (transport, URL/command, auth, enabled, tools) | server list | `GET /api/mcp/servers` |
| Add an HTTP or stdio server, with auth none/bearer/oauth and env | add dialog | `POST /api/mcp/servers` |
| Test connection and list exposed tools | test action | `POST /api/mcp/servers/{name}/test` |
| Enable / disable | toggle | `PUT /api/mcp/servers/{name}/enabled` |
| Delete | confirm | `DELETE /api/mcp/servers/{name}` |
| Start OAuth and poll the flow | auth action | `POST /api/mcp/servers/{name}/auth`, `GET /api/mcp/oauth/flows/{flow_id}` |
| Browse and install from the MCP catalog, filling required env | catalog | `GET /api/mcp/catalog`, `POST /api/mcp/catalog/install` |

### 1.13 `/channels` — Channels (`web/src/pages/ChannelsPage.tsx`, `ChannelsRelayLink.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| See messaging platforms (Telegram, Discord, Slack, WhatsApp, Signal, Matrix, email, SMS, API server…) with enabled/configured status and env vars | platform cards | `GET /api/messaging/platforms` |
| Enable/disable a platform, edit its env values, clear env | per-platform form | `PUT /api/messaging/platforms/{id}` `{enabled, env, clear_env}` |
| Send a test message | test button | `POST /api/messaging/platforms/{id}/test` |
| Guided Telegram bot onboarding (start, poll, apply token, cancel) | wizard | `POST /api/messaging/telegram/onboarding/start`, `GET .../{pairing_id}`, `POST .../apply`, `DELETE .../{pairing_id}` |
| Guided WhatsApp onboarding incl. allowed numbers | wizard | `POST /api/messaging/whatsapp/onboarding/start`, `GET .../{pairing_id}`, `POST .../apply`, `DELETE .../{pairing_id}` |
| Team Gateway relay: request link code, poll link state, unlink an account | relay panel | `GET /api/messaging/relay`, `POST /api/messaging/relay/{platform}/link`, `GET /api/messaging/relay/link/{code}`, `DELETE /api/messaging/relay/{platform}/accounts/{user_id}` |
| Restart the gateway after channel changes | action + log | `POST /api/gateway/restart`, `GET /api/actions/{name}/status` |

### 1.14 `/webhooks` — Webhooks (`web/src/pages/WebhooksPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| See whether the webhook receiver is enabled | status card | `GET /api/webhooks` |
| Enable the receiver | button | `POST /api/webhooks/enable` |
| Create a route: name, description, events, deliver-to, deliver-only (skip agent), HMAC signature, prompt | create dialog | `POST /api/webhooks` (returns `secret`) |
| Enable/disable a route, delete a route | row actions | `PUT /api/webhooks/{name}/enabled`, `DELETE /api/webhooks/{name}` |
| Restart gateway to apply | action | `POST /api/gateway/restart`, `GET /api/actions/{name}/status` |

### 1.15 `/pairing` — Pairing (`web/src/pages/PairingPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| See pending DM pairing requests and approved users | two lists | `GET /api/pairing` |
| Approve a request (per platform/user) | approve button | `POST /api/pairing/approve` `{platform, request_id}` |
| Revoke an approved user | confirm + revoke | `POST /api/pairing/revoke` `{platform, user_id}` |
| Clear all pending requests | header action | `POST /api/pairing/clear-pending` |

### 1.16 `/profiles` — Profiles (`web/src/pages/ProfilesPage.tsx`, `ProfileCreationReceipt.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| List profiles with model, skill count, `.env` badge, gateway run state, alias/distribution, description, warnings | profile cards | `GET /api/profiles`, `GET /api/profiles/active` |
| Create a profile (clone from another / blank, clone everything, seed skills or not, description, model) | modal | `POST /api/profiles` |
| Set the active profile (warns if its gateway runs) | action | `POST /api/profiles/active` `{name}` |
| Rename | inline | `PATCH /api/profiles/{name}` `{new_name}` |
| Delete (config, keys, memories, sessions, skills, cron) | confirm | `DELETE /api/profiles/{name}` |
| Edit description, auto-generate one | description editor | `PUT /api/profiles/{name}/description`, `POST .../describe-auto` |
| Edit SOUL.md | SOUL editor | `GET /api/profiles/{name}/soul`, `PUT .../soul` |
| Change the profile's model | model picker | `PUT /api/profiles/{name}/model` |
| Copy the CLI setup/launch command | copy button | `GET /api/profiles/{name}/setup-command` |
| Show exceptional creation warnings | `ProfileCreationReceipt` | — |

### 1.17 `/profiles/new` — Profile Builder (`web/src/pages/ProfileBuilderPage.tsx`)

Five-step create flow; nothing is written until the final step.

| Step | What the user can do | REST |
|---|---|---|
| Identity | name (validated `^[a-z0-9][a-z0-9_-]{0,63}$`), description | — |
| Model | pick provider/model, filter | `GET /api/model/options` |
| Skills | choose bundled skills to keep, search/select hub skills | `GET /api/skills`, `GET /api/skills/hub/search` |
| MCP | add MCP server definitions to the new profile | (submitted in the create body) |
| Review | create profile; reports pending hub installs | `POST /api/profiles` |

### 1.18 `/system` — System (`web/src/pages/SystemPage.tsx`)

| Section / capability | UI | REST |
|---|---|---|
| Host stats (OS, arch, hostname, Python, CPU, memory, disk, load) | Host card | `GET /api/system/stats` |
| Nous Portal login/plan summary and tool-gateway routing | Portal card | `GET /api/portal` |
| Skill curator status, pause/resume, run now | Curator card | `GET /api/curator`, `PUT /api/curator/paused`, `POST /api/curator/run` |
| Gateway start/stop/restart, health, version, update check and apply, multiplex migration plan/apply | Gateway card | `GET /api/status`, `POST /api/gateway/start`, `.../stop`, `.../restart`, `GET /api/gateway/migrate/plan`, `POST /api/gateway/migrate`, `GET /api/hermes/update/check`, `POST /api/hermes/update` |
| Credential pool: list entries per provider, add API key, remove entry | Credential pool card | `GET /api/credentials/pool`, `POST /api/credentials/pool`, `DELETE /api/credentials/pool/{provider}/{index}` |
| Operations: doctor, security audit, skills update, prompt-size report, support dump, config migrate, full backup, download backup, restore from upload, restore from backups path, share debug report | Operations card, live action log | `POST /api/ops/doctor`, `.../security-audit`, `POST /api/skills/hub/update`, `POST /api/ops/prompt-size`, `.../dump`, `.../config-migrate`, `POST /api/ops/backup`, `GET /api/ops/backup/download`, `POST /api/ops/import`, `.../import-upload`, `POST /api/ops/debug-share`, `GET /api/actions/{name}/status` |
| Checkpoints: per-session count/size, prune all | Checkpoints card | `GET /api/ops/checkpoints`, `POST /api/ops/checkpoints/prune` |
| Shell hooks: list, add (event/matcher/command/timeout), remove | Shell hooks card | `GET /api/ops/hooks`, `POST /api/ops/hooks`, `DELETE /api/ops/hooks` body `{event, command}` |
| Memory: active provider, built-in MEMORY.md/USER.md sizes, reset memory/user/all | Memory card | `GET /api/memory`, `PUT /api/memory/provider`, `POST /api/memory/reset` `{target}` |

### 1.19 `/docs` — Documentation (`web/src/pages/DocsPage.tsx`)

| What the user can do | UI | REST |
|---|---|---|
| Read the hosted docs in an iframe, open them in a new tab | full-height iframe (`https://hermes-agent.nousresearch.com/docs/`) | none |

### 1.20 Every other file in `web/src/pages` (support + tests, no route)

| File | Role |
|---|---|
| `ChannelsRelayLink.tsx` | Relay link-code widget embedded in Channels (§1.13) |
| `PluginsPage_updateAll.tsx` | “Update all” + auto-update switch embedded in Plugins (§1.11) |
| `ProfileCreationReceipt.tsx` | Out-of-band profile-creation warnings (§1.16) |
| `SessionsPage_sources.tsx` | Source taxonomy/labels/filters for Sessions (§1.2) |
| `ChannelsPage.relay.test.tsx`, `ChannelsPage.whatsapp.test.tsx` | vitest for relay/WhatsApp flows |
| `ChatPage.a11y.test.tsx`, `ChatPage.test.tsx` | vitest for PTY page, resize, reconnect, a11y |
| `PluginsPage.test.ts` | vitest for plugin helpers |
| `ProfilesPage.warnings.test.tsx` | vitest for profile warnings |
| `SessionsPage.test.tsx` | vitest for session filters/actions |
| `WebhooksPage.signature.test.tsx` | vitest for HMAC signature field |

---

## 2. Chat protocol (JSON-RPC + events)

### 2.0 Transport and envelope

| Item | Detail | Source |
|---|---|---|
| Transport | Newline-delimited JSON-RPC 2.0 over WebSocket `/api/ws` or stdio | `tui_gateway/ws.py`, `tui_gateway/entry.py` |
| Subprotocol | `hermes-gateway-v1` (canonical gateway); native tickets ride `hermes-gateway-ticket.<ticket>` | `hermes_cli/web_server_boundary.py:156` |
| Client request | `{jsonrpc:"2.0", id:<int\|string>, method, params}` | `apps/shared/src/json-rpc-channel.ts:363` |
| Server event | `{jsonrpc:"2.0", method:"event", params:{type, session_id, payload?, seq?, ...}}` | `tui_gateway/server.py::_event_frame` |
| Server→client request | `{jsonrpc:"2.0", id:"srq-<12hex>", method, params:{session_id, …}}`; client answers with `{id, result}` | `tui_gateway/server_requests.py` |
| Cancel/withdraw a request | event `request.cancel {id, method, reason}` | `server_requests.py` |
| Ready frame | `gateway.ready` right after accept (protocol version, capabilities, skin/theme, i18n) | `contracts/events.py:63` |
| Heartbeat | client `gateway.ping` (15 s) + server heartbeat deadline | `apps/shared/src/json-rpc-gateway.ts:649`, `ws.py` |
| Error codes | `4000` bad params, `4001` invalid params/contract, `4009` busy, `4015` missing arg, `5000` internal, plus domain codes (`5011`, `5020`, `5027`, `5028`…) | `tui_gateway/methods_*.py` |

### 2.1 Session lifecycle

| Method | Key params | Key result | Source |
|---|---|---|---|
| `session.create` | `source` (`cli\|tui\|gui\|acp\|tool\|oneshot`), `cwd`, `model`, `provider`, `toolsets`, `reasoning`, `max_turns`, `yolo`, `safe_mode`, `skills`, `checkpoints`, `title`, `hidden`, `profile`, `client` | `CanonicalSnapshot` (below) | `contracts/canonical_sessions.py:23` |
| `session.resume` | `session_id` (stored id or exact title), `latest` (`cli\|tui`), `workspace`, `defer_history`, `omit_messages`, `cols`, `display_projection` | `CanonicalSnapshot` | `canonical_sessions.py:70` |
| `session.list` | `scope` (`live\|stored`), `limit`, `title`, `include_hidden`, `workspace`, `picker`, `query`, `cursor` | `{sessions:[{session_id,id,title,source,started_at,message_count,running,model,preview,last_reply,cwd,git_branch,workspace,last_active_at,pinned}], next_cursor}` | `canonical_sessions.py:145` |
| `session.activate` | `session_id` | snapshot | `methods_session.py` |
| `session.most_recent` | — | id | `methods_session.py` |
| `session.history` | `session_id`, `include_*` | `{count, messages}` | `methods_session.py:1976` |
| `session.transcript` | stored cursor / `subagent_id` | stored rows | `contracts/canonical_stored_reads.py:61` |
| `session.interrupt` | `session_id`, `execution_generation` | `CanonicalSessionHandle` | `canonical_sessions.py:366` |
| `session.steer` / `session.redirect` | `text`, `execution_generation` | `{status: queued\|redirected\|rejected, text, delivered?}` | `canonical_sessions.py:307` |
| `session.branch` | `name`, `count`, `idempotency_key` | new session + copied messages | `methods_session.py:2151` |
| `session.branch_stored` | `parent_session_id`, `cols`, `source`, `cwd`, `idempotency_key` | `{session_id, stored_session_id, message_count, info}` | `contracts/sessions.py:154` |
| `session.branch_whole` | as `session.branch`, transcript omitted | new session | `methods_session.py:2156` |
| `session.undo` | `intent` (`undo\|retry`), `session_id` | `{removed, undo_hint}` | `methods_session.py:1998` |
| `session.compress` | `session_id`, `focus_topic` | `{compressed, lock_held?, message?, before/after tokens, messages}` | `methods_session.py:2083` |
| `session.delete` / `.archive` / `.set_hidden` | `session_id`, flags | ok | `methods_session.py` |
| `session.title` | `session_id`, `title` | title | `methods_session.py` |
| `session.close` | `session_id` | ok | `methods_session.py` |
| `session.status` | `session_id` | live status | `methods_session.py` |
| `session.save` | `session_id` | ok | `methods_session.py` |
| `session.cwd.set` / `session.workspace.move` | `cwd`, `session_id` | cwd/branch | `methods_session.py` |
| `session.mutate` | `session_id`, `request_id`, `expected_revision`, `operation`, `payload`, `expected_generation` | receipt + projection; ops: rename, archive, sidebar, branch, delete, rewind, reset, model, reasoning, workspace, edit_policy, compress, import | `contracts/canonical.py:111` |
| `session.export` / `session.automation` / `session.detach` | `session_id` | export/automation/detach | `contracts/canonical.py:350–388` |
| `session.prune` | filters or `never_active_days` | pruned count | `contracts/canonical.py:130` |
| `session.events.since` | `last_sequence`, `last_seen`, `replay_epoch` | `{events:[{type,payload,seq,…}], latest_seq, replay_epoch, truncated, snapshot_required, open_requests}` | `canonical_sessions.py:330` |
| `session.events.stats` | `session_id` | ring/counters | `methods_session.py` |
| `session.reclaimed` event | — | backend reclaimed the live session | `contracts/events.py:556` |
| `session.resume_progress` event | — | deferred hydration progress | `contracts/events.py:545` |

`CanonicalSnapshot` (`contracts/canonical_sessions.py:165`): `session_id`, `stored_session_id`, `messages`, `message_count`, `running`, `authority_epoch`, `replay_epoch`, `last_sequence`, `subscription_id`, `revision`, `execution_generation`, `pending[]` (queued admissions), `prompts[]` (open approval/clarify), `info` (`SessionLiveInfo`), `pending_connection`, `todo_state`, `open_requests`.

### 2.2 Turn submit, queue, steer

| Method | Key params | Key result | Source |
|---|---|---|---|
| `prompt.submit` | Legacy `PromptSubmitParams`: `text`, `queued`, `surface`, `display_kind`, `title_preview`, `interrupted`, `truncate_before_row_id` / `_message_id` / `_user_ordinal`, `confirm_truncate`, `confirm_empty_truncate`, `confirm_deep_truncate`, `rebind_survivor_row_ids`. Canonical `CanonicalSubmitParams` adds `input_id`, `submission_id`, `attachments:[{path,mime}]`, `turn_author`, `api_text`, `model_override:{model,provider,reasoning}`, `clarify_batch`, `voice_context`, `voice_turn` | Legacy `{status: streaming\|queued\|steered\|redirected, user_row_id, survivor_row_id_map}` or `{voice_stopped:true}`; canonical `AdmissionStatus` (`admission_id`, `status: queued\|started\|unknown\|terminal`, `outcome`, `authority_epoch`, `execution_generation`) or `{voice_stopped:true}` | `contracts/prompt_voice.py:26`, `canonical_sessions.py:255` |
| `prompt.receipt` | `session_id`, `admission_id`, `include_result` | `AdmissionStatus` (`admission_id, ref, sequence, status: queued\|started\|unknown\|terminal, outcome, authority_epoch, execution_generation`) + `result`, `usage` | `contracts/canonical.py:44` |
| `prompt.cancel` | `session_id`, `admission_id` | `AdmissionStatus` (queued retired, started interrupted) | `canonical.py:68` |
| `prompt.resolve_unknown` | `session_id`, `admission_id`, `execution_generation` | `AdmissionStatus` | `canonical.py:78` |
| `prompt.steer_queued` | `session_id`, `admission_id` | `AdmissionStatus`; moves a still-queued admission into the running turn | `canonical_sessions.py:377` |
| `prompt.replace_queued` | `session_id`, `admission_id`, `submission_id`, `text`, `attachments` | new admission at FIFO tail | `canonical_sessions.py:386` |
| `prompt.background` / `prompt.btw` | `text`, `session_id` | side agent id | `methods_prompt.py` |
| `request.answer` | `request_id`, `question_id`, `answer` | ok | `methods_prompt.py:1298` |
| `approval.respond` | `session_id`, `request_id` (legacy) / `prompt_id` (canonical), `choice` (`once\|session\|always\|deny`), `all`, `execution_generation` | `{choice}`/receipt (`resolved`/`acknowledged`) | `canonical_sessions.py:330`, `methods_prompt.py:1354` |
| `approval.pending` / `approval.received` | `session_id` / `request_id` | pending list / acknowledged | `methods_prompt.py` |
| `clarify.respond` | `session_id`, `execution_generation`, `prompt_id`, `answer` ('' = skipped) | `{status: resolved\|already_resolved, prompt_id}` | `contracts/canonical.py:430` |
| `clarify.lock` | `session_id`, `request_id`, `question_id`, `answer` | locked-answer state | `contracts/prompt_voice.py`, `methods_prompt.py` |
| `session.control` | `action` (`goal.pause\|resume\|clear\|unwait`, `loop.pause\|resume\|stop`, `subgoal.add\|remove\|clear`, `heartbeat.pause\|resume\|clear`), `text`, `index` | control snapshot | `contracts/config_free_tier_control.py:742` |
| `session.control.read` | `session_id` | `{goal, loop, heartbeat, revision, updated_at}` | `config_free_tier_control.py:730` |

### 2.3 Stream events (turn)

| Event | Payload (key fields) | Source |
|---|---|---|
| `message.start` | `display_kind`, `display_text`, `notification_category`, `text`, `turn_id` | `contracts/events.py:150` |
| `message.delta` | `text` (null = segment boundary), `rendered`, `turn_id`, `segment`, `offset` | `events.py:178` |
| `message.interim` | `text`, `already_streamed`, `turn_id`, `segment` | `events.py:194` |
| `reasoning.delta` | `text`, `verbose` | `events.py:179` |
| `reasoning.available` | completed reasoning block | `events.py:180` |
| `thinking.delta` | legacy thinking text | `events.py:181` |
| `message.complete` | `text`, `usage`, `status` (`complete\|error\|interrupted`), `reasoning`, `warning`, `billing`, `error`, `error_surface`, `partial`, `persisted_turn` (`row_ids`, `complete`, `submission_id`) | `events.py:305` |
| `status.update` | `kind` (`status\|lifecycle\|compacting\|goal\|loop\|heartbeat\|process\|…`), `text` | `events.py:315` |
| `agent.print` | `text` | `events.py:393` |
| `review.summary` | background review result | `events.py:382` |
| `session.usage` | `usage` (see 2.7) | `events.py:354` |
| `session.title` | new title | `events.py:364` |
| `background.complete` / `btw.complete` | side-agent completion | `events.py:608–609` |
| `preview.restart.complete` / `.progress` | hidden preview agent | `events.py:610–621` |
| `moa.reference` / `moa.aggregating` / `moa.progress` / `moa.phase` | MoA fan-out | `events.py:705–708` |
| `compaction` (via `status.update`) | before/after tokens | `methods_session.py` |
| `session.info` | `SessionLiveInfo` (model, provider, reasoning, tools, skills, cwd, branch, project, usage, mcp_servers, title, credential_warning, running) | `contracts/common.py:73`, `events.py:526` |

### 2.4 Tool events

| Event | Payload | Source |
|---|---|---|
| `tool.start` | `tool_id`, `name`, `context`, `args`, `args_text`, `preview`, `labels[]` | `events.py:413` |
| `tool.generating` | `name` | `events.py:442` |
| `tool.progress` | `tool_id`, `name`, `progress`, `total`, `percent`, `message` | `events.py:470` |
| `tool.complete` | `tool_id`, `name`, `args`, `duration_s`, `result`, `summary`, `result_text`, `inline_diff`, `todos`, `revision`, `labels`, `image_path` | `events.py:433` |
| `tool.output_risk` | `tool_id`, `name`, `risk`, `findings[]`, `redacted` | `events.py:455` |
| `todo.updated` | `todos[]`, `revision` | `events.py:480` |
| `terminal.close` | agent-owned background process closed | `events.py:763` |
| `agent.terminal.output` | output chunk of an agent-owned process | `events.py:762` |
| `browser.progress` | CDP connect/install progress | `events.py:773` |
| `preview.open` / `preview.close` | preview pane tab | `events.py:727–728` |
| `pane.reveal` | focus a named desktop pane | `events.py:737` |
| `tip.show` | in-product tip selector/text | `events.py:518` |
| `notification.show` / `notification.clear` | `text`, `level`, `kind`, `ttl_ms`, `key`, `detail` | `events.py:505–506` |
| `request.cancel` | `id`, `method`, `reason` | `server_requests.py` |
| `connection.request` / `connection.update` | out-of-band connector card (`tools/connectors/live.py`) | `contracts/connectors_operation.py:216` |

### 2.5 User questions: server→client requests

| Request | Params | Result | Source |
|---|---|---|---|
| `approval` | `request_id`, `command` (redacted), `description`, `choices[]`, `allow_permanent`, `allow_session`, `smart_denied`, `tool_name`, `session_id_hint` | `{choice: once\|session\|always\|deny, all?}` | `contracts/server_requests.py:173` |
| `clarify` | `questions:[{qid,question,choices,multi_select}]`, `answers?` (replay) | `{answers:{qid:value}, outcome: submitted\|timed_out\|cancelled}` | `server_requests.py:40` |
| `sudo` | `command` | `{value}` ('' = declined) | `server_requests.py:212` |
| `secret` | `env_var`, `prompt`, `metadata` | `{value}` | `server_requests.py:222` |
| `vault.unlock_prompt` | `backend`, `display_name` | `{value}` | `server_requests.py:231` |
| `vault.save_login` | `origin`, `site` | `{value}` JSON `{identifier,password}` | `server_requests.py:240` |
| `vault.code` | `site`, `hint` | `{value}` | `server_requests.py:249` |
| `setup_beat` | `beat` (`name\|theme\|layout\|connectors\|plugins\|tour\|build`), `card`, `tool_call_id` | answer/said | `server_requests.py:159` |
| `display.install.sudo` | display install prompt | `{value}` | `contracts/display.py:167` |
| `terminal.read` / `preview.read` / `window.read` | `start`, `count` (desktop bridges) | `{value}` JSON text | `server_requests.py:261–265` |
| `preview.act` | preview interaction | `{value}` | `server_requests.py:294` |
| `tour` | tour step | `{value}` | `server_requests.py:320` |
| `theme.apply` / `theme.pick` | theme id(s) | `{value}` / theme | `server_requests.py:364–366` |

Reconnect contract: `session.resume` / `session.activate` / `session.events.since` return `open_requests`, and the client re-renders the still-open cards (`tui_gateway/AGENTS.md`; `apps/shared/src/json-rpc-gateway.ts`).

### 2.6 Slash commands: catalog, completion, dispatch

| Method | Params | Result | Source |
|---|---|---|---|
| `commands.catalog` | `session_id?`, `profile?` | `pairs`, `sub`, `canon`, `commands{argument_mode,desktop,desktop_subcommands}`, `categories`, `skills`, `skill_count`, `plugin_commands`, `warning` | `contracts/tools_commands.py:205` |
| `command.resolve` | `name`, `profile?` | `{canonical, description, category}` | `tools_commands.py:252` |
| `complete.slash` | `session_id`, `text`, cursor | completion rows (`replace` offsets) | `methods_complete.py`, `contracts/tools_commands.py` |
| `complete.path` | `session_id`, `text` | path completions via the session's terminal backend | `methods_complete.py` |
| `slash.exec` | `session_id`, `command` | `{output, warning}` or a `command.dispatch` directive | `tools_commands.py:303` |
| `command.dispatch` | `name`, `arg`, `session_id`, `profile?` | `{type: exec\|alias\|plugin\|send\|skill\|prefill, output\|target\|message, display, notice, name, status}` | `tools_commands.py:278` |
| `cli.exec` / `shell.exec` | argv / command | command output | `methods_tools.py` |

Desktop/Ink also handle a local subset before calling the backend: `/help`, `/new`, `/clear`, `/resume`, `/copy`, `/paste`, `/quit`, `/density`, `/details`, `/logs`, `/mouse`, `/pets` (`ui-tui/src/app/useSubmission.ts`, `tools_commands.py`; `apps/desktop/src/lib/desktop-slash-commands.ts`).

### 2.7 Model, reasoning, config

| Method | Params | Result | Source |
|---|---|---|---|
| `model.options` | `session_id?`, `explicit_only`, `include_unconfigured`, `refresh`, `profile?` | `{providers:[{slug,name,models[],is_current,authenticated,pricing,capabilities,plan_usage,…}], model, provider}` | `contracts/config_free_tier_control.py:451–577` |
| `model.save_key` | provider key payload | provider row | `methods_complete.py` |
| `model.disconnect` | provider | ok | `methods_complete.py` |
| `config.get` | `session_id?`, `profile?` | display/approval/paste/voice config projection (no secrets) | `methods_config.py` |
| `config.set` | `key`, `value`, `session_id?`, `scope?` (`session\|global`), `confirm_expensive_model` | `{key, value, warning?, confirm_required?, scope?, deferred?, cwd?, branch?, history_reset?, info?}` | `config_free_tier_control.py:69` |
| `session.mutate` `operation:"model"` / `"reasoning"` | `{model,provider}` / `{effort}` | receipt | `contracts/canonical.py:96` |
| `gateway.capabilities` | — | protocol capabilities | `methods_voice.py` |
| `client.capabilities` | `{server_requests:true}` | ack; must be sent once per connection for the server to park requests | `methods_voice.py` |

Model switch semantics: desktop composer writes `config.set {key:"model", scope}` (session or global); the next turn reads it. Dashboard sidebar writes REST `/api/model/set` and offers a reload. `/model --once` rides `prompt.submit.model_override`.

### 2.8 Attachments and images

| Method | Params | Result | Source |
|---|---|---|---|
| `image.attach` | `path` | `{attached, path, token, text}` | `methods_prompt.py:1022` |
| `image.attach_bytes` | `content_base64`/`data`, `filename`, `ext` | same | `methods_prompt.py:1050` |
| `pdf.attach` | `path` or `content_base64`, `first_page`, `last_page`, `filename` | page images queued | `methods_prompt.py:1081` |
| `file.attach` | `path` or `data_url`, `name` | `{attached,name,path,ref_path,ref_text:"@file:…",uploaded}` | `methods_prompt.py:1139` |
| `image.detach` | `path`/token | ok | `methods_prompt.py:1162` |
| `input.detect_drop` | `text` | detected dropped file/image | `methods_prompt.py:1184` |
| `paste.collapse` | paste id | collapsed text | `methods_complete.py` |
| REST upload | `POST /api/chat/image-upload`, `POST /api/chat/file-upload` | stored path | `routers/files.py:`, `routers/uploads.py` |

### 2.9 Usage, cost, context, checkpoints

| Method / event | Detail | Source |
|---|---|---|
| `session.usage` | `Usage`: model, input, output, reasoning, prompt, completion, total, calls, compressions, context_used/max/percent/source/estimated, cache_hit_pct/read/write, avg_latency_s, avg_tps, active_subagents, dev_credits_spent_micros, cost_usd, cost_status, plan_gauge | `methods_session.py:1443`, `contracts/common.py:28` |
| `session.stats` | canonical cumulative counters + context/compressor/latency/rate-limit state | `contracts/canonical.py:229` |
| `session.context_breakdown` | `{categories[], context_max/used/percent, estimated_total, context_estimated, context_source, model, context_files[]}` | `methods_session.py:1452` |
| `session.account_usage` | `/usage` account blocks: `lines`, `nous_lines`, `nous_route`, `nous_usage` dollar bars | `contracts/canonical.py:291` |
| `session.usage` event | mid-turn tick; `message.complete.usage` is authoritative | `events.py:354` |
| `rollback.list` | `enabled`, `checkpoints:[{hash,timestamp,message}]`, `undo_hint` | `contracts/tools_commands.py:368` |
| `rollback.restore` | `hash`, `file_path`, `all` → restore result (skipped user edits, `history_removed`) | `tools_commands.py:395` |
| `rollback.diff` | `hash` → diff | `tools_commands.py:427` |
| `session.undo` | returns `undo_hint` naming changed files; retry = undo + resubmit | `methods_session.py:1998` |

### 2.10 Subagents, delegation, background work

| Method | Detail | Source |
|---|---|---|
| `subagent.list` | `{subagents, delegations}` for the session's conversation lineage | `methods_subagents.py`, `tui_gateway/AGENTS.md` |
| `subagent.roster` | roster snapshot | `methods_subagents.py` |
| `subagent.tail` | last 16 KiB of a live child transcript | `methods_subagents.py` |
| `subagent.steer` / `subagent.interrupt` | exact live generation/transport ownership | `methods_session.py`, `methods_subagents.py` |
| `delegation.status` / `delegation.pause` | active subagents, paused, max depth/concurrency | `methods_session.py` |
| `spawn_tree.list/save/load` | persisted delegation tree | `methods_session.py` |
| `prompt.background` / `prompt.btw` | side sessions | `methods_prompt.py` |

### 2.11 Other events the transcript may consume

`gateway.ready`, `skin.changed`, `notice`, `error`, `reaction`, `message.reaction`, `voice.*`, `wake.detected`, `billing.step_up.verification`, `free_tier.challenge`, `onboarding.ended`, `setup.ready`, `pet.changed`, `pet.generate.progress`, `pet.hatch.progress`, `cron.changed`, `sessions.changed`, `platforms.changed`, `projects.changed`, `pairing.changed`, `skills.changed`, `groups.changed`, `bot_relay.outbox.pending`, `session.control.update`, `session.reclaimed`, `session.resume_progress`, `display.status`, `display.lease`, `display.install.*`, `connection.request`, `connection.update`, `request.cancel` (`tui_gateway/contracts/events.py`; `contracts/connectors_operation.py`; `contracts/display.py`).

---

## 3. Slash commands and keyboard shortcuts

### 3.1 Slash commands

Registry: `hermes_cli/commands.py` (`COMMAND_REGISTRY`, `CommandDef`). Aliases in parentheses. `desktop=` in the registry decides whether the Desktop palette offers a command; `cli_only`/`gateway_only` gate surfaces. `commands.catalog` is the live source (includes skills, quick commands, plugin commands).

**Session**

| Command | Meaning |
|---|---|
| `/new` (`/reset`) | Start a new session (fresh ID + history) |
| `/clear` | Clear screen and start a new session (CLI/TUI) |
| `/start` | Acknowledge platform start pings without a reply (gateway) |
| `/topic` | Enable/inspect Telegram DM topic sessions |
| `/redraw` | Force a full UI repaint |
| `/history` | Show conversation history |
| `/save` | Export the conversation (`json\|md\|html`, filename, redact) |
| `/retry` | Retry the last message |
| `/prompt` (`/compose`) | Compose next prompt in `$EDITOR`, then send |
| `/undo [N]` | Back up N user turns and re-prompt |
| `/rewind [N\|fork N]` | Rewind to an earlier prompt to edit/resend or fork (Esc Esc) |
| `/title [name]` | Set the session title |
| `/handoff <platform>` | Hand this session to a messaging platform |
| `/branch [--here] [name]` (`/fork`) | Branch the session |
| `/worktree [new\|list\|prune]` | Show/list/create/prune isolated git worktrees |
| `/compress [here N\|focus topic\|--preview]` (`/compact`) | Compress conversation context |
| `/rollback [number] [--all]` | List/restore filesystem checkpoints |
| `/snapshot [create\|restore <id>\|prune]` (`/snap`) | State snapshots of config/state |
| `/stop` | Kill all running background processes |
| `/discard` | Drop a turn lost across a restart so the queue runs again (gateway) |
| `/pause [reason\|off]` | Pause new work globally / resume |
| `/approve [session\|always]` | Approve a pending dangerous command (gateway) |
| `/deny [all] [reason]` | Deny a pending dangerous command (gateway) |
| `/queue [list\|edit\|rm\|move\|clear]` (`/q`) | Queue a prompt for the next turn / manage the queue |
| `/steer <text>` (`/s`) | Inject text after the next tool call without interrupting |
| `/resume` | Resume a previously named session |
| `/sessions` | Browse and resume previous sessions |
| `/restart` | Gracefully restart the gateway after draining |
| `/quit [--delete]` (`/exit`) | Exit the CLI; `--delete` also removes history |

**Context, background, automation**

| Command | Meaning |
|---|---|
| `/status` | Session, model, token and context info |
| `/context` (`/ctx`) | Detailed context window view with gauge, categories, compression stats, throughput |
| `/usage` | Token usage and rate limits; `reset` redeems a banked Codex reset |
| `/insights` | Usage insights/analytics |
| `/egress` | Docker egress proxy status |
| `/bg <prompt>` | Run a prompt in a separate background session |
| `/btw <question>` | Side question about the current conversation |
| `/agents` (`/tasks`) | Show active agents and running tasks |
| `/journey` (`/learning`, `/memory-graph`) | Open the learning journey timeline |
| `/goal` | Set a standing goal across turns |
| `/subgoal` | Add/manage extra criteria on the active goal |
| `/heartbeat` (`/hb`) | Recurring prompt that re-enters the session when idle |
| `/loop` (`/proactive`) | Re-run a prompt on a recurring interval |
| `/refine` | Review the conversation and save lessons to memory/skills |
| `/review` | Spawn an independent review subagent |
| `/plan` | Write a markdown implementation plan to `.hermes/plans/` |
| `/moa` | Run one prompt through the default Mixture of Agents preset |
| `/cron` | Manage scheduled tasks |
| `/suggestions` (`/suggest`) | Review suggested automations |
| `/blueprint` (`/bp`) | Set up an automation from a blueprint |
| `/kanban` | Multi-profile collaboration board |
| `/curator` | Background skill maintenance |
| `/memory` | Review pending memory writes / toggle approval gate |
| `/learn` | Learn a reusable skill from a description, dirs, URLs, chat or notes |
| `/init` | Generate/update `AGENTS.md` from a repo scan |
| `/worktree` | Isolated git worktrees (also listed above) |
| `/discard`, `/stop`, `/pause` | Queue/process control (also listed above) |

**Configuration and display**

| Command | Meaning |
|---|---|
| `/config` | Show current configuration |
| `/model` | Switch model (session-scoped; `--global` persists) |
| `/reasoning` | Manage reasoning effort and display |
| `/fast` | Fast mode (normal/fast/auto/cold/ultrafast) |
| `/codex-runtime` | Toggle codex app-server runtime for OpenAI/Codex models |
| `/personality` | Set a predefined personality |
| `/statusbar` (`/sb`) | Toggle context/model status bar |
| `/battery` | Toggle battery indicator |
| `/timestamps` (`/ts`) | Toggle `[HH:MM]` timestamps |
| `/diff` | Show git changes in the working directory |
| `/verbose` | Cycle tool progress display: off → new → all → verbose |
| `/focus` | Focus view: only prompt and final response |
| `/footer` | Toggle gateway runtime-metadata footer on final replies |
| `/yolo` | Toggle YOLO mode (skip dangerous-command approvals) |
| `/approvals` | Show/set persistent dangerous-command approval mode |
| `/busy` | How messages behave while Hermes is working |
| `/autoprune` | Automatic pruning of old sessions |
| `/skin` | Show/change display skin/theme |
| `/indicator` | TUI busy-indicator style |
| `/voice` | Toggle voice mode |
| `/wake` | Toggle the “Hey Hermes” wake word listener |
| `/reload` | Reload `.env` into the running session |
| `/reload-mcp` | Reload MCP servers from config |
| `/reload-skills` | Re-scan `~/.hermes/skills/` |
| `/export [profile] [-o out.tar.gz]` | Export a profile (config, skills, theme) as a shareable archive |
| `/import <archive.tar.gz> [--name <name>]` | Import a shared profile archive as a new profile |
| `/sethome` (`/set-home`) | Set this chat as the home channel |

**Tools and skills**

| Command | Meaning |
|---|---|
| `/tools [list\|disable\|enable] [name…]` | Manage tools |
| `/toolsets` | List available toolsets |
| `/skills` | Search/install/inspect/manage skills |
| `/bundles` | List skill bundles (`/<name>` aliases for several skills) |
| `/pet [list\|<slug>]` | Toggle/adopt a petdex mascot |
| `/hatch` (`/generate-pet`) | Generate a petdex pet from a description |
| `/browser` | Connect browser tools to a live Chromium via CDP |
| `/plugins` | List installed plugins and status |
| `/platforms` (`/gateway`) | Gateway/messaging platform status |
| `/platform` | Pause/resume/list a failing platform |
| `/copy` | Copy the last assistant response |
| `/paste` | Attach clipboard image |
| `/image` | Attach a local image for the next prompt |

**Info / account / exit**

| Command | Meaning |
|---|---|
| `/help` | Available commands (`/help skills`, `/help <text>`) |
| `/commands` | Browse all commands and skills (paginated) |
| `/palette` | Fuzzy command palette (Ctrl+P) |
| `/whoami` | Slash-command access (admin/user) |
| `/profile` | Active profile name and home |
| `/subscription` (`/upgrade`) | Nous plan; change in browser |
| `/login` | Sign in with a Nous account |
| `/topup` | Nous balance / billing portal |
| `/update` | Update Hermes Agent |
| `/version` (`/v`) | Hermes version |
| `/debug` | Debug report (versions, config keys, error counts; `/debug upload` shares links) |

**Ink-TUI-local commands (not in `commands.py`)**

Registered in `ui-tui/src/app/slash/commands/{core,debug,ops,session,setup}.ts`; they dispatch entirely in the renderer.

| Command | Meaning |
|---|---|
| `/density [on\|off\|toggle]` | Compact/comfortable transcript density |
| `/details [hidden\|collapsed\|expanded\|cycle] [section]` | Agent detail visibility (thinking/tools/subagents/activity) |
| `/logs` | Open the gateway log pager |
| `/mouse [on\|off\|toggle\|wheel\|buttons\|all]` | Terminal mouse-tracking mode |
| `/fortune [random\|daily]` | Local fortune |
| `/theme [auto\|light\|dark]` | Pin light/dark mode |
| `/theme-info` | Current theme details |
| `/terminal-setup [auto\|vscode\|cursor\|windsurf]` | Install IDE terminal keybindings |
| `/setup` | Run the full `hermes setup` wizard (suspends Ink) |
| `/connectors` | Manage connector accounts (rename, add, reconnect, remove) |
| `/mem` | Memory diagnostics |
| `/widgets-reload` | Rescan `$HERMES_HOME/tui-widgets` and register widget apps |
| `/heapdump` | Write a V8 heap snapshot + memory diagnostics |
| `/replay [N\|last\|list\|load <path>]` | Replay a completed spawn tree |
| `/replay-diff <baseline> <candidate>` | Diff two spawn trees |
| `/pet`, `/hatch` | Pet mascot (also in `commands.py`) |

### 3.2 TUI keyboard shortcuts (`ui-tui/src/app/useInputHandlers.ts`, `ui-tui/src/app/useSubmission.ts`)

| Key | Action |
|---|---|
| `Enter` | Submit prompt |
| `Shift+Enter` | Newline in composer |
| `Up` / `Down` | Composer history, then queued prompts (`cycleQueue`/`cycleHistory`) |
| `Tab` | Apply the highlighted completion |
| `Shift+Tab` | Toggle YOLO without spending a turn |
| `/` at start | Slash menu (`commands.catalog` + `complete.slash`) |
| `@` | File/path mention completion |
| `!cmd` | Run a shell command (`shell.exec`) instead of prompting the agent |
| `Esc` | Close overlay / cancel queue edit / clear selection |
| `Esc Esc` | Rewind to an earlier prompt (double-Esc; while busy with no draft it interrupts) |
| `Ctrl+C` | Clear draft → interrupt running turn → exit (in that order) |
| `Ctrl+D` | Exit (only with an empty composer) |
| `Ctrl+O` | Model picker |
| `Ctrl+P` | Expand/fold the paste chip, or paste sections in already-sent messages. (The `/palette` description also advertises Ctrl+P; `useInputHandlers.ts` binds Ctrl+P to paste, so treat the palette claim as unverified.) |
| `Ctrl+T` | Agents overlay |
| `Ctrl+X` | Session picker; removes the queued item being edited |
| `Ctrl+K` | Dequeue and send the next queued prompt |
| `Ctrl+R` / `F7` | Toggle the agent dock preview |
| `Ctrl+L` / `Cmd+L` | Force redraw |
| `Cmd+G` / `Ctrl+G` (Alt+G fallback) | Open the composer in `$EDITOR` |
| `Shift+Up` / `Shift+Down` | Scroll transcript one row |
| `PageUp` / `PageDown` | Scroll transcript half a viewport |
| Mouse wheel | Accelerated scroll; modifier = precision |
| Voice key (configurable, e.g. `Ctrl+Esc`/`Alt+Esc`) | Push-to-talk / toggle recording |

### 3.3 Desktop keyboard shortcuts (defaults, rebindable in Settings → Keybinds)

Source: `apps/desktop/src/lib/keybinds/actions.ts`; `mod` = Cmd on macOS, Ctrl elsewhere.

| Key | Action |
|---|---|
| `Enter` | Send (or steer while busy) |
| `Shift+Enter` | Newline |
| `mod+Enter` | Queue the prompt |
| `mod+Shift+K` | Send the next queued prompt |
| `@` / `/` / `?` | Mention, slash menu, help |
| `Esc` | Cancel / close composer overlay |
| `mod+Shift+M` | Model picker |
| `mod+K` / `mod+P` | Command palette |
| `mod+.` | Command center |
| `mod+,` | Settings |
| `mod+B` | Toggle sidebar |
| `mod+J` | Toggle right sidebar (inspector) |
| `mod+G` | Toggle review pane |
| `mod+Shift+B` | New worktree |
| `mod+O` | Open folder |
| `mod+F` | Find in page |
| `mod+D` | Default profile |
| `mod+Shift+]` / `mod+Shift+[` | Next / previous profile |
| `mod+Shift+0` | Toggle all profiles |
| `mod+Shift+S` | Toggle status bar |
| `mod+Alt+T` | Toggle tab strip |
| `mod+Shift+L` | Show browser |
| `mod+Shift+H` | Toggle HUD |
| `mod+\` | Flip panes |
| `mod+/` | Keybind panel |
| `Ctrl+backtick` / `Ctrl+Shift+backtick` | Show / new terminal |
| `Ctrl+Shift+Up/Down` | Previous / next terminal |
| `PageUp` / `PageDown` | Scroll conversation |
| `mod+Shift+F` | Focus session search |
| `Ctrl+B` (mac) / `mod+Alt+V` | Voice |

---

## 4. Authentication for a browser client

| Concern | Detail | Source |
|---|---|---|
| Session token mint | `resolve_session_token()`: `HERMES_DASHBOARD_SESSION_TOKEN` (plain or `file:<path>`), else a fresh `secrets.token_urlsafe(32)` per server boot | `hermes_cli/web_server_session_token.py` |
| Token delivery | Injected into `index.html` as `window.__HERMES_SESSION_TOKEN__`; base path as `window.__HERMES_BASE_PATH__`; gated flag as `window.__HERMES_AUTH_REQUIRED__` | `hermes_cli/web_server_dashboard.py`, `web/src/lib/api.ts:76` |
| REST auth (loopback / `--insecure`) | Header `X-Hermes-Session-Token: <token>` on every `/api/...` call; same-origin only (`sameOriginRequestUrl`) | `web/src/lib/api.ts::fetchJSON`, `hermes_cli/web_server.py:227` |
| REST auth (gated OAuth) | HttpOnly session cookie `hermes_session_at`; no token header; `credentials: "include"` | `hermes_cli/dashboard_auth/cookies.py`, `middleware.py` |
| Login flow | `GET /login` → provider chooser (`GET /api/auth/providers`) → `GET /auth/login` → callback `GET /auth/callback`; native app exchange `POST /auth/native/token`, refresh `/auth/native/refresh`; password login `POST /auth/password-login`; logout `POST /auth/logout` | `dashboard_auth/routes.py` |
| Identity | `GET /api/auth/me` → `{user_id,email,display_name,org_id,provider,expires_at}` | `routes.py:551` |
| WS ticket (gated) | `POST /api/auth/ws-ticket` (cookie-auth) → `{ticket, ttl_seconds:30}`; single-use, consumed on upgrade as `?ticket=` | `routes.py:583`, `dashboard_auth/ws_tickets.py` |
| WS auth (loopback) | Legacy `?token=<session token>` on `/api/pty`, `/api/ws`; constant-time compare | `web_server_chat.py::_ws_auth_reason` |
| `/api/ws` opening | `buildWsUrl("/api/ws", {profile})` → `ws(s)://host<base>/api/ws?token=…` or `?ticket=…`; subprotocol `hermes-gateway-v1`; first frame `gateway.ready`; client sends `client.capabilities {server_requests:true}` | `web/src/lib/gatewayClient.ts`, `apps/shared/src/json-rpc-gateway.ts`, `tui_gateway/ws.py` |
| `/api/pty` opening | `buildWsUrl("/api/pty", {channel, attach, resume?, cwd?, profile?, fresh?})`; ticket/ token as above; server spawns `hermes --tui` under `ptyprocess`; frames are raw bytes; resize `\x1b[RESIZE:cols;rows]` | `web/src/pages/ChatPage.tsx:1196`, `hermes_cli/pty_bridge.py`, `routers/chat_ws.py:475` |
| `/api/events` | Same auth; `?channel=<id>` subscribes to that PTY child's fanned-out events (read-only) | `routers/chat_ws.py:740` |
| `/api/console` | Same auth; interactive console socket | `routers/chat_ws.py:241` |
| `/api/pub` | Same auth, internal credential allowed; plugin publishers | `routers/chat_ws.py:728` |
| Desktop native client | Private preload IPC carries a one-use gateway ticket; WS subprotocol `hermes-gateway-ticket.<ticket>`; REST header `X-Hermes-Gateway-Ticket`; core sockets (`/api/ws`, `/api/pty`) refuse the native grant and require tickets/token | `hermes_cli/dashboard_auth/native_http.py`, `web_server_boundary.py:157` |
| Server-spawned clients | Process-lifetime `?internal=` credential for the PTY child reconnecting to `/api/ws` / `/api/pub`; never injected into the SPA | `dashboard_auth/ws_tickets.py`, `web_server_chat.py` |
| File/media downloads | `POST /api/files/ticket` mints a path-bound ticket for `GET /api/fs/download`, `/api/files/stream`, `/api/media/proxy` so the token never appears in a URL; 60 s TTL, download tickets allow a few redemptions, stream tickets are reusable | `hermes_cli/web_server_file_tickets.py`, `routers/files.py` |
| Socket scoping | A ticket names one socket (`GATEWAY_SOCKET`, `HOST_TERMINAL_SOCKET`, audio sockets); a ticket for one opens no other | `hermes_cli/web_session_sockets.py`, `web_server_chat.py:216` |
| Profile scope | Every management call carries `?profile=<name>` for profile-scoped prefixes; chat adds `?profile=` to `/api/pty` and `/api/ws` so the child runs under that home | `web/src/lib/api-request-scope.ts`, `web/src/lib/api.ts::withManagementProfile` |
| Host validation | `Host`/`Origin` checks and public-bind gating (`auth_required`) | `hermes_cli/web_server_boundary.py`, `dashboard_auth/middleware.py` |

---

## 5. What the Desktop app already renders natively (reuse map)

The Desktop is the reference implementation for a native transcript over the same gateway. It uses `@assistant-ui/react` + nanostores and the shared `JsonRpcGatewayClient`.

| Surface | Files to reuse | Notes |
|---|---|---|
| Thread shell / message list | `apps/desktop/src/components/assistant-ui/thread/index.tsx`, `list.tsx`, `types.ts` | Memoised list, session-switch safe, transcript windowing |
| User message | `thread/user-message.tsx`, `user-message-text.tsx`, `user-edit-composer.tsx` | Edit/rewind from a message |
| Assistant message / parts | `thread/assistant-message.tsx`, `message-parts.tsx`, `response-group.tsx`, `content.ts` | Text, reasoning, tools, connectors |
| Markdown / code / tables | `components/assistant-ui/markdown-text.tsx`, `markdown-table.tsx`, `components/chat/shiki-block.tsx`, `shiki-highlighter.tsx`, `code-editor.tsx` | Shiki highlighting |
| Diffs | `components/chat/syntax-diff.tsx`, `diff-lines.tsx`, `changed-files-card.tsx` (thread) | Per-file inline diff |
| Timeline / checkpoints rail | `thread/timeline.tsx`, `timeline-rail.tsx`, `timeline-data.ts`, `timeline-position.ts` | Prompt markers and jump-to-turn |
| Turn activity / status | `thread/turn-activity.ts`, `status.tsx`, `components/chat/status-row.tsx`, `status-stack/*` | “Worked for …”, live activity, queue |
| Tool cards | `components/assistant-ui/tool/fallback.tsx` (`ToolFallback`, `ToolGroupSlot`), `fallback-model/*`, `delegate.tsx`, `run-summary.ts`, `run-ticker.tsx`, `skill-activity.ts` | Grouped runs, per-tool disclosure, media slots |
| Tool media | `tool-media-slot.tsx`, `components/chat/generated-image-result.tsx`, `terminal-output.tsx` | Images, terminal output |
| Approvals | `components/assistant-ui/tool/approval.tsx` (`PendingApprovalStack`, `ApprovalChoice = once\|session\|always\|deny`), `store/prompts.ts` | Inline + floating stack; answers via `approval.respond` |
| Clarify | `components/assistant-ui/clarify/index.tsx`, `parse.ts`, `pending.tsx`, `settled.tsx`, `submit-shortcut.ts` | Multi-question batch |
| Sudo / secret / vault prompts | `components/prompt-overlays.tsx` (+ `*.vault-*.test.tsx`) | Modal overlays driven by server requests |
| Composer | `app/chat/composer/index.tsx`, `controls.tsx`, `attachments.tsx`, `queue-panel.tsx`, `queue-slot.tsx`, `model-pill.tsx`, `reasoning-pill.tsx`, `help-hint.tsx` | Attach, model, reasoning, queue, send/stop |
| Slash + @ completions | `app/chat/composer/hooks/use-slash-completions.ts`, `use-at-completions.ts`, `trigger-popover.tsx`, `completion-drawer.tsx`, `lib/desktop-slash-commands.ts`, `lib/slash-completion-cache.ts` | Catalog-fetched, extension-safe |
| Stream reducer | `app/session/hooks/use-message-stream/index.ts`, `gateway-event/*.ts` (`message-stream`, `tools`, `tools-progress`, `input-requests`, `server-requests`, `lifecycle`, `session-info`, `status`) | Reduces every gateway event into transcript state |
| Session lifecycle | `app/session/hooks/use-session-actions/*`, `use-route-resume.ts`, `use-resume-reattach.ts`, `use-transcript-peer-sync.ts` | Create/resume/branch/rewind/retry |
| Prompt actions | `app/session/hooks/use-prompt-actions/index.ts`, `slash.ts`, `rewind.ts` | Submit, steer, retry, edit, branch |
| Gateway client | `apps/shared/src/json-rpc-gateway.ts`, `json-rpc-channel.ts`, `gateway-events.ts`, `gateway-types.ts`, `gateway-contract.generated.ts` | Typed methods/events/requests; replay + reconnect |
| Session sidebar / picker | `app/chat/sidebar/*`, `app/session-picker-overlay.tsx`, `app/chat/session-tile.tsx` | Grouping, pinning, state glyphs |
| Right rail / inspector | `app/chat/right-rail/*` (preview, browser), `app/right-sidebar/review/*`, `app/right-sidebar/files/*`, `app/right-sidebar/terminal/*` | Browser/preview, review pane, file tree, shell |
| Composer status bar | `app/chat/composer/status-stack/*`, `components/chat/status-*` | Branch, mode, context, subagents |
| Theme / skin | `apps/shared/src/skin.ts`, `theme-presets.ts`, `apps/desktop/src/themes/*` | `gateway.ready` carries skin data |

---

## 6. Gaps: backend/CLI capability with no dashboard UI today

### 6.1 REST surfaces the dashboard does not call

Verified by searching `web/src` for the route prefix; all routes exist in `hermes_cli/web_routers/`.

| Capability | Backend routes | Notes / where it belongs in the redesign |
|---|---|---|
| Git review, branches, worktrees, PRs | `GET /api/git/status`, `/gh-auth`, `/worktrees`, `/branches`, `/base-branches`, `/review/list\|diff\|commit-context\|rev-parse\|ship-info`, `/file-diff`; `POST /api/git/review/pr-list\|stage\|unstage\|revert\|commit\|push\|create-pr`; `POST /api/git/worktree/add\|remove`; `POST /api/git/branch/switch` (`routers/git.py`) | Entirely absent from `web/src`. Needed for SPEC inspector Changes/Shell and the header Local/Worktree chip. Desktop has the review pane (`apps/desktop/src/app/right-sidebar/review/*`) and preview (`apps/desktop/src/app/chat/right-rail/preview-*`). |
| Local model runtime | `GET /api/local-models/status\|hardware\|catalog\|jobs\|jobs/{id}\|search\|search/files`; `POST .../runtime/install\|download\|download/pause\|download/resume\|quickstart\|server\|eject\|activate\|download-browsed\|sideload`; `DELETE .../models/{id}` (`routers/local_models.py`) | Listed as profile-scoped in `web/src/lib/api-request-scope.ts` but no page. Models page only covers cloud providers. |
| Saved gateway connections | `GET/POST /api/gateway-connections`; `DELETE /{id}`; `POST /launch-mode`, `/last-used`, `/{id}/primary`, `/{id}/test`; SSH and OAuth sub-routes (`gateway_connections*.py`) | Desktop-only today. Needed for “hosts” in Settings/Channels. |
| Delegation routing / backend map | `GET /api/delegation/routing`; `PUT /api/delegation/backend`, `/backends/model_map`, `/backends/profile_routes` (`routers/delegation.py`) | Only raw `delegation.*` config keys in ConfigPage. |
| Learning graph / journey | `GET /api/learning/graph`, `/learning/node`; `PUT/DELETE /api/learning/node` (`routers/status.py`) | `/journey` exists in the TUI only. SPEC Library → Memory journey. |
| Audio / voice | `POST /api/audio/transcribe\|speak\|tts-lease\|stt-lease`; `GET /api/audio/voice-config\|voice-live/status\|elevenlabs/voices`; `POST /api/audio/voice-live/session`; `WS /api/audio/transcribe-stream\|speak-stream` (`routers/audio.py`) | No dashboard voice UI (TUI voice mode is terminal-only). |
| UI preferences | `GET/PATCH /api/ui-preferences` (`ui_preferences.py`) | Dashboard keeps its own localStorage prefs. |
| Webapp access control / window tickets | `GET /api/webapp-access/status`; `POST .../start\|stop\|restart`; `POST /api/webapp/window-ticket\|socket-ticket`; `GET /webapp/launch\|window` (`webapp.py`, `webapp_access.py`) | Gateway Webapp surface only. |
| Project/session trees and pull requests | `GET /api/profiles/sessions`, `/profiles/sessions/sidebar`, `/profiles/projects/tree`; `POST /api/profiles/sessions/pull-requests` (`profiles.py`) | Desktop's project sidebar uses these; dashboard Sessions has no project grouping. |
| Profile export / import / desktop overlay | `POST /api/profiles/{name}/export`, `POST /api/profiles/import`, `GET /api/profiles/{name}/desktop-overlay`, `POST /api/profiles/{name}/open-terminal` | `/export`, `/import` are CLI-only; no dashboard flow. |
| Egress proxy status | `GET /api/egress/status` (`config_env.py`) | `/egress` TUI-only. |
| Custom provider endpoints | `GET/POST /api/providers/custom-endpoints`; `POST .../{id}/activate`, `/validate`; `DELETE .../{id}`; `POST /api/providers/validate` (`config_env.py`) | Only OAuth + env keys in the dashboard; no custom endpoint editor. |
| Cloud agents | `GET /api/cloud/agents` (`status.py`) | No UI. |
| Computer use | `GET /api/tools/computer-use/status`; `POST /api/tools/computer-use/permissions/grant` (`tools.py`) | No UI. |
| Terminal backend selection | `GET /api/tools/terminal/backends`; `PUT /api/tools/terminal/backend` (`tools.py`) | ConfigPage exposes raw config only. |
| Per-toolset model assignment | `GET /api/tools/toolsets/{name}/models`; `PUT .../model` (`tools.py`) | `api.ts` has config/provider/env/post-setup but not models/model. |
| Skills lock / hub official / updates list | `PUT /api/skills/lock`, `GET /api/skills/hub/updates`, `GET /api/skills/hub/official` (`skills.py`) | SkillsPage installs/searches but does not show pinned versions or the full update list. |
| Archive / pin / mark-read sessions | `PATCH /api/sessions/{id}` accepts `archived`, `pinned`, `unread` (`hermes_cli/web_models.py:286`); `GET /api/sessions` accepts `archived=only` / `archived=include` (`sessions.py:185`) | Dashboard only sends `title`; no archived view, pin, or unread state. SPEC History wants archive and “thread state at a glance”. |
| Edit an existing MCP server | `PUT /api/mcp/servers` (`routers/mcp.py`) | `web/src/lib/api.ts` has add/test/auth/enable/delete/catalog but no update; changing a URL or args means delete + re-add. |
| Session timeline / around | `GET /api/sessions/{id}/timeline`, `/messages/around`; `POST /api/sessions/owner-backfill` (`sessions.py`) | Dashboard has no timeline view or windowed transcript read; it does use `/mutation-snapshot` internally for safe mutations (`web/src/lib/session-mutations.ts`). Needed for timeline and rewind UI. |
| Cron run history and cancel | `GET /api/cron/jobs/{id}`, `/runs`; `POST .../cancel`, `/api/cron/fire` (`cron.py`) | Dashboard shows last/next only, no run history. |
| Backup chunked transfer | `GET /api/ops/backup/chunk`; `POST /api/ops/transfer/chunk\|restore` (`transfer.py`) | Dashboard uses whole-file upload/download. |
| Gateway drain / update receipt / retirement | `POST /api/gateway/drain`; `GET /api/hermes/update/receipt`; `POST /api/health/retirement`; `GET /api/health`, `/api/health/idle`, `/api/ssh/ownership`, `/api/host/identity` (`actions.py`, `status.py`) | Operational endpoints with no surface. |
| Peer / desktop-plugin / display APIs | `routers/peer.py`, `desktop_plugins.py`, `display.py` (`WS /api/display/ws`), `webapp_relay_proxy.py` | Desktop/relay-specific; a web redesign may not need them, but they exist. |
| Console socket | `WS /api/console` | Dashboard exposes it only via a modal. |
| Media | `GET /api/media`, `/api/media/proxy` | Dashboard has no media browser/preview. |
| Memory OAuth | `hermes_cli/memory_oauth` router | Memory providers can OAuth; no dashboard surface. |

### 6.2 Protocol capabilities the dashboard (web/src) does not render

These exist over `/api/ws` and are fully rendered by Desktop/Ink, but the dashboard's React side has no component for them. A native web transcript must add them.

| Capability | Evidence |
|---|---|
| Structured transcript (messages, parts, reasoning, tool calls) | No message/tool components under `web/src`; only xterm (`web/src/pages/ChatPage.tsx`) |
| Inline approval cards (`approval` server request → `approval.respond`) | No `onRequest` handler in `web/src`; `approval` appears only as an unrelated auxiliary-model task label (`web/src/lib/aux-tasks.ts`) and API comments |
| Clarify cards (`clarify`, `clarify.lock`) | Same; only TUI/Desktop handlers |
| Sudo / secret / vault prompts | Same; dashboard relies on the TUI overlays inside the PTY |
| Tool progress, output risk, todo list, diff cards | Events consumed only by Ink/Desktop; no web reducers |
| Queue/steer UI | TUI-only today; protocol supports `prompt.steer_queued`, `prompt.replace_queued`, `session.steer` |
| Context breakdown / compression UI | `session.context_breakdown`, `/compress` are TUI/Desktop popovers; dashboard shows nothing |
| Checkpoint/rollback UI | `rollback.list/restore/diff` TUI/Desktop; dashboard only prunes checkpoint files in System |
| Subagent roster/tail/steer | `subagent.*` desktop status stack; no web UI |
| Presence/approval inbox | No aggregated backend query; SPEC calls for a new one |
| Voice capture | `voice.*` + `/api/audio/*`; no web UI |

### 6.3 CLI-only operational capabilities

| Capability | CLI | Why it matters |
|---|---|---|
| State DB repair / session recovery | `hermes doctor --fix`, `hermes sessions repair`, `hermes sessions optimize` | SPEC History wants a “state.db health footer that leads to the quiesce procedure”; dashboard has no entry point |
| Profile archive export/import | `hermes profile export/import` | REST routes exist (`/api/profiles/{name}/export`, `/api/profiles/import`) but no UI |
| Worktree management | `hermes worktree new\|list\|prune`, `/worktree` | Backend git routes exist; no dashboard UI |
| Snapshot/restore of Hermes state | `hermes snapshot` | No REST equivalent surfaced |
| Secrets vault management | `hermes vault` + `vault.*` RPC | Desktop has vault prompts; dashboard has none |
| Connector/account management | `hermes connectors`, `connectors.*` RPC | Desktop-only today |
| Groups / bot relay | `groups.*`, `bot_relay.*` RPC | Desktop bot mode only |
| Pet / achievements / kanban | `/pet`, `/hatch`, `/kanban`, achievements plugin | Dashboard kanban exists only as a plugin tab; pets/achievements are plugin/desktop |
| Cloud agents | `/api/cloud/agents` | No UI anywhere in the dashboard |
| Send a message to a channel from the CLI | `hermes send --to <target> <message>` (`hermes_cli/send_cmd.py`) | SPEC Channels space expects a compose/test path; dashboard only has per-platform “Test”. |

### 6.4 Known structural risks for the redesign

1. **Two chat surfaces.** `web/AGENTS.md` says not to re-implement the TUI in React, but the SPEC explicitly plans a native transcript using `@assistant-ui/react` and the Desktop reducers. The safe path is the SPEC's: reuse `apps/shared` + Desktop's `use-message-stream` reducers, keep `ChatPage` (xterm) as the Terminal view, and do not fork agent behavior.
2. **Approvals are single-source.** `tools/approval.py` owns the queue; `approval.respond` (canonical) and the legacy `approval` server request must stay the only answer path. A web inbox that caches or re-answers risks double-resolution.
3. **Profile scope is not optional.** One gateway process can serve several homes; every new REST/WS call must carry `?profile=` (and the PTY/WS dial too), or it silently acts on the launch home (`tui_gateway/AGENTS.md` § Profile scope).
4. **Tickets are single-use.** A web transcript that opens several sockets (`/api/ws` + `/api/pty` + `/api/events`) must mint a fresh ticket per socket; reusing one fails after the first upgrade.
5. **Event replay.** A reconnect must call `session.events.since` with `last_sequence`/`replay_epoch` and re-render `open_requests`; rendering only live events loses approvals and clarifies raised while disconnected.
6. **`session.rewind` is called by Desktop's `/undo` and `/retry` but is not declared in `tui_gateway/contracts` and has no Python handler** (`apps/desktop/src/app/session/hooks/use-prompt-actions/slash-session-commands.ts:177`, `:248`; grep of `gateway/` and `tui_gateway/` finds no such method). The declared mechanism is `session.mutate {operation:"rewind"}`. Flagged as a source contradiction; verify against the running backend before reusing that Desktop code path.
