/* Calm stage screens for the six secondary spaces.
   Each screen: one goal, one sentence, one primary action, a few doorways.
   The dense workbench modules (H.views.*) open in the right-hand drawer via H.work.*.
   Owns only this file. Loaded after js/views/*.js and before js/shell.js. */
(function(){
'use strict';
const H = window.H;
if (!H || !H.stage) return;
const h = H.h;

const NAMES = ['routines', 'library', 'channels', 'insights', 'settings', 'history'];
/* keep the dense views as the drawer workbenches before the stage wrappers replace H.views */
NAMES.forEach(name => { if (H.views[name]) H.work[name] = H.views[name]; });

const LIVE = H.live;
const failText = e => (e && (e.message || e.status)) || 'unknown error';

/* ---------- small helpers ---------- */
const pad2 = n => String(n).padStart(2, '0');
function onPrimary(el, fn){
  const b = el.querySelector('.stage-actions .btn.primary');
  if (b) b.onclick = fn;
}
/* keep copy off the illustration on wide screens; below 900px the stage stacks, so these caps do not bite */
function cap(el, sel, px){
  const n = el.querySelector(sel);
  if (n) n.style.maxWidth = px + 'px';
}

/* ---------- live patches: the stage shell is built from the def, so live numbers land in its nodes ---------- */
function setSub(el, text){ const n = el.querySelector('.stage-sub'); if (n) n.textContent = text; }
function setLead(el, text){ const n = el.querySelector('.stage-lead'); if (n) n.textContent = text; }
function setHandle(el, count){
  const b = el.querySelector('.stage-handle'); if (!b) return;
  let n = b.querySelector('.hc');
  if (count == null){ if (n) n.remove(); return; }
  if (!n){ n = document.createElement('span'); n.className = 'hc num'; b.insertBefore(n, b.querySelector('svg') || null); }
  n.textContent = H.fmt.n(count);
}
function setDoor(el, label, count){
  const btn = Array.from(el.querySelectorAll('.stage-doors .door')).find(b => { const s = b.querySelector('span'); return s && s.textContent === label; });
  if (!btn) return;
  let n = btn.querySelector('.dn');
  if (count == null){ if (n) n.remove(); return; }
  if (!n){ n = document.createElement('span'); n.className = 'dn num'; const lab = btn.querySelector('span'); (lab || btn).after(n); }
  n.textContent = H.fmt.n(count);
}

/* a failed live load offers one Retry next to the primary action; it disappears on the next attempt */
function addRetry(el, fn){
  const acts = el.querySelector('.stage-actions');
  if (!acts || acts.querySelector('.retry')) return;
  acts.append(h('button.btn.big.line.retry', {onclick:()=>{ const b = acts.querySelector('.retry'); if (b) b.remove(); fn(); }}, 'Retry'));
}
function dropRetry(el){ const b = el.querySelector('.stage-actions .retry'); if (b) b.remove(); }

/* ---------- routines: the next run, counting down ---------- */
const BRIEFING_HOUR = 6;               /* Morning briefing runs daily at 06:00 */
function nextBriefing(){
  const d = new Date();
  d.setHours(BRIEFING_HOUR, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}
function countdownText(ms){
  const s = Math.max(0, Math.floor(ms / 1000));
  return 'Morning briefing in ' + Math.floor(s / 3600) + 'h ' + pad2(Math.floor((s % 3600) / 60)) + 'm ' + pad2(s % 60) + 's';
}
/* short duration for a real next-run countdown (stage subs stay one short sentence) */
function leftText(ms){
  const s = Math.max(0, Math.floor(ms / 1000));
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  return hh ? hh + 'h ' + pad2(mm) + 'm' : (mm ? mm + 'm ' + pad2(ss) + 's' : ss + 's');
}

H.defineStage({
  name: 'routines',
  title: 'Routines',
  ch: 'routines',
  glyph: 'routines',
  seed: 31,
  work: 'routines',
  workTitle: 'Routines',
  handle: 'All routines',
  handleCount: LIVE ? null : 8,
  lead: 'Hermes works while you sleep.',
  sub: LIVE ? 'Checking the schedule…' : 'Morning briefing in 6h 00m 00s',
  primary: {label: 'New routine'},
  secondary: LIVE ? null : {label: 'Pause all'},
  doors: [
    {label: 'Schedules', count: LIVE ? null : 8, tab: 'schedules'},
    {label: 'Triggers', count: LIVE ? null : 4, tab: 'triggers'},
    {label: 'Board', count: LIVE ? null : 12, tab: 'board'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('schedules'));

    const sub = el.querySelector('.stage-sub');
    if (LIVE){
      /* live: real cron jobs, countdown from their next_run_at, real webhook-route count */
      let target = 0, name = '';
      const paint = () => {
        if (!sub || !target) return;
        const left = target - Date.now();
        sub.textContent = 'Next run ' + (left <= 0 ? 'due now' : 'in ' + leftText(left)) + (name ? ' · ' + name : '');
      };
      const load = async () => {
        dropRetry(el);
        try {
          const res = await H.api.cached('/api/cron/jobs', 10000);
          const jobs = Array.isArray(res) ? res : (res && res.jobs) || [];
          const enabled = jobs.filter(j => j.enabled && j.state !== 'paused');
          const next = enabled
            .map(j => ({j, t: Date.parse(j.next_run_at || '')}))
            .filter(x => !isNaN(x.t)).sort((a, b) => a.t - b.t)[0];
          target = next ? next.t : 0;
          name = next ? String(next.j.name || next.j.prompt || '').trim().slice(0, 40) : '';
          setHandle(el, jobs.length);
          setDoor(el, 'Schedules', jobs.length);
          if (!jobs.length) setSub(el, 'No routines yet.');
          else if (!enabled.length) setSub(el, 'All ' + jobs.length + ' routines are paused.');
          else if (!target) setSub(el, enabled.length + ' enabled, no next run set.');
          else paint();
        } catch (e) { setSub(el, "Couldn't load routines: " + failText(e)); addRetry(el, load); }
        try {
          const wh = await H.api.cached('/api/webhooks', 10000);
          setDoor(el, 'Triggers', Array.isArray(wh && wh.subscriptions) ? wh.subscriptions.length : 0);
        } catch (e) { setDoor(el, 'Triggers', null); }   /* unknown: omit the count */
      };
      setDoor(el, 'Board', null);                        /* no task-board endpoint in the REST API */
      load();
      const timer = setInterval(() => {
        if (!sub || !sub.isConnected) { clearInterval(timer); return; }
        if (!target) return;
        if (target <= Date.now()) { load(); return; }
        paint();
      }, 1000);
      return;
    }

    const pause = el.querySelector('.stage-actions .btn.line');
    let paused = false;
    let target = nextBriefing();

    const paint = () => { if (sub) sub.textContent = countdownText(target - Date.now()); };
    paint();

    const timer = setInterval(() => {
      if (!sub || !sub.isConnected) { clearInterval(timer); return; }
      if (paused) return;
      if (target <= Date.now()) target = nextBriefing();
      paint();
    }, 1000);

    if (pause) { pause.setAttribute('aria-pressed', 'false'); pause.onclick = () => {
      paused = !paused;
      pause.textContent = paused ? 'Resume' : 'Pause all';
      pause.setAttribute('aria-pressed', String(paused));
      if (paused) sub.textContent = 'Paused. Nothing will run.';
      else { target = nextBriefing(); paint(); }
      H.toast(paused ? 'All routines paused' : 'Routines resumed');
    }; }
  }
});

/* ---------- library ---------- */
H.defineStage({
  name: 'library',
  title: 'Library',
  ch: 'library',
  glyph: 'library',
  seed: 47,
  work: 'library',
  workTitle: 'Library',
  handle: 'All skills',
  handleCount: LIVE ? null : 34,
  lead: 'Teach Hermes something new.',
  sub: LIVE ? 'Checking the library…' : '34 skills, 12 memories and 6 toolsets are ready.',
  primary: {label: 'Add a skill'},
  doors: [
    {label: 'Skills', count: LIVE ? null : 34, tab: 'skills'},
    {label: 'Memory', count: LIVE ? null : 12, tab: 'memory'},
    {label: 'Tools', count: LIVE ? null : 6, tab: 'tools'},
    {label: 'Files', count: LIVE ? null : 24, tab: 'files'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('skills'));
    cap(el, '.stage-sub', 380);
    cap(el, '.stage-doors', 300);
    if (!LIVE) return;
    const load = async () => {
      dropRetry(el);
      const [skillsR, toolsR] = await Promise.allSettled([
        H.api.cached('/api/skills', 10000),
        H.api.cached('/api/tools/toolsets', 10000)
      ]);
      const skills = skillsR.status === 'fulfilled' && Array.isArray(skillsR.value) ? skillsR.value.length : null;
      const toolsets = toolsR.status === 'fulfilled' && Array.isArray(toolsR.value) ? toolsR.value.length : null;
      if (skills != null){ setHandle(el, skills); setDoor(el, 'Skills', skills); }
      if (toolsets != null) setDoor(el, 'Tools', toolsets);
      /* memory entries and files have no REST count: omit the numbers instead of inventing them */
      setDoor(el, 'Memory', null); setDoor(el, 'Files', null);
      const bits = [];
      if (skills != null) bits.push(skills + (skills === 1 ? ' skill' : ' skills'));
      if (toolsets != null) bits.push(toolsets + (toolsets === 1 ? ' toolset' : ' toolsets'));
      if (bits.length) setSub(el, bits.join(' and ') + ' installed.');
      else { setSub(el, "Couldn't load the library: " + failText(skillsR.reason || toolsR.reason)); addRetry(el, load); }
    };
    load();
  }
});

/* ---------- channels ---------- */
H.defineStage({
  name: 'channels',
  title: 'Channels',
  ch: 'channels',
  glyph: 'channels',
  seed: 58,
  work: 'channels',
  workTitle: 'Channels',
  handle: 'All channels',
  handleCount: LIVE ? null : 4,
  lead: 'Reach people where they are.',
  sub: LIVE ? 'Checking channels…' : '4 platforms connected, 7 live chats.',
  primary: {label: 'Connect a platform'},
  doors: [
    {label: 'Platforms', count: LIVE ? null : 4, tab: 'platforms'},
    {label: 'People', count: LIVE ? null : 7, tab: 'people'},
    {label: 'Endpoints', count: LIVE ? null : 5, tab: 'endpoints'},
    {label: 'Peers', count: LIVE ? null : 4, tab: 'peers'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('platforms'));
    cap(el, '.stage-doors', 300);
    if (!LIVE) return;
    const load = async () => {
      dropRetry(el);
      const [platsR, pairR] = await Promise.allSettled([
        H.api.cached('/api/messaging/platforms', 10000),
        H.api.cached('/api/pairing', 10000)
      ]);
      const list = platsR.status === 'fulfilled' && platsR.value && Array.isArray(platsR.value.platforms) ? platsR.value.platforms : null;
      const connected = list ? list.filter(p => p.state === 'connected').length : null;
      const people = pairR.status === 'fulfilled' && pairR.value && Array.isArray(pairR.value.approved) ? pairR.value.approved.length : null;
      if (list) setHandle(el, list.length);
      if (connected != null) setDoor(el, 'Platforms', connected);
      if (people != null) setDoor(el, 'People', people);
      /* no endpoint count in the REST API, and peers need a peer grant: omit both */
      setDoor(el, 'Endpoints', null); setDoor(el, 'Peers', null);
      const parts = [];
      if (list) parts.push(connected ? connected + (connected === 1 ? ' platform connected' : ' platforms connected') : 'No platforms connected');
      if (people != null) parts.push(people ? people + (people === 1 ? ' person paired' : ' people paired') : 'no one paired yet');
      if (parts.length) setSub(el, parts.join(', ') + '.');
      else { setSub(el, "Couldn't load channels: " + failText(platsR.reason)); addRetry(el, load); }
    };
    load();
  }
});

/* ---------- insights: the figure is the lead ---------- */
H.defineStage({
  name: 'insights',
  title: 'Insights',
  ch: 'insights',
  glyph: 'insights',
  seed: 73,
  work: 'insights',
  workTitle: 'Insights',
  handle: 'Full report',
  handleCount: LIVE ? null : 7,
  lead: LIVE ? 'Usage this week.' : '$18.42 this week.',
  sub: LIVE ? 'Loading usage…' : '14% less than last week. 62% of the monthly cap.',
  primary: {label: 'See the breakdown'},
  doors: [
    {label: 'Usage', count: LIVE ? null : 5, tab: 'usage'},
    {label: 'Activity', count: LIVE ? null : 96, tab: 'activity'},
    {label: 'Logs', count: LIVE ? null : 212, tab: 'logs'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('usage'));
    cap(el, '.stage-sub', 380);
    cap(el, '.stage-doors', 340);
    if (!LIVE) return;
    const load = async () => {
      dropRetry(el);
      try {
        /* one 14-day read: the last 7 days are this week, the 7 before it are the comparison */
        const a = await H.api.cached('/api/analytics/usage?days=14', 30000);
        const daily = Array.isArray(a && a.daily) ? a.daily : [];
        const DAY = 86400000, now = Date.now();
        const inWin = (d, from, to) => { const t = Date.parse(d.day); return !isNaN(t) && t > from && t <= to; };
        const week = daily.filter(d => inWin(d, now - 7 * DAY, now));
        const prev = daily.filter(d => inWin(d, now - 14 * DAY, now - 7 * DAY));
        const sum = (rows, f) => rows.reduce((s, d) => s + (Number(f(d)) || 0), 0);
        const costOf = d => Number(d.actual_cost) || Number(d.estimated_cost) || 0;
        const cost = sum(week, costOf), prevCost = sum(prev, costOf);
        const tokens = sum(week, d => (Number(d.input_tokens) || 0) + (Number(d.output_tokens) || 0));
        const sessions = sum(week, d => d.sessions);
        setLead(el, tokens || cost ? (cost ? H.fmt.usd(cost) : '$0.00') + ' this week.' : 'No usage this week.');
        const sub = [];
        if (prevCost > 0 && cost !== prevCost){
          const pct = Math.round(Math.abs(1 - cost / prevCost) * 100);
          sub.push(pct + '% ' + (cost < prevCost ? 'less' : 'more') + ' than last week.');
        }
        if (tokens) sub.push(H.fmt.k(tokens) + ' tokens.');
        setSub(el, sub.length ? sub.join(' ') : 'No usage recorded in the last 7 days.');
        if (Array.isArray(a && a.by_model)) setDoor(el, 'Usage', a.by_model.length);
        setDoor(el, 'Activity', sessions);
        setDoor(el, 'Logs', null);          /* logs have no cheap count */
      } catch (e) {
        setLead(el, 'Usage unavailable.');
        setSub(el, "Couldn't load analytics: " + failText(e));
        setDoor(el, 'Usage', null); setDoor(el, 'Activity', null); setDoor(el, 'Logs', null);
        addRetry(el, load);
      }
    };
    load();
  }
});

/* ---------- settings: search instead of actions ---------- */
const SETTINGS_LINKS = [
  {label: 'Models', tab: 'models', keys: 'models providers model routing default'},
  {label: 'Appearance', tab: 'general', keys: 'appearance theme light dark density'},
  {label: 'Approvals', tab: 'agent', keys: 'approvals approval mode risky auto manual'},
  {label: 'Keys', tab: 'secrets', keys: 'keys secrets api tokens env vault credentials'},
  {label: 'Health check', tab: 'system', keys: 'health check doctor gateway ports uptime'},
  {label: 'Raw config', tab: 'advanced', keys: 'raw config yaml advanced file'},
  {label: 'Tools & terminal', tab: 'tools', keys: 'tools terminal shell browser'},
  {label: 'Security', tab: 'security', keys: 'security lock ssh network access'},
  {label: 'Profiles', tab: 'profiles', keys: 'profiles agents scout ledger default'}
];
const settingsFoot = h('div.stage-search', {style: {display: 'grid', gap: '6px', justifyItems: 'start', width: 'min(390px, 80vw)'}});

H.defineStage({
  name: 'settings',
  title: 'Settings',
  ch: 'settings',
  glyph: 'settings',
  seed: 86,
  work: 'settings',
  workTitle: 'Settings',
  handle: 'All settings',
  handleCount: 9,
  lead: 'Make Hermes yours.',
  sub: 'Search any setting, or jump straight in.',
  foot: settingsFoot,
  mount(el, api){
    const acts = el.querySelector('.stage-actions');
    if (acts && !acts.children.length) acts.style.display = 'none';

    const input = h('input.input', {
      type: 'search',
      placeholder: 'Search settings: models, keys, approvals…',
      'aria-label': 'Search settings',
      autocomplete: 'off',
      style: {width: '100%', background: 'color-mix(in srgb, var(--on) 10%, transparent)',
              borderColor: 'color-mix(in srgb, var(--on) 34%, transparent)', color: 'var(--on)'}
    });
    const list = h('div', {style: {display: 'grid', width: '100%'}});

    const draw = () => {
      const q = input.value.trim().toLowerCase();
      const hits = SETTINGS_LINKS.filter(l => !q || (l.label + ' ' + l.keys).toLowerCase().includes(q)).slice(0, 6);
      list.replaceChildren();
      if (!hits.length){
        list.append(h('div', {style: {padding: '10px 0', opacity: '.75'}}, 'No setting matches “' + input.value.trim() + '”.'));
        return;
      }
      hits.forEach(l => list.append(h('button.door', {
        type: 'button', 'aria-label': 'Open ' + l.label + ' settings',
        onclick: () => api.openWork(l.tab)
      }, h('span', l.label), H.ic('chev', 'sm arrow'))));
    };

    input.addEventListener('input', draw);
    input.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const first = list.querySelector('button');
      if (first) first.click();
    });

    settingsFoot.replaceChildren(input, list);
    draw();
  }
});

/* ---------- history ---------- */
H.defineStage({
  name: 'history',
  title: 'History',
  ch: 'history',
  glyph: 'history',
  seed: 97,
  work: 'history',
  workTitle: 'History',
  handle: 'All threads',
  handleCount: LIVE ? null : 1284,
  lead: 'Everything Hermes has done.',
  sub: LIVE ? 'Loading history…' : '1,284 threads, 211 MB, all healthy.',
  primary: {label: 'Search history'},
  mount(el, api){
    onPrimary(el, () => api.openWork());
    if (!LIVE) return;
    const load = async () => {
      dropRetry(el);
      try {
        const s = await H.api.cached('/api/sessions/stats', 10000);
        const total = Number(s && s.total) || 0;
        const messages = Number(s && s.messages) || 0;
        setHandle(el, total);
        /* state.db size is not exposed by /api/status or any read endpoint: omitted */
        setSub(el, H.fmt.n(total) + (total === 1 ? ' thread' : ' threads') + ' · ' + H.fmt.n(messages) + ' messages.');
      } catch (e) { setSub(el, "Couldn't load history: " + failText(e)); addRetry(el, load); }
    };
    load();
  }
});
})();
