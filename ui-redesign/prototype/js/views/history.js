/* History · every thread this machine has run: search, filter, export, prune.
   Own file: js/views/history.js + css/history.css. */
(function(){
const H = window.H;
if (!H || !H.views) return;

const TODAY = '19 Nov 2026';
const todayLabel = () => LIVE ? new Date().toLocaleDateString('en-US', {day:'numeric', month:'short', year:'numeric'}) : TODAY;

/* 24 sample sessions. days = days since last active (today = 0). */
const ROWS = [
  {id:'h1', thread:'t-ui', title:'Redesign the web UI', snippet:'Move off xterm.js; build shell, inbox and history', project:'maint', agent:'hermes', source:'Web', model:'claude-sonnet-5-5', msgs:186, tokens:1240000, cost:18.40, last:'12m ago', days:0,
   first:'You: The old web UI is an xterm.js terminal. Build the calm, chat-first workspace instead · start with the shell and the inbox.',
   lastMsg:'Hermes: Inbox and History are wired end to end. Next I’ll run the 390px pass and check the paused banner.'},
  {id:'h2', thread:'t-gw', title:'Gateway heartbeat gaps after restart', snippet:'Two gaps of 41 s and 49 s in the last hour', project:'maint', agent:'hermes', source:'TUI', model:'claude-sonnet-5-5', msgs:42, tokens:214000, cost:3.12, last:'28m ago', days:0,
   first:'You: The dashboard shows heartbeat gaps after the 21:04 restart. Find out why.',
   lastMsg:'Hermes: The worker holds a stale lock in /run/hermes. I need approval to restart the gateway.'},
  {id:'h3', thread:'t-tri', title:'Triage inbox, draft replies', snippet:'6 drafts waiting on a sending identity', project:'mail', agent:'hermes', source:'Web', model:'claude-sonnet-5-5', msgs:96, tokens:640000, cost:9.60, last:'41m ago', days:0,
   first:'You: Clear the inbox and draft replies in my voice. Do not send anything yet.',
   lastMsg:'Hermes: Six drafts are ready. Which account should they come from · support@, you@, or ask per thread?'},
  {id:'h4', thread:'t-bk', title:'Verify last night’s backup zip', snippet:'state.db, -wal and -shm restored in a scratch dir', project:'maint', agent:'ledger', source:'Cron', model:'gemini-flash', msgs:18, tokens:88000, cost:0.42, last:'1h ago', days:1,
   first:'Cron: Verify the 02:00 backup archive and report row counts.',
   lastMsg:'Hermes: 3,912 files, 214 MB. state.db opens clean; every table passed integrity_check.'},
  {id:'h5', thread:'t-ml', title:'Compare three SMTP providers', snippet:'Postmark vs SES vs Resend, with real prices', project:'mail', agent:'scout', source:'Web', model:'deepseek-flash', msgs:34, tokens:312000, cost:0.28, last:'3h ago', days:1,
   first:'You: Compare Postmark, SES and Resend for 4k transactional mails a month. Cite prices.',
   lastMsg:'Hermes: SES is cheapest at $0.40; Postmark is $15 flat. Notes saved to library/smtp-compare.md.'},
  {id:'h6', thread:'t-pr', title:'What changed in Python 3.14.2?', snippet:'Changelog, plus what breaks on arm64', project:'ops', agent:'scout', source:'Telegram', model:'deepseek-flash', msgs:12, tokens:44000, cost:0.04, last:'5h ago', days:1,
   first:'You: 3.14.2 landed. Anything that breaks on this arm64 box?',
   lastMsg:'Hermes: No arm64 regressions. Two security fixes touch ssl and tarfile; neither affects your scripts.'},
  {id:'h7', thread:'t-ci', title:'Weekly cost report', snippet:'Routine failed twice on provider 429s', project:'ops', agent:'ledger', source:'Cron', model:'gemini-flash', msgs:9, tokens:21000, cost:0.11, last:'Yesterday', days:2,
   first:'Cron: Build the weekly cost report from state.db usage rows.',
   lastMsg:'Hermes: Provider returned 429 twice; fallback timed out. Routine left failed for review.'},
  {id:'h8', thread:'t-mcp', title:'Rotate the Telegram bot token', snippet:'New token in the vault; gateway restarted once', project:'ops', agent:'hermes', source:'Discord', model:'claude-sonnet-5-5', msgs:24, tokens:96000, cost:1.44, last:'Yesterday', days:2,
   first:'You: Rotate the Telegram bot token and restart the channel cleanly.',
   lastMsg:'Hermes: Token replaced, gateway restarted, Telegram reconnected in 4 s. Old token revoked at the BotFather.'},
  {id:'h9', title:'MCP server smoke test', snippet:'Three servers: files, browser, sheets', project:'maint', agent:'hermes', source:'TUI', model:'claude-sonnet-5-5', msgs:51, tokens:288000, cost:4.10, last:'17 Nov', days:3,
   first:'You: Test the three MCP servers and tell me which tools actually work.',
   lastMsg:'Hermes: files and browser answer; sheets fails the OAuth handshake. Logs under ~/.hermes/logs/mcp.'},
  {id:'h10', title:'Explain the 429s in atomicmail', snippet:'Send loop retried without backoff', project:'mail', agent:'hermes', source:'Web', model:'claude-sonnet-5-5', msgs:27, tokens:133000, cost:1.98, last:'15 Nov', days:4,
   first:'You: Why did atomicmail send 41 duplicates this morning?',
   lastMsg:'Hermes: The send loop retried on 429 with no backoff. Patch is in branch fix/429; one file, +14 −3.'},
  {id:'h11', title:'Draft a reply to the landlord', snippet:'Two versions, short and firm', project:'ops', agent:'scout', source:'Telegram', model:'deepseek-flash', msgs:8, tokens:19000, cost:0.02, last:'14 Nov', days:5,
   first:'You: The boiler repair slipped again. Draft a firm but polite reply.',
   lastMsg:'Hermes: Two drafts ready · one short, one with the repair timeline. Nothing sent.'},
  {id:'h12', title:'Prune 400 old sessions', snippet:'state.db down 38 MB after vacuum', project:'maint', agent:'ledger', source:'Cron', model:'gemini-flash', msgs:15, tokens:62000, cost:0.36, last:'13 Nov', days:6,
   first:'Cron: Prune sessions older than 90 days and report the size change.',
   lastMsg:'Hermes: 412 sessions removed, 211 MB → 173 MB. state.db-wal checkpointed first.'},
  {id:'h13', title:'Set up the calendar sync', snippet:'Read-only Google Calendar on its own calendar', project:'ops', agent:'hermes', source:'Web', model:'claude-sonnet-5-5', msgs:38, tokens:174000, cost:2.60, last:'12 Nov', days:7,
   first:'You: Connect my Google Calendar read-only and put routines on their own calendar.',
   lastMsg:'Hermes: Calendar “Hermes routines” exists. Two cron entries now show their next run there.'},
  {id:'h14', title:'Why did cron skip Tuesday?', snippet:'Host clock drifted 3 min; the window closed', project:'ops', agent:'ledger', source:'API', model:'gemini-flash', msgs:21, tokens:74000, cost:0.44, last:'11 Nov', days:8,
   first:'API: Routine “Weekly cost report” did not run at 14:02 on Tuesday.',
   lastMsg:'Hermes: The host clock drifted 3 minutes after suspend; the window closed. NTP is back in sync; a catch-up run is queued.'},
  {id:'h15', title:'Review the worktree diff', snippet:'9 files, +412 −96, tests not run', project:'maint', agent:'hermes', source:'Web', model:'claude-opus-5-5', msgs:64, tokens:402000, cost:14.20, last:'10 Nov', days:9,
   first:'You: Review the ui-redesign worktree and list anything that will break dark mode.',
   lastMsg:'Hermes: Two hardcoded colours in shell.css and one missing token. Fixed in the worktree; tests still not run.'},
  {id:'h16', title:'Write the changelog for 0.9', snippet:'Grouped by area, not by commit', project:'maint', agent:'hermes', source:'TUI', model:'claude-sonnet-5-5', msgs:33, tokens:158000, cost:2.34, last:'7 Nov', days:12,
   first:'You: Turn the last 60 commits into a changelog people can read.',
   lastMsg:'Hermes: Draft is in docs/changelog-0.9.md, grouped as Inbox, History, Gateway, Channels.'},
  {id:'h17', title:'Find a cheaper DeepSeek plan', snippet:'Token pricing at the current volume', project:'ops', agent:'scout', source:'Web', model:'deepseek-flash', msgs:19, tokens:102000, cost:0.09, last:'4 Nov', days:15,
   first:'You: At 2.1M tokens a month, what does DeepSeek actually cost?',
   lastMsg:'Hermes: $0.34 at cache-miss prices, $0.11 with the cache hit rate you already have.'},
  {id:'h18', title:'Backup retention policy', snippet:'Keep 7 daily, 4 weekly, 3 monthly', project:'maint', agent:'ledger', source:'Discord', model:'gemini-flash', msgs:26, tokens:91000, cost:0.52, last:'1 Nov', days:18,
   first:'You: Write a retention policy for the backup folder and apply it as a routine.',
   lastMsg:'Hermes: Policy saved; the first prune dry-run removes 11 archives, 1.8 GB. Nothing deleted yet.'},
  {id:'h19', title:'Summarise the OCI bill', snippet:'Boot volume and egress are the movers', project:'ops', agent:'ledger', source:'Telegram', model:'gemini-flash', msgs:14, tokens:48000, cost:0.28, last:'29 Oct', days:21,
   first:'You: Read the October OCI invoice and tell me what changed.',
   lastMsg:'Hermes: $41.20, up $6.80. Egress doubled and the boot volume grew 40 GB; nothing else moved.'},
  {id:'h20', title:'Move the dashboard to :9119', snippet:'Loopback only; gateway restarted once', project:'maint', agent:'hermes', source:'API', model:'claude-sonnet-5-5', msgs:47, tokens:226000, cost:3.40, last:'26 Oct', days:24,
   first:'You: The dashboard is on 8080 and collides with the dev server. Move it to 9119.',
   lastMsg:'Hermes: config.yaml updated to 127.0.0.1:9119; gateway restarted; the old port is free.'},
  {id:'h21', title:'Inbox rules for newsletters', snippet:'12 rules, all reversible', project:'mail', agent:'hermes', source:'Discord', model:'claude-sonnet-5-5', msgs:22, tokens:88000, cost:1.32, last:'23 Oct', days:27,
   first:'You: Newsletters should skip the inbox and land in a digest folder.',
   lastMsg:'Hermes: 12 rules created; 340 messages moved. The digest lands at 07:00 daily.'},
  {id:'h22', title:'Nightly backup ran long', snippet:'3 h 41 m, mostly the zip step', project:'maint', agent:'ledger', source:'Cron', model:'gemini-flash', msgs:7, tokens:18000, cost:0.10, last:'19 Oct', days:31,
   first:'Cron: Report why the 02:00 backup took longer than its 90-minute budget.',
   lastMsg:'Hermes: 3 h 41 m, 82% in zip compression. Switching to zstd should bring it under 40 minutes.'},
  {id:'h23', title:'Explain the memory vault layout', snippet:'vault/, memory/ and what is encrypted', project:'maint', agent:'scout', source:'TUI', model:'deepseek-flash', msgs:16, tokens:57000, cost:0.05, last:'12 Oct', days:38,
   first:'You: Walk me through ~/.hermes/vault and ~/.hermes/memory. What is encrypted?',
   lastMsg:'Hermes: vault/ holds secrets encrypted at rest; memory/ is plain markdown you can edit. The index rebuilds on start.'},
  {id:'h24', title:'Try the Gemini 3.8 migration', snippet:'Flash is cheaper; one tool-call format changed', project:'ops', agent:'scout', source:'Web', model:'gemini-flash', msgs:29, tokens:140000, cost:0.84, last:'29 Sep', days:51,
   first:'You: Move Scout from gemini 3.5 to 3.8 flash and compare answers on five prompts.',
   lastMsg:'Hermes: 3.8 flash is 18% cheaper and matched 4 of 5 answers. One tool-call format changed; notes in library/gemini-3.8.md.'},
];

/* ================= live layer =================
   H.live === true: the table is `/api/sessions` (server paging + search), nothing is sample data.
   H.live === false: the arrays above, exactly as before. */
const LIVE = H.live;
const PAGE = 25;
const live = {
  rows: [], total: 0, offset: 0, hasMore: false, loading: false, error: null,
  storage: {}, stats: null, statsError: null, mode: 'list', term: '',
  detail: null, detailLoading: false, detailError: null, busy: '',
};
let loadSeq = 0;

/* session sources: the dashboard's own taxonomy (web/src/pages/SessionsPage_sources.tsx) */
const SOURCE_NAMES = {
  cli:'CLI', tui:'CLI', gui:'Desktop', telegram:'Telegram', discord:'Discord', slack:'Slack',
  whatsapp:'WhatsApp', whatsapp_cloud:'WhatsApp Cloud', signal:'Signal', matrix:'Matrix', email:'Email',
  sms:'SMS', cron:'Cron', tool:'Tools', oneshot:'One-shots', api_server:'API', acp:'ACP',
  hermes_flow:'Flows', vulcan_delegate:'Delegates', webhook:'Webhooks', local:'Local', cron_output:'Cron',
};
const srcName = src => SOURCE_NAMES[String(src || 'local').split(':')[0]] || String(src || 'local');
function ago(ts){
  if (!ts) return '–';
  const ms = ts > 1e12 ? ts : ts * 1000;
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  const d = new Date(ms), t = new Date();
  const days = Math.floor((new Date(t.getFullYear(), t.getMonth(), t.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (days <= 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', {weekday:'short'});
  return d.toLocaleDateString('en-US', {day:'numeric', month:'short'});
}
const baseName = p => String(p || '').replace(/\/+$/, '').split('/').filter(Boolean).pop() || '–';

/* one /api/sessions row -> the row shape this view renders */
function fromApiSession(s){
  const title = String(s.title || '').trim();
  const preview = String(s.preview || '').replace(/\s+/g, ' ').trim();
  const ts = Number(s.last_active || s.started_at || 0);
  const tokens = (Number(s.input_tokens) || 0) + (Number(s.output_tokens) || 0);
  const cost = s.actual_cost_usd != null ? Number(s.actual_cost_usd)
    : s.estimated_cost_usd != null ? Number(s.estimated_cost_usd) : null;
  return {
    id: s.id, thread: s.id, api: true,
    title: title || (preview ? preview.slice(0, 64) : 'Untitled session'),
    snippet: preview || 'No messages yet',
    project: '', cwd: s.cwd || '',
    agent: s.profile || 'default',
    source: srcName(s.source),
    model: s.model || '–',
    msgs: Number(s.message_count) || 0,
    tokens, cost,
    last: ago(ts), days: Math.floor(Math.max(0, Date.now() - ts * 1000) / 86400000),
    ts: ts * 1000,
    state: s.is_active ? 'working' : (s.ended_at ? 'done' : 'idle'),
    endReason: s.end_reason || '',
    archived: !!s.archived, pinned: !!s.pinned,
  };
}

function liveQuery(offset){
  const order = sort === 'oldest' ? 'created' : 'recent';
  let p = '/api/sessions?limit=' + PAGE + '&offset=' + (offset || 0) + '&order=' + order;
  if (fSource) p += '&source=' + encodeURIComponent(fSource);
  return p;
}

async function loadLive(append){
  const my = ++loadSeq;
  live.loading = true; live.error = null; live.mode = 'list';
  if (!append){ live.rows = []; live.offset = 0; }
  repaint();
  try {
    if (!live.stats){
      H.api.get('/api/sessions/stats').then(d => { if (d && typeof d === 'object'){ live.stats = d; repaint(); } })
        .catch(e => { live.statsError = e.message; });
    }
    const data = await H.api.get(liveQuery(append ? live.offset : 0));
    if (my !== loadSeq) return;
    const rows = (Array.isArray(data.sessions) ? data.sessions : []).map(fromApiSession);
    live.rows = append ? live.rows.concat(rows) : rows;
    live.offset = live.rows.length;
    live.total = Number(data.total || 0);
    live.storage = data.storage || {};
    live.hasMore = rows.length > 0 && live.rows.length < live.total;
    if (data.storage && data.storage[Object.keys(data.storage)[0]] === 'corrupt'){
      live.error = 'state.db is unreadable on this profile (database disk image is malformed). Run `hermes doctor` to diagnose before reading History.';
    }
  } catch (e){
    if (my !== loadSeq) return;
    live.error = e && e.status === 0 ? 'Hermes is not reachable · the dashboard backend did not answer.' : (e.message || 'Could not load sessions');
  }
  live.loading = false;
  repaint();
}

async function searchLive(term){
  const my = ++loadSeq;
  live.term = term;
  live.mode = 'search';
  live.loading = true; live.error = null;
  repaint();
  try {
    const data = await H.api.get('/api/sessions/search?q=' + encodeURIComponent(term) + '&limit=50');
    if (my !== loadSeq) return;
    const results = Array.isArray(data.results) ? data.results : [];
    live.rows = results.map(r => {
      const row = fromApiSession(Object.assign({}, r, {id: r.session_id || r.id, preview: r.snippet || r.preview}));
      row.snippet = String(r.snippet || row.snippet).replace(/\s+/g, ' ').slice(0, 160);
      return row;
    });
    live.total = live.rows.length;
    live.hasMore = false;
  } catch (e){
    if (my !== loadSeq) return;
    live.error = (e.message || 'Search failed');
  }
  live.loading = false;
  repaint();
}

/* ---------- module state ---------- */
let q = '';
let fAgent = '';
let fProject = '';
let fSource = '';
let fRange = 'all';
let sort = 'newest';
let selected = new Set();
let archived = new Set();
let deleted = new Set();
let imported = [];
let openId = null;
let bulkDel = false;
let totalSessions = 1284;
let totalMB = 211;
let viewRoot = null;
let appCtx = {};
let searchInput = null;

const toast = msg => (appCtx.toast ? appCtx.toast(msg) : H.toast(msg));
const openThread = id => {
  if (!id) return;
  if (appCtx.openThread) appCtx.openThread(id);
  else if (appCtx.go) appCtx.go('#/thread/' + id);
  else H.toast('Opened thread ' + id);
};
function projectName(id) { return (H.project(id) || {}).name || 'No project'; }
const projectLabel = r => LIVE ? (r.cwd ? baseName(r.cwd) : '–') : projectName(r.project);
const agentOf = id => H.agent(id) || {name:id, hue:212, kind:0, state:'idle'};
const rangeDays = r => r === 'today' ? 0 : Number(r);

function rowsAll(){
  if (LIVE) return live.rows;
  return ROWS.concat(imported).filter(r => !archived.has(r.id) && !deleted.has(r.id));
}
function filtered(){
  if (LIVE) return rowsAll();     /* the server already filtered, sorted and paged */
  const term = q.trim().toLowerCase();
  const out = rowsAll().filter(r => {
    if (fAgent && r.agent !== fAgent) return false;
    if (fProject && r.project !== fProject) return false;
    if (fSource && r.source !== fSource) return false;
    if (fRange !== 'all' && r.days > rangeDays(fRange)) return false;
    if (term && (r.title + ' ' + r.snippet).toLowerCase().indexOf(term) === -1) return false;
    return true;
  });
  const cmp = {
    newest: (a,b) => a.days - b.days,
    oldest: (a,b) => b.days - a.days,
    messages: (a,b) => b.msgs - a.msgs,
    cost: (a,b) => b.cost - a.cost,
  }[sort] || ((a,b) => a.days - b.days);
  out.sort(cmp);
  return out;
}
function selectedRows(){ return rowsAll().filter(r => selected.has(r.id)); }

/* ---------- table ---------- */
function selectNode(label, value, options, onChange, cls){
  const sel = H.h('select.select.history-select', {onchange: e => onChange(e.target.value)},
    options.map(o => H.h('option', {value:o.v, selected:o.v === value ? '' : null}, o.t))
  );
  return H.h('label.history-ctl' + (cls ? '.' + cls : ''),
    H.h('span.history-ctl-l', label),
    sel
  );
}

function controls(){
  if (LIVE) return controlsLive();
  searchInput = H.h('input', {
    type:'search', value:q, placeholder:'Search titles and messages', 'aria-label':'Search sessions',
    oninput: e => { q = e.target.value; paintTable(); }
  });
  return H.h('div.history-controls',
    H.h('div.history-search', H.ic('search','sm'), searchInput),
    selectNode('Agent', fAgent, [
      {v:'', t:'All agents'}, {v:'hermes', t:'Hermes'}, {v:'scout', t:'Scout'}, {v:'ledger', t:'Ledger'},
    ], v => { fAgent = v; draw(); }),
    selectNode('Project', fProject,
      [{v:'', t:'All projects'}].concat(H.data.projects.map(p => ({v:p.id, t:p.name}))),
      v => { fProject = v; draw(); }),
    selectNode('Source', fSource, [
      {v:'', t:'All sources'}, {v:'Web', t:'Web'}, {v:'TUI', t:'TUI'}, {v:'Telegram', t:'Telegram'},
      {v:'Discord', t:'Discord'}, {v:'Cron', t:'Cron'}, {v:'API', t:'API'},
    ], v => { fSource = v; draw(); }),
    selectNode('Date range', fRange, [
      {v:'all', t:'All time'}, {v:'today', t:'Today'}, {v:'7', t:'Last 7 days'},
      {v:'30', t:'Last 30 days'}, {v:'90', t:'Last 90 days'},
    ], v => { fRange = v; draw(); }),
    selectNode('Sort', sort, [
      {v:'newest', t:'Newest first'}, {v:'oldest', t:'Oldest first'},
      {v:'messages', t:'Most messages'}, {v:'cost', t:'Highest cost'},
    ], v => { sort = v; draw(); }),
    H.h('button.btn.sm.history-clear', {type:'button', onclick:clearFilters}, 'Clear')
  );
}

let searchTimer = null;
function controlsLive(){
  searchInput = H.h('input', {
    type:'search', value:LIVE ? live.term : q, placeholder:'Search titles and messages',
    'aria-label':'Search sessions',
    oninput: e => {
      live.term = e.target.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => { if (live.term.trim()) searchLive(live.term.trim()); else loadLive(false); }, 350);
    },
    onkeydown: e => { if (e.key === 'Enter'){ clearTimeout(searchTimer); const v = e.target.value.trim(); v ? searchLive(v) : loadLive(false); } },
  });
  const sources = live.stats && live.stats.by_source ? Object.keys(live.stats.by_source) : [];
  return H.h('div.history-controls',
    H.h('div.history-search', H.ic('search','sm'), searchInput),
    selectNode('Source', fSource, [{v:'', t:'All sources'}].concat(sources.map(s => ({v:s, t:srcName(s)}))),
      v => { fSource = v; loadLive(false); }),
    selectNode('Sort', sort, [
      {v:'newest', t:'Newest activity'}, {v:'oldest', t:'Oldest first'},
    ], v => { sort = v; loadLive(false); }),
    H.h('button.btn.sm.history-clear', {type:'button', onclick:() => { loadLive(false); toast('Reloaded from state.db'); }}, H.ic('retry','sm'), 'Refresh'),
    H.h('button.btn.sm.history-clear', {type:'button', onclick:clearFilters}, 'Clear')
  );
}

function clearFilters(){
  q = ''; fAgent = ''; fProject = ''; fSource = ''; fRange = 'all'; sort = 'newest';
  live.term = ''; live.mode = 'list';
  if (LIVE){ live.rows = []; loadLive(false); toast('Filters cleared'); return; }
  draw();
  toast('Filters cleared');
}

function headCheckbox(list){
  const n = list.filter(r => selected.has(r.id)).length;
  const cb = H.h('input.history-cb.history-head-cb', {
    type:'checkbox', 'aria-label':'Select all visible sessions',
    checked: n > 0 && n === list.length ? '' : null,
    onchange: e => {
      const on = e.target.checked;
      filtered().forEach(r => on ? selected.add(r.id) : selected.delete(r.id));
      paintTable();
    },
  });
  cb.indeterminate = n > 0 && n < list.length;
  return H.h('label.history-cbwrap', {onclick: e => e.stopPropagation()}, cb);
}

function rowNode(r){
  const isSel = selected.has(r.id);
  const cb = H.h('input.history-cb', {
    type:'checkbox', 'aria-label':'Select ' + r.title,
    checked: isSel ? '' : null,
    onchange: e => {
      const on = e.target.checked;
      if (on) selected.add(r.id); else selected.delete(r.id);
      const tr = viewRoot.querySelector('tr[data-id="' + r.id + '"]');
      if (tr) tr.classList.toggle('is-sel', on);
      syncHeadCheck();
      paintBulk();
    },
  });
  return H.h('tr.history-tr' + (isSel ? '.is-sel' : ''), {
    'data-id':r.id, tabindex:'0', 'aria-label':'Preview session: ' + r.title,
    onclick: () => { openId = r.id; paintDrawer(); },
    onkeydown: e => {
      if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openId = r.id; paintDrawer(); }
    },
  },
    H.h('td.history-cbcell', H.h('label.history-cbwrap', {onclick: e => e.stopPropagation()}, cb)),
    H.h('td.history-title-cell', H.h('div.history-t', {title:r.title}, r.title)),
    H.h('td.history-snip-cell', H.h('div.history-snip', {title:r.snippet}, r.snippet)),
    H.h('td.history-projcell', H.h('div.history-proj', {title:LIVE ? (r.cwd || '') : projectName(r.project)}, projectLabel(r))),
    H.h('td.history-avcell', H.avatar(agentOf(r.agent), 24, 'idle')),
    H.h('td', H.pill(r.source)),
    H.h('td.history-modelcell', H.h('div.history-model', {title:r.model}, r.model)),
    H.h('td.r.num', H.fmt.n(r.msgs)),
    H.h('td.r.num', r.tokens ? H.fmt.k(r.tokens) : '–'),
    H.h('td.r.num', r.cost == null ? '–' : H.fmt.usd(r.cost)),
    H.h('td.history-last', r.last)
  );
}

function tableCard(){
  const list = filtered();
  const card = H.h('section.card.history-card');
  const bulkHost = H.h('div.history-bulk-host');
  card.appendChild(bulkHost);

  const countLine = LIVE
    ? (live.loading ? 'Loading sessions…'
      : live.mode === 'search' ? 'Matches for “' + live.term + '” · ' + list.length
      : 'Showing ' + list.length + ' of ' + H.fmt.n(live.total) + ' sessions')
    : 'Showing ' + list.length + ' of ' + rowsAll().length + ' sessions';

  card.appendChild(H.h('div.history-card-top',
    H.h('span.history-showing', countLine),
    H.h('span.history-hint', LIVE ? 'Click a row to read the transcript · server search on Enter' : 'Click a row to preview · Space to select')
  ));

  const table = H.h('table.tbl.history-table',
    H.h('thead', H.h('tr',
      H.h('th.history-cbcell', {scope:'col'}, headCheckbox(list)),
      H.h('th', {scope:'col'}, 'Title'),
      H.h('th', {scope:'col'}, 'Snippet'),
      H.h('th', {scope:'col'}, LIVE ? 'Workspace' : 'Project'),
      H.h('th.history-avcell', {scope:'col'}, 'Agent'),
      H.h('th', {scope:'col'}, 'Source'),
      H.h('th', {scope:'col'}, 'Model'),
      H.h('th.r', {scope:'col'}, 'Messages'),
      H.h('th.r', {scope:'col'}, 'Tokens'),
      H.h('th.r', {scope:'col'}, 'Cost'),
      H.h('th', {scope:'col'}, 'Last active')
    )),
    H.h('tbody', list.map(rowNode))
  );
  if (list.length) card.appendChild(H.h('div.scroll-x.history-scroll', table));

  if (LIVE && live.error){
    card.appendChild(H.h('div.empty.history-empty', {role:'alert'},
      H.ic('warn','lg'),
      H.h('div.history-empty-t', 'Couldn’t load History'),
      H.h('div.history-empty-s', live.error),
      H.h('button.btn.sm', {type:'button', onclick:() => LIVE ? loadLive(false) : draw()}, H.ic('retry','sm'), 'Retry')
    ));
  } else if (LIVE && live.loading && !list.length){
    card.appendChild(H.h('div.empty.history-empty',
      H.h('div.history-empty-t', 'Loading sessions…'),
      H.h('div.history-empty-s', 'Reading state.db through the dashboard API.')
    ));
  } else if (!list.length){
    const searching = LIVE ? live.mode === 'search' : !!q;
    card.appendChild(H.h('div.empty.history-empty',
      H.ic('search','lg'),
      H.h('div.history-empty-t', searching ? 'No sessions mention “' + (LIVE ? live.term : q) + '”' : LIVE ? 'No sessions yet' : 'No sessions match these filters'),
      H.h('div.history-empty-s', searching
        ? 'Search runs over message text in state.db.'
        : LIVE ? 'Threads appear here once Hermes or a channel starts one.' : 'Try another agent, project, source or date range.'),
      searching || !LIVE ? H.h('button.btn.sm', {type:'button', onclick:clearFilters}, LIVE ? 'Back to all sessions' : 'Clear filters') : null
    ));
  }

  if (LIVE && live.hasMore && !live.loading && !live.error){
    card.appendChild(H.h('div.history-more',
      H.h('button.btn', {type:'button', onclick:() => loadLive(true)}, 'Load ' + PAGE + ' more')
    ));
  }
  return card;
}

function paintBulk(){
  const host = viewRoot.querySelector('.history-bulk-host');
  if (!host) return;
  host.replaceChildren();
  if (!selected.size) return;
  const n = selected.size;
  const bar = H.h('div.history-bulk');
  bar.appendChild(H.h('div.history-bulk-line',
    H.h('span.history-bulk-n', n + ' selected'),
    H.h('span.history-bulk-sp'),
    H.h('button.btn.sm', {type:'button', onclick:() => openExport('json')}, H.ic('download','sm'), 'Export JSON'),
    H.h('button.btn.sm', {type:'button', onclick:() => openExport('md')}, H.ic('download','sm'), 'Export Markdown'),
    H.h('button.btn.sm', {type:'button', onclick:archiveSelected}, H.ic('archive','sm'), 'Archive'),
    H.h('button.btn.sm.danger', {type:'button', onclick:() => { bulkDel = true; paintBulk(); }}, H.ic('trash','sm'), 'Delete')
  ));
  if (bulkDel){
    bar.appendChild(H.h('div.history-bulk-confirm',
      H.h('span.history-bulk-warn', 'Delete ' + n + ' session' + (n === 1 ? '' : 's') + ' from state.db? Messages, tool output and token rows go with them. This cannot be undone.'),
      H.h('button.btn.sm.danger', {type:'button', onclick:deleteSelected}, 'Delete permanently'),
      H.h('button.btn.sm.ghost', {type:'button', onclick:() => { bulkDel = false; paintBulk(); }}, 'Cancel')
    ));
  }
  host.appendChild(bar);
}
function paintTable(){
  const card = viewRoot.querySelector('.history-card');
  if (!card) return;
  const fresh = tableCard();
  card.replaceWith(fresh);
  paintBulk();
  if (openId && !rowsAll().some(r => r.id === openId)){ openId = null; paintDrawer(); }
}
/* live repaint: swap the table + footer without rebuilding the controls (keeps search focus) */
function repaint(){
  if (!viewRoot) return;
  if (!viewRoot.querySelector('.history-card') || !viewRoot.querySelector('.history-controls')){ draw(); return; }
  paintTable();
  const f = viewRoot.querySelector('.history-foot');
  if (f) f.replaceWith(footer());
}
function syncHeadCheck(){
  const list = filtered();
  const cb = viewRoot.querySelector('.history-head-cb');
  if (!cb) return;
  const n = list.filter(r => selected.has(r.id)).length;
  cb.checked = n > 0 && n === list.length;
  cb.indeterminate = n > 0 && n < list.length;
}

/* ---------- real session mutations (live only) ---------- */
function uuid(){
  try { if (crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
  const b = new Uint8Array(16);
  try { crypto.getRandomValues(b); } catch (e) { for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256); }
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
/* PATCH/DELETE need the snapshot identity the dashboard's session client sends */
async function mutationIdentity(id){
  const s = await H.api.get('/api/sessions/' + encodeURIComponent(id) + '/mutation-snapshot');
  if (!s || s.exists !== true || !Number.isSafeInteger(s.runtime_revision)){
    throw new Error('Session ' + id.slice(0, 8) + '… no longer exists · refresh the list');
  }
  const out = {request_id: uuid(), expected_revision: s.runtime_revision};
  if (Number.isSafeInteger(s.runtime_generation)) out.expected_generation = s.runtime_generation;
  return out;
}
async function patchSession(id, payload){
  const idn = await mutationIdentity(id);
  return H.api.patch('/api/sessions/' + encodeURIComponent(id), Object.assign({}, payload, idn));
}
async function deleteSession(id){
  const idn = await mutationIdentity(id);
  const qs = new URLSearchParams(Object.entries(idn).map(([k,v]) => [k, String(v)])).toString();
  return H.api.del('/api/sessions/' + encodeURIComponent(id) + '?' + qs);
}

function archiveSelected(){
  const n = selected.size;
  if (!n) return;
  if (LIVE){
    const ids = selectedRows().map(r => r.id);
    selected.clear(); bulkDel = false;
    (async () => {
      let done = 0, failed = 0, lastErr = '';
      for (const id of ids){
        try { await patchSession(id, {archived: true}); done++; }
        catch (e){ failed++; lastErr = e.message; }
      }
      openId = null; paintDrawer();
      await loadLive(false);
      toast(failed ? 'Archived ' + done + ', ' + failed + ' failed · ' + lastErr : done + ' session' + (done === 1 ? '' : 's') + ' archived');
    })();
    draw();
    return;
  }
  selectedRows().forEach(r => archived.add(r.id));
  selected.clear();
  bulkDel = false;
  openId = null;
  paintDrawer();
  draw();
  toast(n + ' session' + (n === 1 ? '' : 's') + ' archived');
}
function deleteSelected(){
  const n = selected.size;
  if (!n) return;
  if (LIVE){
    const ids = selectedRows().map(r => r.id);
    selected.clear(); bulkDel = false;
    (async () => {
      try {
        const res = await H.api.post('/api/sessions/bulk-delete', {ids});
        openId = null; paintDrawer();
        await loadLive(false);
        const skipped = (res && res.skipped_active) || [];
        toast('Deleted ' + ((res && res.deleted) || 0) + ' session' + (((res && res.deleted) || 0) === 1 ? '' : 's')
          + (skipped.length ? ' · ' + skipped.length + ' still running, kept' : ''));
      } catch (e){ toast('Delete failed · ' + e.message); }
    })();
    draw();
    return;
  }
  selected.forEach(id => deleted.add(id));
  selected.clear();
  bulkDel = false;
  openId = null;
  totalSessions = Math.max(0, totalSessions - n);
  totalMB = Math.max(0, totalMB - Math.round(n * 0.7));
  draw();
  toast(n + ' session' + (n === 1 ? '' : 's') + ' deleted from state.db');
}

/* ---------- drawer ---------- */
function paintDrawer(){
  if (!viewRoot) return;
  viewRoot.querySelectorAll('.history-scrim,.history-drawer').forEach(n => n.remove());
  if (!openId) return;
  const r = rowsAll().filter(x => x.id === openId)[0];
  if (!r){ openId = null; return; }
  if (LIVE) return paintLiveDrawer(r);
  const ag = agentOf(r.agent);

  const close = () => { openId = null; paintDrawer(); };
  const scrim = H.h('div.scrim.history-scrim', {onclick: close});
  const drawer = H.h('aside.history-drawer', {role:'dialog', 'aria-label':'Session preview: ' + r.title},
    H.h('div.history-drawer-head',
      H.h('div.history-drawer-kicker', 'Session preview'),
      H.h('button.btn.sm.icon', {type:'button', 'aria-label':'Close preview', onclick: close}, H.ic('x','sm')),
      H.h('h2.history-drawer-t', r.title),
      H.h('div.history-drawer-sub',
        H.avatar(ag, 22, 'idle'),
        H.h('span', ag.name),
        H.h('span', '·'),
        H.h('span', r.last),
        H.h('span', '·'),
        H.h('span.mono', r.id)
      ),
      H.h('dl.history-drawer-meta',
        H.h('dt','Project'), H.h('dd', projectName(r.project)),
        H.h('dt','Source'), H.h('dd', H.pill(r.source)),
        H.h('dt','Model'), H.h('dd.history-model', r.model),
        H.h('dt','Messages'), H.h('dd.num', H.fmt.n(r.msgs)),
        H.h('dt','Tokens'), H.h('dd.num', H.fmt.k(r.tokens)),
        H.h('dt','Cost'), H.h('dd.num', H.fmt.usd(r.cost))
      ),
      H.h('div.history-drawer-actions',
        H.h('button.btn.primary', {type:'button', onclick:() => { const id = r.thread || r.id; close(); openThread(id); }}, H.ic('external','sm'), 'Open thread'),
        H.h('button.btn', {type:'button', onclick:() => { close(); toast('Forked at the last message'); }}, H.ic('fork','sm'), 'Fork'),
        H.h('button.btn', {type:'button', onclick:() => { const id = r.thread || r.id; close(); openThread(id); toast('Resumed · new turn started'); }}, H.ic('play','sm'), 'Resume')
      )
    ),
    H.h('div.history-drawer-body',
      H.h('div.history-msg',
        H.h('div.history-msg-h', H.h('span.history-label','First message'), H.h('span.history-msg-meta', r.days ? r.last : 'today')),
        H.h('p.history-msg-t', r.first)
      ),
      H.h('div.history-msg',
        H.h('div.history-msg-h', H.h('span.history-label','Last message'), H.h('span.history-msg-meta', r.last)),
        H.h('p.history-msg-t', r.lastMsg)
      ),
      H.h('div.history-note', H.ic('info','sm'), H.h('span','Preview reads from state.db. Attachments and tool output stay in the thread.'))
    )
  );
  viewRoot.append(scrim, drawer);
}

/* ---------- live preview drawer: real transcript from /api/sessions/{id}/messages ---------- */
function paintLiveDrawer(r){
  const close = () => { openId = null; paintDrawer(); };
  const scrim = H.h('div.scrim.history-scrim', {onclick: close});
  const bodyHost = H.h('div.history-drawer-body');
  const busy = H.h('div.history-note', {hidden:true});

  const drawer = H.h('aside.history-drawer', {role:'dialog', 'aria-label':'Session: ' + r.title},
    H.h('div.history-drawer-head',
      H.h('div.history-drawer-kicker', 'Session'),
      H.h('button.btn.sm.icon', {type:'button', 'aria-label':'Close preview', onclick: close}, H.ic('x','sm')),
      H.h('h2.history-drawer-t', r.title),
      H.h('div.history-drawer-sub',
        H.avatar(agentOf(r.agent), 22, 'idle'),
        H.h('span', r.agent),
        H.h('span', '·'),
        H.h('span', r.last),
        H.h('span', '·'),
        H.h('span.mono', r.id)
      ),
      H.h('dl.history-drawer-meta',
        H.h('dt','Workspace'), H.h('dd', H.h('span.mono', r.cwd || '–')),
        H.h('dt','Source'), H.h('dd', H.pill(r.source)),
        H.h('dt','Model'), H.h('dd.history-model', r.model),
        H.h('dt','Messages'), H.h('dd.num', H.fmt.n(r.msgs)),
        H.h('dt','Tokens'), H.h('dd.num', r.tokens ? H.fmt.k(r.tokens) : '–'),
        H.h('dt','Cost'), H.h('dd.num', r.cost == null ? '–' : H.fmt.usd(r.cost)),
        r.endReason ? H.h('dt','Ended') : null, r.endReason ? H.h('dd.mono', r.endReason) : null
      ),
      H.h('div.history-drawer-actions',
        H.h('button.btn.primary', {type:'button', onclick:() => { close(); openThread(r.thread || r.id); }}, H.ic('external','sm'), 'Open thread'),
        H.h('button.btn', {type:'button', onclick:() => { close(); openThread(r.thread || r.id); toast('Resumed · the thread takes new turns'); }}, H.ic('play','sm'), 'Resume'),
        H.h('button.btn', {type:'button', onclick:() => renameDialog(r)}, H.ic('edit','sm'), 'Rename'),
        H.h('button.btn', {type:'button', onclick:() => exportSession(r)}, H.ic('download','sm'), 'Export'),
        H.h('button.btn.danger', {type:'button', onclick:() => deleteDialog(r)}, H.ic('trash','sm'), 'Delete')
      )
    ),
    bodyHost
  );
  drawer.appendChild(busy);
  viewRoot.append(scrim, drawer);
  loadLiveTranscript(r, bodyHost);
}

async function loadLiveTranscript(r, host){
  host.replaceChildren(H.h('div.history-note', H.ic('clock','sm'), H.h('span','Reading the transcript…')));
  try {
    const [firstRes, lastRes] = await Promise.all([
      H.api.get('/api/sessions/' + encodeURIComponent(r.id) + '/messages?limit=1&order=oldest'),
      H.api.get('/api/sessions/' + encodeURIComponent(r.id) + '/messages?limit=6&order=latest'),
    ]);
    if (openId !== r.id || !host.isConnected) return;
    const first = (firstRes.messages || [])[0];
    const last = (lastRes.messages || []).filter(m => String(m.content || '').trim());
    const msg = (m, label, when) => H.h('div.history-msg',
      H.h('div.history-msg-h', H.h('span.history-label', label), H.h('span.history-msg-meta', when)),
      H.h('p.history-msg-t', String(m.content || '').replace(/\s+\n/g, '\n').slice(0, 900))
    );
    host.replaceChildren();
    if (first) host.appendChild(msg(first, (first.role === 'user' ? 'First message' : 'First message · ' + first.role), ago(first.timestamp)));
    last.forEach((m, i) => {
      if (first && m.id === first.id) return;
      host.appendChild(msg(m, m.role === 'user' ? 'You' : m.role === 'assistant' ? 'Hermes' : m.role + (m.tool_name ? ' · ' + m.tool_name : ''), ago(m.timestamp)));
    });
    if (!first) host.appendChild(H.h('div.history-note', H.ic('info','sm'), H.h('span','This session has no stored messages.')));
    host.appendChild(H.h('div.history-note', H.ic('info','sm'), H.h('span','Read from state.db · long messages are shortened here; the thread has the full transcript.')));
  } catch (e){
    if (openId !== r.id || !host.isConnected) return;
    host.replaceChildren(H.h('div.history-note', {role:'alert'}, H.ic('warn','sm'),
      H.h('span', 'Couldn’t read the transcript: ' + (e.message || 'request failed')),
      H.h('button.btn.sm', {type:'button', onclick:() => loadLiveTranscript(r, host)}, 'Retry')
    ));
  }
}

function renameDialog(r){
  const input = H.h('input.input', {type:'text', value:r.title, 'aria-label':'Session title', maxlength:'200'});
  const err = H.h('div.history-err', {hidden:true});
  const body = H.h('div.history-modal',
    H.h('h2.history-modal-h', 'Rename session'),
    H.h('p.history-modal-p', 'The title is stored in state.db and shows in every client.'),
    H.h('div.history-field', H.h('span.history-label','Title'), input),
    err
  );
  const m = H.modal(body, {width:480});
  const save = async () => {
    const v = input.value.trim();
    if (!v){ err.hidden = false; err.textContent = 'Type a title first.'; input.focus(); return; }
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';
    try {
      await patchSession(r.id, {title: v});
      const row = live.rows.filter(x => x.id === r.id)[0];
      if (row) row.title = v;
      m.close();
      toast('Renamed');
      draw();
    } catch (e){
      err.hidden = false; err.textContent = 'Rename failed: ' + e.message;
      saveBtn.disabled = false; saveBtn.textContent = 'Save';
    }
  };
  const saveBtn = H.h('button.btn.primary', {type:'button', onclick:save}, 'Save');
  input.onkeydown = e => { if (e.key === 'Enter') save(); };
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Cancel'), saveBtn
  ));
  setTimeout(() => input.focus(), 30);
}

function deleteDialog(r){
  const err = H.h('div.history-err', {hidden:true});
  const body = H.h('div.history-modal',
    H.h('h2.history-modal-h', 'Delete this session?'),
    H.h('p.history-modal-p', '“' + r.title + '” and its ' + H.fmt.n(r.msgs) + ' stored messages are deleted from state.db. This cannot be undone.'),
    err
  );
  const m = H.modal(body, {width:480});
  const btn = H.h('button.btn.danger', {type:'button', onclick: async () => {
    btn.disabled = true; btn.textContent = 'Deleting…';
    try {
      await deleteSession(r.id);
      selected.delete(r.id);
      openId = null; m.close(); paintDrawer();
      toast('Session deleted');
      await loadLive(false);
    } catch (e){
      err.hidden = false; err.textContent = 'Delete failed: ' + e.message;
      btn.disabled = false; btn.textContent = 'Delete';
    }
  }}, 'Delete permanently');
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Cancel'), btn
  ));
}

async function exportSession(r){
  try {
    const data = await H.api.get('/api/sessions/' + encodeURIComponent(r.id) + '/export');
    const name = 'hermes-session-' + String(r.id).replace(/[^\w.-]/g, '_') + '.json';
    if (download(name, JSON.stringify(data, null, 2), 'application/json')) toast('Downloaded ' + name);
    else toast('Download blocked by the browser');
  } catch (e){ toast('Export failed · ' + e.message); }
}

/* ---------- dialogs ---------- */
function download(name, text, mime){
  try {
    const blob = new Blob([text], {type:mime});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch (e) { return false; }
}
function copyText(text){
  try {
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(() => toast('Copied'), () => toast('Copy failed · select the text'));
    } else toast('Copy not available here');
  } catch (e) { toast('Copy failed · select the text'); }
}

function exportText(fmt, rows){
  if (fmt === 'json'){
    return JSON.stringify({
      exported: todayLabel(),
      count: rows.length,
      sessions: rows.map(r => ({
        id:r.id, title:r.title, snippet:r.snippet, project:projectLabel(r),
        agent:r.agent, source:r.source, model:r.model, messages:r.msgs,
        tokens:r.tokens, cost:r.cost, lastActive:r.last,
      })),
    }, null, 2);
  }
  const head = '| Title | ' + (LIVE ? 'Workspace' : 'Project') + ' | Agent | Source | Model | Messages | Tokens | Cost | Last active |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const body = rows.map(r => '| ' + [r.title, projectLabel(r), agentOf(r.agent).name, r.source, r.model,
    r.msgs, r.tokens ? H.fmt.k(r.tokens) : '–', r.cost == null ? '–' : H.fmt.usd(r.cost), r.last].join(' | ') + ' |').join('\n');
  return '# Hermes session export\n\n' + todayLabel() + ' · ' + rows.length + ' sessions\n\n' + head + '\n' + body + '\n';
}

function openExport(fmt){
  const rows = selectedRows();
  if (!rows.length) return;
  const text = exportText(fmt, rows);
  const name = 'hermes-history-' + new Date().toISOString().slice(0, 10) + (fmt === 'json' ? '.json' : '.md');
  const body = H.h('div.history-modal',
    H.h('h2.history-modal-h', 'Export ' + rows.length + ' session' + (rows.length === 1 ? '' : 's') + ' as ' + (fmt === 'json' ? 'JSON' : 'Markdown')),
    H.h('p.history-modal-p', fmt === 'json' ? 'One object per session, with title, model, tokens and cost. Attachments are not included.' : 'A table you can paste into a note or a commit message.'),
    H.h('pre.history-export-pre', text)
  );
  const m = H.modal(body, {width:640});
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.primary', {type:'button', onclick:() => {
      if (download(name, text, fmt === 'json' ? 'application/json' : 'text/markdown')) toast('Downloaded ' + name);
      else toast('Download blocked by the browser');
    }}, H.ic('download','sm'), 'Download'),
    H.h('button.btn', {type:'button', onclick:() => copyText(text)}, H.ic('copy','sm'), 'Copy'),
    H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Close')
  ));
}

function pruneDialog(){
  if (LIVE) return pruneDialogLive();
  const old = rowsAll().filter(r => r.days > 30);
  const n = old.length;
  const mb = Math.round(n * 0.8);
  const body = H.h('div.history-modal',
    H.h('h2.history-modal-h', 'Prune older than 30 days'),
    H.h('p.history-modal-p',
      n ? 'This removes ' + n + ' session' + (n === 1 ? '' : 's') + ' last active before 20 Oct 2026 · about ' + mb + ' MB in state.db.'
        : 'Nothing is older than 30 days right now. The cutoff is 20 Oct 2026.')
  );
  if (n){
    body.appendChild(H.h('p.history-modal-p',
      'Messages, tool output and token rows are deleted. History keeps the title and metadata. state.db is checkpointed and vacuumed afterwards, and the file cannot be undeleted.'));
    body.appendChild(H.h('div.history-prune-list', old.slice(0, 5).map(r =>
      H.h('div.history-prune-row', H.h('span.history-prune-t', r.title), H.h('span.history-prune-d', r.last))
    ).concat(old.length > 5 ? [H.h('div.history-prune-more', '+ ' + (old.length - 5) + ' more')] : [])));
  }
  const m = H.modal(body, {width:540});
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Cancel'),
    n ? H.h('button.btn.danger', {type:'button', onclick:() => {
      old.forEach(r => deleted.add(r.id));
      totalSessions = Math.max(0, totalSessions - n);
      totalMB = Math.max(0, totalMB - mb);
      selected.clear();
      openId = null;
      m.close();
      draw();
      toast(n + ' old sessions pruned');
    }}, 'Prune ' + n + ' sessions') : H.h('button.btn', {type:'button', onclick:m.close}, 'Close')
  ));
}

function importDialogLive(){
  const body = H.h('div.history-modal');
  let picked = null;
  const nameRow = H.h('div.history-picked', {hidden:true});
  const nameEl = H.h('span.history-picked-name');
  nameRow.append(H.ic('file','sm'), nameEl);
  const err = H.h('div.history-err', {hidden:true});

  const input = H.h('input', {type:'file', accept:'.json,application/json', style:{display:'none'},
    onchange: e => { if (e.target.files && e.target.files[0]) pick(e.target.files[0]); }
  });
  const zone = H.h('div.history-drop', {tabindex:'0', role:'button', 'aria-label':'Choose a session file'},
    H.ic('upload','lg'),
    H.h('div.history-drop-t', 'Drop a session export here'),
    H.h('button.btn.sm.history-drop-btn', {type:'button', onclick: e => { e.stopPropagation(); input.click(); }}, 'Choose a file'),
    H.h('div.history-drop-h', '.json from History → Export')
  );
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', e => { if (e.target === zone && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); input.click(); } });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('is-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault(); zone.classList.remove('is-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0]);
  });

  const importBtn = H.h('button.btn.primary', {type:'button', disabled:true, onclick: async () => {
    if (!picked) return;
    err.hidden = true;
    importBtn.disabled = true; importBtn.textContent = 'Importing…';
    try {
      const raw = await picked.text();
      let parsed;
      try { parsed = JSON.parse(raw); }
      catch (e){ throw new Error('That file is not JSON. Use the .json a session export produces.'); }
      let sessions = [];
      if (Array.isArray(parsed)) sessions = parsed;
      else if (parsed && Array.isArray(parsed.sessions)) sessions = parsed.sessions;
      else if (parsed && (parsed.id || parsed.session_id)) sessions = [parsed];
      if (!sessions.length) throw new Error('No session found in that file.');
      if (sessions.length > 200) throw new Error('Import at most 200 sessions at a time.');
      const res = await H.api.post('/api/sessions/import', {
        request_id: uuid(), expected_revision: 0, sessions: sessions,
        profile: H.api.profile || undefined,
      });
      m.close();
      toast('Imported ' + sessions.length + ' session' + (sessions.length === 1 ? '' : 's'));
      await loadLive(false);
      if (res && res.ids && res.ids[0]) { openId = res.ids[0]; paintDrawer(); }
    } catch (e){
      err.hidden = false; err.textContent = 'Import failed: ' + e.message;
      importBtn.disabled = false; importBtn.textContent = 'Import';
    }
  }}, 'Import');

  function pick(file){
    picked = file;
    nameEl.textContent = file.name;
    nameRow.hidden = false;
    err.hidden = true;
    importBtn.disabled = false;
  }

  body.append(
    H.h('h2.history-modal-h', 'Import session'),
    H.h('p.history-modal-p', 'Bring a session export from another machine or profile into this state.db. The file is read in the browser and posted to POST /api/sessions/import; nothing else leaves this machine.'),
    zone, input, nameRow, err,
    H.h('div.history-note', H.ic('info','sm'), H.h('span','The import keeps the stored id, timestamps and messages. Existing ids are rejected by the server, not overwritten.'))
  );
  const m = H.modal(body, {width:560});
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Cancel'), importBtn
  ));
}

function repairDialog(){
  const steps = [
    'Stop the gateway: hermes gateway stop',
    'Quit Hermes Desktop, then stop the dashboard: hermes dashboard --stop',
    'Run hermes doctor until no process is holding state.db; kill only the PIDs it lists.',
    'Repair, then start one owner: hermes sessions repair, then the gateway or Desktop.',
  ];
  const plain = steps.map((s, i) => (i + 1) + '. ' + s).join('\n');
  const body = H.h('div.history-modal',
    H.h('h2.history-modal-h', 'Repair state.db'),
    H.h('p.history-modal-p', 'Repair and optimize need the database quiet. Four steps, in order:'),
    H.h('ol.history-steps',
      H.h('li', 'Stop the gateway: ', H.h('code.history-code','hermes gateway stop')),
      H.h('li', 'Quit Hermes Desktop, then stop the dashboard: ', H.h('code.history-code','hermes dashboard --stop')),
      H.h('li', 'Run ', H.h('code.history-code','hermes doctor'), ' until no process is holding state.db; kill only the PIDs it lists.'),
      H.h('li', 'Run ', H.h('code.history-code','hermes sessions repair'), ', then start one owner · the gateway or Desktop, not both.')
    ),
    H.h('div.history-note', H.ic('warn','sm'), H.h('span','Nothing here runs anything. Never delete state.db-wal by hand · it is part of the database.')),
    H.h('p.history-modal-p.history-modal-faint', 'The dialog only explains; the commands run in your terminal.')
  );
  const m = H.modal(body, {width:560});
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.primary', {type:'button', onclick:() => copyText(plain)}, H.ic('copy','sm'), 'Copy steps'),
    H.h('button.btn', {type:'button', onclick:m.close}, 'Close')
  ));
}

async function pruneDialogLive(){
  const body = H.h('div.history-modal',
    H.h('h2.history-modal-h', 'Prune sessions older than 30 days'),
    H.h('p.history-modal-p', 'Checking what matches in state.db…')
  );
  const m = H.modal(body, {width:560});
  let preview = null;
  try {
    preview = await H.api.post('/api/sessions/prune', {older_than_days: 30, dry_run: true});
  } catch (e){
    body.replaceChildren(
      H.h('h2.history-modal-h', 'Prune sessions older than 30 days'),
      H.h('p.history-modal-p', 'Couldn’t read the prune preview: ' + e.message),
      H.h('div.history-modal-actions',
        H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Close'),
        H.h('button.btn', {type:'button', onclick:() => { m.close(); pruneDialogLive(); }}, 'Retry'))
    );
    return;
  }
  const n = Number(preview.matched || 0);
  const skipped = Number(preview.skipped_open || 0);
  const rows = Array.isArray(preview.sessions) ? preview.sessions : [];
  body.replaceChildren(
    H.h('h2.history-modal-h', 'Prune sessions older than 30 days'),
    H.h('p.history-modal-p', n
      ? 'This permanently removes ' + H.fmt.n(n) + ' ended session' + (n === 1 ? '' : 's') + ' last active before 20 Oct 2026.'
        + (skipped ? ' ' + skipped + ' still running will be kept.' : '')
      : 'Nothing matched. No ended session on this profile is older than 30 days.'),
    n ? H.h('p.history-modal-p', 'Messages, tool output and token rows go with them. Compression chains are pruned whole; state.db is checkpointed afterwards.') : null
  );
  if (rows.length){
    body.appendChild(H.h('div.history-prune-list', rows.slice(0, 5).map(r =>
      H.h('div.history-prune-row',
        H.h('span.history-prune-t', String(r.title || r.preview || r.id || '').slice(0, 80) || r.id),
        H.h('span.history-prune-d', ago(r.last_active)))
    ).concat(rows.length > 5 ? [H.h('div.history-prune-more', '+ ' + (rows.length - 5) + ' more')] : [])));
  }
  const err = H.h('div.history-err', {hidden:true});
  body.appendChild(err);
  const go = H.h('button.btn.danger', {type:'button', onclick: async () => {
    go.disabled = true; go.textContent = 'Pruning…';
    try {
      const res = await H.api.post('/api/sessions/prune', {older_than_days: 30});
      m.close();
      selected.clear(); openId = null; paintDrawer();
      await loadLive(false);
      toast((res && res.removed ? res.removed + ' sessions pruned' : 'Nothing left to prune'));
    } catch (e){
      err.hidden = false; err.textContent = 'Prune failed: ' + e.message;
      go.disabled = false; go.textContent = 'Prune ' + n + ' sessions';
    }
  }}, 'Prune ' + n + ' session' + (n === 1 ? '' : 's'));
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Cancel'),
    n ? go : H.h('button.btn', {type:'button', onclick:m.close}, 'Close')
  ));
}

function importDialog(){
  if (LIVE) return importDialogLive();
  const body = H.h('div.history-modal');
  let picked = '';
  const nameRow = H.h('div.history-picked', {hidden:true});
  const nameEl = H.h('span.history-picked-name');
  nameRow.appendChild(H.ic('file','sm'));
  nameRow.appendChild(nameEl);

  const input = H.h('input', {type:'file', accept:'.json,.jsonl,application/json', style:{display:'none'},
    onchange: e => { if (e.target.files && e.target.files[0]) pick(e.target.files[0].name); }
  });
  const zone = H.h('div.history-drop', {tabindex:'0', role:'button', 'aria-label':'Choose a session file'},
    H.ic('upload','lg'),
    H.h('div.history-drop-t', 'Drop a session file here'),
    H.h('button.btn.sm.history-drop-btn', {type:'button', onclick: e => { e.stopPropagation(); input.click(); }}, 'Choose a file'),
    H.h('div.history-drop-h', '.jsonl or .json · up to 64 MB')
  );
  zone.addEventListener('click', () => input.click());
  zone.addEventListener('keydown', e => { if (e.target === zone && (e.key === 'Enter' || e.key === ' ')){ e.preventDefault(); input.click(); } });
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('is-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('is-over');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) pick(e.dataTransfer.files[0].name);
  });

  const importBtn = H.h('button.btn.primary', {type:'button', disabled:true, onclick:() => {
    const name = picked;
    m.close();
    imported.unshift({
      id:'imp-' + Date.now(), title:'Imported ' + name.replace(/\.(jsonl|json)$/i, ''), snippet:'Imported transcript · model kept from the file',
      project:'ops', agent:'hermes', source:'API', model:'claude-sonnet-5-5', msgs:12, tokens:24000, cost:0.32,
      last:'just now', days:0,
      first:'You: (imported) Pick up the gateway restart postmortem from here.',
      lastMsg:'Hermes: (imported) The last turn ended with the restart approved and the log attached.',
    });
    totalSessions += 1;
    selected.clear();
    openId = null;
    draw();
    toast('Imported 1 session from ' + name);
  }}, 'Import');

  function pick(name){
    picked = name;
    nameEl.textContent = name;
    nameRow.hidden = false;
    importBtn.disabled = false;
  }

  body.append(
    H.h('h2.history-modal-h', 'Import session'),
    H.h('p.history-modal-p', 'Bring a transcript from another machine or an older profile. Hermes reads .jsonl or .json and writes a normal thread · nothing leaves this machine.'),
    zone,
    input,
    nameRow,
    H.h('div.history-drop-actions',
      H.h('button.btn.ghost.sm', {type:'button', onclick:() => pick('session-2026-11-12T09-14-02.jsonl')}, 'Use a sample file')
    ),
    H.h('div.history-note', H.ic('info','sm'), H.h('span','Imported sessions keep their model, timestamps and tool output. They are charged to the original project.'))
  );
  const m = H.modal(body, {width:560});
  body.appendChild(H.h('div.history-modal-actions',
    H.h('button.btn.ghost', {type:'button', onclick:m.close}, 'Cancel'),
    importBtn
  ));
}

/* ---------- shell ---------- */
function footer(){
  if (LIVE){
    const st = live.stats;
    return H.h('div.history-foot',
      H.h('span.dot' + (live.error || live.storage && Object.keys(live.storage).length ? '.neg' : '.pos')),
      H.h('span', st
        ? 'state.db · ' + H.fmt.n(st.total) + ' sessions · ' + H.fmt.n(st.messages) + ' messages' + (st.archived ? ' · ' + H.fmt.n(st.archived) + ' archived' : '')
        : live.statsError ? 'state.db stats unavailable · ' + live.statsError : 'state.db · counting…'),
      H.h('span.history-foot-sep', '·'),
      H.h('button.history-link', {type:'button', onclick:repairDialog}, 'Repair…')
    );
  }
  return H.h('div.history-foot',
    H.h('span.dot.pos'),
    H.h('span', 'state.db healthy · ' + H.fmt.n(totalSessions) + ' sessions · ' + totalMB + ' MB'),
    H.h('span.history-foot-sep', '·'),
    H.h('button.history-link', {type:'button', onclick:repairDialog}, 'Repair…')
  );
}

function page(){
  return H.h('div.page.history-page',
    H.h('div.history-in',
      H.h('div.page-head.history-head',
        H.h('div',
          H.h('h1', 'History'),
          H.h('p', 'Every thread this machine has run, from web, TUI, channels and cron.')
        ),
        H.h('div.history-head-actions',
          H.h('button.btn', {type:'button', onclick:importDialog}, H.ic('upload','sm'), 'Import session…'),
          H.h('button.btn', {type:'button', onclick:pruneDialog}, H.ic('trash','sm'), 'Prune older than 30 days…')
        )
      ),
      controls(),
      tableCard(),
      footer()
    )
  );
}

function draw(){
  if (!viewRoot) return;
  viewRoot.replaceChildren(page());
  paintBulk();
  paintDrawer();
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && openId){ openId = null; paintDrawer(); }
});

H.views.history = {
  title: 'history',
  render(root, ctx){
    viewRoot = root;
    appCtx = ctx || {};
    if (LIVE){ loadLive(false); return; }
    draw();
  },
};
})();
