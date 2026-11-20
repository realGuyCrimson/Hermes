/* Inbox · Hermes's triage space: approvals, questions, handoffs, finished turns.
   Own file: js/views/inbox.js + css/inbox.css. */
(function(){
const H = window.H;
if (!H || !H.views) return;

const KIND = {
  approval: {label:'Needs approval', tone:'warn'},
  clarify:  {label:'Question',       tone:'warn'},
  done:     {label:'Finished',       tone:'pos'},
  failed:   {label:'Failed',         tone:'neg'},
  review:   {label:'Ready to review',tone:'live'},
  secret:   {label:'Needs a secret', tone:'warn'},
  browser:  {label:'Browser handoff',tone:'warn'},
};
const NEEDS = ['approval','clarify','secret','browser','pairing','waiting','health'];
const LIVE = H.live;

/* --- rows: shared sample data + two extra mock rows for secret / browser handoff ---
   In live mode this array starts EMPTY and is filled from the REST API; sample rows never appear. */
const SAMPLE_ITEMS = H.data.inbox.map(i => Object.assign({}, i));
const ITEMS = LIVE ? [] : SAMPLE_ITEMS;

/* sample rows are built only in preview mode; live mode never touches them */
if (!LIVE){
  SAMPLE_ITEMS[0].cmd = 'hermes gateway restart';
  SAMPLE_ITEMS[0].cwd = '~/hermes-maintenance';
  SAMPLE_ITEMS[0].why = 'Heartbeat gaps persist after the 21:04 restart. Two gaps of 41 s and 49 s were recorded in the last hour; the dashboard still answers on :9119. A clean restart should clear the stale worker. Active sessions will see “Turn lost during restart” and can be resumed.';
  SAMPLE_ITEMS[0].requested = '4m ago';

  SAMPLE_ITEMS[1].question = 'Which account should replies come from?';
  SAMPLE_ITEMS[1].why = 'Two sending identities are configured for atomicmail. The thread has 6 drafts ready to send; picking one here applies to the whole batch.';

  SAMPLE_ITEMS[2].summary = 'Last night’s archive opened in a scratch directory and every table passed integrity checks. state.db, its -wal and -shm were copied together, so no checkpoint was lost.';
  SAMPLE_ITEMS[2].artifacts = [
    {path:'scripts/verify-backup.sh', add:18, del:2},
    {path:'logs/backup-2026-11-18.log', add:41, del:0},
    {path:'notes/backups.md', add:6, del:1},
  ];

  SAMPLE_ITEMS[3].error = 'HTTP 429 from provider "google" after 2 attempts (retry-after: 60s).\nFallback deepseek-flash timed out after 60s with no first token.';
  SAMPLE_ITEMS[3].retries = [
    {model:'gemini-flash', role:'Primary', at:'14:02', note:'429 Too many requests · retry-after 60 s', tone:'neg'},
    {model:'deepseek-flash', role:'Fallback 1', at:'14:04', note:'No first token in 60 s', tone:'neg'},
    {model:'hermes-local', role:'Fallback 2', at:'14:05', note:'Not tried · no local model loaded', tone:''},
  ];
  SAMPLE_ITEMS[3].routine = 'Routine “Weekly cost report” · Mon 14:02 · cron';

  SAMPLE_ITEMS[4].branch = 'ui-redesign';
  SAMPLE_ITEMS[4].files = [
    {path:'css/base.css', add:84, del:42},
    {path:'js/ui.js', add:38, del:21},
    {path:'js/shell.js', add:96, del:18},
    {path:'index.html', add:12, del:3},
    {path:'js/views/inbox.js', add:122, del:6},
    {path:'css/inbox.css', add:28, del:2},
    {path:'js/views/history.js', add:24, del:2},
    {path:'css/history.css', add:6, del:0},
    {path:'js/data.js', add:2, del:2},
  ];

  SAMPLE_ITEMS.push({
    id:'i6', kind:'secret', thread:'t-gw', agent:'hermes',
    title:'Needs the Telegram bot token', body:'TELEGRAM_BOT_TOKEN is unset in .env', age:'21m', unread:true,
    secretName:'TELEGRAM_BOT_TOKEN', varName:'TELEGRAM_BOT_TOKEN',
    why:'The gateway restarted cleanly but the Telegram channel stays disconnected until the bot token is present. Hermes will not read the value back, and it will not appear in the transcript.',
  });
  SAMPLE_ITEMS.push({
    id:'i7', kind:'browser', thread:'t-ui', agent:'hermes',
    title:'Paused on a GitHub login page', body:'Needs a signed-in session to read the token list', age:'6m', unread:true,
    page:'https://github.com/settings/tokens', waiting:'3m',
    why:'Hermes opened its own Chromium session to check whether the existing PAT still has repo scope. GitHub asked for a password, so the run is holding here instead of guessing.',
  });
}

/* --- module state (persists while the app is open) --- */
let sel = null;
let filter = 'all';
let q = '';
let paused = false;
let confirmId = null;
let detailOpen = false;
let inited = false;
let detailTop = false;
let resolvedById = {};
let viewRoot = null;
let appCtx = {};

/* ================= live layer =================
   There is no single /inbox endpoint. Items are derived from real REST reads:
   cron last_status, session handoff/ended state, pending pairing requests,
   gateway + platform health from /api/status, and live approval/clarify server
   requests on the gateway WebSocket (js/rpc.js). Nothing is invented. */
const KIND_LABEL = {
  pairing: {label:'Pairing request', tone:'warn'},
  waiting: {label:'Waiting on you',  tone:'warn'},
  health:  {label:'Needs attention', tone:'neg'},
  cron:    {label:'Routine',         tone:'live'},
};
Object.keys(KIND_LABEL).forEach(k => { if (!KIND[k]) KIND[k] = KIND_LABEL[k]; });

const live = { loading:false, error:null, errors:[], busy:'', rpcBound:false, loadedAt:0 };
const RESOLVED_KEY = 'hermes.inbox.resolved.' + (H.api && H.api.profile ? H.api.profile : 'default');
const RESOLVED_TTL_MS = 14 * 86400000;

function readResolved(){
  if (!LIVE) return {};
  try {
    const raw = JSON.parse(localStorage.getItem(RESOLVED_KEY) || '{}') || {};
    const now = Date.now(), out = {};
    Object.keys(raw).forEach(k => { const v = raw[k]; if (v && (now - Number(v.at || 0)) < RESOLVED_TTL_MS) out[k] = v; });
    return out;
  } catch (e){ return {}; }
}
function writeResolved(){
  if (!LIVE) return;
  try { localStorage.setItem(RESOLVED_KEY, JSON.stringify(resolvedById)); } catch (e) {}
}
function syncBadge(){
  if (!LIVE) return;
  H.inboxPending = livePending;
  if (H.refreshRail) H.refreshRail();
}
function livePending(){
  return ITEMS.filter(it => NEEDS.indexOf(it.kind) !== -1 && !resolvedById[it.id]).length;
}

function itemCount(n, one, many){ return n + ' ' + (n === 1 ? one : (many || one + 's')); }
const firstLine = s => String(s || '').split('\n').filter(Boolean)[0] || '';

function liveItem(o){
  return Object.assign({unread:false, age:'', body:'', actions:[], meta:[], why:''}, o);
}

/* ---------- approval / clarify that arrive on the gateway socket ---------- */
function rpcItem(req, kind){
  const p = req.params || {};
  const id = 'rpc:' + req.id;
  const sid = p.session_id || p.session_id_hint || p.gateway_session_id || '';
  if (kind === 'approval'){
    const choices = Array.isArray(p.choices) ? p.choices : ['once','deny'];
    const actions = [];
    if (choices.indexOf('once') !== -1) actions.push({label:'Allow once', primary:true, run: async () => { H.rpc.respond(req.id, {choice:'once'}); return 'Allowed once'; }});
    if (choices.indexOf('session') !== -1) actions.push({label:'Allow for this session', run: async () => { H.rpc.respond(req.id, {choice:'session'}); return 'Allowed for this session'; }});
    if (choices.indexOf('always') !== -1) actions.push({label:'Always allow', run: async () => { H.rpc.respond(req.id, {choice:'always'}); return 'Always allowed'; }});
    actions.push({label:'Deny', danger:true, run: async () => { H.rpc.respond(req.id, {choice:'deny'}); return 'Denied · Hermes will ask again next turn'; }});
    return liveItem({
      id, kind:'approval', rpcId:req.id, thread:sid, agent:'hermes',
      title: p.description || 'A command needs your approval',
      body: p.command || '', cmd: p.command || '',
      age:'now', page:'', actions,
      meta: [['Command', p.command || '–'], ['Tool', p.tool_name || '–'], ['Session', sid || '–']],
      why: 'Hermes is holding this turn until you decide. The command shown is redacted by the backend.',
    });
  }
  const qs = Array.isArray(p.questions) ? p.questions : [];
  return liveItem({
    id, kind:'clarify', rpcId:req.id, thread:sid, agent:'hermes',
    title: qs.length === 1 ? (qs[0].question || 'Hermes has a question') : 'Hermes has ' + itemCount(qs.length, 'question'),
    body: qs.map(x => x.question).filter(Boolean).join(' · '),
    age:'now', questions:qs, actions:[],
    meta: [['Session', sid || '–']],
    why: 'The turn is paused until these answers arrive.',
  });
}

function addRpcItem(req, kind){
  if (!req || !req.id) return;
  const it = rpcItem(req, kind);
  if (ITEMS.some(x => x.id === it.id)) return;
  ITEMS.unshift(it);
  sel = it.id; detailOpen = true; detailTop = true;
  draw(); syncBadge();
  if (H.inboxStage && H.inboxStage.paint) H.inboxStage.paint();
  toast(kind === 'approval' ? 'Hermes needs approval' : 'Hermes has a question');
}
function dropRpcItem(reqId){
  const i = ITEMS.findIndex(x => x.rpcId === reqId);
  if (i === -1) return;
  ITEMS.splice(i, 1);
  if (sel && !ITEMS.some(x => x.id === sel)) sel = ITEMS.length ? ITEMS[0].id : null;
  draw(); syncBadge();
  if (H.inboxStage && H.inboxStage.paint) H.inboxStage.paint();
}
function bindRpc(){
  if (live.rpcBound || !H.rpc || typeof H.rpc.on !== 'function') return;
  live.rpcBound = true;
  try {
    H.rpc.on('approval', req => addRpcItem(req, 'approval'));
    H.rpc.on('clarify', req => addRpcItem(req, 'clarify'));
    H.rpc.on('request.done', info => { if (info && info.id) dropRpcItem(info.id); });
  } catch (e){ /* a missing gateway socket must never break the view */ }
}

/* ---------- derivations from REST ---------- */
const CRON_BAD = {error:'Run failed', delivery_failed:'Delivered nowhere', blocked_config:'Blocked by config'};
const CRON_STATUS_ANY = Object.keys(CRON_BAD);

function cronItems(jobs){
  const out = [];
  (Array.isArray(jobs) ? jobs : []).forEach(j => {
    const id = 'cron:' + (j.profile ? j.profile + ':' : '') + j.id;
    const name = String(j.name || j.id || 'Routine');
    const status = String(j.last_status || '');
    const detail = String(j.last_error || j.last_delivery_error || '').trim();
    const schedule = String(j.schedule_display || (j.schedule && (j.schedule.display || j.schedule.expr || j.schedule.run_at)) || '');
    if (status && status !== 'ok'){
      out.push(liveItem({
        id, kind:'failed', agent:'hermes', title:'Routine failed · ' + name,
        body: (CRON_BAD[status] || status) + (detail ? ' · ' + firstLine(detail) : ''),
        age: j.last_run_at ? agoLabel(j.last_run_at) : '', ts: tsOf(j.last_run_at),
        error: detail || (CRON_BAD[status] || status),
        meta: [['Schedule', schedule || '–'], ['Last run', j.last_run_at ? agoLabel(j.last_run_at) : '–'], ['Next run', j.next_run_at ? j.next_run_at : '–']],
        why: 'The routine is enabled and keeps its schedule. Running it now starts one turn immediately.',
        actions: [
          {label:'Run now', primary:true, run: async () => {
            await H.api.post('/api/cron/jobs/' + encodeURIComponent(j.id) + '/trigger' + (j.profile ? '?profile=' + encodeURIComponent(j.profile) : ''), {});
            return 'Triggered · ' + name;
          }},
          {label:'Open routine', run: async () => { openHash('#/routines/schedules'); return 'Opened routines'; }},
        ],
      }));
    } else if (status === 'ok' && tsOf(j.last_run_at) && Date.now() - tsOf(j.last_run_at) < 6 * 3600000){
      out.push(liveItem({
        id, kind:'done', agent:'hermes', title:'Routine finished · ' + name,
        body: 'Last run succeeded' + (schedule ? ' · ' + schedule : ''),
        age: agoLabel(j.last_run_at), ts: tsOf(j.last_run_at),
        meta: [['Schedule', schedule || '–'], ['Last run', agoLabel(j.last_run_at)], ['Next run', j.next_run_at || '–']],
        why: 'A run finished in the last six hours. Open the routine for its history, or mark it seen.',
        actions: [
          {label:'Open routine', primary:true, run: async () => { openHash('#/routines/schedules'); return 'Opened routines'; }},
          {label:'Mark seen', run: async () => 'Marked seen'},
        ],
      }));
    }
  });
  return out;
}

function agoLabel(ts){
  if (!ts) return '';
  const ms = typeof ts === 'string' && !/^\d+(\.\d+)?$/.test(ts) ? Date.parse(ts) : Number(ts) * 1000;
  if (!ms || isNaN(ms)) return '';
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  return Math.floor(s / 86400) + 'd';
}
function tsOf(ts){
  if (!ts) return 0;
  const ms = typeof ts === 'string' && !/^\d+(\.\d+)?$/.test(ts) ? Date.parse(ts) : Number(ts) * 1000;
  return ms && !isNaN(ms) ? ms : 0;
}

function pairingItems(data){
  const out = [];
  ((data && data.pending) || []).forEach(u => {
    const who = String(u.user_name || u.user_id || '');
    out.push(liveItem({
      id: 'pair:' + u.platform + ':' + (u.request_id || u.user_id),
      kind:'pairing', agent:'hermes',
      title: who + ' wants to pair on ' + u.platform,
      body: 'Pending approval · ' + (typeof u.age_minutes === 'number' ? u.age_minutes + 'm' : 'just now'),
      age: typeof u.age_minutes === 'number' ? u.age_minutes + 'm' : 'now',
      meta: [['Platform', u.platform], ['User', who || '–'], ['Request', u.request_id || '–']],
      why: 'Approving lets this user message Hermes on ' + u.platform + '. Hermes never gets their password or history.',
      actions: [
        {label:'Approve', primary:true, run: async () => {
          await H.api.post('/api/pairing/approve', {platform: u.platform, request_id: u.request_id, profile: H.api.profile || undefined});
          return 'Approved ' + who + ' on ' + u.platform;
        }},
        {label:'Deny all pending', danger:true, run: async () => {
          const res = await H.api.post('/api/pairing/clear-pending', {});
          return 'Cleared ' + ((res && res.cleared) || 0) + ' pending request(s)';
        }},
      ],
    }));
  });
  return out;
}

function sessionItems(rows){
  const out = [];
  (Array.isArray(rows) ? rows : []).forEach(s => {
    const sid = s.id;
    const title = String(s.title || '').trim() || (String(s.preview || '').trim().slice(0, 60)) || 'Session ' + String(sid).slice(0, 8);
    if (s.handoff_state === 'failed'){
      out.push(liveItem({
        id:'sess:' + sid, kind:'failed', agent: s.profile || 'hermes', thread:sid, title:'Handoff failed · ' + title,
        body: firstLine(s.handoff_error) || ('Handed off to ' + (s.handoff_platform || 'a channel')),
        age: agoLabel(s.last_active || s.started_at), ts: tsOf(s.last_active || s.started_at),
        error: String(s.handoff_error || '').trim(),
        meta: [['Platform', s.handoff_platform || '–'], ['Source', String(s.source || '–')], ['Messages', String(s.message_count || 0)]],
        why: 'The session could not be handed to its channel. Open it in the thread to continue there.',
        actions: [{label:'Open thread', primary:true, run: async () => { openThread(sid); return 'Opened thread'; }}],
      }));
    } else if (s.handoff_state === 'pending'){
      out.push(liveItem({
        id:'sess:' + sid, kind:'waiting', agent: s.profile || 'hermes', thread:sid, title:'Waiting to hand off · ' + title,
        body: 'Queued for ' + (s.handoff_platform || 'a channel'),
        age: agoLabel(s.last_active || s.started_at), ts: tsOf(s.last_active || s.started_at),
        meta: [['Platform', s.handoff_platform || '–'], ['Messages', String(s.message_count || 0)]],
        why: 'The gateway has not picked this handoff up yet. Opening the thread shows where the turn stopped.',
        actions: [{label:'Open thread', primary:true, run: async () => { openThread(sid); return 'Opened thread'; }}],
      }));
    } else if (s.ended_at && /error|fail|crash|timeout|abort|killed/i.test(String(s.end_reason || ''))){
      out.push(liveItem({
        id:'sess:' + sid, kind:'failed', agent: s.profile || 'hermes', thread:sid, title:'Ended with an error · ' + title,
        body: 'End reason: ' + s.end_reason,
        age: agoLabel(s.ended_at || s.last_active), ts: tsOf(s.ended_at || s.last_active),
        meta: [['End reason', String(s.end_reason)], ['Source', String(s.source || '–')], ['Messages', String(s.message_count || 0)]],
        why: 'state.db recorded an abnormal end. The transcript is intact; open the thread to pick it up again.',
        actions: [{label:'Open thread', primary:true, run: async () => { openThread(sid); return 'Opened thread'; }}],
      }));
    }
  });
  return out;
}

function statusItems(st){
  const out = [];
  if (!st || typeof st !== 'object') return out;
  const errs = [];
  if (st.gateway_running === false){
    errs.push(liveItem({
      id:'health:gateway', kind:'failed', agent:'hermes',
      title:'The gateway is not running',
      body: String(st.gateway_exit_reason || ('Reported state: ' + (st.gateway_state || 'stopped'))),
      age: agoLabel(st.gateway_updated_at), ts: tsOf(st.gateway_updated_at),
      meta: [['State', String(st.gateway_state || 'stopped')], ['Exit reason', String(st.gateway_exit_reason || '–')], ['Version', String(st.version || '–')]],
      why: 'Channels, cron and live sessions all run through the gateway process.',
      actions: [
        {label:'Start gateway', primary:true, run: async () => { await H.api.post('/api/gateway/start', {}); return 'Gateway starting'; }},
        {label:'Open health', run: async () => { openHash('#/settings/system'); return 'Opened system health'; }},
      ],
    }));
  }
  const platforms = st.gateway_platforms && typeof st.gateway_platforms === 'object' ? st.gateway_platforms : {};
  Object.keys(platforms).forEach(name => {
    const p = platforms[name] || {};
    if (!p.needs_attention && !p.error_message) return;
    out.push(liveItem({
      id:'health:platform:' + name, kind:'health', agent:'hermes',
      title: name + ' needs attention',
      body: String(p.error_message || p.error_code || ('State: ' + (p.state || 'unknown'))),
      age: agoLabel(p.updated_at), ts: tsOf(p.updated_at),
      error: p.error_message ? String(p.error_message) : '',
      meta: [['Platform', name], ['State', String(p.state || '–')], ['Retrying since', p.retrying_since ? String(p.retrying_since) : '–']],
      why: 'The channel keeps retrying. Messages from this platform will not reach Hermes until it reconnects.',
      actions: [{label:'Open channels', primary:true, run: async () => { openHash('#/channels'); return 'Opened channels'; }}],
    }));
  });
  ['memory','disk'].forEach(k => {
    const part = st[k] || {};
    const pressure = String(part.pressure || 'ok');
    if (pressure === 'ok' || !pressure) return;
    out.push(liveItem({
      id:'health:' + k, kind:'health', agent:'hermes',
      title: k === 'memory' ? 'Memory pressure is ' + pressure : 'Disk pressure is ' + pressure,
      body: k === 'memory'
        ? (part.system_available_mb ? Math.round(part.system_available_mb / 1024) + ' GB available · gateway ' + Math.round(part.gateway_rss_mb || 0) + ' MB' : '')
        : (part.free_mb ? (Math.round(part.free_mb / 1024)) + ' GB free · ' + part.used_percent + '% used' : ''),
      age: k === 'memory' ? agoLabel(part.sampled_at) : 'now',
      meta: k === 'memory' ? [['Pressure', pressure], ['Gateway RSS', Math.round(part.gateway_rss_mb || 0) + ' MB']] : [['Pressure', pressure], ['Used', String(part.used_percent || 0) + '%']],
      why: 'Sustained pressure can stall turns and fail writes to state.db.',
      actions: [{label:'Open insights', primary:true, run: async () => { openHash('#/insights'); return 'Opened insights'; }}],
    }));
  });
  return errs.concat(out);
}

function openHash(hash){
  if (appCtx.go) appCtx.go(hash); else location.hash = hash;
}

async function loadLive(){
  live.loading = true; live.error = null;
  draw();
  const [cronR, pairR, statusR, sessR] = await Promise.allSettled([
    H.api.get('/api/cron/jobs'),
    H.api.get('/api/pairing'),
    H.api.get('/api/status'),
    H.api.get('/api/sessions?limit=30&order=recent'),
  ]);
  const errors = [];
  const next = [];
  if (cronR.status === 'fulfilled') next.push.apply(next, cronItems(cronR.value));
  else errors.push('Routines: ' + errText(cronR.reason));
  if (pairR.status === 'fulfilled') next.push.apply(next, pairingItems(pairR.value));
  else errors.push('Pairing: ' + errText(pairR.reason));
  if (statusR.status === 'fulfilled') next.push.apply(next, statusItems(statusR.value));
  else errors.push('Gateway status: ' + errText(statusR.reason));
  if (sessR.status === 'fulfilled') next.push.apply(next, sessionItems((sessR.value || {}).sessions));
  else errors.push('Sessions: ' + errText(sessR.reason));

  /* keep live socket items, they are not in REST */
  ITEMS.filter(x => x.rpcId).forEach(x => next.push(x));
  next.sort((a, b) => (b.ts || 0) - (a.ts || 0));
  ITEMS.splice(0, ITEMS.length, ...next);

  live.errors = errors;
  live.error = errors.length && errors.length === 4 ? pairsAllFailed(errors) : null;
  live.loading = false;
  live.loadedAt = Date.now();
  if (sel && !ITEMS.some(x => x.id === sel)) sel = ITEMS.length ? firstSelectable().id : null;
  if (!sel) sel = ITEMS.length ? firstSelectable().id : null;
  if (isNarrow() && !detailOpen) sel = null;
  draw(); syncBadge();
}
function firstSelectable(){ return ITEMS.filter(it => !resolvedById[it.id])[0] || ITEMS[0]; }
function errText(e){ return (e && e.message) || 'request failed'; }
function pairsAllFailed(errors){ return 'Hermes did not answer: ' + errors.join(' · '); }

/* resolve() persists in localStorage per profile in live mode */

const FILTERS = [
  {id:'all',      label:'All',       test: () => true},
  {id:'needs',    label:'Needs you', test: it => NEEDS.indexOf(it.kind) !== -1 && !resolvedById[it.id]},
  {id:'finished', label:'Finished',  test: it => (it.kind === 'done' || it.kind === 'review') && !resolvedById[it.id]},
  {id:'failed',   label:'Failed',    test: it => it.kind === 'failed' && !resolvedById[it.id]},
];

const toast = msg => (appCtx.toast ? appCtx.toast(msg) : H.toast(msg));
const openThread = id => {
  if (!id) return;
  if (appCtx.openThread) appCtx.openThread(id);
  else if (appCtx.go) appCtx.go('#/thread/' + id);
};
const isNarrow = () => window.matchMedia('(max-width: 900px)').matches;
const byId = id => ITEMS.filter(it => it.id === id)[0];
const agentOf = it => H.agent(it.agent) || {name:it.agent, hue:212, kind:0, state:'idle'};
const threadOf = it => H.thread(it.thread);
const ageText = it => it.age === 'now' ? 'just now' : /^\d+[mhd]$/.test(it.age) ? it.age + ' ago' : it.age;

function kindPill(it, size){
  if (resolvedById[it.id]) return H.h('span.pill', 'Resolved');
  const k = KIND[it.kind] || KIND.approval;
  const p = H.pill(k.label, k.tone);
  if (size === 'sm') { p.style.height = '18px'; p.style.fontSize = '11px'; }
  return p;
}

function matches(it){
  if (!FILTERS.filter(f => f.id === filter)[0].test(it)) return false;
  if (!q) return true;
  const hay = [it.title, it.body, agentOf(it).name, (KIND[it.kind] || {}).label].join(' ').toLowerCase();
  return hay.indexOf(q.toLowerCase()) !== -1;
}
function visible(){ return ITEMS.filter(matches); }
function countFor(f){ return ITEMS.filter(f.test).length; }

function resolve(it, action, tone, note, answer){
  resolvedById[it.id] = {action, tone:tone || 'pos', by:'you', when:'just now', note:note || '', answer:answer || '', at:Date.now()};
  if (LIVE){ writeResolved(); syncBadge(); }
  confirmId = null;
  detailOpen = true;
  draw();
  toast(action + ' · ' + it.title.toLowerCase());
}

/* ---------- list pane ---------- */
function head(){
  if (LIVE) return headLive();
  const openNeeds = ITEMS.filter(it => NEEDS.indexOf(it.kind) !== -1 && !resolvedById[it.id]).length;
  const sub = paused
    ? 'Paused · ' + openNeeds + ' still need you'
    : openNeeds + ' need you · agents running';

  return H.h('div.inbox-pane-head',
    H.h('div.inbox-h1row', H.h('h1', 'Inbox')),
    H.h('p.inbox-sub', sub),
    H.h('div.inbox-head-actions',
      H.h('button.btn.sm', {type:'button', onclick:() => {
        ITEMS.forEach(it => { it.unread = false; });
        draw();
        toast('Inbox marked read');
      }}, H.ic('check','sm'), 'Mark all read'),
      H.h('button.btn.sm', {type:'button', 'aria-pressed':String(paused), onclick:() => {
        paused = !paused;
        draw();
        toast(paused ? 'All agents paused' : 'Agents resumed');
      }}, H.ic(paused ? 'play' : 'pause','sm'), paused ? 'Resume' : 'Pause all agents')
    ),
    H.h('div.inbox-filters',
      H.seg(FILTERS.map(f => ({
        id:f.id,
        label:[f.label, H.h('span.inbox-count', String(countFor(f)))],
      })), filter, id => { filter = id; draw(); })
    ),
    H.h('div.inbox-search',
      H.ic('search','sm'),
      H.h('input', {
        type:'search', value:q, placeholder:'Search inbox', 'aria-label':'Search inbox',
        oninput: e => { q = e.target.value; refreshList(); },
      })
    )
  );
}

function errorsStrip(){
  if (!live.errors.length) return null;
  return H.h('div.inbox-errs', {role:'status'},
    H.h('span.inbox-errs-t', 'Some sources did not answer: ' + live.errors.join(' · ')),
    H.h('button.btn.ghost.sm', {type:'button', onclick:() => loadLive()}, 'Retry')
  );
}

function headLive(){
  const openNeeds = livePending();
  const sub = live.loading ? 'Checking cron, pairing and the gateway…'
    : openNeeds ? openNeeds + ' ' + (openNeeds === 1 ? 'thing needs' : 'things need') + ' you'
    : 'Nothing needs you';
  return H.h('div.inbox-pane-head',
    H.h('div.inbox-h1row', H.h('h1', 'Inbox')),
    H.h('p.inbox-sub', sub),
    H.h('div.inbox-head-actions',
      H.h('button.btn.sm', {type:'button', onclick:() => loadLive()}, H.ic('retry','sm'), live.loading ? 'Checking…' : 'Check again')
    ),
    H.h('div.inbox-filters',
      H.seg(FILTERS.map(f => ({
        id:f.id,
        label:[f.label, H.h('span.inbox-count', String(countFor(f)))],
      })), filter, id => { filter = id; draw(); })
    ),
    H.h('div.inbox-search',
      H.ic('search','sm'),
      H.h('input', {
        type:'search', value:q, placeholder:'Search inbox', 'aria-label':'Search inbox',
        oninput: e => { q = e.target.value; refreshList(); },
      })
    ),
    errorsStrip()
  );
}

function rowsNode(){
  const list = visible();
  if (!list.length){
    if (LIVE && !ITEMS.length && !live.loading && !live.error){
      return H.h('div.empty.inbox-none.inbox-clear',
        H.ic('check','lg'),
        H.h('div.inbox-clear-t', 'All clear'),
        H.h('div.inbox-none-s', 'Nothing is waiting on you. Cron, pairing and the gateway are quiet; approvals show up here the moment a turn asks for one.'),
        H.h('button.btn.sm', {type:'button', onclick:() => loadLive()}, H.ic('retry','sm'), 'Check again')
      );
    }
    if (LIVE && !ITEMS.length && live.loading){
      return H.h('div.empty.inbox-none',
        H.h('div', 'Checking cron, pairing and the gateway…'),
        H.h('div.inbox-none-s', 'Reading the Hermes REST API.')
      );
    }
    return H.h('div.empty.inbox-none',
      H.ic('inbox','lg'),
      H.h('div', live.error ? 'Couldn’t load the inbox' : 'Nothing matches this view'),
      H.h('div.inbox-none-s', live.error || (q ? 'Try another word, or switch back to All.' : 'Items you resolve leave the Needs you count.')),
      live.error ? H.h('button.btn.sm', {type:'button', onclick:() => loadLive()}, H.ic('retry','sm'), 'Retry') : null
    );
  }
  return H.h('div.inbox-list', list.map(row));
}

function row(it){
  const ag = agentOf(it);
  const res = resolvedById[it.id];
  const state = res ? 'done' : it.kind === 'failed' ? 'blocked' : it.kind === 'done' || it.kind === 'review' ? 'done' : 'waiting';
  const el = H.h('button.inbox-row', {
    type:'button',
    class:(sel === it.id ? 'is-sel' : '') + (it.unread ? ' unread' : ''),
    'aria-pressed':String(sel === it.id),
    onclick:() => {
      sel = it.id;
      detailOpen = true;
      detailTop = true;
      it.unread = false;
      draw();
    },
  },
    H.avatar(ag, 30, state),
    H.h('span.inbox-row-main',
      H.h('span.inbox-row-top',
        it.unread ? H.h('span.inbox-unread', {'aria-label':'Unread'}) : null,
        H.h('span.inbox-row-t', it.title),
        H.h('span.inbox-row-age', it.age)
      ),
      H.h('span.inbox-row-bot',
        H.h('span.inbox-row-b', res ? (res.action + ' · ' + res.when) : it.body),
        kindPill(it)
      )
    )
  );
  return el;
}

function listPane(){
  const pane = H.h('aside.pane-l.inbox-pane', head(), H.h('div.inbox-list-host', rowsNode()));
  pane.appendChild(H.h('div.inbox-tail',
    H.h('span', LIVE
      ? (live.loading ? 'Reading /api/cron/jobs, /api/pairing, /api/status and /api/sessions'
        : 'Cron · pairing · gateway · sessions' + (live.loadedAt ? ' · ' + (() => { const a = agoLabel(Math.floor(live.loadedAt / 1000)); return a === 'now' ? 'checked just now' : 'checked ' + a + ' ago'; })() : ''))
      : paused ? 'Paused · nothing new will start' : 'Checking state.db every 5 s · last 12 s ago')
  ));
  return pane;
}

function refreshList(){
  if (!viewRoot) return;
  const host = viewRoot.querySelector('.inbox-list-host');
  if (host) host.replaceChildren(rowsNode());
}

/* ---------- detail pane ---------- */
function failureStates(it){
  const ag = agentOf(it);
  const res = resolvedById[it.id];
  if (res) return 'done';
  return it.kind === 'failed' ? 'blocked' : it.kind === 'done' || it.kind === 'review' ? 'done' : 'waiting';
}

function detail(it){
  if (!it){
    return H.h('section.pane-r.inbox-detail',
      H.h('div.empty.inbox-detail-empty', H.ic('inbox','lg'), H.h('div','Nothing selected'), H.h('div.inbox-none-s','Pick an item on the left to see what Hermes is asking.'))
    );
  }
  if (LIVE) return liveDetail(it);
  const ag = agentOf(it);
  const th = threadOf(it);
  const res = resolvedById[it.id];

  const headNode = H.h('div.inbox-det-head',
    H.h('button.btn.sm.icon.inbox-back', {type:'button', 'aria-label':'Back to inbox', onclick:() => { detailOpen = false; draw(); }}, H.ic('chev','sm')),
    H.avatar(ag, 34, failureStates(it)),
    H.h('div.inbox-det-title',
      H.h('h2', it.title),
      H.h('div.inbox-det-sub',
        H.h('span', ag.name),
        H.h('span', '·'),
        H.h('span.ellip', th ? th.title : 'No thread'),
        H.h('span', '·'),
        H.h('span', ageText(it))
      )
    ),
    H.h('div.inbox-det-kind', kindPill(it))
  );

  const body = H.h('div.inbox-det-body');
  if (it.kind === 'approval') approvalBody(it, body, res);
  if (it.kind === 'clarify') clarifyBody(it, body, res);
  if (it.kind === 'done') doneBody(it, body, res);
  if (it.kind === 'failed') failedBody(it, body, res);
  if (it.kind === 'review') reviewBody(it, body, res);
  if (it.kind === 'secret') secretBody(it, body, res);
  if (it.kind === 'browser') browserBody(it, body, res);

  if (res) body.appendChild(resolvedPanel(it));

  return H.h('section.pane-r.inbox-detail', headNode, body);
}

/* ---------- live detail: one action list, real endpoints ---------- */
function liveDetail(it){
  const ag = agentOf(it);
  const res = resolvedById[it.id];
  const subBits = [H.h('span', ag.name), H.h('span', '·')];
  if (it.thread) subBits.push(H.h('span.ellip', it.thread));
  else subBits.push(H.h('span', (KIND[it.kind] || KIND.approval).label));
  if (it.age) { subBits.push(H.h('span', '·'), H.h('span', ageText(it))); }

  const headNode = H.h('div.inbox-det-head',
    H.h('button.btn.sm.icon.inbox-back', {type:'button', 'aria-label':'Back to inbox', onclick:() => { detailOpen = false; draw(); }}, H.ic('chev','sm')),
    H.avatar(ag, 34, failureStates(it)),
    H.h('div.inbox-det-title', H.h('h2', it.title), H.h('div.inbox-det-sub', subBits)),
    H.h('div.inbox-det-kind', kindPill(it))
  );

  const body = H.h('div.inbox-det-body');
  if (it.why) body.appendChild(H.h('div.inbox-block', H.h('span.inbox-label', 'What this is'), H.h('p.inbox-why', it.why)));
  if (it.kind === 'clarify' && it.questions && it.questions.length){
    if (!res) liveClarifyBody(it, body);
  } else {
    if (it.body && it.kind !== 'clarify') body.appendChild(H.h('div.inbox-block', H.h('span.inbox-label', 'Detail'), H.h('p.inbox-why', it.body)));
    if (it.cmd) body.appendChild(codeBlock('Command', it.cmd, 'Copy command'));
    if (it.meta && it.meta.length){
      const dl = H.h('dl.inbox-kv');
      it.meta.forEach(([k, v]) => { dl.append(H.h('dt', k), H.h('dd', {class:String(v).length > 40 ? 'mono' : null}, String(v))); });
      body.appendChild(dl);
    }
    if (it.error) body.appendChild(H.h('div.inbox-block', H.h('span.inbox-label', 'Error'), H.h('div.inbox-error', it.error)));
    if (!res) liveActions(it, body);
  }
  if (res) body.appendChild(resolvedPanel(it));
  return H.h('section.pane-r.inbox-detail', headNode, body);
}

function liveActions(it, body){
  const errHost = H.h('div.inbox-err-text', {hidden:true});
  const row = H.h('div.inbox-actions');
  (it.actions || []).forEach(a => {
    const sel = a.primary ? 'button.btn.primary' : a.danger ? 'button.btn.ghost.danger' : 'button.btn';
    const b = H.h(sel, {type:'button'}, a.label);
    b.onclick = async () => {
      if (live.busy) return;
      live.busy = it.id;
      b.disabled = true;
      const was = b.textContent;
      b.textContent = 'Working…';
      errHost.hidden = true;
      try {
        const note = await a.run();
        live.busy = '';
        resolve(it, a.label, a.danger ? 'neg' : 'pos', note || '');
      } catch (e){
        live.busy = '';
        b.disabled = false;
        b.textContent = was;
        errHost.hidden = false;
        errHost.textContent = a.label + ' failed · ' + errText(e);
      }
    };
    row.appendChild(b);
  });
  if (it.thread && !(it.actions || []).some(a => /open thread/i.test(a.label))){
    row.appendChild(H.h('button.btn.ghost.inbox-end', {type:'button', onclick: () => openThread(it.thread)}, H.ic('external','sm'), 'Open thread'));
  }
  if (row.childNodes.length) body.appendChild(row);
  body.appendChild(errHost);
  body.appendChild(H.h('div.inbox-note', H.ic('info','sm'), H.h('span','These buttons call the Hermes API now. Resolved items stay out of the count and are remembered on this profile.')));
}

function liveClarifyBody(it, body){
  const answers = {};
  const err = H.h('div.inbox-err-text', {hidden:true});
  const send = H.h('button.btn.primary', {type:'button', onclick: async () => {
    const missing = it.questions.map((qq, i) => (qq.qid || 'q' + i)).filter(qid => !String(answers[qid] || '').trim());
    if (missing.length){ err.hidden = false; err.textContent = 'Answer ' + (missing.length === 1 ? 'the question' : 'every question') + ' before sending.'; return; }
    if (!H.rpc || typeof H.rpc.respond !== 'function'){ err.hidden = false; err.textContent = 'The gateway socket is not open, so this answer cannot be delivered. Open the thread instead.'; return; }
    send.disabled = true; send.textContent = 'Sending…'; err.hidden = true;
    try {
      H.rpc.respond(it.rpcId, {answers, outcome:'submitted'});
      resolve(it, 'Answered', 'pos', '', Object.keys(answers).map(k => answers[k]).join(' · '));
    } catch (e){
      send.disabled = false; send.textContent = 'Send answers';
      err.hidden = false; err.textContent = 'Send failed · ' + errText(e);
    }
  }}, H.ic('send','sm'), 'Send answers');

  it.questions.forEach((qq, i) => {
    const qid = qq.qid || 'q' + i;
    const block = H.h('div.inbox-block', H.h('span.inbox-label', it.questions.length > 1 ? 'Question ' + (i + 1) : 'Question'), H.h('p.inbox-question', qq.question || ''));
    if (Array.isArray(qq.choices) && qq.choices.length){
      const opts = H.h('div.inbox-options');
      qq.choices.forEach(c => {
        const b = H.h('button.btn.inbox-opt', {type:'button', 'aria-pressed':'false', onclick: () => {
          answers[qid] = String(c);
          opts.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed','false'));
          b.setAttribute('aria-pressed','true');
        }}, String(c));
        opts.appendChild(b);
      });
      block.appendChild(opts);
    } else {
      block.appendChild(H.h('textarea.textarea', {rows:'2', 'aria-label':'Answer', oninput: e => { answers[qid] = e.target.value; }}));
    }
    body.appendChild(block);
  });
  body.appendChild(err);
  body.appendChild(H.h('div.inbox-actions', send,
    H.h('button.btn.ghost.inbox-end', {type:'button', onclick: () => { if (H.rpc) H.rpc.respond(it.rpcId, {outcome:'cancelled'}); resolve(it, 'Skipped', 'neg', 'The turn continues without an answer'); }}, 'Skip')
  ));
  body.appendChild(H.h('div.inbox-note', H.ic('info','sm'), H.h('span','The answer goes straight back to the waiting turn over the gateway socket; nothing is stored here.')));
}

function resolvedPanel(it){
  const r = resolvedById[it.id];
  return H.h('div.inbox-resolved', {role:'status'},
    H.h('span.inbox-res-ic', H.ic('check')),
    H.h('div',
      H.h('div.inbox-res-t', r.action + ' by ' + r.by),
      H.h('div.inbox-res-s', r.when + (r.note ? ' · ' + r.note : '')),
      r.answer ? H.h('div.inbox-res-a', 'Answer: ' + r.answer) : null
    ),
    H.h('button.btn.sm', {type:'button', style:{marginLeft:'auto'}, onclick:() => openThread(it.thread)}, 'Open thread')
  );
}

function codeBlock(label, code, copyLabel){
  return H.h('div.inbox-block',
    H.h('div.inbox-block-h',
      H.h('span.inbox-label', label),
      H.h('button.btn.ghost.sm.icon', {type:'button', 'aria-label':copyLabel || 'Copy', title:'Copy', onclick:() => {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(() => toast('Copied'), () => toast('Copy failed · select the text'));
          } else toast('Copy not available here');
        } catch (e) { toast('Copy failed · select the text'); }
      }}, H.ic('copy','sm'))
    ),
    H.h('pre.inbox-pre', H.h('code', code))
  );
}

function kv(label, value){
  return [H.h('dt', label), H.h('dd', value)];
}

function approvalBody(it, body, res){
  body.append(
    codeBlock('Command', it.cmd, 'Copy command'),
    H.h('dl.inbox-kv',
      ...kv('Working directory', H.h('span.mono', it.cwd)),
      ...kv('Risk', H.h('span', H.pill(it.risk === 'high' ? 'High' : it.risk === 'low' ? 'Low' : 'Medium', it.risk === 'high' ? 'neg' : it.risk === 'low' ? 'pos' : 'warn'), H.h('span.inbox-kv-note', it.risk === 'low' ? 'no writes outside the thread' : 'writes outside the worktree'))),
      ...kv('Requested', it.requested + ' · ' + agentOf(it).name),
      ...kv('Allowlist', H.h('span', 'No matching rule'))
    ),
    H.h('div.inbox-block', H.h('span.inbox-label','Why the agent wants it'), H.h('p.inbox-why', it.why)),
    H.h('div.inbox-note', H.ic('info','sm'), H.h('span','Allowing runs the command once in this machine’s shell. Output goes back to Hermes as the next turn.'))
  );
  if (res) return;

  if (confirmId === it.id){
    body.appendChild(H.h('div.inbox-confirm',
      H.h('h3', H.h('span.dot.warn'), 'Add this command to the allowlist?'),
      H.h('p', 'The rule ',
        H.h('code.inbox-pattern', it.cmd.split(' ').slice(0, 3).join(' ') + '*'),
        ' will be added to ',
        H.h('code.inbox-pattern', '~/.hermes/allowlist.json'),
        '. It matches this command with any extra flags, in every thread.'),
      H.h('div.inbox-actions.inbox-actions-tight',
        H.h('button.btn.primary', {type:'button', onclick:() => resolve(it, 'Always allowed ' + it.cmd, 'pos', 'Rule added to allowlist')}, 'Add to allowlist'),
        H.h('button.btn.ghost', {type:'button', onclick:() => { confirmId = null; draw(); }}, 'Cancel')
      )
    ));
    return;
  }

  body.appendChild(H.h('div.inbox-actions',
    H.h('button.btn.primary', {type:'button', onclick:() => resolve(it, 'Allowed once', 'pos', it.cmd)}, H.ic('check','sm'), 'Allow once'),
    H.h('button.btn', {type:'button', onclick:() => resolve(it, 'Allowed for this thread', 'pos', it.cmd)}, 'Allow for this thread'),
    H.h('button.btn', {type:'button', onclick:() => { confirmId = it.id; draw(); }}, 'Always allow this command'),
    H.h('button.btn.ghost.btn.danger', {type:'button', onclick:() => resolve(it, 'Denied', 'neg', 'Hermes will ask again next turn')}, 'Deny'),
    H.h('button.btn.ghost.inbox-end', {type:'button', onclick:() => openThread(it.thread)}, H.ic('external','sm'), 'Open thread')
  ));
}

function clarifyBody(it, body, res){
  body.append(
    H.h('div.inbox-block',
      H.h('span.inbox-label','Question'),
      H.h('p.inbox-question', it.question),
      H.h('p.inbox-why', it.why)
    )
  );
  if (!res){
    const opts = H.h('div.inbox-options', (it.options || []).map(o =>
      H.h('button.btn.inbox-opt', {type:'button', onclick:() => {
        it.answer = o;
        resolve(it, 'Answered', 'pos', '', o);
      }}, o)
    ));
    body.appendChild(opts);

    const ta = H.h('textarea.textarea', {placeholder:'Or reply in your own words', 'aria-label':'Reply to Hermes', rows:'3'});
    const err = H.h('div.inbox-err-text', {hidden:true}, 'Type a reply before sending.');
    body.appendChild(H.h('div.inbox-reply',
      ta,
      H.h('div.inbox-reply-row',
        err,
        H.h('button.btn.primary', {type:'button', onclick:() => {
          const v = ta.value.trim();
          if (!v){ err.hidden = false; ta.focus(); return; }
          ta.value = '';
          it.answer = v;
          resolve(it, 'Answered', 'pos', '', v);
        }}, H.ic('send','sm'), 'Send')
      )
    ));
    body.appendChild(H.h('div.inbox-actions',
      H.h('button.btn.ghost.inbox-end', {type:'button', onclick:() => openThread(it.thread)}, H.ic('external','sm'), 'Open thread')
    ));
  }
}

function doneBody(it, body, res){
  body.append(
    H.h('div.inbox-block', H.h('span.inbox-label','Summary'), H.h('p.inbox-why', it.summary || it.detail || '')),
    H.h('div.inbox-block',
      H.h('span.inbox-label','Files changed'),
      H.h('div.inbox-files', (it.artifacts || []).map(f =>
        H.h('div.inbox-file',
          H.ic('file','sm'),
          H.h('span.inbox-path', f.path),
          H.h('span.inbox-add', '+' + f.add),
          H.h('span.inbox-del', '−' + f.del)
        )
      ))
    ),
    H.h('div.inbox-note', H.ic('check','sm'), H.h('span','Verified with ', H.h('code.inbox-pattern','unzip -t'), ' and a scratch-dir restore. Nothing was written outside ~/hermes-maintenance.'))
  );
  if (!res){
    body.appendChild(H.h('div.inbox-actions',
      H.h('button.btn', {type:'button', onclick:() => openThread(it.thread)}, H.ic('external','sm'), 'Open thread'),
      H.h('button.btn.inbox-end', {type:'button', onclick:() => resolve(it, 'Archived', 'pos', 'Moved to History')}, H.ic('archive','sm'), 'Archive')
    ));
  }
}

function failedBody(it, body, res){
  body.append(
    H.h('div.inbox-block',
      H.h('span.inbox-label','Error'),
      H.h('div.inbox-error', it.error)
    ),
    H.h('div.inbox-block',
      H.h('span.inbox-label','What was tried'),
      H.h('div.inbox-timeline', (it.retries || []).map(r =>
        H.h('div.inbox-tl',
          H.h('span.dot' + (r.tone ? '.' + r.tone : '')),
          H.h('div.inbox-tl-main',
            H.h('div.inbox-tl-t', r.model, H.h('span.inbox-tl-role', r.role)),
            H.h('div.inbox-tl-s', r.at + ' · ' + r.note)
          )
        )
      ))
    ),
    H.h('div.inbox-note', H.ic('info','sm'), H.h('span', it.routine))
  );
  if (res) return;

  body.appendChild(H.h('div.inbox-actions',
    H.h('button.btn.primary', {type:'button', onclick:() => resolve(it, 'Retrying', 'pos', 'Same model · new turn')}, H.ic('retry','sm'), 'Retry'),
    H.h('button.btn', {type:'button', onclick:() => switchModel(it)}, 'Switch model and retry'),
    H.h('button.btn.ghost.inbox-end', {type:'button', onclick:() => openThread(it.thread)}, H.ic('external','sm'), 'Open thread')
  ));
}

function switchModel(it){
  const body = H.h('div.inbox-modal');
  let choice = 'claude-sonnet-5-5';
  const list = H.h('div.inbox-model-list');
  H.data.models.forEach(m => {
    const b = H.h('button.inbox-model', {type:'button', 'aria-pressed':String(m.id === choice), onclick:() => {
      choice = m.id;
      list.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed','false'));
      b.setAttribute('aria-pressed','true');
    }},
      H.h('span.inbox-model-id', m.id),
      H.h('span.inbox-model-note', m.provider + ' · ' + m.ctx + ' ctx')
    );
    list.appendChild(b);
  });
  body.append(
    H.h('h2.inbox-modal-h', 'Retry with another model'),
    H.h('p.inbox-modal-p', 'The failed turn is replayed from the last checkpoint. The routine keeps its schedule.'),
    list
  );
  const m = H.modal(body, {width:480});
  body.appendChild(H.h('div.inbox-modal-actions',
    H.h('button.btn', {type:'button', onclick:m.close}, 'Cancel'),
    H.h('button.btn.primary', {type:'button', onclick:() => {
      m.close();
      resolve(it, 'Retrying', 'pos', 'Switched to ' + choice);
    }}, 'Retry with ' + choice)
  ));
}

function reviewBody(it, body, res){
  const files = it.files || [];
  const adds = files.reduce((n,f) => n + f.add, 0);
  const dels = files.reduce((n,f) => n + f.del, 0);
  body.append(
    H.h('div.inbox-block',
      H.h('span.inbox-label','Summary'),
      H.h('p.inbox-why', 'Branch ', H.h('code.inbox-pattern', it.branch || 'main'), ' in a worktree. ',
        files.length + ' files changed, +' + adds + ' −' + dels + '. Tests not run yet; the diff is ready for your read.')
    ),
    H.h('div.inbox-block',
      H.h('div.inbox-block-h',
        H.h('span.inbox-label','Files changed'),
        H.h('span.inbox-file-sum', '+' + adds + ' −' + dels)
      ),
      H.h('div.inbox-files', files.map(f =>
        H.h('div.inbox-file',
          H.ic('file','sm'),
          H.h('span.inbox-path', f.path),
          H.h('span.inbox-add', '+' + f.add),
          H.h('span.inbox-del', '−' + f.del)
        )
      ))
    )
  );
  if (!res){
    body.appendChild(H.h('div.inbox-actions',
      H.h('button.btn.primary', {type:'button', onclick:() => { openThread(it.thread); toast('Opened thread with ' + files.length + ' changed files'); }}, H.ic('diff','sm'), 'Open changes'),
      H.h('button.btn.ghost.inbox-end', {type:'button', onclick:() => openThread(it.thread)}, H.ic('external','sm'), 'Open thread')
    ));
    body.appendChild(H.h('div.inbox-note', H.ic('info','sm'), H.h('span','Reviews are read-only here. Nothing is committed unless you ask Hermes to merge.')));
  }
}

function secretBody(it, body, res){
  body.append(
    H.h('div.inbox-block',
      H.h('span.inbox-label','What Hermes needs'),
      H.h('p.inbox-why', it.why)
    ),
    H.h('dl.inbox-kv',
      ...kv('Variable', H.h('code.inbox-pattern', it.varName)),
      ...kv('Written to', H.h('span.mono', '~/.hermes/.env')),
      ...kv('Read back', 'Never · the value is not shown in the transcript')
    )
  );
  if (res) return;

  const input = H.h('input.input.inbox-secret', {type:'password', placeholder:'Paste the token', 'aria-label':'Value for ' + it.varName, autocomplete:'off'});
  const err = H.h('div.inbox-err-text', {hidden:true}, 'Enter a value first, or skip.');
  const reveal = H.h('button.btn.sm.icon', {type:'button', 'aria-label':'Show value', title:'Show value', onclick:() => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    reveal.setAttribute('aria-label', show ? 'Hide value' : 'Show value');
  }}, H.ic('eye','sm'));

  body.appendChild(H.h('div.inbox-block.inbox-secret-block',
    H.h('span.inbox-label','Value'),
    H.h('div.inbox-secret-row', input, reveal),
    err,
    H.h('div.inbox-actions.inbox-actions-tight',
      H.h('button.btn.primary', {type:'button', onclick:() => {
        if (!input.value.trim()){ err.hidden = false; input.focus(); return; }
        input.value = '';
        resolve(it, 'Secret provided', 'pos', it.varName + ' written to .env');
      }}, 'Provide'),
      H.h('button.btn.ghost', {type:'button', onclick:() => resolve(it, 'Skipped', 'neg', 'Telegram channel stays off')}, 'Skip')
    )
  ));
  body.appendChild(H.h('div.inbox-note', H.ic('lock','sm'), H.h('span','The value is written straight to the vault and .env. Hermes never echoes it back.')));
}

function browserBody(it, body, res){
  body.append(
    H.h('div.inbox-block',
      H.h('span.inbox-label','What happened'),
      H.h('p.inbox-why', 'Hermes paused on a login page in its browser; take over. The tab is still open and will keep its cookies until the session ends.'),
      H.h('div.inbox-browser',
        H.h('div.inbox-browser-bar', H.h('span.dot.warn'), H.h('span.inbox-browser-url', it.page)),
        H.h('div.inbox-browser-body',
          H.h('div.inbox-browser-t', 'Sign in to continue'),
          H.h('div.inbox-browser-s', 'GitHub is asking for a password. Hermes will not type credentials it does not have.'),
          H.h('div.inbox-browser-s', 'Waiting ' + it.waiting + ' · Chromium 131 · profile “hermes”')
        )
      )
    )
  );
  if (res) return;
  body.appendChild(H.h('div.inbox-actions',
    H.h('button.btn.primary', {type:'button', onclick:() => resolve(it, 'Browser handed over', 'pos', 'Tab opened for you · 127.0.0.1:9222')}, H.ic('globe','sm'), 'Open browser'),
    H.h('button.btn.ghost.inbox-end', {type:'button', onclick:() => openThread(it.thread)}, H.ic('external','sm'), 'Open thread')
  ));
}

/* ---------- shell ---------- */
function build(){
  const parts = [];
  if (paused && !LIVE){
    parts.push(H.h('div.inbox-banner',
      H.h('span.dot.warn'),
      H.h('span.inbox-banner-t', 'Paused: cron and new turns are stopped'),
      H.h('button.btn.sm.inbox-banner-btn', {type:'button', onclick:() => { paused = false; draw(); toast('Agents resumed'); }}, 'Resume')
    ));
  }
  const split = H.h('div.split.inbox-split' + (detailOpen ? '.inbox-open' : ''),
    listPane(),
    detail(sel ? byId(sel) : null)
  );
  parts.push(split);
  return H.h('div.inbox-wrap', parts);
}

function draw(){
  if (!viewRoot) return;
  const oldPane = viewRoot.querySelector('.inbox-pane');
  const oldDet = viewRoot.querySelector('.inbox-detail');
  const ls = oldPane ? oldPane.scrollTop : 0;
  const rs = oldDet ? oldDet.scrollTop : 0;
  viewRoot.replaceChildren(build());
  const np = viewRoot.querySelector('.inbox-pane');
  const nd = viewRoot.querySelector('.inbox-detail');
  if (np) np.scrollTop = ls;
  if (nd) nd.scrollTop = detailTop ? 0 : rs;
  detailTop = false;
}

H.views.inbox = {
  title: 'inbox',
  render(root, ctx){
    viewRoot = root;
    appCtx = ctx || {};
    if (LIVE){
      bindRpc();
      if (!inited){ inited = true; sel = null; resolvedById = readResolved(); }
      loadLive();
      return;
    }
    if (!inited){
      inited = true;
      sel = isNarrow() ? null : (ITEMS[0] ? ITEMS[0].id : null);
    }
    draw();
  },
};

/* The stage (js/stages-inbox.js) reads the same live queue; sample mode never touches this. */
H.inbox = {
  live: LIVE,
  load(){ bindRpc(); return loadLive(); },
  bindRpc,
  items: () => ITEMS,
  pending: livePending,
  resolve,
  isResolved: id => !!resolvedById[id],
  readResolved,
  agoLabel,
};
})();
