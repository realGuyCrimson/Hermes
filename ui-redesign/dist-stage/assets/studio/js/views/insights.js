/* Insights · what Hermes spent, did, and logged. Charts are hand-drawn SVG (no libraries).
   Sample data is generated from a seeded PRNG so a given range/profile always looks the same.
   `H.live` (served by hermes dashboard): usage/activity read /api/analytics/usage,
   /api/analytics/models, /api/sessions and /api/status; logs read /api/logs with its
   file/level/component/lines/search params. Log text is rendered as text, never HTML. */
(function(){
const H = window.H;
const SVGNS = 'http://www.w3.org/2000/svg';
const LIVE = !!H.live;

/* ---------------------------------------------------------------- constants */
const RANGE_IDS = ['24h', '7d', '30d', '90d'];
const PROFILES = [
  {id:'all', label:'All agents'},
  {id:'hermes', label:'Hermes'},
  {id:'scout', label:'Scout'},
  {id:'ledger', label:'Ledger'},
];
const PROFILE_SCALE = {all:1, hermes:0.63, scout:0.21, ledger:0.16};
const RANGE = {
  '24h': {buckets:24, prev:'previous 24 hours', tick:6, base:0.92, noun:'hour'},
  '7d':  {buckets:7,  prev:'previous 7 days',  tick:1, base:6.4,  noun:'day'},
  '30d': {buckets:30, prev:'previous 30 days', tick:5, base:5.5,  noun:'day'},
  '90d': {buckets:90, prev:'previous 90 days', tick:15, base:4.8, noun:'day'},
};
const MODEL_PROVIDER = {
  'claude-sonnet-5-5':'Anthropic', 'claude-opus-5-5':'Anthropic',
  'deepseek-flash':'DeepSeek', 'gemini-flash':'Google', 'hermes-local':'Ollama',
};
const MODEL_PRICE = {'claude-sonnet-5-5':6.2, 'claude-opus-5-5':18, 'deepseek-flash':0.85, 'gemini-flash':0.75, 'hermes-local':0.12};
const MODEL_BIAS = {
  all:   {'claude-sonnet-5-5':62, 'claude-opus-5-5':14, 'deepseek-flash':16, 'gemini-flash':6, 'hermes-local':2},
  hermes:{'claude-sonnet-5-5':74, 'claude-opus-5-5':18, 'deepseek-flash':8},
  scout: {'deepseek-flash':68, 'gemini-flash':22, 'claude-sonnet-5-5':10},
  ledger:{'gemini-flash':55, 'deepseek-flash':28, 'claude-sonnet-5-5':17},
};
const AGENT_WEIGHT = {hermes:0.63, scout:0.21, ledger:0.16};
const AGENT_PRICE = {hermes:6.1, scout:1.05, ledger:0.88};
const TOOL_BASE = [
  {name:'terminal', sub:'builtin', calls:2841, ok:0.991},
  {name:'read_file', sub:'builtin', calls:1904, ok:0.997},
  {name:'edit', sub:'builtin', calls:1122, ok:0.994},
  {name:'web_search', sub:'tool', calls:764, ok:0.972},
  {name:'browser', sub:'chromium container', calls:511, ok:0.958},
  {name:'mcp__github', sub:'mcp · github', calls:388, ok:0.986},
  {name:'delegate', sub:'subagent', calls:214, ok:0.977},
  {name:'write_file', sub:'builtin', calls:176, ok:0.998},
  {name:'grep', sub:'builtin', calls:143, ok:0.999},
  {name:'cron_create', sub:'routine', calls:96, ok:0.969},
];
const SKILL_BASE = [
  {name:'code-review', runs:128, last:'2h ago'},
  {name:'web-research', runs:96, last:'4h ago'},
  {name:'sqlite-forensics', runs:61, last:'1d ago'},
  {name:'release-notes', runs:44, last:'2d ago'},
  {name:'invoice-reconcile', runs:38, last:'2d ago'},
  {name:'python-debug', runs:27, last:'4d ago'},
];
const CACHE_NOTE = {
  '24h':'One model switch at 14:20 rewrote 18k prompt tokens; the cache held the rest.',
  '7d':'Switching the model mid-thread cost 41k uncached tokens on Tue.',
  '30d':'Four model switches added 214k uncached tokens; retries added another 38k.',
  '90d':'The Opus trial cut the hit rate to 84% on long threads; sonnet-only days stayed above 90%.',
};
const EXPLAIN = {
  EHEARTBEAT: {
    cause:'The gateway event loop stalled 18 s while SQLite checkpointed the WAL; heartbeats queued behind it.',
    fix:'Move the checkpoint to a quiet window (`hermes sessions optimize` at 03:00) and keep the gateway as the only writer.',
  },
  E429: {
    cause:'The provider returned 429 three times in 90 s; the cron job has no fallback model configured.',
    fix:'Add `/model fallback deepseek-flash` to the routine, then re-run it from Routines.',
  },
  EBROWSER: {
    cause:'Nothing is listening on 127.0.0.1:9222, so the MCP browser tool cannot attach.',
    fix:'Start the Chromium container with ~/chromium-docker/start-cdp.sh, or point browser.cdp_url at a live port.',
  },
  ECTX: {
    cause:'The thread reached 1.02M of a 1M context window before compression ran.',
    fix:'Turn on auto-compress at 80% for this profile, or branch the thread at the last checkpoint.',
  },
};
const FALLBACK_EXPLAIN = {
  cause:'The line reports a failed call; no matching pattern is known for this code.',
  fix:'Open the thread and retry the turn once provider health is green.',
};

/* ---------------------------------------------------------------- helpers */
function pad2(n){ return String(n).padStart(2, '0'); }
function round2(v){ return Math.round(v * 100) / 100; }
function hash32(s){
  let h = 2166136261;
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed){
  let a = seed >>> 0;
  return function(){
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function money(v, dec){
  if (v >= 1000) return '$' + H.fmt.n(Math.round(v));
  return '$' + Number(v).toFixed(dec == null ? 2 : dec);
}
function axisMoney(v){
  if (v === 0) return '$0';
  if (Number.isInteger(v)) return '$' + v;
  if (v < 10) return '$' + v.toFixed(1);
  return '$' + v.toFixed(0);
}
function pct(v, d){ return (v * 100).toFixed(d == null ? 0 : d) + '%'; }
function niceMax(v, ticks){
  const raw = Math.max(v, 0.0001) / ticks;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = norm <= 1 ? 1 : norm <= 1.5 ? 1.5 : norm <= 2 ? 2 : norm <= 3 ? 3 : norm <= 4 ? 4 : norm <= 5 ? 5 : 10;
  return step * mag * ticks;
}
function svgEl(name, attrs){
  const e = document.createElementNS(SVGNS, name);
  if (attrs) Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
  return e;
}
function timeShort(d){ return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function timeFull(d){ return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds()) + '.' + String(d.getMilliseconds()).padStart(3, '0'); }
function dayShort(d){ return d.toLocaleDateString('en-US', {weekday:'short'}) + ' ' + d.getDate(); }
function dayFull(d){ return d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'}); }
function dateShort(d){ return d.getDate() + ' ' + d.toLocaleDateString('en-US', {month:'short'}); }
function sameDay(a, b){ return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }

function makeLabels(rangeId, count){
  const now = new Date();
  const out = [];
  if (rangeId === '24h'){
    const end = new Date(now); end.setMinutes(0, 0, 0);
    for (let i = count - 1; i >= 0; i--){
      const d = new Date(end); d.setHours(d.getHours() - i);
      out.push({date:d, short:pad2(d.getHours()) + ':00', full:'Today ' + pad2(d.getHours()) + ':00'});
    }
  } else {
    for (let i = count - 1; i >= 0; i--){
      const d = new Date(now); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - i);
      out.push({date:d, short:count <= 7 ? dayShort(d) : dateShort(d), full:dayFull(d)});
    }
  }
  return out;
}

/* ---------------------------------------------------------------- sample data */
function buildData(rangeId, profile){
  const meta = RANGE[rangeId];
  const rand = rng(hash32('insights|' + rangeId + '|' + profile));
  const scale = PROFILE_SCALE[profile] == null ? 1 : PROFILE_SCALE[profile];
  const labels = makeLabels(rangeId, meta.buckets);

  const spend = labels.map(lb => {
    let v = meta.base * (0.58 + rand() * 0.88);
    if (rangeId === '24h'){
      const hr = lb.date.getHours();
      v *= (hr >= 9 && hr < 20) ? 1.3 : 0.52;
    } else {
      const dw = lb.date.getDay();
      if (dw === 0 || dw === 6) v *= 0.6;
    }
    v *= 0.9 + rand() * 0.2;
    return v * scale;
  });
  const last = spend.length - 1;
  spend[last] = spend[last] * (rangeId === '24h' ? 0.62 : 0.58);
  for (let i = 0; i < spend.length; i++) spend[i] = round2(spend[i]);
  const total = spend.reduce((a, b) => a + b, 0);

  const dSpend = -0.16 + rand() * 0.3;
  const dTokens = -0.13 + rand() * 0.28;
  const dThreads = -0.18 + rand() * 0.42;
  const dCache = -0.012 + rand() * 0.03;

  /* models */
  const bias = MODEL_BIAS[profile] || MODEL_BIAS.all;
  const ids = Object.keys(bias);
  const weights = ids.map(id => bias[id] * (0.85 + rand() * 0.3));
  const wsum = weights.reduce((a, b) => a + b, 0);
  const byModel = ids.map((id, i) => {
    const cost = round2(total * weights[i] / wsum);
    return {
      id, provider: MODEL_PROVIDER[id], cost,
      tokens: Math.round(cost / MODEL_PRICE[id] * 1e6),
      share: weights[i] / wsum,
    };
  }).sort((a, b) => b.cost - a.cost);
  const tokenTotal = byModel.reduce((a, m) => a + m.tokens, 0);
  const tokensIn = Math.round(tokenTotal * 0.84);
  const tokensOut = tokenTotal - tokensIn;
  const threads = Math.max(1, Math.round(total / 1.28));
  const hit = 0.845 + rand() * 0.065;
  const cacheRead = Math.round(tokensIn * hit);
  const cacheWrite = Math.round(tokensIn * (0.05 + rand() * 0.04));

  /* agents */
  let byAgent;
  if (profile === 'all'){
    const agentIds = Object.keys(AGENT_WEIGHT);
    const aw = agentIds.map(id => AGENT_WEIGHT[id] * (0.9 + rand() * 0.2));
    const asum = aw.reduce((a, b) => a + b, 0);
    const raw = agentIds.map((id, i) => {
      const cost = round2(total * aw[i] / asum);
      return {id, cost, share:aw[i] / asum, rawTokens:cost / AGENT_PRICE[id]};
    });
    const rawSum = raw.reduce((a, r) => a + r.rawTokens, 0) || 1;
    byAgent = raw.map(r => {
      const a = H.agent(r.id) || {name:r.id, role:''};
      return {id:r.id, name:a.name, role:a.role, cost:r.cost, tokens:Math.round(tokenTotal * r.rawTokens / rawSum), share:r.share};
    }).sort((a, b) => b.cost - a.cost);
  } else {
    const a = H.agent(profile) || {name:profile, role:''};
    byAgent = [{id:profile, name:a.name, role:a.role, cost:round2(total), tokens:tokenTotal, share:1}];
  }

  /* threads */
  const tlist = H.data.threads.filter(t => profile === 'all' || t.agent === profile);
  const tw = tlist.map(() => 0.4 + rand());
  const tsum = tw.reduce((a, b) => a + b, 0) || 1;
  const threadRows = tlist.map((t, i) => {
    const cost = round2(total * 0.86 * tw[i] / tsum);
    return {
      id:t.id, title:t.title, agent:t.agent, model:t.model, cost,
      tokens:Math.round(cost / (MODEL_PRICE[t.model] || 1) * 1e6),
    };
  }).sort((a, b) => b.cost - a.cost).slice(0, 6);

  /* month / budget · independent of the selected range */
  const monthBase = profile === 'all' ? 167.4 : profile === 'hermes' ? 105.3 : profile === 'scout' ? 35.2 : 26.9;
  const monthSpend = round2(monthBase * (0.96 + rand() * 0.08));

  /* activity */
  const daysFactor = {['24h']:0.45, ['7d']:1, ['30d']:4.2, ['90d']:12.4}[rangeId];
  const tools = TOOL_BASE.map(t => {
    const calls = Math.max(1, Math.round(t.calls * daysFactor * scale));
    const ok = Math.min(0.9995, t.ok + (rand() - 0.5) * 0.004);
    return {name:t.name, sub:t.sub, calls, ok, failed:Math.max(0, Math.round(calls * (1 - ok)))};
  }).sort((a, b) => b.calls - a.calls);
  const granted = Math.round(96 * daysFactor * (profile === 'all' ? 1 : scale * 1.15));
  const denied = Math.round(7 * daysFactor * (profile === 'all' ? 1 : scale));
  const avgTurn = Math.round(38 + rand() * 12);
  const totalCalls = tools.reduce((a, t) => a + t.calls, 0);
  const failedCalls = tools.reduce((a, t) => a + t.failed, 0);
  const skills = SKILL_BASE.map(s => ({name:s.name, last:s.last, runs:Math.max(1, Math.round(s.runs * Math.min(daysFactor, 3.6) * scale))}));
  const dCalls = -0.1 + rand() * 0.32;
  const dTurn = -0.14 + rand() * 0.24;

  const monthLabel = new Date().toLocaleDateString('en-US', {month:'long'});
  const todayLabel = dayFull(labels[labels.length - 1].date);

  return {
    range:rangeId, profile, meta, labels, spend, total, todayLabel, monthLabel, monthSpend,
    tokensIn, tokensOut, tokenTotal, threads, cacheRead, cacheWrite, hit,
    byModel, byAgent, threadRows,
    deltas:{spend:dSpend, tokens:dTokens, threads:dThreads, cache:dCache},
    activity:{tools, granted, denied, avgTurn, totalCalls, failedCalls, skills, dCalls, dTurn},
    cacheNote:CACHE_NOTE[rangeId],
  };
}

function buildHeat(profile){
  const rand = rng(hash32('heat|' + profile));
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const dow = today.getDay();
  const start = new Date(today); start.setDate(start.getDate() - dow - 11 * 7);
  const cells = [];
  let total = 0, busiest = null, days = 0;
  for (let w = 0; w < 12; w++){
    for (let d = 0; d < 7; d++){
      const date = new Date(start); date.setDate(date.getDate() + w * 7 + d);
      if (date > today){ cells.push({date, future:true, n:0, level:0}); continue; }
      const dw = date.getDay();
      let n = Math.floor(rand() * 6);
      if (dw === 0 || dw === 6) n = Math.floor(n * 0.4);
      if (n === 0 && rand() < 0.25) n = 1;
      total += n; days++;
      if (!busiest || n > busiest.n) busiest = {date:new Date(date), n};
      const level = n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;
      cells.push({date, future:false, n, level, today:sameDay(date, today)});
    }
  }
  return {cells, total, start, end:today, busiest, days, avg:total / Math.max(1, days)};
}

/* ---------------------------------------------------------------- live adapters
   Live mode reads the real REST endpoints and maps them into the same shape the
   sample renderers expect, so the layout stays identical. Nothing here fills a
   gap with an invented number: missing days are zeroes (no sessions recorded),
   and a period with no activity at all renders an explicit empty state. */
const LIVE_RANGES = ['7d', '30d', '90d'];
const LIVE_DAYS = {'7d':7, '30d':30, '90d':90};
const LOG_FILE_OPTIONS = [
  {id:'agent', label:'agent.log'},
  {id:'gateway', label:'gateway.log'},
  {id:'errors', label:'errors.log'},
];
const LOG_COMPONENTS = ['all', 'gateway', 'agent', 'tools', 'cli', 'cron'];
/* module level id -> API level token (`/api/logs?level=`) */
const LOG_LEVEL_API = {all:null, info:'INFO', warn:'WARNING', error:'ERROR'};

function dayKey(d){ return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
function ago(ts){
  const n = Number(ts);
  if (!n) return '—';
  const s = Math.max(0, Date.now() / 1000 - n);
  if (s < 90) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  if (s < 86400 * 45) return Math.round(s / 86400) + 'd ago';
  return new Date(n * 1000).toLocaleDateString('en-US', {month:'short', day:'numeric'});
}
function liveLabels(rangeId){
  const n = LIVE_DAYS[rangeId] || 7;
  const out = [];
  const now = new Date(); now.setHours(0, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--){
    const d = new Date(now); d.setDate(d.getDate() - i);
    out.push({date:d, short:n <= 7 ? dayShort(d) : dateShort(d), full:dayFull(d)});
  }
  return out;
}
/* Sessions-per-day grid from the same daily rows the chart uses. Days outside the
   selected period are drawn as `future` (empty, and titled as out of range). */
function liveHeat(labels, counts){
  if (!labels.length) return null;
  const first = labels[0].date;
  const start = new Date(first); start.setDate(start.getDate() - start.getDay());
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const cells = [];
  let total = 0, busiest = null, days = 0;
  const cur = new Date(start);
  while (cur <= today){
    const key = dayKey(cur);
    const inRange = Object.prototype.hasOwnProperty.call(counts, key);
    const n = inRange ? counts[key] : 0;
    if (inRange){
      total += n; days++;
      if (!busiest || n > busiest.n) busiest = {date:new Date(cur), n};
    }
    const level = n === 0 ? 0 : n <= 1 ? 1 : n <= 3 ? 2 : n <= 5 ? 3 : 4;
    cells.push({date:new Date(cur), future:!inRange, n, level, today:sameDay(cur, today)});
    cur.setDate(cur.getDate() + 1);
  }
  return {cells, total, start, end:labels[labels.length - 1].date, busiest, days, avg:total / Math.max(1, days)};
}

function fromApiInsights(usage, modelsRes, sessionsRes, status, rangeId){
  const range = RANGE[rangeId] || RANGE['7d'];
  const labels = liveLabels(rangeId);
  const byDay = new Map();
  (usage.daily || []).forEach(r => byDay.set(r.day, r));
  const row = lb => byDay.get(dayKey(lb.date)) || null;

  const costSeries = labels.map(lb => { const r = row(lb); return r ? Number(r.estimated_cost || 0) : 0; });
  const tokenSeries = labels.map(lb => { const r = row(lb); return r ? Number(r.input_tokens || 0) + Number(r.output_tokens || 0) : 0; });
  const sessionSeries = labels.map(lb => { const r = row(lb); return r ? Number(r.sessions || 0) : 0; });
  /* A free/local model can report $0 for a busy period, so fall back to a token
     chart instead of drawing a flat line of zeroes. The unit is stated in the UI. */
  const hasCost = costSeries.some(v => v > 0);
  const spend = hasCost ? costSeries : tokenSeries;
  const spendUnit = hasCost ? 'usd' : 'tokens';

  const t = usage.totals || {};
  const tokensIn = Number(t.total_input || 0);
  const tokensOut = Number(t.total_output || 0);
  const tokenTotal = tokensIn + tokensOut;
  const cacheRead = Number(t.total_cache_read || 0);
  const total = Number(t.total_estimated_cost || 0) || Number(t.total_actual_cost || 0);
  const threads = Number(t.total_sessions || 0);
  const apiCalls = Number(t.total_api_calls || 0);
  const hit = (cacheRead + tokensIn) > 0 ? cacheRead / (cacheRead + tokensIn) : 0;

  const modelRows = ((modelsRes && modelsRes.models) || []).length
    ? modelsRes.models
    : (usage.by_model || []).map(m => ({
        model:m.model, provider:'', input_tokens:m.input_tokens, output_tokens:m.output_tokens,
        estimated_cost:m.estimated_cost, sessions:m.sessions, api_calls:m.api_calls,
      }));
  const modelTokens = modelRows.reduce((a, m) => a + Number(m.input_tokens || 0) + Number(m.output_tokens || 0), 0);
  const byModel = modelRows.map(m => {
    const tok = Number(m.input_tokens || 0) + Number(m.output_tokens || 0);
    return {
      id:m.model, provider:m.provider || '—', tokens:tok,
      cost:Number(m.estimated_cost || 0), share:modelTokens ? tok / modelTokens : 0,
      sessions:Number(m.sessions || 0), calls:Number(m.api_calls || 0),
    };
  }).sort((a, b) => b.tokens - a.tokens);

  const taskRows = usage.by_task || [];
  const taskTokens = taskRows.reduce((a, r) => a + Number(r.input_tokens || 0) + Number(r.output_tokens || 0), 0);
  const byTask = taskRows.map(r => {
    const tok = Number(r.input_tokens || 0) + Number(r.output_tokens || 0);
    return {
      id:r.task, name:r.task, role:(r.models || []).join(', ') || 'auxiliary', tokens:tok,
      cost:Number(r.estimated_cost || 0), share:taskTokens ? tok / taskTokens : 0,
    };
  }).sort((a, b) => b.tokens - a.tokens);

  /* /api/sessions returns the most recent sessions regardless of range; keep only
     those started inside the selected period so the table matches the figures. */
  const cutoff = Date.now() / 1000 - (LIVE_DAYS[rangeId] || 7) * 86400;
  const sessionRows = ((sessionsRes && sessionsRes.sessions) || [])
    .filter(s => !s.started_at || Number(s.started_at) >= cutoff);
  const anySessionCost = sessionRows.some(s => Number(s.estimated_cost_usd || 0) > 0);
  const threadRows = sessionRows.map(s => ({
    id:s.id,
    title:s.title || s.display_name || 'Untitled thread',
    agent:s.profile_name || s.profile || s.source || '',
    model:s.model || '—',
    tokens:Number(s.input_tokens || 0) + Number(s.output_tokens || 0),
    cost:Number(s.estimated_cost_usd || 0) || Number(s.actual_cost_usd || 0),
  })).sort((a, b) => anySessionCost ? b.cost - a.cost : b.tokens - a.tokens).slice(0, 6);

  const tools = (usage.tools || []).map(r => ({
    name:r.tool, sub:'', calls:Number(r.count || 0), share:Number(r.percentage || 0) / 100,
  }));
  const skillRows = ((usage.skills || {}).top_skills) || [];
  const skills = skillRows.map(s => ({
    name:s.skill, runs:Number(s.total_count || 0), last:ago(s.last_used_at),
  }));
  const skillLoads = Number((((usage.skills || {}).summary) || {}).total_skill_loads || 0);

  const periodLabel = 'last ' + LIVE_DAYS[rangeId] + ' days';
  const hasActivity = tokenSeries.some(v => v > 0) || sessionSeries.some(v => v > 0);
  const counts = {};
  labels.forEach((lb, i) => { counts[dayKey(lb.date)] = sessionSeries[i]; });

  return {
    live:true, range:rangeId, profile:'all', meta:range, labels, spend, spendUnit,
    total, todayLabel:dayFull(labels[labels.length - 1].date),
    tokensIn, tokensOut, tokenTotal, threads, apiCalls, cacheRead, hit,
    periodLabel, hasActivity,
    byModel, byAgent:byTask, byAgentTitle:'By task (auxiliary)', threadRows,
    threadsTitle:anySessionCost ? 'Most expensive threads' : 'Largest threads',
    activity:{
      tools, skills, skillLoads,
      totalCalls:tools.reduce((a, t2) => a + t2.calls, 0),
      totalSessions:threads, status:status || null,
    },
    heat:liveHeat(labels, counts),
    deltas:null, cacheNote:null,
  };
}

/* ---------------------------------------------------------------- chart */
function drawSpendChart(wrap, d, width){
  if (wrap.dataset.w && Math.abs(Number(wrap.dataset.w) - width) < 30) return;
  wrap.dataset.w = String(width);
  wrap.querySelectorAll('svg').forEach(n => n.remove());
  const n = d.spend.length;
  const compact = width < 460;
  const padL = compact ? 35 : 46, padR = 8, padT = 10, padB = 26;
  const h = 196;
  const plotW = Math.max(60, width - padL - padR);
  const plotH = h - padT - padB;
  const tokens = d.spendUnit === 'tokens';
  const axisFmt = tokens ? (v => v === 0 ? '0' : H.fmt.k(Math.round(v))) : axisMoney;
  const valFmt = tokens ? (v => H.fmt.n(Math.round(v)) + ' tokens') : money;
  const maxV = niceMax(Math.max.apply(null, d.spend.concat([0.01])), 4);
  const svg = svgEl('svg', {viewBox:'0 0 ' + width + ' ' + h, class:'insights-chart', 'aria-label':tokens ? 'Daily tokens bar chart' : 'Daily spend bar chart'});
  svg.style.width = '100%'; svg.style.height = 'auto'; svg.style.display = 'block';
  svg.setAttribute('role', 'group');

  for (let i = 0; i <= 4; i++){
    const y = padT + plotH - plotH * i / 4;
    const ln = svgEl('line', {x1:padL, x2:width - padR, y1:y, y2:y, 'stroke-width':1});
    ln.style.stroke = i === 0 ? 'var(--control)' : 'var(--rule)';
    svg.appendChild(ln);
    const tx = svgEl('text', {x:padL - 7, y:y + 3.5, 'text-anchor':'end', 'font-size':compact ? 9 : 10});
    tx.style.fill = 'var(--faint)';
    tx.style.fontVariantNumeric = 'tabular-nums';
    tx.textContent = axisFmt(maxV * i / 4);
    svg.appendChild(tx);
  }

  const band = plotW / n;
  const bw = Math.max(2, Math.min(30, band * 0.62));
  const tip = H.h('div.insights-tip');
  tip.hidden = true;
  wrap.appendChild(tip);

  d.spend.forEach((v, i) => {
    const x0 = padL + i * band;
    const bh = maxV ? plotH * (v / maxV) : 0;
    const y = padT + plotH - bh;
    const isToday = i === n - 1;
    const shareOf = tokens ? (l => l.tokenTotal || 1) : (l => l.total || 1);
    const label = d.labels[i].full + ' · ' + valFmt(v) +
      (v > 0 ? ' · ' + pct(v / shareOf(d), 1) + ' of range' : ' · no activity');
    const g = svgEl('g', {class:'insights-bar', tabindex:'0', role:'img', 'aria-label':label});
    g.setAttribute('data-tip', label);
    const hit = svgEl('rect', {x:x0, y:padT, width:Math.max(band, 2), height:plotH, fill:'transparent'});
    const bar = svgEl('rect', {x:x0 + (band - bw) / 2, y:y, width:bw, height:Math.max(bh, v > 0 ? 1 : 0), rx:1.2});
    bar.style.fill = isToday ? 'var(--live)' : 'var(--text)';
    bar.style.fillOpacity = isToday ? '1' : '0.8';
    g.appendChild(hit); g.appendChild(bar);

    const show = () => {
      const wr = wrap.getBoundingClientRect(), br = bar.getBoundingClientRect();
      tip.hidden = false;
      tip.textContent = label;
      const left = Math.max(60, Math.min(wr.width - 60, br.left - wr.left + br.width / 2));
      tip.style.left = left + 'px';
      tip.style.top = Math.max(24, br.top - wr.top - 8) + 'px';
    };
    const hide = () => { tip.hidden = true; };
    g.addEventListener('mouseenter', show);
    g.addEventListener('mouseleave', hide);
    g.addEventListener('focus', show);
    g.addEventListener('blur', hide);
    svg.appendChild(g);
  });

  d.labels.forEach((lb, i) => {
    if (i % d.meta.tick !== 0 && i !== n - 1) return;
    const anchor = i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
    const x = padL + (i + 0.5) * band;
    const tx = svgEl('text', {x:x, y:h - 8, 'text-anchor':anchor, 'font-size':compact ? 9 : 10});
    tx.style.fill = 'var(--muted)';
    tx.textContent = lb.short;
    svg.appendChild(tx);
  });

  wrap.appendChild(svg);
}

/* ---------------------------------------------------------------- log data */
const LOG_MESSAGES = {
  agent: [
    ['info', 'turn start · t-ui · claude-sonnet-5-5', {thread:'t-ui', model:'claude-sonnet-5-5', turn:412}],
    ['info', 'tool terminal · git status --short · 14 ms', {tool:'terminal', duration_ms:14}],
    ['info', 'tool read_file · js/views/insights.js · 3 ms', {tool:'read_file', bytes:48120}],
    ['info', 'skill attached · hermes-maintenance', {skill:'hermes-maintenance'}],
    ['info', 'context compressed 118k → 46k tokens', {before:118420, after:46210}],
    ['info', 'turn end · 24.6k in / 3.1k out · $0.081', {tokens_in:24600, tokens_out:3100, cost_usd:0.081}],
    ['info', 'checkpoint written · t-ui @ 4f2a1c', {thread:'t-ui', checkpoint:'4f2a1c'}],
    ['info', 'approval requested · hermes gateway restart', {approval:'gateway.restart'}],
    ['info', 'memory write · preferred backup window 03:00', {key:'backup.window', value:'03:00'}],
    ['info', 'delegate · 3 files reviewed by scout', {agent:'scout', files:3}],
    ['info', 'tool web_search · "sqlite wal checkpoint" · 812 ms', {tool:'web_search', duration_ms:812}],
    ['info', 'thread branched · t-ui → t-ui-2', {from:'t-ui', to:'t-ui-2'}],
  ],
  gateway: [
    ['info', 'heartbeat ok · 7 sessions · 412 MB', {sessions:7, rss_mb:412, pid:1020}],
    ['info', 'GET /api/health 200 · 3 ms', {status:200, duration_ms:3}],
    ['info', 'ws client connected · dashboard', {client:'dashboard'}],
    ['info', 'telegram poll ok · 2 updates', {platform:'telegram', updates:2}],
    ['info', 'dashboard listening on 127.0.0.1:9119', {port:9119}],
    ['info', 'api listening on 8642 · token auth', {port:8642, auth:'token'}],
    ['info', 'session resumed · t-gw', {thread:'t-gw'}],
    ['info', 'discord reconnect scheduled in 5 s', {platform:'discord', retry_s:5}],
  ],
  cron: [
    ['info', 'routine “Nightly backup” started', {routine:'nightly-backup'}],
    ['info', 'routine “Nightly backup” finished in 96 s · 214 MB', {routine:'nightly-backup', duration_s:96, size_mb:214}],
    ['info', 'routine “Weekly cost report” started', {routine:'weekly-cost-report'}],
    ['info', 'job skipped · ledger profile idle', {profile:'ledger', reason:'idle'}],
    ['info', 'routine “Inbox sweep” finished · 12 threads triaged', {routine:'inbox-sweep', threads:12}],
    ['info', 'next run Fri 03:00 · nightly-backup', {routine:'nightly-backup', next:'Fri 03:00'}],
  ],
  mcp: [
    ['info', 'mcp github: tools/list ok (14 tools)', {server:'github', tools:14}],
    ['info', 'mcp sqlite: query returned 214 rows · 6 ms', {server:'sqlite', rows:214, duration_ms:6}],
    ['info', 'mcp playwright: page.goto news.ycombinator.com · 1.2 s', {server:'playwright', duration_ms:1200}],
    ['info', 'mcp filesystem: read ~/.hermes/config.yaml', {server:'filesystem', path:'~/.hermes/config.yaml'}],
    ['info', 'mcp github: rate limit 4,812 / 5,000', {server:'github', remaining:4812, limit:5000}],
    ['info', 'mcp sqlite: attached state.db read-only', {server:'sqlite', mode:'ro'}],
  ],
};
const LOG_WARNS = {
  agent: [
    ['retry 1/3 · provider 529 · waiting 2 s', {attempt:1, status:529, wait_s:2}],
    ['context at 87% of 1M · compression due', {used:870412, limit:1000000}],
    ['tool terminal exited 2 · falling back to sh', {exit_code:2}],
  ],
  gateway: [
    ['heartbeat late by 2.4 s', {lateness_ms:2400}],
    ['ws client slow consumer · buffered 128 events', {buffered:128}],
    ['platform discord token expires in 2 days', {platform:'discord', days:2}],
  ],
  cron: [
    ['routine “Weekly cost report” retrying after 429', {routine:'weekly-cost-report', status:429}],
    ['job ran 3 min past window', {overrun_s:182}],
  ],
  mcp: [
    ['mcp github: rate limit 4,812 / 5,000', {server:'github', remaining:4812}],
    ['mcp playwright: slow selector wait 8.4 s', {server:'playwright', wait_ms:8400}],
  ],
};
const LOG_ERRORS = [
  {source:'gateway', msg:'heartbeat gap 18 s · 7 sessions held', fields:{code:'EHEARTBEAT', gap_ms:18400, sessions:7, pid:1020}},
  {source:'cron', msg:'routine “Weekly cost report” failed · HTTP 429 after 3 retries', fields:{code:'E429', routine:'weekly-cost-report', status:429, retries:3}},
  {source:'mcp', msg:'mcp browser: connect ECONNREFUSED 127.0.0.1:9222', fields:{code:'EBROWSER', server:'playwright', errno:-111, host:'127.0.0.1', port:9222}},
  {source:'agent', msg:'turn aborted · context window exceeded (1.02M / 1M)', fields:{code:'ECTX', thread:'t-ui', tokens:1020000, limit:1000000}},
];
const LOG_SOURCES = ['agent', 'gateway', 'cron', 'mcp'];

function makeLogs(){
  const rand = rng(hash32('logs|default'));
  const out = [];
  let t = Date.now();
  let seq = 1;
  for (let i = 0; i < 200; i++){
    t -= 3000 + Math.floor(rand() * 24000);
    const source = rand() < 0.48 ? 'agent' : rand() < 0.55 ? 'gateway' : rand() < 0.62 ? 'cron' : 'mcp';
    let level = 'info', msg, fields = {};
    const roll = rand();
    if (roll < 0.045){
      const err = LOG_ERRORS[Math.floor(rand() * LOG_ERRORS.length)];
      level = 'error';
      msg = err.msg;
      fields = Object.assign({}, err.fields);
      // keep the line's source plausible for the error it reports
      const src = err.source;
      out.push(makeLine(seq++, new Date(t), src, level, msg, fields));
      continue;
    } else if (roll < 0.17){
      const pool = LOG_WARNS[source] || LOG_WARNS.agent;
      const pick = pool[Math.floor(rand() * pool.length)];
      level = 'warn'; msg = pick[0]; fields = Object.assign({}, pick[1]);
    } else {
      const pool = LOG_MESSAGES[source] || LOG_MESSAGES.agent;
      const pick = pool[Math.floor(rand() * pool.length)];
      msg = pick[1]; fields = Object.assign({}, pick[2]);
    }
    out.push(makeLine(seq++, new Date(t), source, level, msg, fields));
  }
  return out.reverse();
}
function makeLine(seq, t, source, level, msg, fields){
  return {id:'l' + seq, seq, t, source, level, msg, fields:fields || {}, live:false};
}
function makeLiveLine(seq){
  const rand = Math.random;
  const roll = rand();
  let line;
  if (roll < 0.06){
    const err = LOG_ERRORS[Math.floor(rand() * LOG_ERRORS.length)];
    line = makeLine(seq, new Date(), err.source, 'error', err.msg, Object.assign({}, err.fields));
  } else if (roll < 0.2){
    const src = LOG_SOURCES[Math.floor(rand() * LOG_SOURCES.length)];
    const pool = LOG_WARNS[src];
    const pick = pool[Math.floor(rand() * pool.length)];
    line = makeLine(seq, new Date(), src, 'warn', pick[0], Object.assign({}, pick[1]));
  } else {
    const src = LOG_SOURCES[Math.floor(rand() * LOG_SOURCES.length)];
    const pool = LOG_MESSAGES[src] || LOG_MESSAGES.agent;
    const pick = pool[Math.floor(rand() * pool.length)];
    line = makeLine(seq, new Date(), src, 'info', pick[1], Object.assign({}, pick[2]));
  }
  line.live = true;
  return line;
}

/* ---------------------------------------------------------------- view */
H.views.insights = {
  title: 'Insights',

  render(root, ctx){
    ctx = ctx || {};
    const state = {
      range: '7d',
      profile: 'all',
      tab: RANGE_IDS && ['usage', 'activity', 'logs'].indexOf((ctx.route || [])[0]) >= 0 ? ctx.route[0] : 'usage',
      cap: 200,
      log: LIVE ? [] : makeLogs(),
      level: 'all',
      src: 'all',
      q: '',
      follow: true,
      paused: false,
      expanded: new Set(),
      explained: new Set(),
      /* live log filters (mirrors /api/logs query params) */
      logFile: 'agent',
      logLines: 100,
      logComponent: 'all',
      logError: null,
      logLoading: false,
    };
    let searchTimer = null;
    let seqNo = 0;
    const dataCache = new Map();
    const heatCache = new Map();
    let pending = [];
    let timer = null;
    let seq = 300;
    let listEl = null, countEl = null, statusEl = null, pauseBtn = null, followSw = null;

    const toast = msg => (typeof ctx.toast === 'function' ? ctx.toast(msg) : H.toast(msg));

    function dataFor(){
      const key = state.range + '|' + state.profile;
      if (!dataCache.has(key)) dataCache.set(key, buildData(state.range, state.profile));
      return dataCache.get(key);
    }
    function heatFor(){
      if (!heatCache.has(state.profile)) heatCache.set(state.profile, buildHeat(state.profile));
      return heatCache.get(state.profile);
    }
    function clearTimer(){ if (timer){ clearInterval(timer); timer = null; } }
    function profileLabel(){ const p = PROFILES.find(x => x.id === state.profile); return p ? p.label : 'All agents'; }
    function rangeLabel(){ return state.range; }

    function setTab(id){
      if (state.tab === id) return;
      state.tab = id;
      try { history.replaceState(null, '', '#/insights/' + id); } catch (e){}
      paint();
    }

    /* ---------- header ---------- */
    function head(){
      const ranges = LIVE ? LIVE_RANGES : RANGE_IDS;
      const rangeSeg = H.seg(ranges.map(id => ({id, label:id})), state.range, id => {
        state.range = id;
        paint();
      });
      const subtitle = LIVE
        ? 'Live from the Hermes session store and logs · ' + (LIVE_DAYS[state.range] || 0) + ' days'
        : 'What Hermes spent, ran and logged · ' + rangeLabel() + ' · ' + profileLabel().toLowerCase() + ' · sample data';
      const controls = H.h('div.insights-controls',
        H.h('label.insights-ctl', H.h('span.insights-ctl-l', 'Range'), rangeSeg)
      );
      if (!LIVE){
        const sel = H.h('select.select.insights-select', {'aria-label':'Profile'});
        PROFILES.forEach(p => sel.appendChild(H.h('option', {value:p.id}, p.label)));
        sel.value = state.profile;
        sel.addEventListener('change', () => {
          state.profile = sel.value;
          paint();
        });
        controls.appendChild(H.h('label.insights-ctl', H.h('span.insights-ctl-l', 'Profile'), sel));
      }
      return H.h('div.page-head.insights-head',
        H.h('div', H.h('h1', 'Insights'), H.h('p', subtitle)),
        H.h('div.grow'),
        controls
      );
    }

    function tabsBar(){
      return H.tabs([
        {id:'usage', label:'Usage'},
        {id:'activity', label:'Activity'},
        {id:'logs', label:'Logs'},
      ], state.tab, setTab);
    }

    /* ---------- usage ---------- */
    function fig(label, value, cmp){
      const f = H.h('div.insights-fig',
        H.h('div.insights-fig-l', label),
        H.h('div.insights-fig-v.num', value)
      );
      if (cmp) f.appendChild(H.h('div.insights-cmp' + (cmp.tone ? '.is-' + cmp.tone : ''), cmp.text));
      return f;
    }
    function figures(d){
      if (d.live){
        return H.h('div.insights-figs',
          fig('Spend (USD)', money(d.total), {text:'estimated · ' + d.periodLabel}),
          fig('Tokens in / out', H.fmt.k(d.tokensIn) + ' / ' + H.fmt.k(d.tokensOut), {text:H.fmt.n(d.tokenTotal) + ' total'}),
          fig('Sessions', H.fmt.n(d.threads), {text:H.fmt.n(d.apiCalls) + ' API calls'}),
          fig('Cache hit rate', pct(d.hit, 1), {text:H.fmt.k(d.cacheRead) + ' cache-read tokens'})
        );
      }
      const dl = d.deltas;
      const spendCmp = {
        tone: dl.spend <= 0 ? 'pos' : 'neg',
        text: pct(Math.abs(dl.spend)) + (dl.spend <= 0 ? ' less' : ' more') + ' than the ' + d.meta.prev,
      };
      const tokCmp = {
        tone: dl.tokens <= 0 ? 'pos' : 'neg',
        text: pct(Math.abs(dl.tokens)) + (dl.tokens <= 0 ? ' fewer' : ' more') + ' tokens than the ' + d.meta.prev,
      };
      const thrCmp = {
        tone: dl.threads >= 0 ? 'pos' : 'neu',
        text: pct(Math.abs(dl.threads)) + (dl.threads >= 0 ? ' more threads' : ' fewer threads') + ' than the ' + d.meta.prev,
      };
      const cacheCmp = {
        tone: dl.cache >= 0 ? 'pos' : 'neg',
        text: Math.abs(dl.cache * 100).toFixed(1) + ' points ' + (dl.cache >= 0 ? 'higher' : 'lower') + ' than the ' + d.meta.prev,
      };
      return H.h('div.insights-figs',
        fig('Spend (USD)', money(d.total), spendCmp),
        fig('Tokens in / out', H.fmt.k(d.tokensIn) + ' / ' + H.fmt.k(d.tokensOut), tokCmp),
        fig('Threads', H.fmt.n(d.threads), thrCmp),
        fig('Cache hit rate', pct(d.hit, 1), cacheCmp)
      );
    }

    function budgetRow(d){
      const card = H.h('div.card.insights-budget');
      const top = H.h('div.insights-budget-top');
      const headWrap = H.h('div.insights-budget-head',
        H.h('span.insights-budget-title', 'Monthly cap · ' + d.monthLabel)
      );
      const pills = H.h('span.insights-budget-pills');
      const bar = H.h('div.insights-progress', {
        role:'progressbar', 'aria-valuemin':'0', 'aria-valuemax':'100', 'aria-valuenow':'0',
        'aria-label':'Monthly spend against cap',
      });
      const fill = H.h('div.insights-progress-fill');
      bar.appendChild(fill);
      const meta = H.h('div.insights-budget-meta.num');
      const input = H.h('input.input.insights-cap-input', {
        type:'number', min:'10', step:'5', value:String(state.cap),
        'aria-label':'Monthly cap in US dollars', inputmode:'decimal',
      });
      const capWrap = H.h('label.insights-cap',
        H.h('span.insights-cap-l', 'Cap $'),
        input
      );
      top.append(headWrap, pills, H.h('span.grow'));
      const bottom = H.h('div.insights-budget-bottom', meta, H.h('span.grow'), capWrap);
      card.append(top, bar, bottom);

      function syncBudget(){
        const raw = Number(input.value);
        const cap = Math.max(1, Math.round(isFinite(raw) && raw > 0 ? raw : state.cap));
        state.cap = cap;
        const p = d.monthSpend / cap;
        fill.style.width = Math.min(100, p * 100).toFixed(1) + '%';
        fill.classList.toggle('is-over', p >= 1);
        bar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
        bar.setAttribute('aria-label', 'Monthly spend ' + money(d.monthSpend) + ' of cap ' + money(cap));
        pills.innerHTML = '';
        if (p >= 0.8){
          pills.appendChild(H.pill(p >= 1 ? 'Over cap' : 'Near cap · ' + Math.round(p * 100) + '%', 'warn'));
        }
        meta.textContent = money(d.monthSpend) + ' of ' + money(cap) + ' · ' + Math.round(p * 100) + '% used · ' +
          (p >= 1 ? money(d.monthSpend - cap) + ' over' : money(cap - d.monthSpend) + ' left');
      }
      input.addEventListener('input', syncBudget);
      input.addEventListener('change', () => {
        syncBudget();
        input.value = String(state.cap);
        toast('Monthly cap set to ' + money(state.cap));
      });
      input.addEventListener('blur', () => { input.value = String(state.cap); });
      syncBudget();
      return card;
    }

    function hlistCard(title, rows, max, kind){
      const card = H.h('div.card.insights-listcard');
      card.appendChild(H.h('div.card-h', title, H.h('span.insights-card-h-r', 'Tokens · cost · share')));
      if (!rows.length){
        card.appendChild(H.h('div.empty', 'None in this period.'));
        return card;
      }
      const list = H.h('div.insights-hlist');
      rows.forEach((r, i) => {
        const nameWrap = H.h('div.insights-hname');
        if (kind === 'agent'){
          const a = H.agent(r.id);
          if (a) nameWrap.appendChild(H.avatar(a, 18));
        }
        nameWrap.appendChild(H.h('span.t.ellip', r.name || r.id));
        nameWrap.appendChild(H.h('span.s', kind === 'agent' ? (r.role || '').split(' · ')[0] : r.provider));
        const row = H.h('div.insights-hrow',
          H.h('div.insights-hrow-top',
            nameWrap,
            H.h('div.insights-hmeta',
              H.h('span.num', H.fmt.k(r.tokens)),
              H.h('span.num.insights-cost', money(r.cost)),
              H.h('span.num.insights-share', Math.round(r.share * 100) + '%')
            )
          ),
          H.h('div.insights-hbar',
            H.h('div.insights-hfill' + (i === 0 ? '.is-top' : ''), {style:{width:Math.max(2, (r.tokens / max) * 100).toFixed(1) + '%'}})
          )
        );
        row.setAttribute('title', (r.name || r.id) + ' · ' + H.fmt.n(r.tokens) + ' tokens · ' + money(r.cost) + ' · ' + Math.round(r.share * 100) + '%');
        list.appendChild(row);
      });
      card.appendChild(list);
      return card;
    }

    function chartCard(d, wrap){
      const peakIdx = d.spend.indexOf(Math.max.apply(null, d.spend));
      const peakLabel = d.labels[peakIdx] ? d.labels[peakIdx].full : d.todayLabel;
      const peak = d.spend[peakIdx] || 0;
      const peakText = d.spendUnit === 'tokens' ? H.fmt.n(Math.round(peak)) + ' tokens' : money(peak);
      const partialNote = d.range === '24h' ? 'current hour is partial' : 'today is partial';
      const caption = 'Peak ' + peakText + ' on ' + peakLabel + ' · ' + partialNote + ' · zero baseline';
      return H.h('div.card.insights-chart-card', wrap, H.h('div.insights-chart-cap', caption));
    }

    function threadTable(d){
      const card = H.h('div.card.insights-threadcard');
      const table = H.h('table.tbl.insights-threads');
      const thead = H.h('thead');
      thead.appendChild(H.h('tr',
        H.h('th', 'Thread'), H.h('th', d.live ? 'Profile / source' : 'Agent'), H.h('th', 'Model'),
        H.h('th.r', 'Tokens'), H.h('th.r', 'Cost')
      ));
      table.appendChild(thead);
      const tbody = H.h('tbody');
      if (!d.threadRows.length){
        card.appendChild(H.h('div.empty', 'No sessions in this period.'));
        return card;
      }
      d.threadRows.forEach(t => {
        const agent = H.agent(t.agent);
        const tr = H.h('tr', {tabindex:'0', 'aria-label':'Open thread ' + t.title});
        tr.appendChild(H.h('td',
          H.h('div.insights-th-title.ellip', t.title),
          H.h('div.insights-th-id', '#' + t.id)
        ));
        const agentCell = H.h('td', H.h('span.insights-th-agent', agent ? H.avatar(agent, 18) : null, agent ? agent.name : t.agent));
        tr.appendChild(agentCell);
        tr.appendChild(H.h('td', H.h('span.insights-th-model', t.model)));
        tr.appendChild(H.h('td.r.num', H.fmt.n(t.tokens)));
        tr.appendChild(H.h('td.r.num', money(t.cost)));
        const open = () => { if (typeof ctx.openThread === 'function') ctx.openThread(t.id); else toast('Opening ' + t.id); };
        tr.addEventListener('click', open);
        tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      card.appendChild(H.h('div.scroll-x', table));
      return card;
    }

    function cacheCard(d){
      if (d.live){
        /* /api/analytics/usage reports cache reads only; cache writes are not exposed. */
        const p = d.hit;
        return H.h('div.card.insights-cache',
          H.h('div.card-h', 'Cache'),
          H.h('div.card-b',
            H.h('div.insights-cache-nums',
              H.h('span', H.h('strong.num', H.fmt.k(d.cacheRead)), ' read'),
              H.h('span.muted', H.h('span.num', H.fmt.k(d.tokensIn)), ' prompt')
            ),
            H.h('div.insights-cache-bar', {
              role:'img',
              'aria-label':'Prompt cache read ' + H.fmt.n(d.cacheRead) + ' of ' + H.fmt.n(d.cacheRead + d.tokensIn) + ' prompt tokens',
            },
              H.h('div.insights-cache-read', {style:{width:(p * 100).toFixed(1) + '%'}}),
              H.h('div.insights-cache-write', {style:{width:((1 - p) * 100).toFixed(1) + '%'}})
            ),
            H.h('div.insights-cache-legend',
              H.h('span', H.h('i.insights-sw-read'), 'Read · ' + pct(p, 0) + ' of prompt tokens'),
              H.h('span', H.h('i.insights-sw-write'), 'Uncached')
            )
          )
        );
      }
      const readPct = d.cacheRead + d.cacheWrite > 0 ? d.cacheRead / (d.cacheRead + d.cacheWrite) : 0;
      const bar = H.h('div.insights-cache-bar', {
        role:'img',
        'aria-label':'Prompt cache read ' + H.fmt.n(d.cacheRead) + ' tokens, write ' + H.fmt.n(d.cacheWrite) + ' tokens',
      },
        H.h('div.insights-cache-read', {style:{width:(readPct * 100).toFixed(1) + '%'}}),
        H.h('div.insights-cache-write', {style:{width:((1 - readPct) * 100).toFixed(1) + '%'}})
      );
      return H.h('div.card.insights-cache',
        H.h('div.card-h', 'Cache'),
        H.h('div.card-b',
          H.h('div.insights-cache-nums',
            H.h('span', H.h('strong.num', H.fmt.k(d.cacheRead)), ' read'),
            H.h('span.muted', H.h('span.num', H.fmt.k(d.cacheWrite)), ' written')
          ),
          bar,
          H.h('div.insights-cache-legend',
            H.h('span', H.h('i.insights-sw-read'), 'Read · ' + pct(readPct, 0) + ' of prompt tokens'),
            H.h('span', H.h('i.insights-sw-write'), 'Write')
          ),
          H.h('p.insights-cache-note', d.cacheNote)
        )
      );
    }

    function usageView(body, d){
      body.appendChild(figures(d));
      if (!d.live) body.appendChild(budgetRow(d));

      const chartTitle = d.spendUnit === 'tokens' ? 'Daily tokens' : 'Daily spend';
      if (d.live && !d.hasActivity){
        body.appendChild(section(chartTitle, H.h('div.card.empty',
          H.h('div', 'No activity in this period.'),
          H.h('div.muted', 'Nothing was recorded between ' + dayFull(d.labels[0].date) + ' and ' + d.todayLabel + '.')
        )));
        body.appendChild(section('Where the spend went', H.h('div.card.empty', 'No models were used in this period.')));
        body.appendChild(section(d.threadsTitle, H.h('div.card.empty', 'No sessions in this period.')));
        return;
      }

      const wrap = H.h('div.insights-chart-wrap');
      pending.push(() => {
        const w = Math.round(wrap.clientWidth || 0);
        if (w > 240) drawSpendChart(wrap, d, w);
        else requestAnimationFrame(() => {
          if (!wrap.isConnected) return;
          const w2 = Math.round(wrap.clientWidth || 0);
          if (w2 > 240) drawSpendChart(wrap, d, w2);
        });
      });
      const chartNote = (d.range === '24h' ? 'Last 24 hours' : 'Last ' + d.meta.buckets + ' days') + ' to ' + d.todayLabel +
        ' · ' + (d.spendUnit === 'tokens' ? 'tokens in + out' : 'USD');
      body.appendChild(section(chartTitle, chartCard(d, wrap), chartNote));

      const modelMax = Math.max.apply(null, d.byModel.map(m => m.tokens).concat([1]));
      const agentMax = Math.max.apply(null, d.byAgent.map(a => a.tokens).concat([1]));
      const lists = H.h('div.grid.cols-2.insights-lists',
        hlistCard('By model', d.byModel.map(m => ({id:m.id, name:m.id, provider:m.provider, tokens:m.tokens, cost:m.cost, share:m.share})), modelMax, 'model'),
        hlistCard(d.byAgentTitle || 'By agent', d.byAgent.map(a => ({id:a.id, name:a.name, role:a.role, tokens:a.tokens, cost:a.cost, share:a.share})), agentMax, 'agent')
      );
      body.appendChild(section('Where the spend went', lists, 'Share of tokens in this range'));

      body.appendChild(section(d.threadsTitle || 'Most expensive threads',
        H.h('div.insights-bottom', threadTable(d), cacheCard(d)),
        'Click a row to open the thread'
      ));
    }

    /* ---------- activity ---------- */
    function activityViewLive(body, d){
      const a = d.activity;
      const st = a.status || {};
      const toolsMax = Math.max.apply(null, a.tools.map(t => t.calls).concat([1]));
      const skillMax = Math.max.apply(null, a.skills.map(s => s.runs).concat([1]));

      body.appendChild(H.h('div.insights-figs',
        fig('Tool calls', H.fmt.n(a.totalCalls), {text:a.tools.length + ' distinct tools · ' + d.periodLabel}),
        fig('Sessions', H.fmt.n(a.totalSessions), {text:d.periodLabel}),
        fig('Active now', H.fmt.n(Number(st.active_sessions || 0)), {
          tone:st.gateway_state === 'running' ? 'pos' : 'neu',
          text:'gateway ' + (st.gateway_state || 'unknown'),
        }),
        fig('Skill loads', H.fmt.n(a.skillLoads), {text:a.skills.length + ' distinct skills'})
      ));

      const toolsCard = H.h('div.card.insights-toolcard');
      toolsCard.appendChild(H.h('div.card-h', 'By calls', H.h('span.insights-card-h-r', 'Calls · share')));
      if (!a.tools.length){
        toolsCard.appendChild(H.h('div.empty', 'No tool calls in this period.'));
      } else {
        const toolList = H.h('div.insights-tools');
        a.tools.forEach(t => {
          toolList.appendChild(H.h('div.insights-toolrow',
            H.h('div.insights-tool-name', H.h('span.t.ellip', t.name)),
            H.h('div.insights-tool-bar', H.h('div.insights-tool-fill', {style:{width:Math.max(1, (t.calls / toolsMax) * 100).toFixed(1) + '%'}})),
            H.h('div.insights-tool-calls.num', H.fmt.n(t.calls)),
            H.h('div.insights-tool-ratio', H.h('span.num', pct(t.share, 1)))
          ));
        });
        toolsCard.appendChild(toolList);
      }
      body.appendChild(section('Tool calls', toolsCard, a.tools.length + ' tools · ' + d.periodLabel));

      const heat = d.heat;
      const heatCard = H.h('div.card.insights-heatcard');
      heatCard.appendChild(H.h('div.card-h', 'Sessions per day',
        H.h('span.insights-card-h-r', heat ? H.fmt.n(heat.total) + ' sessions' : '')));
      if (!heat || !heat.total){
        heatCard.appendChild(H.h('div.empty', 'No activity in this period.'));
      } else {
        const days = H.h('div.insights-heat-days');
        ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(txt => days.appendChild(H.h('span', txt || '')));
        const grid = H.h('div.insights-heat', {role:'img', 'aria-label':'Sessions per day, ' + heat.total + ' sessions'});
        heat.cells.forEach(c => {
          const cell = H.h('span.insights-heat-cell', {'data-l':String(c.level)});
          if (c.future) cell.classList.add('is-future');
          if (c.today) cell.classList.add('is-today');
          const label = c.future ? dayFull(c.date) + ' · outside this period' : dayFull(c.date) + ' · ' + c.n + (c.n === 1 ? ' session' : ' sessions');
          cell.setAttribute('title', label);
          cell.setAttribute('aria-label', label);
          grid.appendChild(cell);
        });
        const legend = H.h('div.insights-heat-legend',
          H.h('span.muted', 'Less'),
          ...[0, 1, 2, 3, 4].map(l => H.h('span.insights-heat-cell', {'data-l':String(l)})),
          H.h('span.muted', 'More')
        );
        heatCard.appendChild(H.h('div.card-b.insights-heat-body',
          H.h('div.insights-heat-wrap', days, grid,
            H.h('div.insights-heat-side',
              H.h('div', H.h('span.insights-heat-v.num', H.fmt.n(heat.total)), H.h('span.muted', ' sessions')),
              H.h('div', H.h('span.insights-heat-v.num', heat.avg.toFixed(1)), H.h('span.muted', ' per day')),
              heat.busiest ? H.h('div.insights-heat-busiest', H.h('span.muted', 'Busiest '), dayFull(heat.busiest.date),
                H.h('span.muted', ' · ' + heat.busiest.n)) : null
            )
          ),
          H.h('div.insights-heat-foot',
            H.h('span.muted', dateShort(heat.start) + ' – ' + dateShort(heat.end) + ' · today ringed in blue'),
            legend
          )
        ));
      }

      const skillsCard = H.h('div.card.insights-skillcard');
      skillsCard.appendChild(H.h('div.card-h', 'Skills used most', H.h('span.insights-card-h-r', 'Loads · last used')));
      if (!a.skills.length){
        skillsCard.appendChild(H.h('div.empty', 'No skill loads in this period.'));
      } else {
        const sList = H.h('div.insights-skills');
        a.skills.forEach(s => {
          sList.appendChild(H.h('div.insights-skillrow',
            H.h('div.insights-skill-main',
              H.h('div.insights-skill-top',
                H.h('span.t.ellip', s.name),
                H.h('span.s.num', H.fmt.n(s.runs) + (s.runs === 1 ? ' load' : ' loads'))
              ),
              H.h('div.insights-hbar', H.h('div.insights-hfill', {style:{width:Math.max(2, (s.runs / skillMax) * 100).toFixed(1) + '%'}}))
            ),
            H.h('span.insights-skill-last', s.last)
          ));
        });
        skillsCard.appendChild(sList);
      }
      body.appendChild(section('Cadence', H.h('div.insights-act-grid', heatCard, skillsCard), 'Activity over the ' + d.periodLabel));
    }

    function activityView(body, d){
      if (d.live) return activityViewLive(body, d);
      const a = d.activity;
      const toolsMax = Math.max.apply(null, a.tools.map(t => t.calls).concat([1]));
      const skillMax = Math.max.apply(null, a.skills.map(s => s.runs).concat([1]));

      body.appendChild(H.h('div.insights-figs',
        fig('Tool calls', H.fmt.n(a.totalCalls), {tone:a.dCalls >= 0 ? 'pos' : 'neu', text:pct(Math.abs(a.dCalls)) + (a.dCalls >= 0 ? ' more' : ' fewer') + ' calls than the ' + d.meta.prev}),
        fig('Approvals', H.fmt.n(a.granted) + ' / ' + H.fmt.n(a.denied), {tone:'neu', text:'granted / denied in the ' + d.meta.prev.replace('previous ', 'last ')}),
        fig('Average turn', a.avgTurn + ' s', {tone:a.dTurn <= 0 ? 'pos' : 'neg', text:pct(Math.abs(a.dTurn)) + (a.dTurn <= 0 ? ' faster' : ' slower') + ' than the ' + d.meta.prev}),
        fig('Failed calls', H.fmt.n(a.failedCalls), {tone:a.failedCalls > 0 ? 'neg' : 'pos', text:pct(a.failedCalls / Math.max(1, a.totalCalls), 1) + ' of all calls'})
      ));

      const toolsCard = H.h('div.card.insights-toolcard');
      toolsCard.appendChild(H.h('div.card-h', 'By calls', H.h('span.insights-card-h-r', 'Calls · success ratio')));
      const toolList = H.h('div.insights-tools');
      a.tools.forEach(t => {
        const okPct = t.ok * 100;
        const row = H.h('div.insights-toolrow',
          H.h('div.insights-tool-name', H.h('span.t.ellip', t.name), H.h('span.s', t.sub)),
          H.h('div.insights-tool-bar', H.h('div.insights-tool-fill', {style:{width:Math.max(1, (t.calls / toolsMax) * 100).toFixed(1) + '%'}})),
          H.h('div.insights-tool-calls.num', H.fmt.n(t.calls)),
          H.h('div.insights-tool-ratio',
            H.h('span.insights-ratio', {
              role:'img',
              'aria-label':t.name + ' success ' + pct(t.ok, 1) + ', ' + t.failed + ' failed',
              title:pct(t.ok, 1) + ' ok',
            },
              H.h('i.ok', {style:{width:okPct.toFixed(1) + '%'}}),
              H.h('i.bad', {style:{width:(100 - okPct).toFixed(1) + '%'}})
            ),
            H.h('span.num' + (t.ok < 0.97 ? '.is-low' : ''), pct(t.ok, 1))
          )
        );
        toolList.appendChild(row);
      });
      toolsCard.appendChild(toolList);
      body.appendChild(section('Tool calls', toolsCard, 'Top 10 of 24 tools · ' + rangeLabel() + ' · ' + profileLabel().toLowerCase()));

      const heat = heatFor();
      const heatCard = H.h('div.card.insights-heatcard');
      heatCard.appendChild(H.h('div.card-h', 'Threads per day', H.h('span.insights-card-h-r', '12 weeks · ' + H.fmt.n(heat.total) + ' threads')));
      const days = H.h('div.insights-heat-days');
      ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(txt => days.appendChild(H.h('span', txt || '')));
      const grid = H.h('div.insights-heat', {role:'img', 'aria-label':'Threads per day for the last 12 weeks, ' + heat.total + ' threads'});
      heat.cells.forEach(c => {
        const cell = H.h('span.insights-heat-cell', {'data-l':String(c.level)});
        if (c.future) cell.classList.add('is-future');
        if (c.today) cell.classList.add('is-today');
        const label = c.future ? dayFull(c.date) + ' · upcoming' : dayFull(c.date) + ' · ' + c.n + (c.n === 1 ? ' thread' : ' threads');
        cell.setAttribute('title', label);
        cell.setAttribute('aria-label', label);
        grid.appendChild(cell);
      });
      const legend = H.h('div.insights-heat-legend',
        H.h('span.muted', 'Less'),
        ...[0, 1, 2, 3, 4].map(l => H.h('span.insights-heat-cell', {'data-l':String(l)})),
        H.h('span.muted', 'More')
      );
      heatCard.appendChild(H.h('div.card-b.insights-heat-body',
        H.h('div.insights-heat-wrap', days, grid,
          H.h('div.insights-heat-side',
            H.h('div', H.h('span.insights-heat-v.num', H.fmt.n(heat.total)), H.h('span.muted', ' threads')),
            H.h('div', H.h('span.insights-heat-v.num', heat.avg.toFixed(1)), H.h('span.muted', ' per day')),
            H.h('div.insights-heat-busiest', H.h('span.muted', 'Busiest '), dayFull(heat.busiest.date),
              H.h('span.muted', ' · ' + heat.busiest.n))
          )
        ),
        H.h('div.insights-heat-foot',
          H.h('span.muted', dateShort(heat.start) + ' – ' + dateShort(heat.end) + ' · today ringed in blue'),
          legend
        )
      ));

      const skillsCard = H.h('div.card.insights-skillcard');
      skillsCard.appendChild(H.h('div.card-h', 'Skills used most', H.h('span.insights-card-h-r', 'Runs · last used')));
      const sList = H.h('div.insights-skills');
      a.skills.forEach(s => {
        sList.appendChild(H.h('div.insights-skillrow',
          H.h('div.insights-skill-main',
            H.h('div.insights-skill-top',
              H.h('span.t.ellip', s.name),
              H.h('span.s.num', H.fmt.n(s.runs) + ' runs')
            ),
            H.h('div.insights-hbar', H.h('div.insights-hfill', {style:{width:Math.max(2, (s.runs / skillMax) * 100).toFixed(1) + '%'}}))
          ),
          H.h('span.insights-skill-last', s.last)
        ));
      });
      skillsCard.appendChild(sList);
      body.appendChild(section('Cadence', H.h('div.insights-act-grid', heatCard, skillsCard), 'Activity over the last 12 weeks'));
    }

    /* ---------- logs ---------- */
    function lineMatches(l){
      if (state.level !== 'all' && l.level !== state.level) return false;
      if (state.src === 'errors'){ if (l.level !== 'error') return false; }
      else if (state.src !== 'all' && l.source !== state.src) return false;
      if (state.q){
        const hay = (l.msg + ' ' + l.source + ' ' + l.level + ' ' + JSON.stringify(l.fields)).toLowerCase();
        if (hay.indexOf(state.q.toLowerCase()) < 0) return false;
      }
      return true;
    }
    /* Live lines are already filtered server-side by file/level/component/search;
       re-filtering here would silently disagree with the query that produced them. */
    function filteredLogs(){ return LIVE ? state.log.slice() : state.log.filter(lineMatches); }
    function highlight(text, q){
      const frag = document.createDocumentFragment();
      if (!q){ frag.appendChild(document.createTextNode(text)); return frag; }
      const lower = text.toLowerCase(), ql = q.toLowerCase();
      let i = 0;
      for (;;){
        const j = lower.indexOf(ql, i);
        if (j < 0){ frag.appendChild(document.createTextNode(text.slice(i))); break; }
        if (j > i) frag.appendChild(document.createTextNode(text.slice(i, j)));
        const m = document.createElement('mark');
        m.textContent = text.slice(j, j + q.length);
        frag.appendChild(m);
        i = j + q.length;
      }
      return frag;
    }
    function fieldsFor(l){
      const base = {
        at:l.t ? l.t.toISOString() : null,
        level:l.level,
        source:l.source,
        seq:l.seq,
      };
      if (l.raw) base.raw = l.raw;
      return Object.assign(base, l.fields);
    }
    function detailNode(l){
      return H.h('div.insights-log-detail',
        H.h('pre.insights-log-json', JSON.stringify(fieldsFor(l), null, 2))
      );
    }
    function explainNode(l){
      const info = EXPLAIN[l.fields && l.fields.code] || FALLBACK_EXPLAIN;
      return H.h('div.insights-explain-card',
        H.h('div.insights-explain-h', H.ic('warn', 'sm'), 'Explain this error'),
        H.h('div.insights-explain-row', H.h('span.insights-explain-k', 'Probable cause'), H.h('span', info.cause)),
        H.h('div.insights-explain-row', H.h('span.insights-explain-k', 'Suggested fix'), H.h('span', info.fix)),
        H.h('div.insights-explain-actions',
          H.h('button.btn.sm.primary', {
            onclick:() => { if (typeof ctx.go === 'function') ctx.go('#/thread/t-gw'); else toast('Opening t-gw'); },
          }, 'Ask Hermes to fix'),
          H.h('button.btn.sm.ghost', {
            onclick:e => {
              const item = e.target.closest('.insights-log-item');
              if (item){
                const card = item.querySelector('.insights-explain-card');
                if (card) card.remove();
              }
              state.explained.delete(l.id);
            },
          }, 'Dismiss')
        )
      );
    }
    function logRow(l){
      const exp = state.expanded.has(l.id);
      const line = H.h('div.insights-log-line' + (l.level === 'error' ? '.is-error' : ''), {
        tabindex:'0', 'aria-expanded':String(exp),
      });
      line.appendChild(H.h('span.insights-log-ts', l.t ? timeFull(l.t) : '—'));
      line.appendChild(H.h('span.insights-lvl.' + l.level, l.level));
      line.appendChild(H.h('span.insights-log-src', {title:l.source}, l.source));
      const msg = H.h('span.insights-log-msg');
      msg.appendChild(highlight(l.msg, state.q));
      /* The explain card keys off sample error codes; live lines carry no such
         code, so it stays out of live mode rather than inventing a cause. */
      if (!LIVE && l.level === 'error'){
        msg.appendChild(H.h('button.btn.ghost.sm.insights-explain-btn', {
          onclick:e => { e.stopPropagation(); toggleExplain(l, item); },
        }, 'Explain this error'));
      }
      line.appendChild(msg);

      const item = H.h('div.insights-log-item');
      const toggle = () => {
        if (state.expanded.has(l.id)){
          state.expanded.delete(l.id);
          line.setAttribute('aria-expanded', 'false');
          const d = item.querySelector('.insights-log-detail');
          if (d) d.remove();
        } else {
          state.expanded.add(l.id);
          line.setAttribute('aria-expanded', 'true');
          item.insertBefore(detailNode(l), line.nextSibling);
        }
      };
      line.addEventListener('click', toggle);
      line.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); toggle(); }
      });

      item.appendChild(line);
      if (exp) item.appendChild(detailNode(l));
      if (state.explained.has(l.id)) item.appendChild(explainNode(l));
      return item;
    }
    function toggleExplain(l, item){
      const existing = item.querySelector('.insights-explain-card');
      if (existing){ existing.remove(); state.explained.delete(l.id); return; }
      state.explained.add(l.id);
      item.appendChild(explainNode(l));
    }
    function updateCount(){
      if (!countEl) return;
      const shown = filteredLogs().length;
      countEl.textContent = LIVE
        ? shown + (shown === 1 ? ' line' : ' lines') + ' · ' + state.logFile + '.log'
        : 'Showing ' + shown + ' of ' + state.log.length + ' lines';
    }
    function syncStatus(){
      if (!statusEl) return;
      statusEl.innerHTML = '';
      if (state.logError) statusEl.append(H.h('span.dot'), 'Failed · ' + state.logError.message);
      else if (state.logLoading) statusEl.append('Loading…');
      else if (state.paused) statusEl.append(H.h('span.dot'), 'Paused');
      else if (state.follow) statusEl.append(H.h('span.dot.live'), LIVE ? 'Auto-refresh · every 5 s' : 'Following · one line every 1.2 s');
      else statusEl.append(H.h('span.dot'), 'Not following');
    }
    function renderLogList(){
      if (!listEl) return;
      const near = isNearBottom();
      listEl.innerHTML = '';
      if (LIVE && state.logError){
        listEl.appendChild(H.h('div.empty',
          H.h('div', "Couldn't load logs: " + state.logError.message),
          H.h('button.btn.sm', {onclick:() => loadLogsFromApi()}, 'Retry')));
        updateCount();
        return;
      }
      const rows = filteredLogs();
      rows.forEach(l => listEl.appendChild(logRow(l)));
      if (!rows.length){
        listEl.appendChild(H.h('div.empty', H.h('div', state.logLoading ? 'Loading…' : 'No log lines match these filters.'),
          H.h('button.btn.sm', {onclick:() => {
            state.q = ''; state.level = 'all'; state.src = 'all';
            const search = listEl.closest('.insights-logs') && listEl.closest('.insights-logs').querySelector('.insights-log-search');
            if (search) search.value = '';
            const seg = listEl.closest('.insights-logs') && listEl.closest('.insights-logs').querySelectorAll('.insights-log-toolbar .seg button');
            if (seg && seg.length) seg.forEach(b => b.setAttribute('aria-pressed', String(b.textContent === 'All')));
            if (LIVE) loadLogsFromApi(); else paint();
          }}, 'Reset filters')));
      }
      updateCount();
      if (LIVE && near) scrollBottom();
    }

    /* Parse one raw log line: "YYYY-MM-DD HH:MM:SS,mmm LEVEL logger: message".
       The message is rendered as plain text only — log lines can contain secrets
       or personal content, so they are never interpolated as HTML. */
    const LOG_LINE_RE = /^(\d{4})-(\d{2})-(\d{2})[ T]([0-9:,.]+)\s+(DEBUG|INFO|WARNING|WARN|ERROR|CRITICAL|FATAL)\s+([\s\S]*)$/;
    const LOG_LOGGER_RE = /^(?:(\[[^\]]*\])\s*)?([A-Za-z_][\w.\-]*):\s?([\s\S]*)$/;
    function levelOf(token){
      if (/^(ERROR|CRITICAL|FATAL)$/.test(token)) return 'error';
      if (/^WARN/.test(token)) return 'warn';
      if (token === 'DEBUG') return 'debug';
      return 'info';
    }
    function parseLogLine(raw, i){
      const line = String(raw == null ? '' : raw);
      const m = LOG_LINE_RE.exec(line);
      if (!m){
        const up = line.toUpperCase();
        const level = /\b(ERROR|CRITICAL|FATAL)\b/.test(up) || up.indexOf('TRACEBACK') === 0 ? 'error'
          : /\b(WARN(ING)?)\b/.test(up) ? 'warn' : 'info';
        return {id:'r' + i, seq:++seqNo, t:null, source:'—', level, msg:line, fields:{}, raw:line, live:true};
      }
      const clock = m[4].replace(',', '.').split(':');
      const sec = Number(clock[2] || 0);
      const t = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]),
        Number(clock[0] || 0), Number(clock[1] || 0), Math.floor(sec), Math.round((sec % 1) * 1000));
      const rest = m[6] || '';
      const lm = LOG_LOGGER_RE.exec(rest);
      const source = lm ? lm[2] : '—';
      const msg = lm ? ((lm[1] ? lm[1] + ' ' : '') + lm[3]) : rest;
      return {id:'r' + i, seq:++seqNo, t, source, level:levelOf(m[5]), msg, fields:{}, raw:line, live:true};
    }
    async function loadLogsFromApi(){
      if (!LIVE || state.tab !== 'logs') return;
      const q = new URLSearchParams();
      q.set('file', state.logFile);
      q.set('lines', String(state.logLines));
      if (LOG_LEVEL_API[state.level]) q.set('level', LOG_LEVEL_API[state.level]);
      if (state.logComponent !== 'all') q.set('component', state.logComponent);
      if (state.q) q.set('search', state.q);
      state.logLoading = true;
      state.logError = null;
      syncStatus();
      if (listEl && !state.log.length) renderLogList();
      try {
        const res = await H.api.get('/api/logs?' + q.toString());
        if (state.tab !== 'logs') return;
        /* Traceback continuations carry no timestamp of their own; they belong to
           the record above them, so inherit its level and source. */
        const parsed = [];
        (res && res.lines ? res.lines : []).forEach((raw, i) => {
          const l = parseLogLine(raw, i);
          const prev = parsed[parsed.length - 1];
          if (!l.t && prev){ l.level = prev.level; l.source = prev.source; }
          parsed.push(l);
        });
        state.log = parsed;
      } catch (e){
        state.logError = e;
      } finally {
        state.logLoading = false;
        if (state.tab === 'logs'){
          try { renderLogList(); } catch (err) { state.logError = err; }
          syncStatus();
        }
      }
    }
    function isNearBottom(){
      if (!listEl) return true;
      return listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 90;
    }
    function scrollBottom(){
      if (!listEl) return;
      requestAnimationFrame(() => { if (listEl.isConnected) listEl.scrollTop = listEl.scrollHeight; });
    }
    function startFollow(){
      clearTimer();
      if (!state.follow || state.paused || state.tab !== 'logs') return;
      if (LIVE){
        timer = setInterval(() => {
          if (!root.isConnected || state.tab !== 'logs' || !state.follow || state.paused){ clearTimer(); return; }
          if (state.logLoading) return;
          loadLogsFromApi();
        }, 5000);
        return;
      }
      timer = setInterval(() => {
        if (!root.isConnected || state.tab !== 'logs' || !state.follow || state.paused){ clearTimer(); return; }
        const near = isNearBottom();
        const l = makeLiveLine(seq++);
        state.log.push(l);
        if (state.log.length > 320) state.log.shift();
        if (lineMatches(l)){
          if (listEl) listEl.appendChild(logRow(l));
          if (near) scrollBottom();
          updateCount();
        }
      }, 1200);
    }
    function setPaused(v){
      state.paused = v;
      if (pauseBtn) pauseBtn.textContent = v ? 'Resume' : 'Pause';
      if (v) clearTimer(); else startFollow();
      syncStatus();
    }
    function copyLogs(){
      const text = filteredLogs().map(l =>
        (l.t ? l.t.toISOString().slice(11, 23) : '--:--:--.---') + ' ' + l.level.toUpperCase().padEnd(5) + ' ' + l.source.padEnd(7) + ' ' + l.msg
      ).join('\n');
      const done = () => toast('Copied ' + filteredLogs().length + ' lines');
      const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = text; ta.setAttribute('readonly', '');
        ta.style.position = 'fixed'; ta.style.left = '-9999px'; ta.style.top = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e){}
        ta.remove();
        done();
      };
      if (navigator.clipboard && navigator.clipboard.writeText){
        navigator.clipboard.writeText(text).then(done, fallback);
      } else fallback();
    }

    function logsView(body, d){
      const toolbar = H.h('div.insights-log-toolbar');
      const levelSeg = H.seg([
        {id:'all', label:'All'}, {id:'info', label:'Info'}, {id:'warn', label:'Warn'}, {id:'error', label:'Error'},
      ], state.level, id => {
        state.level = id;
        if (LIVE) loadLogsFromApi(); else renderLogList();
      });

      const searches = q => {
        state.q = q;
        if (LIVE){
          if (searchTimer) clearTimeout(searchTimer);
          searchTimer = setTimeout(() => { searchTimer = null; loadLogsFromApi(); }, 350);
        } else renderLogList();
      };

      const search = H.h('input.input.insights-log-search', {
        type:'search', placeholder:'Search messages, sources, error codes', 'aria-label':'Search logs',
        value:state.q,
      });
      search.addEventListener('input', () => searches(search.value.trim()));

      let srcSel, compSel = null, lineSel = null;
      if (LIVE){
        srcSel = H.h('select.select.insights-log-src-select', {'aria-label':'Log file'});
        LOG_FILE_OPTIONS.forEach(o => srcSel.appendChild(H.h('option', {value:o.id}, o.label)));
        srcSel.value = state.logFile;
        srcSel.addEventListener('change', () => { state.logFile = srcSel.value; loadLogsFromApi(); });

        compSel = H.h('select.select.insights-log-src-select', {'aria-label':'Log component'});
        LOG_COMPONENTS.forEach(c => compSel.appendChild(H.h('option', {value:c}, c === 'all' ? 'All components' : c)));
        compSel.value = state.logComponent;
        compSel.addEventListener('change', () => { state.logComponent = compSel.value; loadLogsFromApi(); });

        lineSel = H.h('select.select.insights-log-src-select', {'aria-label':'Line count'});
        [50, 100, 200, 500].forEach(n => lineSel.appendChild(H.h('option', {value:String(n)}, n + ' lines')));
        lineSel.value = String(state.logLines);
        lineSel.addEventListener('change', () => { state.logLines = Number(lineSel.value); loadLogsFromApi(); });
      } else {
        srcSel = H.h('select.select.insights-log-src-select', {'aria-label':'Log source'});
        [['all', 'All sources'], ['agent', 'agent'], ['gateway', 'gateway'], ['cron', 'cron'], ['mcp', 'mcp'], ['errors', 'Errors only']]
          .forEach(([v, label]) => srcSel.appendChild(H.h('option', {value:v}, label)));
        srcSel.value = state.src;
        srcSel.addEventListener('change', () => { state.src = srcSel.value; renderLogList(); });
      }

      followSw = H.sw(state.follow, v => {
        state.follow = v;
        if (v) startFollow(); else clearTimer();
        syncStatus();
      }, LIVE ? 'Auto-refresh logs' : 'Follow new log lines');

      pauseBtn = H.h('button.btn.sm', {onclick:() => setPaused(!state.paused)}, state.paused ? 'Resume' : 'Pause');
      pauseBtn.textContent = state.paused ? 'Resume' : 'Pause';
      const clearBtn = H.h('button.btn.sm.ghost', {
        onclick:() => {
          const n = state.log.length;
          state.log = [];
          state.expanded.clear();
          state.explained.clear();
          renderLogList();
          toast('Cleared ' + n + ' log lines');
        },
      }, 'Clear');
      const copyBtn = H.h('button.btn.sm', {onclick:copyLogs}, H.ic('copy', 'sm'), 'Copy');
      const refreshBtn = LIVE
        ? H.h('button.btn.sm.ghost', {onclick:() => loadLogsFromApi()}, 'Refresh')
        : null;

      toolbar.append(levelSeg,
        H.h('div.insights-log-src', srcSel),
        compSel ? H.h('div.insights-log-src', compSel) : null,
        lineSel ? H.h('div.insights-log-src', lineSel) : null,
        search,
        H.h('div.insights-follow', H.h('span', LIVE ? 'Auto-refresh' : 'Follow'), followSw),
        pauseBtn, refreshBtn, clearBtn, copyBtn
      );

      const card = H.h('div.card.insights-log-card');
      countEl = H.h('span.insights-log-count');
      statusEl = H.h('span.insights-log-status');
      const headbar = H.h('div.insights-log-headbar', countEl, H.h('span.grow'), statusEl);
      const cols = H.h('div.insights-log-cols',
        H.h('span', 'Time'), H.h('span', 'Level'), H.h('span', 'Source'), H.h('span', 'Message')
      );
      listEl = H.h('div.insights-log-scroll');
      card.append(headbar, cols, listEl);

      const wrap = H.h('div.insights-logs', toolbar, card);
      body.appendChild(wrap);
      if (LIVE){
        state.log = [];
        state.logError = null;
        state.logLoading = true;
        renderLogList();
        loadLogsFromApi();
      } else {
        renderLogList();
        syncStatus();
        scrollBottom();
      }
    }

    /* ---------- section helper + paint ---------- */
    function section(title, content, note){
      const s = H.h('div.sec');
      const h = H.h('h2', title);
      if (note) h.appendChild(H.h('span.insights-note', note));
      s.append(h, content);
      return s;
    }

    let paintSeq = 0;

    function errorCard(e, what){
      const msg = e && e.message ? e.message : 'unknown error';
      return H.h('div.card.empty',
        H.h('div', "Couldn't load " + what + ': ' + msg),
        H.h('button.btn.sm', {onclick:() => paint()}, 'Retry'));
    }

    async function liveData(){
      const days = LIVE_DAYS[state.range];
      const results = await Promise.all([
        H.api.cached('/api/analytics/usage?days=' + days, 15000),
        H.api.cached('/api/analytics/models?days=' + days, 15000),
        H.api.cached('/api/sessions?limit=100', 15000),
        H.api.cached('/api/status', 5000),
      ]);
      return fromApiInsights(results[0], results[1], results[2], results[3], state.range);
    }

    function paint(){
      clearTimer();
      if (searchTimer){ clearTimeout(searchTimer); searchTimer = null; }
      pending = [];
      const my = ++paintSeq;
      let page = root.querySelector('.insights-page');
      if (!page){
        page = H.h('div.page.insights-page');
        root.appendChild(page);
      }
      page.scrollTop = 0;
      page.innerHTML = '';
      const pageIn = H.h('div.page-in.insights-page-in');
      pageIn.appendChild(head());
      pageIn.appendChild(H.h('div.insights-tabbar', tabsBar()));
      const body = H.h('div.insights-body');
      pageIn.appendChild(body);
      page.appendChild(pageIn);

      if (!LIVE){
        const d = dataFor();
        if (state.tab === 'usage') usageView(body, d);
        else if (state.tab === 'activity') activityView(body, d);
        else logsView(body, d);
        pending.forEach(fn => fn());
        pending = [];
        if (state.tab === 'logs'){
          startFollow();
          scrollBottom();
        }
        return;
      }

      if (state.tab === 'logs'){
        logsView(body, null);
        startFollow();
        return;
      }

      body.appendChild(H.h('div.card.empty', 'Loading…'));
      liveData().then(d => {
        if (my !== paintSeq || !body.isConnected) return;
        body.innerHTML = '';
        if (state.tab === 'usage') usageView(body, d);
        else activityView(body, d);
        pending.forEach(fn => fn());
        pending = [];
      }).catch(e => {
        if (my !== paintSeq || !body.isConnected) return;
        body.innerHTML = '';
        body.appendChild(errorCard(e, 'analytics'));
      });
    }

    paint();
  },
};
})();
