/* Routines · scheduled jobs, webhook triggers and the shared task board.
   Registers H.views.routines. Owns js/views/routines.js + css/routines.css. */
(function(){
'use strict';
const H = window.H;
/* H.live === true when the page is served by the dashboard: real cron jobs, real
   webhook routes, real clock. Sample mode keeps the fixed Thursday-morning frame. */
const LIVE = !!H.live;
const MIN = 60000, HOUR = 3600000, DAY = 86400000;
const DOW_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DOW_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TABS = [{id:'schedules',label:'Schedules'},{id:'triggers',label:'Triggers'},{id:'board',label:'Board'}];

/* Sample clock: the prototype is a still frame of a Thursday morning. Keeping the
   clock fixed makes “last run”, “next run” and the Today strip agree with each other. */
const NOW = (function(){ const d = new Date(); d.setHours(10,42,0,0); return d; })();
const TODAY = (function(){ const d = new Date(NOW); d.setHours(0,0,0,0); return d; })();
/* Live mode uses the wall clock; sample mode keeps the still frame above. */
function nowDate(){ return LIVE ? new Date() : NOW; }
function todayStart(){ const d = nowDate(); d.setHours(0,0,0,0); return d; }

const pad2 = n => String(n).padStart(2,'0');
const fmtHM = d => pad2(d.getHours()) + ':' + pad2(d.getMinutes());
const fmtRun = d => DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + ', ' + fmtHM(d);
const fmtShort = d => DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()];
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

function relAt(d){
  if(!d) return '–';
  const diff = Math.max(0, nowDate().getTime() - d.getTime());
  if(diff < MIN) return 'just now';
  const mins = Math.floor(diff/MIN);
  if(mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins/60);
  if(hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs/24);
  if(days < 7) return days + 'd ago';
  return fmtShort(d);
}
function fmtNext(d){
  if(!d) return '–';
  const t = fmtHM(d);
  const day = new Date(d); day.setHours(0,0,0,0);
  const diff = Math.round((day - todayStart())/DAY);
  if(diff === 0) return 'Today ' + t;
  if(diff === 1) return 'Tomorrow ' + t;
  if(diff > 1 && diff < 7) return DOW_SHORT[d.getDay()] + ' ' + t;
  return DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + ' ' + t;
}
function atTime(day, hhmm){
  const p = String(hhmm || '00:00').split(':');
  const d = new Date(day);
  d.setHours(Number(p[0]) || 0, Number(p[1]) || 0, 0, 0);
  return d;
}

/* ---------- cron (5 fields, numeric, *, lists, ranges, steps) ---------- */
function parseCronField(str, lo, hi){
  if(str === '*') return null;
  const out = new Set();
  const parts = String(str).split(',');
  for(const part of parts){
    if(!part) return undefined;
    const bits = part.split('/');
    if(bits.length > 2) return undefined;
    const step = bits[1] === undefined ? 1 : Number(bits[1]);
    if(!Number.isInteger(step) || step < 1) return undefined;
    let a = lo, b = hi;
    if(bits[0] !== '*'){
      const r = bits[0].split('-');
      if(r.length > 2 || r[0] === '') return undefined;
      a = Number(r[0]); b = r.length === 2 ? Number(r[1]) : a;
      if(!Number.isInteger(a) || !Number.isInteger(b) || a < lo || b > hi || a > b) return undefined;
    }
    for(let v = a; v <= b; v += step) out.add(v);
  }
  return out;
}
function cronParse(expr){
  const f = String(expr || '').trim().split(/\s+/);
  if(f.length !== 5) return null;
  const bounds = [[0,59],[0,23],[1,31],[1,12],[0,7]];
  const sets = [];
  for(let i = 0; i < 5; i++){
    const s = parseCronField(f[i], bounds[i][0], bounds[i][1]);
    if(s === undefined) return null;
    sets.push(s);
  }
  return sets;
}
function cronMatches(sets, d){
  const [mi,ho,dom,mon,dow] = sets;
  if(mi && !mi.has(d.getMinutes())) return false;
  if(ho && !ho.has(d.getHours())) return false;
  if(mon && !mon.has(d.getMonth()+1)) return false;
  const domOk = !dom || dom.has(d.getDate());
  const w = d.getDay();
  const dowOk = !dow || dow.has(w) || (w === 0 && dow.has(7));
  if(dom && dow) return domOk || dowOk;
  return domOk && dowOk;
}
function cronNext(expr, from, count){
  const sets = cronParse(expr);
  if(!sets) return null;
  const out = [];
  const d = new Date(from);
  d.setSeconds(0,0);
  d.setMinutes(d.getMinutes()+1);
  const limit = from.getTime() + 400*DAY;
  while(out.length < count && d.getTime() <= limit){
    if(sets[3] && !sets[3].has(d.getMonth()+1)){ d.setMonth(d.getMonth()+1, 1); d.setHours(0,0,0,0); continue; }
    const domOk = !sets[2] || sets[2].has(d.getDate());
    const w = d.getDay();
    const dowOk = !sets[4] || sets[4].has(w) || (w === 0 && sets[4].has(7));
    const dayOk = sets[2] && sets[4] ? (domOk || dowOk) : (domOk && dowOk);
    if(!dayOk){ d.setDate(d.getDate()+1); d.setHours(0,0,0,0); continue; }
    if(sets[1] && !sets[1].has(d.getHours())){ d.setHours(d.getHours()+1,0,0,0); continue; }
    if(sets[0] && !sets[0].has(d.getMinutes())){ d.setMinutes(d.getMinutes()+1,0,0); continue; }
    out.push(new Date(d));
    d.setMinutes(d.getMinutes()+1,0,0);
  }
  return out.length ? out : null;
}

/* ---------- schedule maths ---------- */
function unitMs(u){ return u === 'minutes' ? MIN : u === 'days' ? DAY : HOUR; }

function nextFire(s, from){
  if(!s) return null;
  from = from || NOW;
  if(s.kind === 'daily'){
    for(let i = 0; i < 2; i++){
      const d = atTime(addDays(from, i), s.time);
      if(d > from) return d;
    }
  }
  if(s.kind === 'weekly'){
    for(let i = 0; i < 8; i++){
      const day = addDays(from, i);
      if((s.days || []).includes(day.getDay())){
        const d = atTime(day, s.time);
        if(d > from) return d;
      }
    }
  }
  if(s.kind === 'every'){
    const step = Math.max(1, Number(s.n) || 1) * unitMs(s.unit);
    const start = new Date(from); start.setHours(0,0,0,0);
    let t = start.getTime();
    while(t <= from.getTime()) t += step;
    return new Date(t);
  }
  if(s.kind === 'cron'){
    const list = cronNext(s.expr, from, 1);
    return list ? list[0] : null;
  }
  return null;
}
function prevFire(s, from){
  if(!s) return null;
  if(s.kind === 'daily'){
    for(let i = 0; i < 2; i++){
      const d = atTime(addDays(from, -i), s.time);
      if(d < from) return d;
    }
  }
  if(s.kind === 'weekly'){
    for(let i = 0; i < 8; i++){
      const day = addDays(from, -i);
      if((s.days || []).includes(day.getDay())){
        const d = atTime(day, s.time);
        if(d < from) return d;
      }
    }
  }
  if(s.kind === 'every'){
    const step = Math.max(1, Number(s.n) || 1) * unitMs(s.unit);
    const start = new Date(from); start.setHours(0,0,0,0);
    let t = start.getTime(), last = null;
    while(t <= from.getTime()){ last = t; t += step; }
    return last === null ? null : new Date(last);
  }
  return null;
}
function nextRuns(s, from, count){
  if(!s) return null;
  if(s.kind === 'cron') return cronNext(s.expr, from, count);
  const out = [];
  let cur = from;
  for(let i = 0; i < count; i++){
    const n = nextFire(s, cur);
    if(!n) break;
    out.push(n);
    cur = new Date(n.getTime() + MIN);
  }
  return out;
}
function fireTimes(s, day){
  if(!s) return [];
  const out = [];
  if(s.kind === 'weekly'){
    if((s.days || []).includes(day.getDay())) out.push(atTime(day, s.time));
  } else if(s.kind === 'daily'){
    out.push(atTime(day, s.time));
  } else if(s.kind === 'every'){
    const step = Math.max(1, Number(s.n) || 1) * unitMs(s.unit);
    const start = new Date(day); start.setHours(0,0,0,0);
    for(let t = start.getTime(); t < start.getTime() + DAY && out.length < 96; t += step) out.push(new Date(t));
  } else if(s.kind === 'cron'){
    const sets = cronParse(s.expr);
    if(sets){
      const d = new Date(day); d.setHours(0,0,0,0);
      for(let i = 0; i < 1440 && out.length < 96; i++){
        if(cronMatches(sets, d)) out.push(new Date(d));
        d.setMinutes(d.getMinutes()+1);
      }
    }
  }
  return out;
}
function scheduleLabel(s){
  if(!s) return 'No schedule';
  if(s.kind === 'daily') return 'Daily at ' + s.time;
  if(s.kind === 'weekly'){
    const ds = (s.days || [1]).slice().sort();
    if(ds.join(',') === '1,2,3,4,5') return 'Weekdays at ' + s.time;
    if(ds.length === 7) return 'Every day at ' + s.time;
    if(ds.length === 1) return DOW_LONG[ds[0]] + 's at ' + s.time;
    return ds.map(d => DOW_SHORT[d]).join(', ') + ' at ' + s.time;
  }
  if(s.kind === 'every'){
    const n = Math.max(1, Number(s.n) || 1);
    const unit = s.unit === 'minutes' ? 'minute' : s.unit === 'days' ? 'day' : 'hour';
    if(n === 1) return 'Every ' + unit;
    return 'Every ' + n + ' ' + unit + 's';
  }
  if(s.kind === 'once') return 'Once at ' + (s.at ? s.at.replace('T', ' ') : 'a time you pick');
  if(s.kind === 'cron') return 'Cron · ' + s.expr;
  return 'No schedule';
}

/* =====================================================================
   LIVE ADAPTERS
   Shapes come from web/src/lib/api.ts (CronJob / CronJobMutation), the
   schedule string grammar in web/src/lib/schedule.ts and
   hermes_cli/web_routers/cron.py. Sample arrays above stay untouched.
   ===================================================================== */
function deliverLabel(id){
  const v = String(id || '').trim();
  if(!v || v === 'local') return 'Save only';
  if(v === 'telegram') return 'Telegram';
  if(v === 'discord') return 'Discord';
  if(v === 'slack') return 'Slack';
  if(v === 'email') return 'Email';
  if(v === 'log') return 'Log only';
  if(v.indexOf('bot-chat') === 0) return 'Bot chat';
  if(v.indexOf('telegram:') === 0) return 'Telegram · chat';
  return v;
}
function parseApiDate(v){
  if(v === null || v === undefined || v === '') return null;
  if(typeof v === 'number') return new Date(v > 1e12 ? v : v * 1000);
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function statusKey(v){
  const s = String(v || '').toLowerCase();
  if(!s) return null;
  if(s === 'ok' || s === 'success' || s === 'completed') return 'ok';
  if(s === 'running' || s === 'in_progress') return 'running';
  if(s === 'skipped') return 'skipped';
  if(s === 'delivery_failed') return 'delivery_failed';
  if(s === 'blocked_config') return 'blocked';
  return 'failed';
}
/* Stored schedule string (exactly what POST/PUT /api/cron/jobs expects). */
function toScheduleString(s){
  if(!s) return '';
  const hhmm = String(s.time || '09:00').split(':');
  const h = Number(hhmm[0]) || 0, mi = Number(hhmm[1]) || 0;
  if(s.kind === 'every'){
    const n = Math.max(1, Math.floor(Number(s.n) || 1));
    const suffix = s.unit === 'minutes' ? 'm' : s.unit === 'days' ? 'd' : 'h';
    return 'every ' + n + suffix;
  }
  if(s.kind === 'daily') return mi + ' ' + h + ' * * *';
  if(s.kind === 'weekly'){
    const days = (s.days || []).slice().sort().join(',');
    return mi + ' ' + h + ' * * ' + (days || '*');
  }
  if(s.kind === 'once') return s.at ? (s.at.length === 16 ? s.at + ':00' : s.at) : '';
  if(s.kind === 'cron') return String(s.expr || '').trim();
  return '';
}
/* CronJob.schedule -> the editor's structured shape. */
function fromApiSchedule(job){
  const s = (job && job.schedule) || {};
  const raw = String(job.schedule_display || s.expr || s.run_at || '').trim();
  if(s.kind === 'interval' && typeof s.minutes === 'number' && s.minutes > 0){
    const m = s.minutes;
    if(m % 1440 === 0) return {kind:'every', n:m / 1440, unit:'days'};
    if(m % 60 === 0) return {kind:'every', n:m / 60, unit:'hours'};
    return {kind:'every', n:m, unit:'minutes'};
  }
  if(s.kind === 'once' || /^\d{4}-\d{2}-\d{2}T/.test(raw)) return {kind:'once', at:raw.slice(0, 16)};
  const m = /^every\s+(\d+)\s*([mhd])$/i.exec(raw);
  if(m){
    const u = m[2].toLowerCase() === 'm' ? 'minutes' : m[2].toLowerCase() === 'h' ? 'hours' : 'days';
    return {kind:'every', n:Number(m[1]) || 1, unit:u};
  }
  if(raw) return {kind:'cron', expr:raw};
  return {kind:'every', n:1, unit:'hours'};
}
function pseudoAgent(name){
  const known = H.agent(name);
  if(known) return known;
  let hue = 0;
  for(let i = 0; i < String(name).length; i++) hue = (hue * 31 + name.charCodeAt(i)) % 360;
  return {id:name, name:name, role:'profile', hue:hue, kind:2, state:'idle', model:''};
}
function fromApiJob(job){
  const schedule = fromApiSchedule(job);
  return {
    id: job.id,
    name: job.name || job.id,
    prompt: job.prompt || '',
    agent: job.profile_name || job.profile || H.api.profile || 'default',
    profile: job.profile_name || job.profile || null,
    model: job.model || '',
    provider: job.provider || '',
    deliver: job.deliver || 'local',
    skills: Array.isArray(job.skills) ? job.skills.slice() : [],
    enabled: job.enabled !== false && job.state !== 'paused' && job.state !== 'completed',
    state: job.state || null,
    schedule: schedule,
    scheduleText: String(job.schedule_display || (job.schedule && job.schedule.expr) || '').trim() || toScheduleString(schedule),
    lastAt: parseApiDate(job.last_run_at),
    nextAt: parseApiDate(job.next_run_at),
    lastStatus: statusKey(job.last_status),
    lastError: job.last_error || job.last_delivery_error || '',
    runs: null,           /* loaded from /runs when the drawer opens */
    _api: job,
  };
}
function fromApiWebhook(r){
  return {
    name: r.name,
    route: r.name,
    deliver: r.deliver || 'log',
    prompt: r.prompt || '',
    description: r.description || '',
    events: Array.isArray(r.events) ? r.events : [],
    skills: Array.isArray(r.skills) ? r.skills : [],
    signature: r.signature || null,
    secretSet: !!r.secret_set,
    enabled: r.enabled !== false,
    url: r.url || '',
    createdAt: r.created_at || null,
    last: null,
  };
}

/* GET /api/cron/jobs/{id}/runs -> the run rows this module renders. The endpoint's
   `title` carries the ledger status (COMPLETED · …, FAILED · …); `preview` is the
   stored snippet. Cost is not on this endpoint, so it prints as an en dash. */
function fromApiRun(row){
  const started = parseApiDate(row.started_at) || new Date();
  const ended = parseApiDate(row.ended_at);
  const title = String(row.title || '');
  let st = 'ok';
  if(/^FAILED/.test(title)) st = 'failed';
  else if(/^CANCELLED/.test(title) || /^MISSED/.test(title)) st = 'skipped';
  else if(row.is_active) st = 'running';
  const dur = ended ? Math.max(0, Math.round((ended.getTime() - started.getTime()) / 1000)) : null;
  const tokens = (Number(row.input_tokens) || 0) + (Number(row.output_tokens) || 0);
  return {
    at: started,
    status: st,
    duration: dur,
    tokens: tokens || null,
    cost: null,
    out: row.preview || title || '',
  };
}

/* ---------- live loaders ---------- */
const live = {
  loaded: false,
  loading: false,
  error: null,
  gen: 0,
};
function liveError(e){ return (e && e.message) || 'Request failed'; }
async function loadSchedules(){
  const gen = ++live.gen;
  live.loading = true; live.error = null;
  try {
    const jobs = await H.api.get('/api/cron/jobs?profile=all');
    if(gen !== live.gen) return;
    state.routines = (Array.isArray(jobs) ? jobs : []).map(fromApiJob);
    live.loaded = true;
    H.api.get('/api/cron/delivery-targets' + (H.api.profile ? '?profile=' + encodeURIComponent(H.api.profile) : ''))
      .then(function(d){ state.deliveryTargets = (d && d.targets) || []; })
      .catch(function(){ /* the drawer falls back to "Local (save only)" */ });
  } catch(e){
    if(gen !== live.gen) return;
    live.error = liveError(e);
  } finally {
    if(gen === live.gen) live.loading = false;
  }
}
const hookState = {enabled:null, baseUrl:'', loaded:false, loading:false, error:null, gen:0};
async function loadWebhooks(){
  const gen = ++hookState.gen;
  hookState.loading = true; hookState.error = null;
  try {
    const d = await H.api.get('/api/webhooks');
    if(gen !== hookState.gen) return;
    hookState.enabled = !!d.enabled;
    hookState.baseUrl = d.base_url || '';
    state.webhooks = (d.subscriptions || []).map(fromApiWebhook);
    hookState.loaded = true;
  } catch(e){
    if(gen !== hookState.gen) return;
    hookState.error = liveError(e);
  } finally {
    if(gen === hookState.gen) hookState.loading = false;
  }
}
/* After a successful mutation: drop the cached read and repaint from the server. */
function reloadLive(){
  state.scroll = (currentPage && currentPage.scrollTop) || state.scroll;
  if(state.tab === 'triggers'){ hookState.loaded = false; hookState.error = null; }
  else { live.loaded = false; live.error = null; }
  renderView(currentRoot, {route:[state.tab], go:lastCtx && lastCtx.go, toast:lastCtx && lastCtx.toast, openThread:lastCtx && lastCtx.openThread});
}
function failToast(what, e){
  notify(what + ' failed · ' + liveError(e));
}

/* ---------- runs ---------- */
function seeded(seed){
  let s = (seed || 1) * 7919;
  return function(){ s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
}
function buildRuns(s, firstStatus, lastAt, seed, output, failure){
  if(!lastAt) return [];
  const rand = seeded(seed);
  const runs = [];
  for(let i = 0; i < 8; i++){
    let at;
    if(s.kind === 'every') at = new Date(lastAt.getTime() - i * Math.max(1, Number(s.n) || 1) * unitMs(s.unit));
    else if(s.kind === 'daily') at = new Date(lastAt.getTime() - i * DAY);
    else at = new Date(lastAt.getTime() - i * 7 * DAY);
    const status = i === 0 ? firstStatus : (i === 4 && seed % 2 === 0 ? 'skipped' : 'ok');
    const duration = status === 'skipped' ? 0 : Math.round(16 + rand()*74);
    const tokens = status === 'skipped' ? 0 : Math.round(4200 + rand()*26000);
    const cost = status === 'skipped' ? 0 : +(tokens * 0.0000029).toFixed(3);
    runs.push({
      at, status, duration, tokens, cost,
      out: i === 0 && firstStatus === 'failed' ? failure : (status === 'skipped' ? 'Skipped · the previous run was still holding the profile lock.' : output)
    });
  }
  return runs;
}

/* ---------- sample routines ---------- */
const COST_FAILURE = 'Provider returned 429 (rate limited) on attempt 1.\nRetry after 20s also returned 429; fallback gemini-flash exhausted.\nRun aborted after 3m 12s. Last successful run: Mon 9 Nov, 07:00.';

const ROUTINE_DEFS = [
  {id:'r-inbox', name:'Inbox brief', agent:'hermes', deliver:'Telegram',
   schedule:{kind:'weekly', days:[1,2,3,4,5], time:'08:00'},
   prompt:'Summarise unread mail from the last 12 hours. Group by sender, flag anything that needs a reply today, and keep it under 150 words. Send the result to Telegram.',
   model:'', skills:['email-triage','summarise'], enabled:true, lastStatus:'ok', seed:3,
   output:'Scanned 34 unread messages across 2 accounts.\n3 need a reply today: billing@atomicmail, Priya, GitHub Security. Drafts saved in atomicmail.'},
  {id:'r-standup', name:'Standup digest', agent:'scout', deliver:'Thread only',
   schedule:{kind:'weekly', days:[1,2,3,4,5], time:'09:30'},
   prompt:'Collect yesterday’s commits in hermes-maintenance and atomicmail, group them by branch, and note what is blocked. Keep it to five bullets.',
   model:'', skills:['git-log','summarise'], enabled:true, lastStatus:'ok', seed:4,
   output:'6 commits across 2 branches since yesterday 09:30.\nBlocked: worktree ui-redesign waits on the base.css review.'},
  {id:'r-backup', name:'Backup verify', agent:'ledger', deliver:'Email',
   schedule:{kind:'daily', time:'02:00'},
   prompt:'Verify last night’s backup zip in ~/backups. Check the checksum, count files, and restore state.db, -wal and -shm into a scratch directory. Email me only if anything fails; otherwise log a one-line confirmation.',
   model:'', skills:['backup-check','shell'], enabled:true, lastStatus:'ok', seed:5,
   output:'Backup verified: 214 MB, 3,912 files, checksum OK.\nstate.db, -wal and -shm restored cleanly in /tmp/hermes-restore-check.'},
  {id:'r-cost', name:'Weekly cost report', agent:'ledger', deliver:'Email',
   schedule:{kind:'weekly', days:[1], time:'07:00'},
   prompt:'Build the weekly token and cost report across all profiles. Break it down by agent and model, compare with last week, and email the table plus three observations.',
   model:'', skills:['usage-report','invoice-parse'], enabled:true, lastStatus:'failed', seed:6,
   failure:COST_FAILURE,
   output:'Weekly report: 1.24M tokens, $18.42 across 3 profiles.\nAnthropic 61%, DeepSeek 24%, Google 15%.'},
  {id:'r-deep', name:'Deep-work block', agent:'hermes', deliver:'Thread only',
   schedule:{kind:'weekly', days:[1,2,3,4,5], time:'13:00'},
   prompt:'Protect 90 minutes on today’s calendar for deep work. Move any 1:1 shorter than 30 minutes, and tell me what moved in this thread.',
   model:'claude-opus-5-5', skills:['calendar'], enabled:true, lastStatus:'ok', seed:7,
   output:'Protected 13:00–14:30 on today’s calendar.\nMoved one 1:1 to Friday at 10:00.'},
  {id:'r-deps', name:'Dependency audit', agent:'scout', deliver:'Telegram',
   schedule:{kind:'weekly', days:[1], time:'06:00'},
   prompt:'Check the Python and npm lockfiles in ~/hermes-maintenance for outdated packages and advisories. List only packages that affect this machine, with the fixed version.',
   model:'', skills:['web-search'], enabled:true, lastStatus:'ok', seed:8,
   output:'3 packages behind: cryptography 44.0.2, httpx 0.28.1, ruff 0.9.4.\nNo advisories affecting this machine.'},
  {id:'r-health', name:'Gateway health sweep', agent:'hermes', deliver:'Telegram',
   schedule:{kind:'every', n:4, unit:'hours'},
   prompt:'Check the gateway on :9119 and the API on :8642. Report heartbeat gaps over 30 seconds, session count, RSS and CPU. Stay quiet unless something is off.',
   model:'', skills:['shell'], enabled:true, lastStatus:'ok', seed:9,
   output:'Gateway :9119 healthy. 7 sessions, 412 MB RSS, 3% CPU.\nNo heartbeat gap over 30s in the last 4 hours.'},
  {id:'r-read', name:'Reading list', agent:'scout', deliver:'Email',
   schedule:{kind:'weekly', days:[5], time:'17:00'},
   prompt:'Pick five links from the saved reading queue that are worth Friday afternoon attention. One sentence each, newest first.',
   model:'', skills:['web-search','summarise'], enabled:true, lastStatus:'ok', seed:10,
   output:'5 links queued for Friday.\nTop pick: the state.db WAL recovery write-up from the SQLite team.'},
];

const state = {
  tab:'schedules',
  paused:false,
  scroll:0,
  boardScroll:0,
  routines:[],
  webhooks:[],
  deliveries:[],
  cards:[],
  deliveryTargets:[],
};

ROUTINE_DEFS.forEach(function(def){
  const last = prevFire(def.schedule, NOW);
  const r = Object.assign({}, def);
  r.lastAt = last;
  r.lastStatus = def.lastStatus || null;
  r.runs = buildRuns(def.schedule, def.lastStatus || 'ok', last, def.seed, def.output, def.failure);
  state.routines.push(r);
});

/* ---------- sample webhooks ---------- */
state.webhooks = [
  {route:'github-push', source:'GitHub', deliver:'Telegram',
   prompt:'Summarise this push to hermes-maintenance and flag any change under state.db:\n{payload}',
   last:{code:200, at:new Date(NOW.getTime()-12*MIN)}},
  {route:'stripe-invoice', source:'Stripe', deliver:'Email',
   prompt:'Record this Stripe event and email me only if a payment failed:\n{payload}\nInclude the invoice id and amount.',
   last:{code:401, at:new Date(NOW.getTime()-18*HOUR)}},
  {route:'monitor-alert', source:'Generic', deliver:'Telegram',
   prompt:'Page me with the alert name, host and first line of the payload. Do not wake me for warnings:\n{payload}',
   last:{code:200, at:new Date(NOW.getTime()-2*HOUR)}},
];
state.deliveries = [
  {at:new Date(NOW.getTime()-2*MIN), route:'github-push', source:'GitHub', code:200, ms:96},
  {at:new Date(NOW.getTime()-18*MIN), route:'stripe-invoice', source:'Stripe', code:401, ms:42},
  {at:new Date(NOW.getTime()-1*HOUR), route:'monitor-alert', source:'Generic', code:200, ms:210},
  {at:new Date(NOW.getTime()-3*HOUR), route:'github-push', source:'GitHub', code:200, ms:88},
  {at:new Date(NOW.getTime()-26*HOUR), route:'stripe-invoice', source:'Stripe', code:200, ms:74},
  {at:new Date(NOW.getTime()-29*HOUR), route:'monitor-alert', source:'Generic', code:200, ms:199},
];

/* ---------- sample board ---------- */
const COLUMNS = [
  {id:'backlog', name:'Backlog'},
  {id:'ready', name:'Ready'},
  {id:'running', name:'Running'},
  {id:'review', name:'Review'},
  {id:'done', name:'Done'},
];
const CARD_DEFS = [
  {id:'k1', col:'backlog', title:'Prune session exports older than 90 days', agent:'ledger',
   blockedBy:'retention sign-off',
   desc:'~/.hermes/exports has 41 session dumps, 8.2 GB in total. Keep the last 90 days plus anything referenced from the inbox, then prune the rest.',
   linked:[{title:'Retention policy in config.yaml', status:'Backlog', cardId:'k2'},{title:'Measure export size by profile', status:'Done'}],
   comments:[{by:'ledger', at:'Tue 16:20', text:'Oldest export is from March. The prune query needs a dry run first.'},{by:'you', at:'Wed 09:02', text:'Keep anything pinned to a project thread, regardless of age.'}]},
  {id:'k2', col:'backlog', title:'Add a Telegram topic for routine failures', agent:'scout',
   desc:'Failures currently land in the main Hermes chat and get lost. Create a “Routines” topic in the Telegram group and route failed runs there.',
   linked:[{title:'Map delivery targets to channels', status:'Backlog'}],
   comments:[{by:'scout', at:'Mon 14:11', text:'Telegram supports topics in groups; the gateway config already has a topic id field.'}]},
  {id:'k3', col:'backlog', title:'Retire the xterm tab from the web UI', agent:'hermes',
   blockedBy:'new UI parity list',
   desc:'The terminal tab is still the default landing page for deep links. Once Routines and History ship, remove it from the rail and redirect old links.',
   linked:[{title:'New UI parity list', status:'Review', cardId:'k9'},{title:'Chat-first shell', status:'Running', cardId:'k8'},{title:'History view', status:'Done'}],
   comments:[{by:'hermes', at:'Mon 10:40', text:'Two deep links still resolve to /terminal: the dashboard banner and the old cron notification.'},{by:'you', at:'Mon 10:55', text:'Redirect both to the matching thread instead of a 404.'},{by:'hermes', at:'Mon 11:02', text:'Agreed. I will keep /terminal as a redirect for one release.'},{by:'scout', at:'Tue 08:31', text:'Docs mention the terminal tab in three places; I can update them.'}]},
  {id:'k4', col:'ready', title:'Fix heartbeat gaps after gateway restart', agent:'hermes',
   desc:'Two restarts this week dropped heartbeats for 40–70 seconds. Sessions survive, but the dashboard shows them as stale. Trace the gap and add a reconnect notice.',
   linked:[{title:'Gateway heartbeat gaps thread', status:'Running', cardId:'k8'},{title:'Dashboard stale-session state', status:'Ready'},{title:'Session recovery runbook', status:'Done'},{title:'Add uptime probe', status:'Backlog'}],
   comments:[{by:'hermes', at:'Today 09:14', text:'Reproduced twice. The gap is between socket close and the first retry, not in the heartbeat timer itself.'},{by:'you', at:'Today 09:22', text:'Can we shorten the first retry to 2s?'},{by:'hermes', at:'Today 09:24', text:'Yes, but only after the gateway has written its shutdown marker. Otherwise we reconnect into a half-closed socket.'},{by:'scout', at:'Today 10:05', text:'Found the upstream issue: event loop blocked by the backup checksum during restart.'},{by:'hermes', at:'Today 10:18', text:'That matches the timing. Moving checksum work off the gateway process.'}]},
  {id:'k5', col:'ready', title:'Document cron delivery options', agent:'scout',
   desc:'Write a short page covering Telegram, email and thread-only delivery, including what happens when a channel is unavailable.',
   linked:[{title:'Delivery retry policy', status:'Done'}],
   comments:[{by:'scout', at:'Wed 15:40', text:'Draft is in docs/concepts. Needs a worked example with a failed delivery.'},{by:'you', at:'Wed 15:52', text:'Use the cost report failure from Monday as the example.'}]},
  {id:'k6', col:'ready', title:'Backfill November token usage', agent:'ledger',
   desc:'November usage is missing for 3–9 Nov after the provider switch. Rebuild from the request log and reconcile against the invoice.',
   linked:[{title:'Provider switch log', status:'Done'},{title:'Usage table schema', status:'Done'}],
   comments:[{by:'ledger', at:'Tue 11:07', text:'Request log has enough detail. Expected delta is about 180k tokens.'},{by:'ledger', at:'Tue 11:30', text:'Reconciled to within 400 tokens; waiting on a second pair of eyes.'},{by:'you', at:'Tue 13:12', text:'I’ll check the invoice side tomorrow.'}]},
  {id:'k7', col:'running', title:'Verify last night’s backup zip', agent:'ledger',
   desc:'Checksum the zip, count files, and restore state.db with both sidecars into a scratch directory. Report only anomalies.',
   linked:[{title:'Backup verify routine', status:'Running'},{title:'Scratch restore script', status:'Done'}],
   comments:[{by:'ledger', at:'Today 08:58', text:'Zip is 214 MB, 3,912 files. Restore check is running now.'},{by:'ledger', at:'Today 09:03', text:'state.db opened cleanly with -wal and -shm. Checking the FTS index next.'},{by:'you', at:'Today 09:10', text:'Also confirm the vault directory is excluded.'},{by:'ledger', at:'Today 09:12', text:'Excluded, as configured.'}]},
  {id:'k8', col:'running', title:'Triage inbox, draft replies', agent:'hermes',
   desc:'Work through unread mail, draft replies for anything routine, and surface the three that need a decision.',
   linked:[{title:'Inbox brief routine', status:'Running'}],
   comments:[{by:'hermes', at:'Today 10:12', text:'18 messages read. 4 drafts ready, 3 need your call.'},{by:'hermes', at:'Today 10:31', text:'One draft is waiting on the support@ vs you@ decision.'},{by:'you', at:'Today 10:35', text:'Use support@ for anything customer-facing.'}]},
  {id:'k9', col:'review', title:'New webhook signature check', agent:'hermes',
   desc:'Verify HMAC SHA-256 signatures before parsing payloads, reject stale timestamps over five minutes, and log rejected deliveries with the route name.',
   linked:[{title:'Webhook subscriptions', status:'Ready'},{title:'Rotate signing secret', status:'Backlog'},{title:'Signature rejection log', status:'Review'},{title:'Stripe test fixtures', status:'Done'},{title:'GitHub test fixtures', status:'Done'}],
   comments:[{by:'hermes', at:'Today 09:44', text:'Signature check is in. Rejected a Stripe test event with a 401 as expected.'},{by:'scout', at:'Today 09:51', text:'Please make the rejection log include the source so I can filter GitHub noise.'},{by:'hermes', at:'Today 09:53', text:'Added source and route. Log line is one line per rejection.'},{by:'you', at:'Today 10:02', text:'Does this break the old unsigned monitor-alert route?'},{by:'hermes', at:'Today 10:04', text:'It does. I kept a per-route “unsigned allowed” flag, off by default.'},{by:'you', at:'Today 10:06', text:'Good. Turn it on only for monitor-alert until it is rotated.'}]},
  {id:'k10', col:'review', title:'Routines empty-state copy', agent:'scout',
   blockedBy:'voice and tone review',
   desc:'When there are no routines, the page should explain what a routine is and offer the natural-language example, not a blank list.',
   linked:[],
   comments:[{by:'scout', at:'Wed 16:08', text:'Draft copy is in the PR description. Needs a tone pass before it ships.'}]},
  {id:'k11', col:'done', title:'Move dashboard off :9119', agent:'hermes',
   desc:'The dashboard now binds to loopback only and the old public port is closed. Gateway and API ports are unchanged.',
   linked:[{title:'Bind dashboard to 127.0.0.1', status:'Done'},{title:'Update firewall notes', status:'Done'}],
   comments:[{by:'hermes', at:'Mon 12:20', text:'Dashboard is loopback-only. Old deep links redirect to the chat shell.'},{by:'you', at:'Mon 12:41', text:'Confirmed from the laptop over SSH tunnel.'},{by:'hermes', at:'Mon 12:43', text:'Closing this out.'}]},
  {id:'k12', col:'done', title:'Compress the weekly cost report prompt', agent:'ledger',
   desc:'Cut the prompt from 2,100 to 900 tokens without losing the comparison against last week or the three observations.',
   linked:[{title:'Weekly cost report routine', status:'Done'}],
   comments:[{by:'ledger', at:'Fri 16:02', text:'Down to 880 tokens; output format unchanged.'},{by:'you', at:'Fri 16:15', text:'Cost per run should now be under two cents.'}]},
];
CARD_DEFS.forEach(function(c){
  c.comments = c.comments || [];
  c.linked = c.linked || [];
  state.cards.push(c);
});

/* ---------- module UI state ---------- */
let currentRoot = null, currentPage = null, lastCtx = null;
let panelApi = null, activeMenu = null, dragId = null;
let cleanups = [];

function notify(msg){
  try {
    if(lastCtx && typeof lastCtx.toast === 'function') lastCtx.toast(msg);
    else H.toast(msg);
  } catch(e){ H.toast(msg); }
}
function cleanup(){
  cleanups.forEach(function(fn){ try{ fn(); }catch(e){} });
  cleanups = [];
  if(activeMenu){ activeMenu.close(); activeMenu = null; }
}
function refresh(){
  if(!currentRoot || !currentPage || !currentPage.isConnected) return;
  const ctx = lastCtx || {};
  renderView(currentRoot, {route:[state.tab], go:ctx.go, toast:ctx.toast, openThread:ctx.openThread});
}
function setHash(tab){
  try { history.replaceState(null, '', '#/routines/' + tab); }
  catch(e){ try { location.hash = '/routines/' + tab; } catch(_e){} }
}

/* =====================================================================
   LIVE MUTATIONS (paths + bodies mirror web/src/lib/api.ts)
   ===================================================================== */
function jobPath(r, suffix){
  const p = r.profile || H.api.profile || '';
  return '/api/cron/jobs/' + encodeURIComponent(r.id) + (suffix || '') + (p ? '?profile=' + encodeURIComponent(p) : '');
}
function createJobBody(src){
  /* CronJobMutation: optional strings collapse to null so nothing stale is stored */
  const opt = v => { const t = String(v || '').trim(); return t || null; };
  return {
    name: String(src.name || '').trim(),
    prompt: String(src.prompt || '').trim(),
    schedule: src.scheduleString,
    deliver: src.deliver || 'local',
    skills: (src.skills || []).filter(Boolean),
    provider: opt(src.provider),
    model: opt(src.model),
    base_url: null,
    script: null,
    no_agent: false,
    context_from: null,
    enabled_toolsets: null,
    workdir: null,
  };
}
async function setRoutineEnabled(r, v){
  try {
    await H.api.post(jobPath(r, v ? '/resume' : '/pause'));
    notify('“' + r.name + '” ' + (v ? 'resumed' : 'paused'));
    reloadLive();
  } catch(e){
    failToast(v ? 'Resume' : 'Pause', e);
    reloadLive();
  }
}
async function deleteRoutineLive(r){
  try {
    await H.api.del(jobPath(r));
    notify('Deleted “' + r.name + '”');
    reloadLive();
  } catch(e){ failToast('Delete', e); }
}
async function duplicateRoutineLive(r){
  try {
    const copy = await H.api.post('/api/cron/jobs' + (r.profile ? '?profile=' + encodeURIComponent(r.profile) : ''),
      createJobBody({
        name: r.name + ' copy',
        prompt: r.prompt,
        scheduleString: toScheduleString(r.schedule) || r.scheduleText,
        deliver: r.deliver,
        skills: r.skills,
        model: r.model,
        provider: r.provider,
      }));
    notify('Duplicated as “' + ((copy && copy.name) || r.name + ' copy') + '”');
    reloadLive();
  } catch(e){ failToast('Duplicate', e); }
}
async function triggerRoutineLive(r){
  try {
    await H.api.post(jobPath(r, '/trigger'));
    notify('Triggered “' + r.name + '” · the gateway runs it on its next tick');
    setTimeout(function(){ if(!panelApi) reloadLive(); }, 2500);
  } catch(e){ failToast('Run now', e); }
}
async function saveRoutineLive(r, draft){
  const schedule = toScheduleString(draft.schedule);
  if(!schedule){ notify('Fix the schedule before saving'); return false; }
  if(!draft.prompt.trim()){ notify('Write a prompt before saving'); return false; }
  try {
    await H.api.put(jobPath(r), {updates:{
      name: r.name,
      prompt: draft.prompt.trim(),
      schedule: schedule,
      deliver: draft.deliver,
      skills: (draft.skills || []).slice(),
      model: draft.model || null,
      provider: draft.provider || null,
    }});
    notify('Saved “' + r.name + '”');
    reloadLive();
    return true;
  } catch(e){ failToast('Save', e); return false; }
}
async function createRoutineLive(src){
  const qs = src.profile ? '?profile=' + encodeURIComponent(src.profile) : '';
  return H.api.post('/api/cron/jobs' + qs, createJobBody(src));
}
/* Skills for the drawer: real names from /api/skills, cached for a minute. */
const skillCache = {items:null, error:null, loading:false};
async function loadSkills(){
  if(skillCache.items || skillCache.loading) return;
  skillCache.loading = true; skillCache.error = null;
  try {
    const list = await H.api.cached('/api/skills', 60000);
    skillCache.items = (Array.isArray(list) ? list : []).map(function(s){ return s.name; }).filter(Boolean);
  } catch(e){ skillCache.error = liveError(e); }
  finally { skillCache.loading = false; }
}

/* ---------- popover menus ---------- */
function openPop(anchor, build){
  if(activeMenu){ activeMenu.close(); }
  const pop = H.h('div.routines-menu-pop', {role:'menu'});
  anchor.appendChild(pop);
  let closed = false;
  const api = { close:function(){
    if(closed) return;
    closed = true;
    document.removeEventListener('click', onDoc, true);
    pop.remove();
    if(activeMenu === api) activeMenu = null;
  }};
  function onDoc(e){ if(!anchor.contains(e.target)) api.close(); }
  setTimeout(function(){ if(!closed) document.addEventListener('click', onDoc, true); }, 0);
  activeMenu = api;
  build(pop, api.close);
  return api;
}
function menuItem(pop, label, icon, fn, danger){
  const b = H.h('button.routines-menu-item' + (danger ? '.danger' : ''), {role:'menuitem', type:'button', onclick:function(){ fn(); }},
    icon ? H.ic(icon, 'sm') : null, H.h('span', label));
  pop.appendChild(b);
  return b;
}

/* ---------- drawer ---------- */
function openPanel(label, build, opts){
  opts = opts || {};
  if(panelApi) panelApi.close(true);
  const scrim = H.h('div.scrim.routines-scrim');
  const panel = H.h('aside.routines-drawer', {role:'dialog', 'aria-modal':'true', 'aria-label':label, tabindex:'-1'});
  let api = null;
  function close(silent){
    if(!panel.isConnected && !scrim.isConnected) return;
    scrim.remove(); panel.remove();
    document.removeEventListener('keydown', esc);
    document.body.classList.remove('routines-locked');
    if(panelApi === api) panelApi = null;
    if(!silent && typeof opts.onClose === 'function') opts.onClose();
  }
  function esc(e){ if(e.key === 'Escape') close(false); }
  api = {close:close, panel:panel};
  panelApi = api;
  scrim.onclick = function(){ close(false); };
  build(panel, function(){ close(false); });
  document.body.append(scrim, panel);
  document.body.classList.add('routines-locked');
  document.addEventListener('keydown', esc);
  const first = panel.querySelector('button, textarea, select, input');
  if(first) first.focus();
  return api;
}
function drawerHead(eyebrow, title, sub, close){
  return H.h('div.routines-dh',
    H.h('div.routines-dh-top',
      H.h('span.routines-eyebrow', eyebrow),
      H.h('button.btn.icon.ghost.routines-close', {'aria-label':'Close panel', title:'Close', onclick:close}, H.ic('x','sm'))
    ),
    H.h('div.routines-dtitle', title),
    sub ? H.h('div.routines-dsub', sub) : null
  );
}

/* ---------- statuses ---------- */
function statusPill(status){
  if(status === 'ok') return H.pill('Ok', 'pos');
  if(status === 'failed') return H.pill('Failed', 'neg');
  if(status === 'running') return H.pill('Running', 'live');
  if(status === 'skipped') return H.pill('Skipped', '');
  if(status === 'delivery_failed') return H.pill('Delivery failed', 'warn');
  if(status === 'blocked') return H.pill('Blocked', 'warn');
  return H.pill('–', '');
}

/* =====================================================================
   SCHEDULES
   ===================================================================== */
function buildTimeline(){
  const now = nowDate();
  const enabled = state.routines.filter(function(r){ return r.enabled; });
  const rows = [];
  let nextAt = null, nextR = null;
  if(LIVE){
    /* Real clock only: one mark for the last run and one for the next run,
       each shown when it falls inside today. */
    const t0 = todayStart(), t1 = new Date(t0.getTime() + DAY);
    state.routines.forEach(function(r){
      if(!r.enabled) return;
      const times = [];
      if(r.lastAt && r.lastAt >= t0 && r.lastAt < t1) times.push(r.lastAt);
      if(r.nextAt && r.nextAt >= t0 && r.nextAt < t1) times.push(r.nextAt);
      if(times.length) rows.push({r:r, times:times});
    });
  } else {
    enabled.forEach(function(r){
      const times = fireTimes(r.schedule, TODAY);
      if(times.length) rows.push({r:r, times:times});
    });
  }
  rows.forEach(function(row){
    row.times.forEach(function(t){
      if(t > now && (!nextAt || t < nextAt)){ nextAt = t; nextR = row.r; }
    });
  });

  const labels = H.h('div.routines-tl-labels');
  const lanes = H.h('div.routines-tl-lanes');
  rows.forEach(function(row){
    labels.appendChild(H.h('span.routines-tl-label', {title:row.r.name}, row.r.name));
    const lane = H.h('div.routines-tl-lane');
    row.times.forEach(function(t){
      const pct = ((t.getHours()*60 + t.getMinutes()) / 1440) * 100;
      let cls = ' later';
      if(t <= now) cls = '';
      else if(nextAt && t.getTime() === nextAt.getTime() && row.r === nextR) cls = ' next';
      lane.appendChild(H.h('span.routines-tl-mark' + cls, {
        style:{left:pct + '%'},
        title:row.r.name + ' · ' + fmtHM(t),
        'aria-label':row.r.name + ' at ' + fmtHM(t)
      }));
    });
    lanes.appendChild(lane);
  });

  const grid = H.h('div.routines-tl-grid');
  for(let h = 0; h <= 24; h += 3){
    grid.appendChild(H.h('span.routines-tl-gl', {style:{left:(h/24*100) + '%'}}));
  }
  const nowPct = ((now.getHours()*60 + now.getMinutes()) / 1440) * 100;
  const nowLine = H.h('span.routines-tl-now', {style:{left:nowPct + '%'}, title:'Now · ' + fmtHM(now)});
  const track = H.h('div.routines-tl-track', grid, lanes, nowLine);
  const axis = H.h('div.routines-tl-axis', ['00','06','12','18','24'].map(function(x){ return H.h('span', x); }));

  const legend = H.h('div.routines-tl-legend',
    H.h('span.routines-tl-key', H.h('span.routines-tl-sw.past'), 'Past'),
    H.h('span.routines-tl-key', H.h('span.routines-tl-sw.next'), 'Next'),
    H.h('span.routines-tl-key', H.h('span.routines-tl-sw.later'), 'Later')
  );

  const nextTxt = nextAt && nextR
    ? 'Next · ' + nextR.name + ' · ' + fmtHM(nextAt)
    : (rows.length ? 'No runs left today' : 'Nothing scheduled today');

  const body = rows.length
    ? H.h('div.routines-tl-body',
        H.h('div.routines-tl-labelcol', labels, H.h('div.routines-tl-axis-space')),
        H.h('div.routines-tl-right', track, axis))
    : H.h('div.routines-tl-empty', 'No enabled routine fires today.');

  return H.h('div.card.routines-tl',
    H.h('div.routines-tl-h',
      H.h('span.routines-tl-title', 'Today'),
      H.h('span.routines-tl-next', nextTxt),
      state.paused ? H.pill('Dispatch paused', 'warn') : null,
      H.h('span.grow'),
      legend
    ),
    H.h('div.routines-tl-bodywrap', body)
  );
}

function rowMatches(r, q){
  if(!q) return true;
  const hay = [r.name, r.agent, scheduleLabel(r.schedule), r.deliver, r.prompt].join(' ').toLowerCase();
  return hay.indexOf(q) !== -1;
}

function routineScheduleText(r){
  return LIVE ? (r.scheduleText || scheduleLabel(r.schedule)) : scheduleLabel(r.schedule);
}

function buildRoutineRow(r){
  const agent = LIVE ? pseudoAgent(r.agent) : (H.agent(r.agent) || H.agent('hermes'));
  const last = H.h('div.routines-last');
  if(r.lastAt){
    if(r.lastStatus) last.appendChild(statusPill(r.lastStatus));
    last.appendChild(H.h('span.routines-when', relAt(r.lastAt)));
  } else {
    last.appendChild(H.h('span.routines-when', 'Never run'));
  }

  const nf = r.enabled ? (LIVE ? r.nextAt : nextFire(r.schedule, NOW)) : null;
  const next = H.h('div.routines-next', H.h('span.num', nf ? fmtNext(nf) : '–'));

  const nameCell = H.h('div.routines-name',
    H.avatar(agent, 30, 'idle'),
    H.h('div.routines-nm',
      H.h('span.routines-title', r.name),
      H.h('span.routines-sched', routineScheduleText(r))
    )
  );
  const meta = H.h('div.routines-meta',
    H.h('div.routines-deliver', H.pill(deliverLabel(r.deliver))),
    last,
    next
  );
  const switchCell = H.h('div.routines-switch', H.sw(r.enabled, function(v){
    if(LIVE){ setRoutineEnabled(r, v); return; }
    r.enabled = v;
    refresh();
    notify('“' + r.name + '” ' + (v ? 'enabled' : 'paused'));
  }, r.name + ' enabled'));

  const menuWrap = H.h('div.routines-menu');
  const menuBtn = H.h('button.btn.icon.ghost.routines-menu-btn', {
    'aria-label':'Actions for ' + r.name, 'aria-haspopup':'menu', title:'Routine actions', type:'button'
  }, H.ic('more', 'sm'));
  menuBtn.onclick = function(e){
    e.stopPropagation();
    openMenuFor(menuWrap, r);
  };
  menuWrap.appendChild(menuBtn);

  const row = H.h('div.routines-row', {role:'button', tabindex:'0', 'aria-label':'Open routine ' + r.name},
    nameCell, meta, switchCell, menuWrap);
  row.onclick = function(e){
    if(e.target.closest('button, input, select, textarea, a')) return;
    openRoutine(r);
  };
  row.onkeydown = function(e){
    if(e.target !== row) return;
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openRoutine(r); }
  };
  return row;
}

function openMenuFor(anchor, r){
  openPop(anchor, function(pop, close){
    menuItem(pop, 'Run now', 'play', function(){ close(); runNow(r); });
    menuItem(pop, 'Edit', 'edit', function(){ close(); openRoutine(r); });
    menuItem(pop, 'Duplicate', 'copy', function(){ close(); duplicateRoutine(r); });
    pop.appendChild(H.h('div.routines-menu-sep'));
    menuItem(pop, 'Delete', 'trash', function(){
      pop.replaceChildren(
        H.h('div.routines-confirm',
          H.h('p', 'Delete “' + r.name + '”? Its run history goes too.'),
          H.h('div.routines-confirm-a',
            H.h('button.btn.sm', {type:'button', onclick:close}, 'Cancel'),
            H.h('button.btn.sm.danger', {type:'button', onclick:function(){
              close();
              if(LIVE){ deleteRoutineLive(r); return; }
              state.routines = state.routines.filter(function(x){ return x !== r; });
              refresh();
              notify('Deleted “' + r.name + '”');
            }}, 'Delete')
          )
        )
      );
    }, true);
  });
}

function duplicateRoutine(r){
  if(LIVE){ duplicateRoutineLive(r); return; }
  const copy = Object.assign({}, r);
  copy.id = 'r-' + Date.now();
  copy.name = r.name + ' copy';
  copy.schedule = JSON.parse(JSON.stringify(r.schedule));
  copy.skills = (r.skills || []).slice();
  copy.enabled = false;
  copy.lastAt = null;
  copy.lastStatus = null;
  copy.failure = null;
  copy.runs = [];
  const i = state.routines.indexOf(r);
  state.routines.splice(i + 1, 0, copy);
  refresh();
  notify('Duplicated as “' + copy.name + '” (off)');
}

function runNow(r){
  if(LIVE){ triggerRoutineLive(r); return; }
  if(state.paused){ notify('Paused · resume to run routines'); return; }
  notify('Running “' + r.name + '” now');
  r.lastStatus = 'running';
  r.lastAt = NOW;
  refresh();
  setTimeout(function(){
    if(state.routines.indexOf(r) === -1) return;
    r.lastStatus = 'ok';
    r.lastAt = NOW;
    r.runs = r.runs || [];
    r.runs.unshift({at:NOW, status:'ok', duration:12, tokens:5200, cost:0.015, out:'Completed on demand.\n' + (r.output || 'Output delivered.')});
    r.runs = r.runs.slice(0, 8);
    if(currentPage && currentPage.isConnected && !panelApi) refresh();
  }, 1500);
}

function openRoutine(r){
  const draft = {
    prompt: r.prompt,
    agent: r.agent,
    model: r.model || '',
    deliver: r.deliver,
    skills: (r.skills || []).slice(),
    schedule: JSON.parse(JSON.stringify(r.schedule)),
  };
  const agent0 = LIVE ? pseudoAgent(r.agent) : (H.agent(r.agent) || H.agent('hermes'));

  openPanel('Routine ' + r.name, function(panel, close){
    const head = drawerHead('Routine',
      H.h('div.routines-dt-row', H.avatar(agent0, 34, 'idle'), H.h('h2', r.name)),
      routineScheduleText(r) + ' · ' + deliverLabel(r.deliver),
      close
    );

    const body = H.h('div.routines-dbody');

    if(r.lastStatus === 'failed' && (r.failure || r.lastError)){
      body.appendChild(H.h('div.routines-fail',
        H.h('strong', 'Last run failed'),
        H.h('p', r.failure || r.lastError)
      ));
    } else if(r.lastStatus === 'delivery_failed' && r.lastError){
      body.appendChild(H.h('div.routines-fail',
        H.h('strong', 'Last delivery failed'),
        H.h('p', r.lastError)
      ));
    }

    const promptTa = H.h('textarea.textarea.routines-ta', {rows:'5', 'aria-label':'Routine prompt', placeholder:'What should Hermes do?'}, draft.prompt);
    promptTa.oninput = function(){ draft.prompt = promptTa.value; };
    const promptField = H.h('div.field',
      H.h('label', 'Prompt'),
      promptTa,
      H.h('span.hint', 'Sent as the routine’s full prompt. Changes only apply after you save.')
    );
    body.appendChild(promptField);

    /* schedule editor */
    const scheduleBlock = H.h('div.routines-block');
    scheduleBlock.appendChild(H.h('div.routines-lab', 'Schedule'));
    const fields = H.h('div.routines-editor');
    const preview = H.h('div.routines-preview');
    const seg = H.seg([
      {id:'every', label:'Every'},
      {id:'daily', label:'Daily'},
      {id:'weekly', label:'Weekly'},
      {id:'once', label:'Once'},
      {id:'cron', label:'Cron'},
    ], draft.schedule.kind, function(id){
      const time = draft.schedule.time || '09:00';
      if(id === 'every') draft.schedule = {kind:'every', n:4, unit:'hours'};
      else if(id === 'daily') draft.schedule = {kind:'daily', time:time};
      else if(id === 'weekly') draft.schedule = {kind:'weekly', days:[1,2,3,4,5], time:time};
      else if(id === 'once') draft.schedule = {kind:'once', at:''};
      else draft.schedule = {kind:'cron', expr:'0 8 * * 1-5'};
      drawEditor();
    });
    scheduleBlock.appendChild(seg);
    scheduleBlock.appendChild(fields);
    scheduleBlock.appendChild(preview);
    scheduleBlock.appendChild(H.h('div.routines-hint', 'Runs on the gateway clock · local time'));
    body.appendChild(scheduleBlock);

    function updatePreview(){
      preview.classList.remove('bad');
      preview.replaceChildren();
      if(draft.schedule.kind === 'once'){
        preview.appendChild(H.h('span', 'Runs once at '));
        preview.appendChild(H.h('span.num', draft.schedule.at ? fmtRun(new Date(draft.schedule.at)) : 'a time you pick'));
        return;
      }
      const runs = nextRuns(draft.schedule, nowDate(), 3);
      if(!runs || !runs.length){
        preview.classList.add('bad');
        preview.appendChild(H.h('span', 'Next 3 runs: cron expression not recognised · check the five fields.'));
        return;
      }
      preview.appendChild(H.h('span', 'Next 3 runs: '));
      runs.forEach(function(d, i){
        if(i) preview.appendChild(H.h('span.routines-dotsep', ' · '));
        preview.appendChild(H.h('span.num', fmtRun(d)));
      });
    }
    function drawEditor(){
      fields.replaceChildren();
      const s = draft.schedule;
      if(s.kind === 'every'){
        const n = H.h('input.input.num.routines-numin', {type:'number', min:'1', max:'999', value:String(s.n || 1), 'aria-label':'Interval'});
        n.oninput = function(){
          const v = Math.max(1, Math.min(999, Number(n.value) || 1));
          draft.schedule.n = v;
          updatePreview();
        };
        const unit = H.h('select.select.routines-unitsel', {'aria-label':'Interval unit'});
        [['minutes','minutes'],['hours','hours'],['days','days']].forEach(function(o){
          unit.appendChild(H.h('option', {value:o[0], selected: s.unit === o[0] ? 'selected' : null}, o[1]));
        });
        unit.onchange = function(){ draft.schedule.unit = unit.value; updatePreview(); };
        fields.appendChild(H.h('div.routines-inline', H.h('span.routines-inline-l', 'Run every'), n, unit));
      } else if(s.kind === 'daily'){
        const time = H.h('input.input.routines-timesel', {type:'time', value:s.time, 'aria-label':'Time of day'});
        time.oninput = function(){ draft.schedule.time = time.value || '09:00'; updatePreview(); };
        fields.appendChild(H.h('div.routines-inline', H.h('span.routines-inline-l', 'At'), time));
      } else if(s.kind === 'weekly'){
        const ds = (s.days || [1]).slice().sort();
        const dayVal = ds.join(',') === '1,2,3,4,5' ? 'weekdays'
          : ds.length === 7 ? 'everyday'
          : String(ds[0] === undefined ? 1 : ds[0]);
        const day = H.h('select.select.routines-daysel', {'aria-label':'Day'});
        [['weekdays','Weekdays'],['everyday','Every day'],['1','Monday'],['2','Tuesday'],['3','Wednesday'],['4','Thursday'],['5','Friday'],['6','Saturday'],['0','Sunday']].forEach(function(o){
          day.appendChild(H.h('option', {value:o[0], selected: dayVal === o[0] ? 'selected' : null}, o[1]));
        });
        day.onchange = function(){
          const v = day.value;
          draft.schedule.days = v === 'weekdays' ? [1,2,3,4,5] : v === 'everyday' ? [0,1,2,3,4,5,6] : [Number(v)];
          updatePreview();
        };
        const time = H.h('input.input.routines-timesel', {type:'time', value:s.time, 'aria-label':'Time of day'});
        time.oninput = function(){ draft.schedule.time = time.value || '09:00'; updatePreview(); };
        fields.appendChild(H.h('div.routines-inline', H.h('span.routines-inline-l', 'On'), day, H.h('span.routines-inline-l', 'at'), time));
      } else if(s.kind === 'once'){
        const at = H.h('input.input', {type:'datetime-local', value:s.at || '', 'aria-label':'Run once at'});
        at.oninput = function(){ draft.schedule.at = at.value; updatePreview(); };
        fields.appendChild(H.h('div.routines-inline', H.h('span.routines-inline-l', 'At'), at));
      } else {
        const expr = H.h('input.input.mono', {type:'text', value:s.expr || '0 8 * * 1-5', 'aria-label':'Cron expression', placeholder:'0 8 * * 1-5'});
        expr.oninput = function(){ draft.schedule.expr = expr.value; updatePreview(); };
        fields.appendChild(H.h('div.field', H.h('label', 'Cron expression'), expr,
          H.h('span.hint', 'minute · hour · day of month · month · day of week')));
      }
      updatePreview();
    }
    drawEditor();

    /* agent, model, delivery */
    let agentField, modelField;
    if(LIVE){
      agentField = H.h('div.field', H.h('label', 'Profile'),
        H.h('div.routines-readonly', H.avatar(agent0, 22, 'idle'), H.h('span', r.agent)),
        H.h('span.hint', 'The profile that owns this job. Move it with the CLI if it belongs elsewhere.'));
      const modelIn = H.h('input.input', {type:'text', value:draft.model || '', placeholder:'Agent default', 'aria-label':'Model override'});
      modelIn.oninput = function(){ draft.model = modelIn.value.trim(); };
      const providerIn = H.h('input.input', {type:'text', value:draft.provider || '', placeholder:'Provider default', 'aria-label':'Provider override'});
      providerIn.oninput = function(){ draft.provider = providerIn.value.trim(); };
      modelField = H.h('div.field', H.h('label', 'Model override'), modelIn,
        H.h('span.hint', 'Leave empty to use the profile’s model.'), providerIn);
    } else {
      const agentSel = H.h('select.select', {'aria-label':'Agent profile'});
      H.data.agents.forEach(function(a){
        agentSel.appendChild(H.h('option', {value:a.id, selected: draft.agent === a.id ? 'selected' : null}, a.name + ' · ' + a.role.split(' · ')[0]));
      });
      agentSel.onchange = function(){ draft.agent = agentSel.value; };
      agentField = H.h('div.field', H.h('label', 'Agent'), agentSel);

      const modelSel = H.h('select.select', {'aria-label':'Model override'});
      const defaultAgent = H.agent(draft.agent) || agent0;
      modelSel.appendChild(H.h('option', {value:'', selected: draft.model === '' ? 'selected' : null}, 'Agent default · ' + defaultAgent.model));
      H.data.models.forEach(function(m){
        modelSel.appendChild(H.h('option', {value:m.id, selected: draft.model === m.id ? 'selected' : null}, m.id));
      });
      modelSel.onchange = function(){ draft.model = modelSel.value; };
      modelField = H.h('div.field', H.h('label', 'Model override'), modelSel);
    }

    const deliverSel = H.h('select.select', {'aria-label':'Deliver to'});
    let deliverOpts;
    if(LIVE){
      deliverOpts = (state.deliveryTargets && state.deliveryTargets.length ? state.deliveryTargets : [{id:'local', name:'Local (save only)'}])
        .map(function(t){ return {id:t.id, label:t.name}; });
      if(!deliverOpts.some(function(o){ return o.id === draft.deliver; })) deliverOpts.push({id:draft.deliver, label:deliverLabel(draft.deliver)});
    } else {
      deliverOpts = [{id:'Telegram', label:'Telegram'},{id:'Email', label:'Email'},{id:'Thread only', label:'Thread only'}];
    }
    deliverOpts.forEach(function(d){
      deliverSel.appendChild(H.h('option', {value:d.id, selected: draft.deliver === d.id ? 'selected' : null}, d.label));
    });
    deliverSel.onchange = function(){ draft.deliver = deliverSel.value; };

    body.appendChild(H.h('div.routines-fields', agentField, modelField));
    body.appendChild(H.h('div.field.routines-deliverfield',
      H.h('label', 'Deliver to'), deliverSel,
      H.h('span.hint', LIVE ? 'Targets come from this profile’s gateway platforms.' : 'Telegram and Email go through the gateway; Thread only keeps the output in a thread.')
    ));

    /* skills */
    const chips = H.h('div.routines-chips');
    const skillBox = H.h('div.field', H.h('label', 'Skills'), chips);
    function paintSkills(){
      chips.replaceChildren();
      draft.skills.forEach(function(skill, i){
        chips.appendChild(H.h('span.routines-chip',
          H.h('span', skill),
          H.h('button.routines-chip-x', {'aria-label':'Remove ' + skill, type:'button', onclick:function(){
            draft.skills.splice(i, 1);
            paintSkills();
          }}, H.ic('x','sm'))
        ));
      });
      if(LIVE){
        const names = (skillCache.items || []).filter(function(x){ return draft.skills.indexOf(x) === -1; });
        if(skillCache.error){
          chips.appendChild(H.h('span.routines-hint', 'Couldn’t load skills: ' + skillCache.error));
          chips.appendChild(H.h('button.btn.sm', {type:'button', onclick:function(){ skillCache.error = null; loadSkills().then(paintSkills); }}, 'Retry'));
        } else if(!skillCache.items){
          chips.appendChild(H.h('span.routines-hint', 'Loading skills…'));
        } else if(names.length){
          const sel = H.h('select.select.routines-unitsel', {'aria-label':'Skill to attach'});
          names.forEach(function(n){ sel.appendChild(H.h('option', {value:n}, n)); });
          const add = H.h('button.btn.sm.routines-addskill', {type:'button'}, H.ic('plus','sm'), 'Attach');
          add.onclick = function(){
            if(sel.value && draft.skills.indexOf(sel.value) === -1) draft.skills.push(sel.value);
            paintSkills();
          };
          chips.appendChild(sel, add);
        }
      } else {
        const add = H.h('button.btn.sm.routines-addskill', {type:'button'}, H.ic('plus','sm'), 'Add skill');
        add.onclick = function(){
          const avail = SKILL_LIBRARY.filter(function(x){ return draft.skills.indexOf(x) === -1; });
          if(!avail.length){ notify('All sample skills are attached'); return; }
          draft.skills.push(avail[0]);
          paintSkills();
          notify('Attached ' + avail[0]);
        };
        chips.appendChild(add);
      }
      if(!draft.skills.length && !LIVE) chips.appendChild(H.h('span.routines-hint', 'No skills attached'));
    }
    paintSkills();
    if(LIVE && !skillCache.items && !skillCache.error) loadSkills().then(paintSkills);
    body.appendChild(skillBox);

    /* run history */
    const histBlock = H.h('div.routines-block.routines-hist');
    const histHint = H.h('span.routines-hint', '');
    function drawRuns(list, note){
      histBlock.replaceChildren();
      histBlock.appendChild(H.h('div.routines-lab-row', H.h('span.routines-lab', 'Run history'), histHint));
      if(!list){
        histBlock.appendChild(H.h('div.routines-runs-empty', note || 'Loading runs…'));
        return;
      }
      histHint.textContent = list.length ? 'Last ' + list.length + ' runs' : '';
      if(!list.length){
        histBlock.appendChild(H.h('div.routines-runs-empty', 'No runs yet. The first run will appear here.'));
        return;
      }
      const runList = H.h('div.routines-runs');
      list.forEach(function(run, i){
        const expanded = i === 0 && run.status === 'failed';
        const out = H.h('div.routines-run-out', expanded ? {} : {hidden:true}, H.h('pre', run.out || 'No output captured.'));
        const headBtn = H.h('button.routines-run-h', {'aria-expanded':String(expanded), type:'button'},
          statusPill(run.status),
          H.h('span.routines-run-time.num', fmtRun(run.at)),
          H.h('span.routines-run-d.num', run.duration == null ? '–' : run.duration + 's'),
          H.h('span.routines-run-t.num', run.tokens == null ? '–' : H.fmt.k(run.tokens)),
          H.h('span.routines-run-c.num', run.cost == null ? '–' : H.fmt.usd(run.cost)),
          H.ic('chevd','sm')
        );
        headBtn.onclick = function(){
          const open = headBtn.getAttribute('aria-expanded') === 'true';
          headBtn.setAttribute('aria-expanded', String(!open));
          if(open) out.setAttribute('hidden',''); else out.removeAttribute('hidden');
        };
        runList.appendChild(H.h('div.routines-run' + (run.status === 'failed' ? '.is-failed' : ''), headBtn, out));
      });
      histBlock.appendChild(runList);
    }
    if(LIVE){
      drawRuns(null);
      const gen = live.gen;
      H.api.get(jobPath(r, '/runs') + (jobPath(r, '/runs').indexOf('?') === -1 ? '?' : '&') + 'limit=8')
        .then(function(d){
          if(gen !== live.gen) return;
          drawRuns(((d && d.runs) || []).map(fromApiRun));
        })
        .catch(function(e){
          if(gen !== live.gen) return;
          drawRuns(null, 'Couldn’t load runs: ' + liveError(e));
          histHint.textContent = '';
        });
    } else {
      drawRuns((r.runs || []).slice(0, 8));
    }
    body.appendChild(histBlock);

    const foot = H.h('div.routines-dfoot',
      H.h('button.btn.ghost', {type:'button', onclick:function(){
        if(LIVE){ triggerRoutineLive(r); return; }
        if(state.paused){ notify('Paused · resume to run routines'); return; }
        notify('Queued “' + r.name + '” · it will run at the next dispatch tick');
      }}, H.ic('play','sm'), 'Run now'),
      H.h('span.grow'),
      H.h('button.btn', {type:'button', onclick:close}, 'Cancel'),
      H.h('button.btn.primary', {type:'button', onclick:function(){
        if(LIVE){
          saveRoutineLive(r, draft).then(function(ok){ if(ok) close(); });
          return;
        }
        const previewRuns = nextRuns(draft.schedule, NOW, 1);
        if(!previewRuns || !previewRuns.length){ notify('Fix the schedule before saving'); return; }
        if(!draft.prompt.trim()){ notify('Write a prompt before saving'); return; }
        r.prompt = draft.prompt.trim();
        r.agent = draft.agent;
        r.model = draft.model;
        r.deliver = draft.deliver;
        r.skills = draft.skills.slice();
        r.schedule = JSON.parse(JSON.stringify(draft.schedule));
        close();
        notify('Saved “' + r.name + '”');
      }}, 'Save changes')
    );

    panel.append(head, body, foot);
  }, {onClose:function(){ if(!LIVE) refresh(); }});
}
const SKILL_LIBRARY = ['email-triage','summarise','web-search','calendar','shell','usage-report','backup-check','invoice-parse','git-log'];

function buildSchedules(){
  const wrap = H.h('div');

  const listCard = H.h('div.card.routines-list');
  const count = H.h('span.routines-count', state.routines.length + ' routines');
  const searchInput = H.h('input.input.routines-search-input', {type:'search', placeholder:'Search routines', 'aria-label':'Search routines'});
  const head = H.h('div.card-h.routines-list-h',
    H.h('span.routines-list-title', 'All routines'),
    count,
    H.h('span.grow'),
    H.h('div.routines-search', H.ic('search','sm'), searchInput)
  );
  const thead = H.h('div.routines-thead',
    H.h('span', 'Routine'),
    H.h('span', 'Delivers to'),
    H.h('span', 'Last run'),
    H.h('span', 'Next run'),
    H.h('span'),
    H.h('span')
  );
  const rows = H.h('div.routines-rows');

  function paint(){
    const q = searchInput.value.trim().toLowerCase();
    const list = state.routines.filter(function(r){ return rowMatches(r, q); });
    rows.replaceChildren();
    if(!list.length){
      rows.appendChild(H.h('div.empty', H.h('strong', q ? 'No routines match “' + searchInput.value.trim() + '”' : 'No routines yet'),
        H.h('span', q ? 'Try a name, agent or delivery target.' : (LIVE ? 'Create one from a sentence.' : 'Create one from a sentence.')),
        LIVE && !q ? H.h('div.routines-empty-act',
          H.h('button.btn.primary', {type:'button', onclick:openNewRoutine}, H.ic('plus','sm'), 'New routine')
        ) : null));
    } else {
      list.forEach(function(r){ rows.appendChild(buildRoutineRow(r)); });
    }
    count.textContent = q ? list.length + ' of ' + state.routines.length : state.routines.length + ' routines';
  }
  searchInput.oninput = paint;
  paint();

  listCard.append(head, thead, rows);
  wrap.appendChild(buildTimeline());
  wrap.appendChild(H.h('div.routines-listsec', listCard));
  return wrap;
}

/* =====================================================================
   NEW ROUTINE
   ===================================================================== */
const DOW_INDEX = {sunday:0, monday:1, tuesday:2, wednesday:3, thursday:4, friday:5, saturday:6};

function parseTime(text){
  let m = text.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i)
       || text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if(!m) return null;
  let h = Number(m[1]);
  const mi = Number(m[2] || 0);
  const ap = (m[3] || '').toLowerCase();
  if(ap === 'pm' && h < 12) h += 12;
  if(ap === 'am' && h === 12) h = 0;
  if(h > 23 || mi > 59) return null;
  return pad2(h) + ':' + pad2(mi);
}
function deriveName(text, schedule, expr){
  let s = text.trim();
  if(expr){ s = s.replace(expr, ' '); }
  s = s.replace(/^\s*(every|each)\s+(weekday|weekdays|day|morning|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d+\s*(?:hours?|hrs?|minutes?|mins?))\b/i, '');
  s = s.replace(/^\s*(daily|weekly)\b/i, '');
  s = s.replace(/^\s*at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/i, '');
  s = s.replace(/\s+(?:and\s+)?(?:send|deliver|post|email|message|notify)\s+(?:it\s+)?(?:to|via|me)\b[\s\S]*$/i, '');
  s = s.replace(/\s+then\s+[\s\S]*$/i, '');
  s = s.replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/g, '');
  if(s.length > 58) s = s.slice(0, 55).replace(/\s+\S*$/,'') + '…';
  if(!s) return 'Untitled routine';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function parseNatural(raw){
  const text = String(raw || '').trim();
  const t = text.toLowerCase();
  let schedule = null, note = '', expr = '';

  const cronM = text.match(/\b((?:[\d*\/,\-]+)\s+){4}[\d*\/,\-]+\b/);
  if(cronM && cronParse(cronM[0])){
    expr = cronM[0];
    schedule = {kind:'cron', expr:expr};
    note = 'Cron expression read from the sentence.';
  }

  if(!schedule){
    const time = parseTime(text);
    let m;
    if((m = t.match(/\b(?:every|each)\s+(\d+)\s*(hours?|hrs?)\b/))){
      schedule = {kind:'every', n:Math.max(1, Number(m[1])), unit:'hours'};
    } else if((m = t.match(/\b(?:every|each)\s+(\d+)\s*(minutes?|mins?)\b/))){
      schedule = {kind:'every', n:Math.max(1, Number(m[1])), unit:'minutes'};
    } else if(/\bweekdays?\b/.test(t)){
      schedule = {kind:'weekly', days:[1,2,3,4,5], time:time || '09:00'};
      if(!time) note = 'No time found · set to 09:00.';
    } else if((m = t.match(/\b(?:every|each)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/))){
      schedule = {kind:'weekly', days:[DOW_INDEX[m[1]]], time:time || '09:00'};
      if(!time) note = 'No time found · set to 09:00.';
    } else if(/\b(every day|each day|daily)\b/.test(t)){
      schedule = {kind:'daily', time:time || '09:00'};
      if(!time) note = 'No time found · set to 09:00.';
    } else if(/\b(every|each)\s+morning\b/.test(t)){
      schedule = {kind:'daily', time:time || '07:30'};
      if(!time) note = 'Morning defaults to 07:30.';
    } else if(/\b(every|each)\s+evening\b/.test(t)){
      schedule = {kind:'daily', time:time || '18:00'};
      if(!time) note = 'Evening defaults to 18:00.';
    } else if(/\bweekly\b/.test(t)){
      schedule = {kind:'weekly', days:[1], time:time || '09:00'};
      note = 'Weekly defaults to Mondays.';
    } else if(time){
      schedule = {kind:'daily', time:time};
      note = 'No day given · defaulted to Daily.';
    } else {
      schedule = {kind:'daily', time:'09:00'};
      note = 'No schedule found · defaulted to Daily 09:00.';
    }
  }

  let deliver = 'Thread only';
  if(/\btelegram\b/.test(t)) deliver = 'Telegram';
  else if(/\b(e-?mail|mail me|by mail)\b/.test(t)) deliver = 'Email';
  else if(/\bthread\b/.test(t)) deliver = 'Thread only';

  let agent = 'hermes';
  if(/\b(scout|research|reading list|papers?)\b/.test(t)) agent = 'scout';
  else if(/\b(ledger|billing|invoice|backup|cost|ops)\b/.test(t)) agent = 'ledger';

  return {
    name: deriveName(text, schedule, expr),
    schedule: schedule,
    agent: agent,
    deliver: deliver,
    note: note,
  };
}

function liveDeliver(v){
  const ids = (state.deliveryTargets || []).map(function(t){ return t.id; });
  const want = v === 'Telegram' ? 'telegram' : v === 'Email' ? 'email' : 'local';
  return ids.indexOf(want) !== -1 ? want : 'local';
}

function openNewRoutine(){
  let parsed = null;
  const ta = H.h('textarea.textarea.routines-ta', {rows:'3', 'aria-label':'Describe the routine', placeholder:'Every weekday at 8 summarise my inbox and send it to Telegram'});
  const preview = H.h('div.routines-parse-empty', 'Parsed schedule, agent and delivery appear here as you type.');
  const create = H.h('button.btn.primary', {type:'submit'}, 'Create routine');
  create.disabled = true;

  function parsedCard(p){
    const agentName = LIVE ? (H.api.profile || 'default') : p.agent;
    const agent = pseudoAgent(agentName);
    const row = function(label, value){
      return H.h('div.routines-parse-row', H.h('span.routines-parse-l', label), H.h('div.routines-parse-v', value));
    };
    return H.h('div.routines-parse-card',
      H.h('div.routines-parse-h', 'Parsed from your sentence'),
      row('Name', p.name),
      row('Schedule', H.h('span.routines-parse-sched', H.pill(scheduleLabel(p.schedule), p.note ? 'warn' : ''), p.note ? H.h('span.routines-parse-note', p.note) : null)),
      row('Agent', H.h('span.routines-parse-agent', H.avatar(agent, 22, 'idle'), agent.name)),
      row('Delivers to', H.pill(LIVE ? deliverLabel(liveDeliver(p.deliver)) : p.deliver))
    );
  }
  function update(){
    const v = ta.value;
    if(!v.trim()){
      parsed = null;
      preview.className = 'routines-parse-empty';
      preview.replaceChildren(document.createTextNode('Parsed schedule, agent and delivery appear here as you type.'));
      create.disabled = true;
      return;
    }
    parsed = parseNatural(v);
    preview.className = 'routines-parse';
    preview.replaceChildren(parsedCard(parsed));
    create.disabled = v.trim().length < 6;
  }
  ta.oninput = update;

  const form = H.h('form.routines-modal', {onsubmit:function(e){
    e.preventDefault();
    if(!parsed || create.disabled) return;
    if(LIVE){
      const scheduleString = toScheduleString(parsed.schedule);
      if(!scheduleString){ preview.classList.add('bad'); return; }
      create.disabled = true;
      createRoutineLive({
        name: parsed.name,
        prompt: ta.value.trim(),
        scheduleString: scheduleString,
        deliver: liveDeliver(parsed.deliver),
        skills: [],
        model: '',
        provider: '',
        profile: H.api.profile,
      }).then(function(job){
        modal.close();
        state.tab = 'schedules';
        state.scroll = 0;
        setHash('schedules');
        notify('Routine “' + ((job && job.name) || parsed.name) + '” created');
        reloadLive();
      }).catch(function(err){
        create.disabled = false;
        failToast('Create', err);
      });
      return;
    }
    const r = {
      id:'r-' + Date.now(),
      name:parsed.name,
      agent:parsed.agent,
      deliver:parsed.deliver,
      prompt:ta.value.trim(),
      model:'',
      skills:[],
      enabled:true,
      schedule:parsed.schedule,
      lastAt:null,
      lastStatus:null,
      runs:[],
      failure:null,
      output:'',
    };
    state.routines.unshift(r);
    modal.close();
    state.tab = 'schedules';
    state.scroll = 0;
    setHash('schedules');
    renderView(currentRoot, {route:['schedules'], go:lastCtx && lastCtx.go, toast:lastCtx && lastCtx.toast});
    notify('Routine “' + r.name + '” created');
  }},
    H.h('div.routines-modal-h',
      H.h('h2', 'New routine'),
      H.h('button.btn.icon.ghost', {type:'button', 'aria-label':'Close dialog', onclick:function(){ modal.close(); }}, H.ic('x','sm'))
    ),
    H.h('p.routines-modal-lead', 'Describe the job in one sentence. Hermes reads the schedule, agent and delivery target from it · you can adjust everything afterwards.'),
    H.h('div.field',
      H.h('label', 'What should Hermes do?'),
      ta,
      H.h('span.hint', 'Try “Every weekday at 8 summarise my inbox and send it to Telegram”, “Every Monday at 7 email the cost report” or “Every 4 hours check the gateway”.')
    ),
    preview,
    H.h('div.routines-modal-foot',
      H.h('button.btn', {type:'button', onclick:function(){ modal.close(); }}, 'Cancel'),
      create
    )
  );
  const modal = H.modal(form, {width:640});
  setTimeout(function(){ ta.focus(); }, 0);
}

/* =====================================================================
   TRIGGERS
   ===================================================================== */
const WEBHOOK_BASE = 'http://127.0.0.1:8644/p/default/webhooks/';
function webhookUrl(route){ return WEBHOOK_BASE + route; }

function copyText(text, okMsg){
  let done = false;
  const finish = function(){ if(done) return; done = true; notify(okMsg); };
  const fallback = function(){
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly','');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch(e){}
      ta.remove();
    } finally { finish(); }
  };
  try {
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(finish, fallback);
    } else fallback();
  } catch(e){ fallback(); }
}

function hookEnabled(w, v){
  H.api.put('/api/webhooks/' + encodeURIComponent(w.name) + '/enabled', {enabled: !!v})
    .then(function(){
      w.enabled = !!v;
      notify('“' + w.name + '” ' + (v ? 'enabled' : 'disabled'));
      reloadLive();
    })
    .catch(function(e){ failToast(v ? 'Enable' : 'Disable', e); reloadLive(); });
}
function deleteHook(w){
  H.api.del('/api/webhooks/' + encodeURIComponent(w.name))
    .then(function(){ notify('Deleted route “' + w.name + '”'); reloadLive(); })
    .catch(function(e){ failToast('Delete', e); });
}
function testHook(w){
  /* A real POST to the route URL. Signed routes need an HMAC we do not hold,
     so the button is disabled for them (see buildWebhookRow). */
  fetch(w.url, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({test: true, source: 'hermes-dashboard'}),
  }).then(function(res){
    notify('Test event delivered to ' + w.name + ' · ' + res.status);
    reloadLive();
  }).catch(function(e){
    failToast('Test event', new Error((e && e.message) || 'receiver refused the request'));
  });
}

function buildWebhookRow(w){
  const name = w.name || w.route;
  const url = LIVE ? (w.url || '') : webhookUrl(name);
  const urlTxt = H.h('span.routines-url-txt.mono', url);
  const copyBtn = H.h('button.btn.icon.ghost.routines-copy', {'aria-label':'Copy URL for ' + name, title:'Copy URL', type:'button'},
    H.ic('copy','sm'));
  copyBtn.onclick = function(){ copyText(url, 'Webhook URL copied'); };

  const last = H.h('span.routines-trig-last');
  if(LIVE){
    last.appendChild(H.h('span.muted', 'Delivery log lives on the gateway'));
  } else if(w.last){
    last.appendChild(H.pill(String(w.last.code), w.last.code >= 200 && w.last.code < 300 ? 'pos' : 'neg'));
    last.appendChild(H.h('span.muted', relAt(w.last.at)));
  } else {
    last.appendChild(H.h('span.muted', 'No deliveries yet'));
  }

  const meta = H.h('div.routines-trig-meta',
    H.h('span.routines-sig', H.ic('key','sm'),
      LIVE
        ? (w.signature ? 'Signature · ' + w.signature : 'No signature pin') + (w.secretSet ? ' · secret set' : ' · no secret')
        : 'HMAC SHA-256 · secret set'),
    H.h('span.routines-metadot', '·'),
    H.h('span', 'Delivers to'),
    H.pill(deliverLabel(w.deliver)),
    H.h('span.routines-metadot', '·'),
    last
  );

  const actions = H.h('div.routines-trig-actions');
  const testBtn = H.h('button.btn.sm', {type:'button', onclick:function(){ testHook(w); }}, 'Send test event');
  if(LIVE && w.signature){
    testBtn.disabled = true;
    testBtn.title = 'Signed route · a test event needs the HMAC secret, which the web does not read';
  }
  actions.appendChild(testBtn);
  if(LIVE){
    actions.appendChild(H.h('button.btn.sm', {type:'button', onclick:function(){ deleteHook(w); }}, 'Delete'));
  }

  const top = H.h('div.routines-trig-top',
    H.h('span.routines-trig-name', name),
    LIVE ? (w.enabled ? H.pill('Enabled','pos') : H.pill('Disabled','warn')) : H.pill(w.source)
  );
  if(LIVE){
    top.appendChild(H.h('span.grow'));
    top.appendChild(H.sw(w.enabled, function(v){ hookEnabled(w, v); }, name + ' enabled'));
  }

  return H.h('div.routines-trig-row',
    H.h('div.routines-trig-main',
      top,
      w.description ? H.h('div.routines-trig-desc', w.description) : null,
      url ? H.h('div.routines-url', urlTxt, copyBtn) : null,
      meta
    ),
    actions
  );
}
function sendTest(w){
  w.last = {code:200, at:NOW};
  state.deliveries.unshift({at:NOW, route:w.route, source:w.source, code:200, ms:60 + Math.round(Math.random()*120)});
  state.deliveries = state.deliveries.slice(0, 10);
  refresh();
  notify('Test event delivered to ' + w.route + ' · 200');
}

function buildTriggers(){
  const wrap = H.h('div');
  const newBtn = H.h('button.btn.routines-newhook', {type:'button', onclick:openNewWebhook}, H.ic('plus','sm'), 'New webhook');

  if(LIVE && hookState.enabled === false){
    wrap.appendChild(H.h('div.routines-banner.routines-hookoff', {role:'status'},
      H.ic('warn','sm'),
      H.h('span.routines-banner-t', 'The webhook receiver is off · routes cannot receive events'),
      H.h('span.grow'),
      H.h('button.btn.sm.routines-banner-btn', {type:'button', onclick:function(){
        H.api.post('/api/webhooks/enable')
          .then(function(){ notify('Webhook receiver enabled'); hookState.enabled = true; reloadLive(); })
          .catch(function(e){ failToast('Enable webhooks', e); });
      }}, 'Enable webhooks')
    ));
  }

  wrap.appendChild(H.h('div.routines-sec-h',
    H.h('h2', 'Webhook subscriptions'),
    H.h('span.routines-count', state.webhooks.length + (state.webhooks.length === 1 ? ' route' : ' routes')),
    H.h('span.grow'),
    newBtn
  ));

  const trigCard = H.h('div.card.routines-trigs');
  if(!state.webhooks.length){
    trigCard.appendChild(H.h('div.empty.routines-hooks-empty',
      H.h('strong', 'No webhooks yet'),
      H.h('span', LIVE ? 'Create a route and POST to its URL to start a routine from an event.' : 'Create a route and POST to its URL to start a routine from an event.'),
      LIVE ? H.h('div.routines-empty-act',
        H.h('button.btn.primary', {type:'button', onclick:openNewWebhook}, H.ic('plus','sm'), 'New webhook')) : null));
  }
  state.webhooks.forEach(function(w){ trigCard.appendChild(buildWebhookRow(w)); });
  wrap.appendChild(trigCard);
  wrap.appendChild(H.h('p.routines-note', LIVE
    ? 'Every route accepts POST at its URL' + (hookState.baseUrl ? ' under ' + hookState.baseUrl : '') + ' and verifies its signature before the prompt runs. The signing secret stays on the gateway and is never shown here.'
    : 'Every route accepts POST at /p/default/webhooks/<route> on port 8644 and verifies an HMAC SHA-256 signature before the prompt runs.'));

  if(LIVE){
    wrap.appendChild(H.h('p.routines-note.routines-listsec', 'Delivery history is not exposed by the dashboard API yet · check the gateway log for rejected or failed deliveries.'));
    return wrap;
  }

  const recentCard = H.h('div.card.routines-recent');
  recentCard.appendChild(H.h('div.card-h',
    H.h('span', 'Recent deliveries'),
    H.h('span.routines-count', 'Last ' + Math.min(8, state.deliveries.length) + ' events'),
    H.h('span.grow'),
    state.paused ? H.pill('Turns paused', 'warn') : null
  ));
  const table = H.h('table.tbl.routines-dtbl');
  table.appendChild(H.h('thead', H.h('tr',
    H.h('th', 'Time'), H.h('th', 'Route'), H.h('th', 'Source'), H.h('th.r', 'Status'), H.h('th.r', 'Duration')
  )));
  const tbody = H.h('tbody');
  state.deliveries.slice(0, 8).forEach(function(d){
    tbody.appendChild(H.h('tr',
      H.h('td', H.h('span.num', relAt(d.at))),
      H.h('td', H.h('span.mono', d.route)),
      H.h('td', d.source),
      H.h('td.r', H.pill(String(d.code), d.code >= 200 && d.code < 300 ? 'pos' : 'neg')),
      H.h('td.r', H.h('span.num', d.ms + ' ms'))
    ));
  });
  table.appendChild(tbody);
  recentCard.appendChild(H.h('div.scroll-x', table));
  wrap.appendChild(H.h('div.routines-listsec', recentCard));
  return wrap;
}

function splitNames(v){ return String(v||'').split(/[\n,]/).map(function(x){ return x.trim(); }).filter(Boolean); }

function openNewWebhook(){
  const routeIn = H.h('input.input', {type:'text', placeholder:'github-push', 'aria-label':'Route name'});
  const promptIn = H.h('textarea.textarea.routines-ta', {rows:'5', 'aria-label':'Prompt template', placeholder:'Summarise this event and send it to Telegram:\n{payload}'});
  const deliverSel = H.h('select.select', {'aria-label':'Deliver to'});
  let deliverIds;
  if(LIVE){
    deliverIds = [{id:'log', label:'Log only'}].concat((state.deliveryTargets || []).map(function(t){ return {id:t.id, label:t.name}; }));
  } else {
    deliverIds = [{id:'Telegram', label:'Telegram'},{id:'Email', label:'Email'},{id:'Thread only', label:'Thread only'}];
  }
  deliverIds.forEach(function(d){
    deliverSel.appendChild(H.h('option', {value:d.id, selected:d.id === deliverIds[0].id ? 'selected' : null}, d.label));
  });
  const urlPrev = H.h('div.routines-urlprev.mono', LIVE ? ((hookState.baseUrl || '') + '/webhooks/github-push') : webhookUrl('github-push'));
  const err = H.h('div.routines-formerr', {hidden:true});

  let extraFields = [];
  let descIn = null, skillsIn = null, chatIn = null, sigSel = null;
  if(LIVE){
    descIn = H.h('input.input', {type:'text', placeholder:'What this route is for', 'aria-label':'Description'});
    skillsIn = H.h('input.input', {type:'text', placeholder:'summarise, shell', 'aria-label':'Skills'});
    chatIn = H.h('input.input', {type:'text', placeholder:'Optional chat id', 'aria-label':'Deliver chat id'});
    sigSel = H.h('select.select', {'aria-label':'Signature scheme'});
    [['generic','Generic HMAC'],['github','GitHub'],['gitlab','GitLab'],['linear','Linear']].forEach(function(o){
      sigSel.appendChild(H.h('option', {value:o[0], selected:o[0] === 'generic' ? 'selected' : null}, o[1]));
    });
    extraFields = [
      H.h('div.field', H.h('label', 'Description'), descIn),
      H.h('div.field', H.h('label', 'Signature'), sigSel,
        H.h('span.hint', 'The secret is generated on the gateway and never shown in the web UI.')),
      H.h('div.field', H.h('label', 'Skills'), skillsIn,
        H.h('span.hint', 'Comma separated skill names, attached to every run of this route.')),
      H.h('div.field', H.h('label', 'Deliver chat id'), chatIn,
        H.h('span.hint', 'Optional · overrides the platform’s home channel for this route.')),
    ];
  }

  const form = H.h('form.routines-modal', {onsubmit:function(e){
    e.preventDefault();
    let route = routeIn.value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    if(!/^[a-z0-9][a-z0-9_-]{1,39}$/.test(route)){
      err.textContent = 'Route needs 2–40 lowercase letters, digits, dashes or underscores.';
      err.removeAttribute('hidden');
      routeIn.focus();
      return;
    }
    if(!promptIn.value.trim()){
      err.textContent = 'Add a prompt template · use {payload} where the JSON body should go.';
      err.removeAttribute('hidden');
      promptIn.focus();
      return;
    }
    if(LIVE){
      /* WebhookCreate: name, description, events, prompt, skills, deliver,
         deliver_only, deliver_chat_id, signature (see api-webhooks.ts). */
      const body = {
        name: route,
        events: [],
        prompt: promptIn.value.trim(),
        skills: splitNames(skillsIn.value),
        deliver: deliverSel.value,
        deliver_only: false,
        signature: sigSel.value || undefined,
      };
      if(descIn.value.trim()) body.description = descIn.value.trim();
      if(chatIn.value.trim()) body.deliver_chat_id = chatIn.value.trim();
      H.api.post('/api/webhooks', body).then(function(res){
        modal.close();
        notify('Webhook ' + ((res && res.name) || route) + ' created');
        reloadLive();
      }).catch(function(ex){ failToast('Create webhook', ex); });
      return;
    }
    state.webhooks.push({route:route, source:'Generic', deliver:deliverSel.value, prompt:promptIn.value.trim(), last:null});
    modal.close();
    refresh();
    notify('Webhook /p/default/webhooks/' + route + ' created');
  }},
    H.h('div.routines-modal-h',
      H.h('h2', 'New webhook'),
      H.h('button.btn.icon.ghost', {type:'button', 'aria-label':'Close dialog', onclick:function(){ modal.close(); }}, H.ic('x','sm'))
    ),
    H.h('p.routines-modal-lead', 'A route accepts POSTs and turns {payload} into a prompt. The signature secret is generated on the gateway.'),
    H.h('div.field',
      H.h('label', 'Route name'),
      routeIn,
      H.h('span.hint', 'Lowercase letters, digits, dashes and underscores.'),
      urlPrev
    ),
    H.h('div.field',
      H.h('label', 'Prompt template'),
      promptIn,
      H.h('span.hint', 'Use {payload} where the JSON body should go.')
    ),
    H.h('div.field', H.h('label', 'Deliver to'), deliverSel),
    extraFields,
    err,
    H.h('div.routines-modal-foot',
      H.h('button.btn', {type:'button', onclick:function(){ modal.close(); }}, 'Cancel'),
      H.h('button.btn.primary', {type:'submit'}, 'Create webhook')
    )
  );

  routeIn.oninput = function(){
    const slug = routeIn.value.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
    urlPrev.textContent = LIVE ? ((hookState.baseUrl || '') + '/webhooks/' + (slug || '…')) : webhookUrl(slug || '…');
  };

  const modal = H.modal(form, {width:640});
  setTimeout(function(){ routeIn.focus(); }, 0);
}

/* =====================================================================
   BOARD
   ===================================================================== */
function columnName(id){
  const c = COLUMNS.filter(function(x){ return x.id === id; })[0];
  return c ? c.name : id;
}
function openCardMenu(anchor, card){
  openPop(anchor, function(pop, close){
    pop.appendChild(H.h('div.routines-menu-h', 'Move to…'));
    COLUMNS.forEach(function(col){
      if(col.id === card.col) return;
      menuItem(pop, col.name, null, function(){
        close();
        moveCard(card, col.id);
      });
    });
  });
}
function moveCard(card, colId){
  if(card.col === colId) return;
  card.col = colId;
  refresh();
  notify('Moved to ' + columnName(colId));
}

function buildCard(card){
  const agent = H.agent(card.agent) || H.agent('hermes');
  const el = H.h('div.routines-kcard', {
    draggable:'true', tabindex:'0', role:'button',
    'aria-label':'Open task ' + card.title,
    'data-card':card.id
  });
  const menuWrap = H.h('div.routines-kmenu-wrap');
  const menuBtn = H.h('button.routines-kmenu', {
    type:'button', 'aria-haspopup':'menu', title:'Move to…',
    'aria-label':'Move “' + card.title + '” to another column'
  }, H.ic('more','sm'));
  menuBtn.onclick = function(e){ e.stopPropagation(); openCardMenu(menuWrap, card); };
  menuWrap.appendChild(menuBtn);

  const kids = [
    H.h('div.routines-kcard-t', card.title),
    H.h('div.routines-kcard-m',
      H.avatar(agent, 20, 'idle'),
      H.h('span.grow'),
      H.h('span.routines-kcount', H.ic('link','sm'), H.h('span.num', String(card.linked.length))),
      H.h('span.routines-kcount.routines-cmt-n', H.ic('chat','sm'), H.h('span.num', String(card.comments.length)))
    ),
  ];
  if(card.blockedBy) kids.push(H.h('div.routines-blockedwrap', H.pill('Blocked by ' + card.blockedBy, 'warn')));
  kids.push(menuWrap);
  el.append.apply(el, kids);
  el.onclick = function(e){
    if(e.target.closest('button')) return;
    openCard(card);
  };
  el.onkeydown = function(e){
    if(e.target !== el) return;
    if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); openCard(card); }
  };
  el.addEventListener('dragstart', function(e){
    dragId = card.id;
    el.classList.add('is-drag');
    try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', card.id); } catch(err){}
  });
  el.addEventListener('dragend', function(){
    dragId = null;
    el.classList.remove('is-drag');
    document.querySelectorAll('.routines-col-body.over').forEach(function(x){ x.classList.remove('over'); });
  });
  return el;
}

function buildBoardUnavailable(){
  return H.h('div',
    H.h('div.routines-sec-h.routines-board-h',
      H.h('h2', 'Task board'),
      H.h('span.routines-count', 'Not available from the web yet')
    ),
    H.h('div.card.routines-board-off',
      H.h('div.empty.routines-board-empty',
        H.h('strong', 'The task board is not exposed by the dashboard API'),
        H.h('span', 'Hermes keeps the board in kanban.db and `hermes kanban` runs it from the CLI. The web dashboard has no REST or JSON-RPC surface for its columns, cards or comments, so this tab stays read-only until one ships.'),
        H.h('p.routines-note', 'Use `hermes kanban` in a terminal, or the Desktop app’s Kanban space, to move cards.')
      )
    )
  );
}

function buildBoard(){
  if(LIVE) return buildBoardUnavailable();
  const running = state.cards.filter(function(c){ return c.col === 'running'; }).length;
  const blocked = state.cards.filter(function(c){ return !!c.blockedBy; }).length;
  const wrap = H.h('div');
  wrap.appendChild(H.h('div.routines-sec-h.routines-board-h',
    H.h('h2', 'Task board'),
    H.h('span.routines-count', state.cards.length + ' tasks · ' + running + ' running · ' + blocked + ' blocked'),
    H.h('span.grow'),
    H.h('span.routines-board-hint', 'Drag to move · each card has a Move to… menu')
  ));

  const scroll = H.h('div.routines-board-scroll');
  const board = H.h('div.routines-board');
  COLUMNS.forEach(function(col){
    const cards = state.cards.filter(function(c){ return c.col === col.id; });
    const body = H.h('div.routines-col-body');
    cards.forEach(function(c){ body.appendChild(buildCard(c)); });
    const bodyWrap = H.h('div.routines-col-bodywrap', body);

    const colEl = H.h('div.routines-col', {'data-col':col.id},
      H.h('div.routines-col-h',
        H.h('span.routines-col-name', col.name),
        H.h('span.routines-col-count', String(cards.length)),
        col.id === 'running' ? H.h('span.dot.live') : null
      ),
      bodyWrap
    );

    body.addEventListener('dragover', function(e){
      e.preventDefault();
      try { e.dataTransfer.dropEffect = 'move'; } catch(err){}
      body.classList.add('over');
    });
    body.addEventListener('dragleave', function(e){
      if(!body.contains(e.relatedTarget)) body.classList.remove('over');
    });
    body.addEventListener('drop', function(e){
      e.preventDefault();
      body.classList.remove('over');
      const id = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || dragId;
      const card = state.cards.filter(function(c){ return c.id === id; })[0];
      if(card && card.col !== col.id) moveCard(card, col.id);
    });

    board.appendChild(colEl);
  });
  scroll.appendChild(board);
  scroll.addEventListener('scroll', function(){ state.boardScroll = scroll.scrollLeft; }, {passive:true});
  wrap.appendChild(scroll);
  setTimeout(function(){ scroll.scrollLeft = state.boardScroll || 0; }, 0);
  return wrap;
}

function commentNode(c){
  const agent = c.by === 'you' ? null : H.agent(c.by);
  const av = agent ? H.avatar(agent, 24, 'idle') : H.h('span.routines-cav.you', 'You');
  return H.h('div.routines-comment',
    av,
    H.h('div.routines-cmain',
      H.h('div.routines-cmeta',
        H.h('strong', agent ? agent.name : 'You'),
        H.h('span.routines-ctime', c.at)
      ),
      H.h('div.routines-cbody', c.text)
    )
  );
}

function openCard(card){
  openPanel('Task ' + card.title, function(panel, close){
    const agent = H.agent(card.agent) || H.agent('hermes');
    const head = drawerHead(columnName(card.col) + ' · task',
      H.h('h2', card.title),
      H.h('div.routines-cmeta',
        H.avatar(agent, 22, 'idle'),
        H.h('span', agent.name),
        card.blockedBy ? H.pill('Blocked by ' + card.blockedBy, 'warn') : null
      ),
      close
    );
    const body = H.h('div.routines-dbody');
    body.appendChild(H.h('p.routines-desc', card.desc));

    const commentCount = H.h('span.routines-count', String(card.comments.length));
    const commentList = H.h('div.routines-comments');
    card.comments.forEach(function(c){ commentList.appendChild(commentNode(c)); });
    if(!card.comments.length) commentList.appendChild(H.h('div.routines-runs-empty', 'No comments yet.'));
    body.appendChild(H.h('div.routines-lab-row.routines-comments-h',
      H.h('span.routines-lab', 'Comments'), commentCount
    ));
    body.appendChild(commentList);

    const ta = H.h('textarea.textarea', {rows:'2', 'aria-label':'Add a comment', placeholder:'Add a comment…'});
    const addBtn = H.h('button.btn', {type:'button'}, 'Comment');
    addBtn.onclick = function(){
      const v = ta.value.trim();
      if(!v){ notify('Write a comment first'); ta.focus(); return; }
      const c = {by:'you', at:'just now', text:v};
      card.comments.push(c);
      if(commentList.querySelector('.routines-runs-empty')) commentList.replaceChildren();
      commentList.appendChild(commentNode(c));
      commentCount.textContent = String(card.comments.length);
      ta.value = '';
      const n = currentPage && currentPage.querySelector('[data-card="' + card.id + '"] .routines-cmt-n .num');
      if(n) n.textContent = String(card.comments.length);
      notify('Comment added');
    };
    body.appendChild(H.h('div.routines-addcomment', ta, addBtn));

    body.appendChild(H.h('div.routines-lab-row.routines-linked-h',
      H.h('span.routines-lab', 'Linked tasks'),
      H.h('span.routines-count', String(card.linked.length))
    ));
    const linked = H.h('div.routines-linked');
    if(!card.linked.length){
      linked.appendChild(H.h('div.routines-runs-empty', 'No linked tasks.'));
    } else {
      card.linked.forEach(function(l){
        const row = H.h('button.routines-link-row', {type:'button'},
          H.h('span.routines-link-t', l.title),
          H.pill(l.status, l.status === 'Done' ? 'pos' : l.status === 'Running' ? 'live' : ''),
          H.ic('chev','sm')
        );
        row.onclick = function(){
          const target = l.cardId ? state.cards.filter(function(c){ return c.id === l.cardId; })[0] : null;
          if(target){ close(); openCard(target); }
          else notify('Linked task: ' + l.title);
        };
        linked.appendChild(row);
      });
    }
    body.appendChild(linked);

    panel.append(head, body);
  }, {onClose:refresh});
}

/* =====================================================================
   RENDER
   ===================================================================== */
function renderPageHead(){
  let pauseBtn;
  if(LIVE){
    /* `hermes pause` writes the ESTOP sentinel; no dashboard route reads or writes it. */
    pauseBtn = H.h('button.btn.ghost', {type:'button', disabled:'disabled',
      title:'Not available from the web yet · run `hermes pause` in a terminal to stop new work'},
      H.ic('pause','sm'), 'Pause all');
  } else {
    pauseBtn = H.h('button.btn.ghost', {type:'button', onclick:function(){
      state.paused = !state.paused;
      refresh();
      notify(state.paused ? 'Dispatch paused · cron and kanban stopped' : 'Dispatch resumed');
    }}, H.ic(state.paused ? 'play' : 'pause','sm'), state.paused ? 'Resume all' : 'Pause all');
  }

  const newBtn = H.h('button.btn.primary', {type:'button', onclick:openNewRoutine}, H.ic('plus','sm'), 'New routine');
  return H.h('div.page-head',
    H.h('div',
      H.h('h1', 'Routines'),
      H.h('p', 'What Hermes does without being asked · scheduled jobs, webhook triggers and the shared task board.')
    ),
    H.h('span.grow'),
    H.h('div.routines-actions', pauseBtn, newBtn)
  );
}

function loadFailNode(msg, retry){
  return H.h('div.card.routines-loadfail',
    H.h('div.empty',
      H.h('strong', 'Couldn’t load routines'),
      H.h('span', msg || 'The request failed.'),
      H.h('div.routines-empty-act',
        H.h('button.btn', {type:'button', onclick:retry}, 'Retry'))));
}
function loadingNode(label){
  const card = H.h('div.card.routines-loading');
  card.appendChild(H.h('div.routines-loading-msg', label));
  for(let i = 0; i < 3; i++) card.appendChild(H.h('div.routines-skel'));
  return card;
}

function paintTab(tab, content, root, ctx){
  if(!LIVE){
    if(tab === 'schedules') content.appendChild(buildSchedules());
    else if(tab === 'triggers') content.appendChild(buildTriggers());
    else content.appendChild(buildBoard());
    return;
  }

  const need = tab === 'schedules' ? !live.loaded : tab === 'triggers' ? !hookState.loaded : false;
  const err = tab === 'schedules' ? live.error : tab === 'triggers' ? hookState.error : null;

  if(need && err){
    content.appendChild(loadFailNode(err, function(){
      if(tab === 'schedules'){ live.error = null; live.loaded = false; }
      else { hookState.error = null; hookState.loaded = false; }
      renderView(root, ctx);
    }));
    return;
  }
  if(need){
    content.appendChild(loadingNode(tab === 'schedules' ? 'Loading routines…' : 'Loading webhooks…'));
    const load = tab === 'schedules' ? loadSchedules() : loadWebhooks();
    load.then(function(){
      if(!root.isConnected || !currentPage || !currentPage.isConnected) return;
      renderView(root, ctx);
    });
    return;
  }

  if(tab === 'schedules') content.appendChild(buildSchedules());
  else if(tab === 'triggers') content.appendChild(buildTriggers());
  else content.appendChild(buildBoard());
}

function renderView(root, ctx){
  lastCtx = ctx || lastCtx || {};
  cleanup();
  if(panelApi) panelApi.close(true);

  const route = (ctx.route && ctx.route[0]) || '';
  const tab = TABS.some(function(t){ return t.id === route; }) ? route : 'schedules';
  state.tab = tab;

  currentRoot = root;
  root.replaceChildren();

  const page = H.h('div.page.routines-page');
  const inner = H.h('div.page-in' + (tab === 'board' || (LIVE && tab === 'triggers') ? '.routines-wide' : ''));

  inner.appendChild(renderPageHead());

  if(!LIVE && state.paused){
    inner.appendChild(H.h('div.routines-banner', {role:'status'},
      H.ic('warn','sm'),
      H.h('span.routines-banner-t', 'Paused · scheduled runs and new turns are stopped'),
      H.h('span.grow'),
      H.h('button.btn.sm.routines-banner-btn', {type:'button', onclick:function(){
        state.paused = false;
        refresh();
        notify('Dispatch resumed');
      }}, 'Resume')
    ));
  }

  const counts = {
    schedules: (!LIVE || live.loaded) ? state.routines.length : null,
    triggers: (!LIVE || hookState.loaded) ? state.webhooks.length : null,
    board: LIVE ? null : state.cards.length,
  };
  const tabs = H.tabs(TABS.map(function(t){
    return {id:t.id, label:t.label, count:counts[t.id]};
  }), state.tab, function(id){
    if(state.tab === id) return;
    state.tab = id;
    state.scroll = 0;
    setHash(id);
    renderView(root, {route:[id], go:ctx.go, toast:ctx.toast, openThread:ctx.openThread});
  });
  inner.appendChild(tabs);

  const content = H.h('div.routines-content');
  inner.appendChild(content);

  page.appendChild(inner);
  page.addEventListener('scroll', function(){ state.scroll = page.scrollTop; }, {passive:true});
  root.appendChild(page);
  currentPage = page;
  page.scrollTop = state.scroll;

  paintTab(tab, content, root, {route:[tab], go:ctx.go, toast:ctx.toast, openThread:ctx.openThread});
}

H.views.routines = {
  title: 'Routines',
  render: function(root, ctx){ renderView(root, ctx || {}); }
};
})();
