/* js/ui.js */
/* Shared helpers. Global namespace: window.H  (views register in H.views) */
(function(){
const H = window.H = window.H || {};
H.views = {};

/* ---- DOM helper: h('div.card#id', {onclick, class, 'data-x'}, ...children) ---- */
H.h = function h(sel, attrs, ...kids){
  if (typeof attrs !== 'object' || attrs === null || attrs instanceof Node || Array.isArray(attrs)) { if (attrs!==undefined && attrs!==null) kids.unshift(attrs); attrs = {}; }
  const m = /^([a-z0-9-]*)((?:[.#][\w-]+)*)/i.exec(sel);
  const e = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0]==='.' ? e.classList.add(t.slice(1)) : e.id = t.slice(1));
  for (const [k,v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') v.split(' ').filter(Boolean).forEach(c => e.classList.add(c));
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  const add = c => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(add); else if (c instanceof Node) e.appendChild(c); else e.appendChild(document.createTextNode(String(c))); };
  kids.forEach(add);
  return e;
};
H.html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
H.esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---- Icons (24px grid, stroke) ---- */
const P = {
  plus:'M12 5v14M5 12h14', search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4', inbox:'M3 13l3-8h12l3 8v6H3v-6zM3 13h5l1 3h6l1-3h5',
  chat:'M4 5h16v11H9l-5 4V5z', folder:'M3 6h6l2 2h10v11H3V6z', clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  book:'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h10', plug:'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v4',
  chart:'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3', gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  send:'M5 12l14-7-5 14-3-6-6-1z', stop:'M7 7h10v10H7z', check:'M5 12.5l4.5 4.5L19 7', x:'M6 6l12 12M18 6L6 18', chev:'M9 6l6 6-6 6', chevd:'M6 9l6 6 6-6', chevu:'M6 15l6-6 6 6',
  terminal:'M4 5h16v14H4V5zM8 10l3 2-3 2M13 15h4', file:'M6 3h8l4 4v14H6V3zM14 3v4h4', edit:'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4', globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  brain:'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 5 1V4a3 3 0 0 0-2 0zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-5 1V4', bolt:'M13 3L5 14h6l-1 7 8-11h-6l1-7z',
  shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4', key:'M14 10a4 4 0 1 0-3.5 4L14 17.5V20h2.5v-2.5H19V15h-2.5L14 12.5', link:'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  branch:'M7 4v12M7 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM17 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 8c0 5-10 3-10 8', diff:'M12 5v8M8 9h8M8 19h8', 
  paperclip:'M20 11l-8 8a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8', mic:'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4', 
  more:'M5 12h.01M12 12h.01M19 12h.01', copy:'M8 8h11v12H8V8zM5 16V4h11', retry:'M4 12a8 8 0 0 1 14-5l2-2v6h-6l2.5-2.5A5 5 0 0 0 7 12M20 12a8 8 0 0 1-14 5l-2 2v-6h6l-2.5 2.5A5 5 0 0 0 17 12',
  undo:'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3', fork:'M6 3v6a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v4M6 3a2 2 0 1 0 0 .01M18 21a2 2 0 1 0 0-.01', pause:'M8 5v14M16 5v14', play:'M7 4l13 8-13 8V4z',
  sidebar:'M3 5h18v14H3V5zM9 5v14', panel:'M3 5h18v14H3V5zM15 5v14', sun:'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  moon:'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z', cpu:'M7 7h10v10H7V7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4', db:'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 4 6', cmd:'M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6z',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', warn:'M12 3l10 18H2L12 3zM12 10v5M12 18h.01', info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  webhook:'M9 18a4 4 0 1 1 3-6.6M12 6a3 3 0 1 1 5.2 2L15 12M17 18a3 3 0 1 0 1-5.8H11', radio:'M12 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 16a6 6 0 0 1 0-8M16 8a6 6 0 0 1 0 8M5 19a10 10 0 0 1 0-14M19 5a10 10 0 0 1 0 14',
  board:'M4 4h5v16H4V4zM10 4h5v10h-5V4zM16 4h4v13h-4V4z', sparkle:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z',
  flask:'M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3', pin:'M12 17v5M8 3h8l-1 6 3 4H6l3-4-1-6z', trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  archive:'M3 4h18v4H3V4zM5 8v12h14V8M10 12h4', download:'M12 4v11M7 11l5 5 5-5M5 20h14', upload:'M12 16V5M7 9l5-5 5 5M5 20h14', external:'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  image:'M3 5h18v14H3V5zM3 16l5-5 4 4 3-3 6 5M8.5 9.5h.01', at:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1', hash:'M5 9h15M4 15h15M10 3L8 21M16 3l-2 18', slash:'M16 3L8 21',
  moa:'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8',
  graph:'M6 7a2 2 0 1 0 0-.01M18 5a2 2 0 1 0 0-.01M12 18a2 2 0 1 0 0-.01M7.7 8.3l3 7.4M16.5 6.8l-3.5 9', layers:'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5L12 22l9-4.5', maximize:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  lock:'M6 11h12v9H6v-9zM8 11V8a4 4 0 0 1 8 0v3', heart:'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z', route:'M6 19a2 2 0 1 0 0-.01M18 5a2 2 0 1 0 0-.01M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6',
};
H.icon = (n, cls='') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]||P.info}"/></svg>`;
H.ic = (n, cls='') => H.html(H.icon(n, cls));
H.iconNames = Object.keys(P);

/* ---- Agent avatar (presence). state: idle|thinking|working|waiting|blocked|done ---- */
H.avatar = function(agent, size=30, state){
  const st = state || agent.state || 'idle';
  const kind = agent.kind || 0;
  const acc = [
    '<path class="acc" d="M5 7.5C7 6 9 6 10.5 7M19 7.5C17 6 15 6 13.5 7"/>',            /* wings (hermes) */
    '<path class="acc" d="M8 5.5h8"/>',                                                      /* brim */
    '<path class="acc" d="M12 4.2v2.6M9.5 5.3l5 0"/>',                                       /* antenna */
    '<path class="acc" d="M7 6.5l2.5 1.2M17 6.5l-2.5 1.2"/>',                                /* ears */
  ][kind % 4];
  const mouth = st==='waiting' ? '<path class="acc" d="M10 16.5h4"/>' : st==='blocked' ? '<path class="acc" d="M9.8 17c1.4-1.2 3-1.2 4.4 0"/>' : '<path class="acc" d="M9.8 15.8c1.4 1.4 3 1.4 4.4 0"/>';
  const el = H.html(`<span class="av" style="--s:${size}px;--h:${agent.hue}" data-state="${st}" title="${H.esc(agent.name)}"><span class="ring"></span>
    <svg viewBox="0 0 24 24" aria-hidden="true">${acc}<circle class="eye" cx="9.2" cy="11.2" r="1.25"/><circle class="eye" cx="14.8" cy="11.2" r="1.25"/>${mouth}</svg></span>`);
  return el;
};
H.mark = (size=22) => H.html(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-label="Hermes"><path d="M3 14c5 0 9-3 12-9"/><path d="M6 18c5 0 10-4 13-10"/><path d="M10 21c4.5 0 9-4 11-9"/></svg>`);

/* ---- small utilities ---- */
H.toast = (msg) => {
  let box = document.querySelector('.toasts'); if (!box) { box = H.h('div.toasts', {role:'status','aria-live':'polite'}); document.body.appendChild(box); }
  const t = H.h('div.toast', msg); box.appendChild(t); setTimeout(() => t.remove(), 2600);
};
H.fmt = { n: v => Number(v).toLocaleString('en-US'), k: v => v>=1e6 ? (v/1e6).toFixed(1)+'M' : v>=1e3 ? (v/1e3).toFixed(v>=1e4?0:1)+'k' : String(v), usd: v => '$'+Number(v).toFixed(v<1?3:2) };
H.pill = (text, tone='') => H.h('span.pill'+(tone?'.'+tone:''), text);
H.sw = (on, onChange, label) => { const b = H.h('button.switch', {role:'switch','aria-checked':String(!!on),'aria-label':label||'toggle'}); b.onclick = () => { const v = b.getAttribute('aria-checked')!=='true'; b.setAttribute('aria-checked',String(v)); onChange && onChange(v); }; return b; };
H.tabs = (items, active, onPick) => {
  const root = H.h('div.tabs', {role:'tablist'});
  items.forEach(it => { const b = H.h('button', {role:'tab','aria-selected':String(it.id===active),onclick:()=>{ root.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected','false')); b.setAttribute('aria-selected','true'); onPick(it.id); }}, it.icon?H.ic(it.icon,'sm'):null, it.label, it.count!=null?H.h('span.count',it.count):null); root.appendChild(b); });
  return root;
};
H.seg = (items, active, onPick) => {
  const root = H.h('div.seg', {role:'group'});
  items.forEach(it => { const b = H.h('button', {'aria-pressed':String(it.id===active),onclick:()=>{ root.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); onPick(it.id); }}, it.label); root.appendChild(b); });
  return root;
};
H.modal = (content, {width=560, onClose}={}) => {
  const scrim = H.h('div.scrim'); const wrap = H.h('div', {style:{position:'fixed',inset:0,zIndex:71,display:'grid',placeItems:'start center',paddingTop:'12vh',overflow:'auto'}});
  const box = H.h('div.float', {style:{width:`min(${width}px,calc(100vw - 24px))`}}, content);
  wrap.appendChild(box);
  const close = () => { scrim.remove(); wrap.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); };
  const esc = e => { if (e.key==='Escape') close(); };
  scrim.onclick = close; wrap.onclick = e => { if (e.target===wrap) close(); };
  document.addEventListener('keydown', esc); document.body.append(scrim, wrap);
  return {close, box};
};
})();

/* js/api.js */
/* Live layer: when the page is served by `hermes dashboard` the server injects window.__HERMES_SESSION_TOKEN__.
   H.live === true means "talk to the real Hermes"; otherwise every view uses its sample data (artifact / file:// preview). */
(function(){
const H = window.H;
const TOKEN = window.__HERMES_SESSION_TOKEN__ || '';
H.live = !!TOKEN || window.__HERMES_AUTH_REQUIRED__ === true;
const BASE = String(window.__HERMES_BASE_PATH__ || '').replace(/\/+$/, '');
const PROFILE = String(window.__HERMES_INITIAL_PROFILE__ || window.__HERMES_DASHBOARD_PROFILE__ || '');
/* endpoint families that honour ?profile= (mirrors web/src/lib/api-request-scope.ts) */
const SCOPED = ['/api/status','/api/gateway','/api/analytics','/api/skills','/api/tools/toolsets','/api/config','/api/env','/api/mcp','/api/messaging/platforms','/api/providers/oauth','/api/model/','/api/pairing','/api/memory','/api/curator','/api/webhooks','/api/ops','/api/logs','/api/portal','/api/credentials','/api/dashboard/','/api/local-models','/api/plugins/','/api/shared-metrics'];
function scoped(path){
  if (!PROFILE || !SCOPED.some(p => path.startsWith(p)) || /[?&]profile=/.test(path)) return path;
  return path + (path.includes('?') ? '&' : '?') + 'profile=' + encodeURIComponent(PROFILE);
}
function url(path){ return BASE + scoped(path); }
async function req(method, path, body, opts){
  if (!H.live) { const e = new Error('offline: sample data mode'); e.status = 0; throw e; }
  const headers = {'Accept':'application/json'};
  if (TOKEN) headers['X-Hermes-Session-Token'] = TOKEN;
  let payload;
  if (body !== undefined && body !== null) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
  let res;
  try { res = await fetch(url(path), Object.assign({method, headers, body:payload, credentials:'include', mode:'same-origin'}, opts||{})); }
  catch (cause) { const e = new Error('Hermes is not reachable'); e.status = 0; e.cause = cause; throw e; }
  const text = await res.text(); let data = null;
  if (text) { try { data = JSON.parse(text); } catch (e) { data = text; } }
  if (!res.ok) {
    const msg = (data && (data.detail || data.error || data.message)) || res.statusText || ('HTTP '+res.status);
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg)); err.status = res.status; err.body = data;
    if (res.status === 401 && data && data.login_url) { location.href = data.login_url; }
    throw err;
  }
  return data;
}
/* WebSocket URL with auth: loopback token, or a one-use ticket when the OAuth gate is on. `params` are extra query args. */
async function wsUrl(path, params){
  const q = new URLSearchParams(Object.assign({}, params || {}));
  if (PROFILE && !q.has('profile')) q.set('profile', PROFILE);
  if (window.__HERMES_AUTH_REQUIRED__ === true) {
    const t = await req('POST', '/api/auth/ws-ticket', {socket: path.indexOf('/api/pty') === 0 ? 'pty' : 'gateway'});
    q.set('ticket', t.ticket);
  } else if (TOKEN) q.set('token', TOKEN);
  const loc = window.location; const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
  return proto + '//' + loc.host + BASE + path + '?' + q.toString();
}
H.api = {
  get: (p) => req('GET', p), post: (p, b) => req('POST', p, b === undefined ? {} : b), put: (p, b) => req('PUT', p, b), patch: (p, b) => req('PATCH', p, b), del: (p) => req('DELETE', p),
  url, wsUrl, profile: PROFILE, base: BASE,
  /* run a loader in live mode; on any failure return `fallback` (or rethrow when fallback === undefined) */
  async try(fn, fallback){ try { return await fn(); } catch (e) { if (fallback === undefined) throw e; H.api.lastError = e; return fallback; } },
};
/* tiny shared cache so several views do not hit the same endpoint within a few seconds */
const cache = {};
H.api.cached = async (path, ttl) => { const c = cache[path]; const now = Date.now(); if (c && now - c.t < (ttl || 5000)) return c.v; const v = await H.api.get(path); cache[path] = {t: now, v}; return v; };
})();

/* js/data.js */
/* Sample data (clearly mock). Shared across views via H.data */
(function(){
const H = window.H;
const agents = [
  {id:'hermes',  name:'Hermes',  role:'Primary agent · default profile', hue:212, kind:0, state:'working', model:'claude-sonnet-5-5', blurb:'Maintains this machine, writes code, runs the schedule.'},
  {id:'scout',   name:'Scout',   role:'Research profile', hue:158, kind:2, state:'idle', model:'deepseek-flash', blurb:'Web research, summaries, reading lists.'},
  {id:'ledger',  name:'Ledger',  role:'Ops profile · cron + billing', hue:32, kind:1, state:'waiting', model:'gemini-flash', blurb:'Nightly jobs, invoices, backups, alerts.'},
];
const projects = [
  {id:'maint', name:'hermes-maintenance', path:'~/hermes-maintenance', branch:'main', dirty:3},
  {id:'mail',  name:'atomicmail',         path:'~/atomicmail',         branch:'inbox-triage', dirty:0},
  {id:'ops',   name:'No project',         path:'~',                    branch:null, dirty:0},
];
/* thread.state: working | thinking | waiting (needs you) | done | idle | failed */
const threads = [
  {id:'t-ui',   project:'maint', agent:'hermes', title:'Redesign the web UI', state:'working', age:'now',   model:'claude-sonnet-5-5', mode:'worktree', branch:'ui-redesign', adds:412, dels:96, unread:false, pinned:true},
  {id:'t-gw',   project:'maint', agent:'hermes', title:'Gateway heartbeat gaps after restart', state:'waiting', age:'4m', model:'claude-sonnet-5-5', mode:'local', branch:'main', adds:0, dels:0, ask:'Approve: hermes gateway restart'},
  {id:'t-bk',   project:'maint', agent:'ledger', title:'Verify last night’s backup zip', state:'done', age:'38m', model:'gemini-flash', mode:'local', branch:'main', adds:0, dels:0, unread:true},
  {id:'t-mcp',  project:'maint', agent:'hermes', title:'Test the three MCP servers', state:'idle', age:'2h', model:'claude-sonnet-5-5', mode:'local', branch:'main', adds:18, dels:4},
  {id:'t-tri',  project:'mail',  agent:'hermes', title:'Triage inbox, draft replies', state:'thinking', age:'now', model:'claude-sonnet-5-5', mode:'local', branch:'inbox-triage', adds:0, dels:0},
  {id:'t-ml',   project:'mail',  agent:'scout',  title:'Compare three SMTP providers', state:'done', age:'Yesterday', model:'deepseek-flash', mode:'local', branch:'inbox-triage', adds:0, dels:0},
  {id:'t-pr',   project:'ops',   agent:'scout',  title:'What changed in Python 3.14.2?', state:'idle', age:'Tue', model:'deepseek-flash', mode:'local', branch:null, adds:0, dels:0},
  {id:'t-ci',   project:'ops',   agent:'ledger', title:'Cron: weekly cost report', state:'failed', age:'Mon', model:'gemini-flash', mode:'local', branch:null, adds:0, dels:0},
];
const inbox = [
  {id:'i1', kind:'approval', thread:'t-gw', agent:'hermes', title:'Wants to restart the gateway', body:'hermes gateway restart', risk:'medium', age:'4m', unread:true,
   detail:'Heartbeat gaps persist after the last restart. Hermes proposes a clean restart. Active sessions will see “Turn lost during restart” and can be resumed.'},
  {id:'i2', kind:'clarify', thread:'t-tri', agent:'hermes', title:'Which account should replies come from?', body:'2 candidates found in atomicmail', age:'11m', unread:true, options:['support@ (shared)','you@ (personal)','Ask each time']},
  {id:'i3', kind:'done', thread:'t-bk', agent:'ledger', title:'Backup verified: 214 MB, 3,912 files', body:'state.db, -wal and -shm restored cleanly in a scratch dir.', age:'38m', unread:true},
  {id:'i4', kind:'failed', thread:'t-ci', agent:'ledger', title:'Routine “Weekly cost report” failed', body:'Provider returned 429 twice, fallback exhausted.', age:'Mon', unread:false},
  {id:'i5', kind:'review', thread:'t-ui', agent:'hermes', title:'Changes ready to review: 9 files, +412 −96', body:'Branch ui-redesign · worktree', age:'now', unread:false},
];
const models = [
  {id:'claude-sonnet-5-5', provider:'Anthropic', ctx:'1M', note:'Default'},
  {id:'claude-opus-5-5', provider:'Anthropic', ctx:'1M', note:'Deep reasoning'},
  {id:'deepseek-flash', provider:'DeepSeek', ctx:'1M', note:'Cheap, fast'},
  {id:'gemini-flash', provider:'Google', ctx:'1M', note:'Multimodal'},
  {id:'hermes-local', provider:'Ollama', ctx:'64k', note:'On this machine'},
];
const slash = [
  ['/new','Start a fresh thread'],['/model','Switch model or provider'],['/reasoning','Set reasoning effort'],['/skills','Browse and attach skills'],
  ['/compress','Compress context now'],['/undo','Undo last turn'],['/retry','Retry last turn'],['/branch','Fork thread from here'],['/checkpoint','Save a checkpoint'],
  ['/cron','Create a routine from this thread'],['/memory','Open memory'],['/tools','Choose toolsets'],['/usage','Show tokens and cost'],['/yolo','Auto-approve (this thread)'],['/help','All commands'],
];
const gateway = {state:'healthy', pid:1020, uptime:'6d 4h', dashboard:9119, api:8642, platforms:['telegram','discord','slack','email'], sessions:7, cpu:'3%', ram:'412 MB'};
H.data = {agents, projects, threads, inbox, models, slash, gateway};
H.agent = id => agents.find(a => a.id === id);
H.thread = id => threads.find(t => t.id === id);
H.project = id => projects.find(p => p.id === id);
})();

/* js/mosaic.js */
/* Pixel mosaic engine: the tile from the palette image, generated per space.
   H.mosaic({size, seed, glyph, state, reveal}) -> element; H.avatar(agent,size,state) -> small static tile with a state ring. */
(function(){
const H = window.H;
const PAL = {n:'#060338',w:'#ffffff',c:'#f6efd8',C:'#e9d9a8',g:'#e4b43a',G:'#f8d674',a:'#c8821e',b:'#8d4b13',t:'#2e8d8f',e:'#4ec28b',q:'#79e0d8',m:'#c43cb4',p:'#f2b4ef',v:'#6a2aa8',i:'#3b2fbf',l:'#a9d4ee',u:'#3f6fd0',d:'#4b3f72',o:'#c9792a',r:'#d4562a',k:'#12104f'};
H.PAL = PAL;
const CORE = ['#ffffff','#fdf6e0','#f6efd8'];
const GOLD = ['#f8d674','#f2c14e','#e4b43a','#d49f2f','#f3cf5c','#e4b43a'];
const AMBER = ['#c8821e','#b8651a','#a9621c','#8d4b13','#e9d9a8','#c9792a'];
const NOISE = ['#060338','#060338','#060338','#e4b43a','#c8821e','#2e8d8f','#4ec28b','#c9792a','#f6efd8','#4b3f72','#5ccf9a','#e9d9a8','#d9a22f','#2e8d8f'];
const FRAME = ['#f2b4ef','#c43cb4','#7b2fb0','#3b2fbf','#4cb7a8','#a9d4ee','#3f6fd0','#8fe8ea','#a9d4ee','#3b2fbf','#c43cb4','#f2b4ef'];
function rng(seed){ let a = seed|0; return () => { a = (a + 0x6D2B79F5)|0; let t = Math.imul(a ^ (a>>>15), 1|a); t = (t + Math.imul(t ^ (t>>>7), 61|t)) ^ t; return ((t ^ (t>>>14))>>>0)/4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r()*arr.length)];

function frameColor(x, y, N, t, phase, r){
  /* perimeter position clockwise from top-left, 0..1 */
  const m = N-1; let p;
  const side = Math.min(x, y, m-x, m-y);
  if (y === side) p = x/(4*m); else if (m-x === side) p = (m + y)/(4*m); else if (m-y === side) p = (3*m - x)/(4*m); else p = (4*m - y)/(4*m);
  let k = (p*FRAME.length + phase) % FRAME.length;
  let idx = Math.floor(k); if (r() < 0.22) idx = (idx + (r() < .5 ? 1 : FRAME.length-1)) % FRAME.length;
  return FRAME[idx];
}
function build(N, seed, o){
  o = o || {}; const r = rng(seed); const t = o.frame != null ? o.frame : (N >= 20 ? 3 : 1); const c = (N-1)/2; const cells = []; const grid = [];
  const R = c - t + 0.5;
  for (let y=0; y<N; y++){ grid[y] = []; for (let x=0; x<N; x++){
    let col, z, d = 0;
    const edge = Math.min(x, y, N-1-x, N-1-y);
    if (edge < t){
      const corner = (Math.min(x, N-1-x) < t-1 && Math.min(y, N-1-y) < t-1) || (N >= 20 && edge === 0 && ((x===0||x===N-1) && (y<2||y>N-3) || (y===0||y===N-1) && (x<2||x>N-3)));
      col = corner ? null : frameColor(x, y, N, t, o.phase||0, r); z = 'f';
    } else {
      const dx = Math.abs(x-c), dy = Math.abs(y-c);
      d = (Math.max(dx,dy)*0.55 + Math.hypot(dx,dy)*0.45) / R; z = 'i';
      const cross = (dx < 0.6 || dy < 0.6); const diag = Math.abs(dx-dy) < 0.6;
      const left = grid[y][x-1], up = grid[y-1] && grid[y-1][x];
      if (d < 0.14) col = pick(r, CORE);
      else if (cross && d < 0.9 && r() > d*0.55) col = d < 0.34 ? pick(r, CORE) : pick(r, ['#f6efd8','#e9d9a8','#efe3c4']);
      else if (diag && d < 0.46 && r() > d*0.9) col = pick(r, ['#ffffff','#fdf6e0']);
      else {
        const n = d + (r()-0.5)*0.34;
        col = n < 0.36 ? pick(r, GOLD) : n < 0.62 ? pick(r, AMBER) : pick(r, NOISE);
        if (left && left.z==='i' && r() < 0.42 && left.d > 0.2 && d > 0.2) col = left.col; else if (up && up.z==='i' && r() < 0.22 && d > 0.3) col = up.col;
      }
    }
    const cell = {x, y, col, z, d}; grid[y][x] = cell; cells.push(cell);
  }}
  return {N, cells, grid, t, c};
}
function stamp(m, glyph){
  if (!glyph || !glyph.length) return;
  const gh = glyph.length, gw = Math.max.apply(null, glyph.map(s=>s.length)); const ox = Math.round(m.c - (gw-1)/2), oy = Math.round(m.c - (gh-1)/2);
  const mask = {};
  glyph.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && ch !== ' ' && PAL[ch]) mask[(oy+j)+','+(ox+i)] = ch; }));
  Object.keys(mask).forEach(k => { const [y,x] = k.split(',').map(Number); for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){ const yy=y+dy, xx=x+dx; const cell = m.grid[yy] && m.grid[yy][xx]; if (cell && cell.z==='i' && !mask[yy+','+xx]) { cell.col = PAL.n; cell.halo = true; } } });
  Object.keys(mask).forEach(k => { const [y,x] = k.split(',').map(Number); const cell = m.grid[y] && m.grid[y][x]; if (cell && cell.z==='i') { cell.col = PAL[mask[k]]; cell.glyph = true; } });
}

/* ---------- big tile ---------- */
H.mosaic = function(o){
  o = o || {}; const N = o.size || 33, seed = o.seed || 7, m = build(N, seed, {phase:o.phase||0});
  const g = typeof o.glyph === 'string' ? (H.glyphs && H.glyphs[o.glyph]) : o.glyph; stamp(m, g);
  const wrap = H.h('div.mosaic', {role:'img', 'aria-label': o.label || 'Pixel illustration'}); const cv = H.h('canvas'); wrap.append(cv); const ctx = cv.getContext('2d');
  const order = m.cells.filter(c => c.col).sort((a,b) => (a.d + (a.z==='f'?1.4:0)) - (b.d + (b.z==='f'?1.4:0)) + (Math.sin(a.x*12.9898+a.y*78.233)*0.04));
  let K = 16, phase = o.phase||0, state = o.state||'idle', shown = 0, tStart = 0, raf = 0, last = 0, tw = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fit = () => { const w = wrap.clientWidth || 300; K = Math.max(4, Math.round(w*(devicePixelRatio||1)/N)); cv.width = cv.height = N*K; draw(); };
  const drawCell = c => { if (!c.col) return; ctx.fillStyle = c.col; ctx.fillRect(c.x*K, c.y*K, K, K); };
  function draw(){ ctx.clearRect(0,0,cv.width,cv.height); const lim = Math.floor(shown); for (let i=0;i<lim && i<order.length;i++) drawCell(order[i]); }
  const ease = x => 1 - Math.pow(1-x, 4);
  function frameStep(){ m.cells.forEach(c => { if (c.z==='f' && c.col){ const r = rng(c.x*31+c.y*57+seed); c.col = frameColor(c.x,c.y,N,m.t,phase,r); } }); }
  function tick(ts){
    if (!wrap.isConnected) return; raf = requestAnimationFrame(tick);
    if (!tStart) tStart = ts; const T = 900; const p = Math.min(1, (ts-tStart)/T); const want = ease(p)*order.length;
    let dirty = false; if (shown < order.length && (o.reveal !== false) && !reduce){ shown = want; dirty = true; } else if (shown < order.length){ shown = order.length; dirty = true; }
    if (!reduce && ts - last > (state==='working' ? 90 : 160) && shown >= order.length){
      last = ts; dirty = true;
      for (let i=0;i<5;i++){ const c = order[Math.floor(Math.random()*order.length)]; if (c.z==='i' && c.d > 0.5 && !c.glyph && !c.halo) c.col = pick(Math.random, NOISE); }
      if (state==='working'){ phase += 0.12; frameStep(); }
      tw++; order.forEach(c => { if (c.z==='i' && !c.glyph && !c.halo && c.d < 0.14) c.col = CORE[(tw + c.x + c.y) % 3]; });
    }
    if (dirty) draw();
  }
  const ro = new ResizeObserver(fit); ro.observe(wrap);
  requestAnimationFrame(() => { fit(); raf = requestAnimationFrame(tick); });
  wrap.setState = s => { state = s; };
  wrap.replay = () => { tStart = 0; shown = 0; };
  return wrap;
};

/* ---------- avatar: tiny static tile + state ring ---------- */
const cache = {};
function tile(agent){
  const key = agent.id; if (cache[key]) return cache[key];
  const seeds = {hermes:11, scout:23, ledger:37}; const seed = seeds[agent.id] || (agent.hue|0)+3;
  const m = build(9, seed, {frame:1, phase:(agent.hue||0)/30}); const cv = document.createElement('canvas'); const K = 8; cv.width = cv.height = 9*K; const x = cv.getContext('2d');
  m.cells.forEach(c => { if (c.col){ x.fillStyle = c.col; x.fillRect(c.x*K, c.y*K, K, K); } });
  return cache[key] = cv.toDataURL();
}
H.avatar = function(agent, size, state){
  size = size || 30; const st = state || agent.state || 'idle';
  return H.html(`<span class="av" data-state="${st}" title="${H.esc(agent.name)}" style="--s:${size}px;background-image:url(${tile(agent)})"><span class="ring"></span></span>`);
};
H.mark = (size=22) => H.html(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-label="Hermes"><path d="M3 14c5 0 9-3 12-9"/><path d="M6 18c5 0 10-4 13-10"/><path d="M10 21c4.5 0 9-4 11-9"/></svg>`);
})();

/* js/glyphs.js */
/* Pixel glyphs for the mosaic illustrations.
   One char per pixel: '.' is transparent, letters are H.PAL keys (js/mosaic.js).
   Every glyph is <= 17x17 and odd so the engine centres it on the 33x33 tile and
   adds the navy halo; no outline is drawn here. Bright inks only (w c G g a q p m u e l),
   dark n only for small inner detail. */
(function(){
const H = window.H = window.H || {};
H.glyphs = Object.assign(H.glyphs || {}, {

  /* home: chat bubble with a four-point burst */
  home: [
    '.................',
    '.................',
    '..GGGGGGGGGGGGG..',
    '.GGGGGGGGGGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGwwwGGGGGG.',
    '.GGGGwwwwwwwGGGG.',
    '.GGGGGGwwwGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGGwGGGGGGG.',
    '.GGGGGGGGGGGGGGG.',
    '..GGGGGGGGGGGGG..',
    '...GGGG..........',
    '...GGG...........',
    '...GG............',
    '.................'
  ],

  /* inbox: open envelope, letter peeking out, small spark */
  inbox: [
    '.................',
    '..............w..',
    '.....wwwwwww.www.',
    '.....wwwwwww..w..',
    '.....wgggggw.....',
    '.....wggggww.....',
    '.....wwwwwww.....',
    '..aGGGGGGGGGGGa..',
    '.GGaGGGGGGGGGaGG.',
    '.GGGaGGGGGGGaGGG.',
    '.GGGGaGGGGGaGGGG.',
    '.GGGGGaGGGaGGGGG.',
    '.GGGGGGaGaGGGGGG.',
    '.GGGGGGGaGGGGGGG.',
    '.GGGGGGGGGGGGGGG.',
    '..GGGGGGGGGGGGG..',
    '.................'
  ],

  /* routines: round clock at 8:00 with four rays */
  routines: [
    '.................',
    '.w.............w.',
    '........G........',
    '.....GGGGGGG.....',
    '....GGccaccGG....',
    '...GGcccacccGG...',
    '...GccccaccccG...',
    '...GccccaccccG...',
    '..GGccccaccccGG..',
    '...GcccacccccG...',
    '...GccaccccccG...',
    '...GGcccccccGG...',
    '....GGcccccGG....',
    '.....GGGGGGG.....',
    '........G........',
    '.w.............w.',
    '.................'
  ],

  /* library: open book, bookmark ribbon, spark */
  library: [
    '.................',
    '...G.............',
    '..GGG.....mmm....',
    '...G......mmm....',
    '....ccccacmmm....',
    '...cccccacmmmc...',
    '..ccccccacmmmcc..',
    '..ccccccacmmmcc..',
    '..ccccccacmcmcc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '..ccccccacccccc..',
    '.aaaaaaaaaaaaaaa.',
    '.................',
    '.................'
  ],

  /* channels: lattice antenna tower with signal arcs */
  channels: [
    '.................',
    '.................',
    '........w........',
    '...q....G....q...',
    '...q....G....q...',
    '..q...q.G.q...q..',
    '..q..q..G..q..q..',
    '..q..q.GGG.q..q..',
    '...q..qG.Gq..q...',
    '...q..G...G..q...',
    '......GaaaG......',
    '.....G.....G.....',
    '.....GaaaaaG.....',
    '....G.......G....',
    '....GGGGGGGGG....',
    '.................',
    '.................'
  ],

  /* insights: five rising bars, star over the tallest */
  insights: [
    '.................',
    '..............G..',
    '.............GGG.',
    '..............G..',
    '.................',
    '..............ww.',
    '...........gg.ww.',
    '...........gg.ww.',
    '........gg.gg.ww.',
    '........gg.gg.ww.',
    '.....gg.gg.gg.ww.',
    '.....gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '..gg.gg.gg.gg.ww.',
    '.................'
  ],

  /* settings: gear with a round centre hole */
  settings: [
    '.................',
    '......GGGGG......',
    '......GGGGG......',
    '.....ggggggg.....',
    '....ggggggggg....',
    '...ggggggggggg...',
    '.GGgggggngggggGG.',
    '.GGggggnnnggggGG.',
    '.GGgggnnnnngggGG.',
    '.GGggggnnnggggGG.',
    '.GGgggggngggggGG.',
    '...ggggggggggg...',
    '....ggggggggg....',
    '.....ggggggg.....',
    '......GGGGG......',
    '......GGGGG......',
    '.................'
  ],

  /* history: hourglass with sand in both halves */
  history: [
    '.................',
    '..GGGGGGGGGGGGG..',
    '...ccccccccccc...',
    '....caaaaaaac....',
    '.....caaaaac.....',
    '......caaac......',
    '.......cac.......',
    '........a........',
    '........a........',
    '........a........',
    '.......cac.......',
    '......caaac......',
    '.....caaaaac.....',
    '....caaaaaaac....',
    '...caaaaaaaaac...',
    '..GGGGGGGGGGGGG..',
    '.................'
  ],

  /* terminal: window frame, prompt chevron, cursor */
  terminal: [
    '.................',
    '.................',
    '..GGGGGGGGGGGGG..',
    '..GaaaaaaaaaaaG..',
    '..GawawawaaaaaG..',
    '..GaaaaaaaaaaaG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnwnnqqnnnnG..',
    '..GnnnwnqqnnnnG..',
    '..GnnwnnqqnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GnnnnnnnnnnnG..',
    '..GGGGGGGGGGGGG..',
    '.................'
  ],

  /* clear: big check inside a ring */
  clear: [
    '.................',
    '......eeeee......',
    '....eeeeeeeee....',
    '...eeeeeeeeeee...',
    '..eeennnnnnneee..',
    '..eeennnnnnneee..',
    '.eeennnnnnnwneee.',
    '.eeennnnnnwwneee.',
    '.eeewwnnnwwnneee.',
    '.eeenwwnwwnnneee.',
    '.eeennwwwwnnneee.',
    '..eeennwnnnneee..',
    '..eeennnnnnneee..',
    '...eeeeeeeeeee...',
    '....eeeeeeeee....',
    '......eeeee......',
    '.................'
  ]

});
})();

/* js/stage.js */
/* Stage kit: one goal per screen.  H.stage(def, ctx) builds a flat colour field with a giant background title,
   a big pixel mosaic, one sentence, one primary action and a few doorways. Anything more opens in the drawer (workbench). */
(function(){
const H = window.H, h = H.h;
H.work = H.work || {};   // dense workbench modules, mounted inside the drawer: H.work.<name>.render(root, ctx)

/* ---------- drawer: expandable sidebar that slides in from the right ---------- */
H.drawer = function(o){
  const scrim = h('div.dscrim'); const body = h('div.dbody');
  const title = h('h2', o.title || '');
  const close = () => { if (dr._closing) return; dr._closing = true; scrim.classList.remove('on'); aside.classList.remove('on'); document.removeEventListener('keydown', esc); setTimeout(() => { scrim.remove(); aside.remove(); }, 380); o.onClose && o.onClose(); };
  const esc = e => { if (e.key === 'Escape') close(); };
  const aside = h('aside.drawer', {style:o.width?{width:o.width}:null, role:'dialog','aria-modal':'true','aria-label':o.title || 'Details', 'data-ch':o.ch || ''},
    h('header.dhead', title, h('span.grow'), o.actions || null, h('button.btn.ghost.icon', {'aria-label':'Close', onclick:close}, H.ic('x'))), body);
  scrim.onclick = close; document.addEventListener('keydown', esc);
  document.body.append(scrim, aside);
  requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('on'); aside.classList.add('on'); }));
  const dr = {el:aside, body, close, setTitle:t => { title.textContent = t; }}; return dr;
};

/* ---------- fit the giant title to the stage width ---------- */
function fitTitle(stage, t){
  const fit = () => { const w = stage.clientWidth; if (!w) return; t.style.fontSize = '100px'; const tw = t.scrollWidth || 1; const size = Math.min(100 * (w * 0.94) / tw, stage.clientHeight * 0.52); t.style.fontSize = Math.max(64, size) + 'px'; };
  new ResizeObserver(fit).observe(stage); fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
}

/* ---------- the stage ---------- */
H.stage = function(def, ctx){
  const art = def.art === false ? null : H.mosaic(Object.assign({size:33, seed:def.seed || 7, glyph:def.glyph}, def.art || {}));
  const title = h('h1.stage-title', def.title);
  const lead = h('p.stage-lead', {'data-rise':1}, def.lead || '');
  const sub = def.sub ? h('p.stage-sub', {'data-rise':2}, def.sub) : null;
  const actions = h('div.stage-actions', {'data-rise':3});
  if (def.primary) actions.append(h('button.btn.primary.big', {onclick:def.primary.onclick}, def.primary.label, H.ic('chev','arrow')));
  if (def.secondary) actions.append(h('button.btn.big.line', {onclick:def.secondary.onclick}, def.secondary.label));
  const doors = (def.doors && def.doors.length) ? h('nav.stage-doors', {'data-rise':4, 'aria-label':def.title+' sections'}, ...def.doors.map(d => h('button.door', {onclick:()=>openWork(d.tab)}, h('span', d.label), d.count != null ? h('span.dn.num', String(d.count)) : null, H.ic('chev','sm arrow')))) : null;
  const copy = h('div.stage-copy', lead, sub, actions, doors, def.foot || null);
  const handle = def.work ? h('button.stage-handle', {'aria-label':def.handle || 'Open all', onclick:()=>openWork()}, h('span.hl', def.handle || 'Everything'), def.handleCount != null ? h('span.hc.num', String(def.handleCount)) : null, H.ic('chevu','sm')) : null;
  const el = h('section.stage', {'data-ch':def.ch || 'home'}, title, art ? h('div.stage-art', {'data-rise':0}, art) : null, copy, handle);
  let dr = null;
  function openWork(tab){
    if (!def.work) return;
    if (dr) { if (!tab) return; const d = dr; dr = null; d.close(); setTimeout(() => openWork(tab), 400); return; }
    dr = H.drawer({title:def.workTitle || def.title, ch:def.ch, onClose:() => { dr = null; if (location.hash.split('/').length > 2 || def.dropHashOnClose !== false) history.replaceState(null,'','#/'+def.name); }});
    const root = h('div.wb'); dr.body.append(root);
    const m = H.work[def.work]; const c = Object.assign({}, ctx, {route: tab ? [tab] : (ctx.route || [])});
    if (m) m.render(root, c); else root.append(h('div.empty', 'Workbench not loaded'));
    if (tab) history.replaceState(null, '', '#/'+def.name+'/'+tab);
  }
  requestAnimationFrame(() => { fitTitle(el, title); });
  const api = {el, openWork, update(args){ if (args && args[0] && def.work) openWork(args[0]); }, state(s){ art && art.setState && art.setState(s); }, art};
  if (ctx && ctx.route && ctx.route[0] && def.work) setTimeout(() => openWork(ctx.route[0]), 360);
  def.mount && def.mount(el, api, ctx);
  return api;
};
/* convenience: register a stage as a view */
H.defineStage = function(def){
  H.views[def.name] = { title:def.title, render(root, ctx){ const s = H.stage(def, ctx); root.append(s.el); return s; } };
};
})();

/* js/views/inbox.js */
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
const NEEDS = ['approval','clarify','secret','browser'];

/* --- rows: shared sample data + two extra mock rows for secret / browser handoff --- */
const ITEMS = H.data.inbox.map(i => Object.assign({}, i));

ITEMS[0].cmd = 'hermes gateway restart';
ITEMS[0].cwd = '~/hermes-maintenance';
ITEMS[0].why = 'Heartbeat gaps persist after the 21:04 restart. Two gaps of 41 s and 49 s were recorded in the last hour; the dashboard still answers on :9119. A clean restart should clear the stale worker. Active sessions will see “Turn lost during restart” and can be resumed.';
ITEMS[0].requested = '4m ago';

ITEMS[1].question = 'Which account should replies come from?';
ITEMS[1].why = 'Two sending identities are configured for atomicmail. The thread has 6 drafts ready to send; picking one here applies to the whole batch.';

ITEMS[2].summary = 'Last night’s archive opened in a scratch directory and every table passed integrity checks. state.db, its -wal and -shm were copied together, so no checkpoint was lost.';
ITEMS[2].artifacts = [
  {path:'scripts/verify-backup.sh', add:18, del:2},
  {path:'logs/backup-2026-11-18.log', add:41, del:0},
  {path:'notes/backups.md', add:6, del:1},
];

ITEMS[3].error = 'HTTP 429 from provider "google" after 2 attempts (retry-after: 60s).\nFallback deepseek-flash timed out after 60s with no first token.';
ITEMS[3].retries = [
  {model:'gemini-flash', role:'Primary', at:'14:02', note:'429 Too many requests · retry-after 60 s', tone:'neg'},
  {model:'deepseek-flash', role:'Fallback 1', at:'14:04', note:'No first token in 60 s', tone:'neg'},
  {model:'hermes-local', role:'Fallback 2', at:'14:05', note:'Not tried · no local model loaded', tone:''},
];
ITEMS[3].routine = 'Routine “Weekly cost report” · Mon 14:02 · cron';

ITEMS[4].branch = 'ui-redesign';
ITEMS[4].files = [
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

ITEMS.push({
  id:'i6', kind:'secret', thread:'t-gw', agent:'hermes',
  title:'Needs the Telegram bot token', body:'TELEGRAM_BOT_TOKEN is unset in .env', age:'21m', unread:true,
  secretName:'TELEGRAM_BOT_TOKEN', varName:'TELEGRAM_BOT_TOKEN',
  why:'The gateway restarted cleanly but the Telegram channel stays disconnected until the bot token is present. Hermes will not read the value back, and it will not appear in the transcript.',
});
ITEMS.push({
  id:'i7', kind:'browser', thread:'t-ui', agent:'hermes',
  title:'Paused on a GitHub login page', body:'Needs a signed-in session to read the token list', age:'6m', unread:true,
  page:'https://github.com/settings/tokens', waiting:'3m',
  why:'Hermes opened its own Chromium session to check whether the existing PAT still has repo scope. GitHub asked for a password, so the run is holding here instead of guessing.',
});

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
  resolvedById[it.id] = {action, tone:tone || 'pos', by:'you', when:'just now', note:note || '', answer:answer || ''};
  confirmId = null;
  detailOpen = true;
  draw();
  toast(action + ' · ' + it.title.toLowerCase());
}

/* ---------- list pane ---------- */
function head(){
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

function rowsNode(){
  const list = visible();
  if (!list.length){
    return H.h('div.empty.inbox-none',
      H.ic('inbox','lg'),
      H.h('div', 'Nothing matches this view'),
      H.h('div.inbox-none-s', q ? 'Try another word, or switch back to All.' : 'Items you resolve leave the Needs you count.')
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
    H.h('span', paused ? 'Paused · nothing new will start' : 'Checking state.db every 5 s · last 12 s ago')
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
  if (paused){
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
    if (!inited){
      inited = true;
      sel = isNarrow() ? null : (ITEMS[0] ? ITEMS[0].id : null);
    }
    draw();
  },
};
})();

/* js/views/routines.js */
/* Routines · scheduled jobs, webhook triggers and the shared task board.
   Registers H.views.routines. Owns js/views/routines.js + css/routines.css. */
(function(){
'use strict';
const H = window.H;
const MIN = 60000, HOUR = 3600000, DAY = 86400000;
const DOW_LONG = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DOW_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const MONTH_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TABS = [{id:'schedules',label:'Schedules'},{id:'triggers',label:'Triggers'},{id:'board',label:'Board'}];

/* Sample clock: the prototype is a still frame of a Thursday morning. Keeping the
   clock fixed makes “last run”, “next run” and the Today strip agree with each other. */
const NOW = (function(){ const d = new Date(); d.setHours(10,42,0,0); return d; })();
const TODAY = (function(){ const d = new Date(NOW); d.setHours(0,0,0,0); return d; })();

const pad2 = n => String(n).padStart(2,'0');
const fmtHM = d => pad2(d.getHours()) + ':' + pad2(d.getMinutes());
const fmtRun = d => DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()] + ', ' + fmtHM(d);
const fmtShort = d => DOW_SHORT[d.getDay()] + ' ' + d.getDate() + ' ' + MONTH_SHORT[d.getMonth()];
const addDays = (d,n) => { const x = new Date(d); x.setDate(x.getDate()+n); return x; };

function relAt(d){
  if(!d) return '–';
  const diff = Math.max(0, NOW.getTime() - d.getTime());
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
  const diff = Math.round((day - TODAY)/DAY);
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
    const step = Math.max(1, Number(s.n) || 1) * (s.unit === 'minutes' ? MIN : HOUR);
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
    const step = Math.max(1, Number(s.n) || 1) * (s.unit === 'minutes' ? MIN : HOUR);
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
    const step = Math.max(1, Number(s.n) || 1) * (s.unit === 'minutes' ? MIN : HOUR);
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
    const unit = s.unit === 'minutes' ? 'minute' : 'hour';
    if(n === 1) return 'Every ' + unit;
    return 'Every ' + n + ' ' + unit + 's';
  }
  if(s.kind === 'cron') return 'Cron · ' + s.expr;
  return 'No schedule';
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
    if(s.kind === 'every') at = new Date(lastAt.getTime() - i * Math.max(1, Number(s.n) || 1) * (s.unit === 'minutes' ? MIN : HOUR));
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
  return H.pill('–', '');
}

/* =====================================================================
   SCHEDULES
   ===================================================================== */
function buildTimeline(){
  const enabled = state.routines.filter(function(r){ return r.enabled; });
  const rows = [];
  let nextAt = null, nextR = null;
  enabled.forEach(function(r){
    const times = fireTimes(r.schedule, TODAY);
    times.forEach(function(t){
      if(t > NOW && (!nextAt || t < nextAt)){ nextAt = t; nextR = r; }
    });
    if(times.length) rows.push({r:r, times:times});
  });

  const labels = H.h('div.routines-tl-labels');
  const lanes = H.h('div.routines-tl-lanes');
  rows.forEach(function(row){
    labels.appendChild(H.h('span.routines-tl-label', {title:row.r.name}, row.r.name));
    const lane = H.h('div.routines-tl-lane');
    row.times.forEach(function(t){
      const pct = ((t.getHours()*60 + t.getMinutes()) / 1440) * 100;
      let cls = ' later';
      if(t <= NOW) cls = '';
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
  const nowPct = ((NOW.getHours()*60 + NOW.getMinutes()) / 1440) * 100;
  const nowLine = H.h('span.routines-tl-now', {style:{left:nowPct + '%'}, title:'Now · ' + fmtHM(NOW)});
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

function buildRoutineRow(r){
  const agent = H.agent(r.agent) || H.agent('hermes');
  const last = H.h('div.routines-last');
  if(r.lastAt){
    last.appendChild(statusPill(r.lastStatus || 'ok'));
    last.appendChild(H.h('span.routines-when', relAt(r.lastAt)));
  } else {
    last.appendChild(H.h('span.routines-when', 'Never run'));
  }

  const nf = r.enabled ? nextFire(r.schedule, NOW) : null;
  const next = H.h('div.routines-next', H.h('span.num', nf ? fmtNext(nf) : '–'));

  const nameCell = H.h('div.routines-name',
    H.avatar(agent, 30, 'idle'),
    H.h('div.routines-nm',
      H.h('span.routines-title', r.name),
      H.h('span.routines-sched', scheduleLabel(r.schedule))
    )
  );
  const meta = H.h('div.routines-meta',
    H.h('div.routines-deliver', H.pill(r.deliver)),
    last,
    next
  );
  const switchCell = H.h('div.routines-switch', H.sw(r.enabled, function(v){
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
  const agent0 = H.agent(r.agent) || H.agent('hermes');

  openPanel('Routine ' + r.name, function(panel, close){
    const head = drawerHead('Routine',
      H.h('div.routines-dt-row', H.avatar(agent0, 34, 'idle'), H.h('h2', r.name)),
      scheduleLabel(r.schedule) + ' · ' + r.deliver,
      close
    );

    const body = H.h('div.routines-dbody');

    if(r.lastStatus === 'failed' && r.failure){
      body.appendChild(H.h('div.routines-fail',
        H.h('strong', 'Last run failed'),
        H.h('p', r.failure)
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
      {id:'cron', label:'Cron'},
    ], draft.schedule.kind, function(id){
      const time = draft.schedule.time || '09:00';
      if(id === 'every') draft.schedule = {kind:'every', n:4, unit:'hours'};
      else if(id === 'daily') draft.schedule = {kind:'daily', time:time};
      else if(id === 'weekly') draft.schedule = {kind:'weekly', days:[1,2,3,4,5], time:time};
      else draft.schedule = {kind:'cron', expr:'0 8 * * 1-5'};
      drawEditor();
    });
    scheduleBlock.appendChild(seg);
    scheduleBlock.appendChild(fields);
    scheduleBlock.appendChild(preview);
    scheduleBlock.appendChild(H.h('div.routines-hint', 'Runs on the gateway clock · local time'));
    body.appendChild(scheduleBlock);

    function updatePreview(){
      const runs = nextRuns(draft.schedule, NOW, 3);
      preview.classList.remove('bad');
      preview.replaceChildren();
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
        [['minutes','minutes'],['hours','hours']].forEach(function(o){
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
    const agentSel = H.h('select.select', {'aria-label':'Agent profile'});
    H.data.agents.forEach(function(a){
      agentSel.appendChild(H.h('option', {value:a.id, selected: draft.agent === a.id ? 'selected' : null}, a.name + ' · ' + a.role.split(' · ')[0]));
    });
    agentSel.onchange = function(){ draft.agent = agentSel.value; };

    const modelSel = H.h('select.select', {'aria-label':'Model override'});
    const defaultAgent = H.agent(draft.agent) || agent0;
    modelSel.appendChild(H.h('option', {value:'', selected: draft.model === '' ? 'selected' : null}, 'Agent default · ' + defaultAgent.model));
    H.data.models.forEach(function(m){
      modelSel.appendChild(H.h('option', {value:m.id, selected: draft.model === m.id ? 'selected' : null}, m.id));
    });
    modelSel.onchange = function(){ draft.model = modelSel.value; };

    const deliverSel = H.h('select.select', {'aria-label':'Deliver to'});
    ['Telegram','Email','Thread only'].forEach(function(d){
      deliverSel.appendChild(H.h('option', {value:d, selected: draft.deliver === d ? 'selected' : null}, d));
    });
    deliverSel.onchange = function(){ draft.deliver = deliverSel.value; };

    body.appendChild(H.h('div.routines-fields',
      H.h('div.field', H.h('label', 'Agent'), agentSel),
      H.h('div.field', H.h('label', 'Model override'), modelSel)
    ));
    body.appendChild(H.h('div.field.routines-deliverfield',
      H.h('label', 'Deliver to'), deliverSel,
      H.h('span.hint', 'Telegram and Email go through the gateway; Thread only keeps the output in a thread.')
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
      const add = H.h('button.btn.sm.routines-addskill', {type:'button'}, H.ic('plus','sm'), 'Add skill');
      add.onclick = function(){
        const avail = SKILL_LIBRARY.filter(function(x){ return draft.skills.indexOf(x) === -1; });
        if(!avail.length){ notify('All sample skills are attached'); return; }
        draft.skills.push(avail[0]);
        paintSkills();
        notify('Attached ' + avail[0]);
      };
      chips.appendChild(add);
      if(!draft.skills.length) chips.appendChild(H.h('span.routines-hint', 'No skills attached'));
    }
    paintSkills();
    body.appendChild(skillBox);

    /* run history */
    const histBlock = H.h('div.routines-block.routines-hist');
    histBlock.appendChild(H.h('div.routines-lab-row',
      H.h('span.routines-lab', 'Run history'),
      H.h('span.routines-hint', 'Last ' + Math.min(8, r.runs.length || 0) + ' runs')
    ));
    const runs = (r.runs || []).slice(0, 8);
    if(!runs.length){
      histBlock.appendChild(H.h('div.routines-runs-empty', 'No runs yet. The first run will appear here.'));
    } else {
      const runList = H.h('div.routines-runs');
      runs.forEach(function(run, i){
        const expanded = i === 0 && run.status === 'failed';
        const out = H.h('div.routines-run-out', expanded ? {} : {hidden:true}, H.h('pre', run.out || 'No output captured.'));
        const headBtn = H.h('button.routines-run-h', {'aria-expanded':String(expanded), type:'button'},
          statusPill(run.status),
          H.h('span.routines-run-time.num', fmtRun(run.at)),
          H.h('span.routines-run-d.num', run.status === 'skipped' ? '–' : run.duration + 's'),
          H.h('span.routines-run-t.num', run.status === 'skipped' ? '–' : (run.tokens/1000).toFixed(1) + 'k'),
          H.h('span.routines-run-c.num', run.status === 'skipped' ? '–' : H.fmt.usd(run.cost)),
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
    body.appendChild(histBlock);

    const foot = H.h('div.routines-dfoot',
      H.h('button.btn.ghost', {type:'button', onclick:function(){
        if(state.paused){ notify('Paused · resume to run routines'); return; }
        notify('Queued “' + r.name + '” · it will run at the next dispatch tick');
      }}, H.ic('play','sm'), 'Run now'),
      H.h('span.grow'),
      H.h('button.btn', {type:'button', onclick:close}, 'Cancel'),
      H.h('button.btn.primary', {type:'button', onclick:function(){
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
  }, {onClose:refresh});
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
        H.h('span', q ? 'Try a name, agent or delivery target.' : 'Create one from a sentence.')));
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

function openNewRoutine(){
  let parsed = null;
  const ta = H.h('textarea.textarea.routines-ta', {rows:'3', 'aria-label':'Describe the routine', placeholder:'Every weekday at 8 summarise my inbox and send it to Telegram'});
  const preview = H.h('div.routines-parse-empty', 'Parsed schedule, agent and delivery appear here as you type.');
  const create = H.h('button.btn.primary', {type:'submit'}, 'Create routine');
  create.disabled = true;

  function parsedCard(p){
    const agent = H.agent(p.agent) || H.agent('hermes');
    const row = function(label, value){
      return H.h('div.routines-parse-row', H.h('span.routines-parse-l', label), H.h('div.routines-parse-v', value));
    };
    return H.h('div.routines-parse-card',
      H.h('div.routines-parse-h', 'Parsed from your sentence'),
      row('Name', p.name),
      row('Schedule', H.h('span.routines-parse-sched', H.pill(scheduleLabel(p.schedule), p.note ? 'warn' : ''), p.note ? H.h('span.routines-parse-note', p.note) : null)),
      row('Agent', H.h('span.routines-parse-agent', H.avatar(agent, 22, 'idle'), agent.name)),
      row('Delivers to', H.pill(p.deliver))
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

function buildWebhookRow(w){
  const url = webhookUrl(w.route);
  const urlTxt = H.h('span.routines-url-txt.mono', url);
  const copyBtn = H.h('button.btn.icon.ghost.routines-copy', {'aria-label':'Copy URL for ' + w.route, title:'Copy URL', type:'button'},
    H.ic('copy','sm'));
  copyBtn.onclick = function(){ copyText(url, 'Webhook URL copied'); };

  const last = H.h('span.routines-trig-last');
  if(w.last){
    last.appendChild(H.pill(String(w.last.code), w.last.code >= 200 && w.last.code < 300 ? 'pos' : 'neg'));
    last.appendChild(H.h('span.muted', relAt(w.last.at)));
  } else {
    last.appendChild(H.h('span.muted', 'No deliveries yet'));
  }

  return H.h('div.routines-trig-row',
    H.h('div.routines-trig-main',
      H.h('div.routines-trig-top',
        H.h('span.routines-trig-name', w.route),
        H.pill(w.source)
      ),
      H.h('div.routines-url', urlTxt, copyBtn),
      H.h('div.routines-trig-meta',
        H.h('span.routines-sig', H.ic('key','sm'), 'HMAC SHA-256 · secret set'),
        H.h('span.routines-metadot', '·'),
        H.h('span', 'Last delivery'),
        last
      )
    ),
    H.h('div.routines-trig-actions',
      H.h('button.btn.sm', {type:'button', onclick:function(){ sendTest(w); }}, 'Send test event')
    )
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
  wrap.appendChild(H.h('div.routines-sec-h',
    H.h('h2', 'Webhook subscriptions'),
    H.h('span.routines-count', state.webhooks.length + ' routes'),
    H.h('span.grow'),
    newBtn
  ));

  const trigCard = H.h('div.card.routines-trigs');
  state.webhooks.forEach(function(w){ trigCard.appendChild(buildWebhookRow(w)); });
  wrap.appendChild(trigCard);
  wrap.appendChild(H.h('p.routines-note', 'Every route accepts POST at /p/default/webhooks/<route> on port 8644 and verifies an HMAC SHA-256 signature before the prompt runs.'));

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

function openNewWebhook(){
  const routeIn = H.h('input.input', {type:'text', placeholder:'github-push', 'aria-label':'Route name'});
  const promptIn = H.h('textarea.textarea.routines-ta', {rows:'5', 'aria-label':'Prompt template', placeholder:'Summarise this event and send it to Telegram:\n{payload}'});
  const deliverSel = H.h('select.select', {'aria-label':'Deliver to'});
  ['Telegram','Email','Thread only'].forEach(function(d){
    deliverSel.appendChild(H.h('option', {value:d, selected:d === 'Telegram' ? 'selected' : null}, d));
  });
  const urlPrev = H.h('div.routines-urlprev.mono', webhookUrl('github-push'));
  const err = H.h('div.routines-formerr', {hidden:true});
  const form = H.h('form.routines-modal', {onsubmit:function(e){
    e.preventDefault();
    let route = routeIn.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    if(!/^[a-z0-9][a-z0-9-]{1,39}$/.test(route)){
      err.textContent = 'Route needs 2–40 lowercase letters, digits or dashes.';
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
      H.h('span.hint', 'Lowercase letters, digits and dashes. The URL is built for the default profile.'),
      urlPrev
    ),
    H.h('div.field',
      H.h('label', 'Prompt template'),
      promptIn,
      H.h('span.hint', 'Use {payload} where the JSON body should go.')
    ),
    H.h('div.field', H.h('label', 'Deliver to'), deliverSel),
    err,
    H.h('div.routines-modal-foot',
      H.h('button.btn', {type:'button', onclick:function(){ modal.close(); }}, 'Cancel'),
      H.h('button.btn.primary', {type:'submit'}, 'Create webhook')
    )
  );

  routeIn.oninput = function(){
    const slug = routeIn.value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
    urlPrev.textContent = webhookUrl(slug || '…');
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

function buildBoard(){
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
  const pauseBtn = H.h('button.btn.ghost', {type:'button', onclick:function(){
    state.paused = !state.paused;
    refresh();
    notify(state.paused ? 'Dispatch paused · cron and kanban stopped' : 'Dispatch resumed');
  }}, H.ic(state.paused ? 'play' : 'pause','sm'), state.paused ? 'Resume all' : 'Pause all');

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
  const inner = H.h('div.page-in' + (tab === 'board' ? '.routines-wide' : ''));

  inner.appendChild(renderPageHead());

  if(state.paused){
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

  const tabs = H.tabs(TABS.map(function(t){
    const count = t.id === 'schedules' ? state.routines.length : t.id === 'triggers' ? state.webhooks.length : state.cards.length;
    return {id:t.id, label:t.label, count:count};
  }), state.tab, function(id){
    if(state.tab === id) return;
    state.tab = id;
    state.scroll = 0;
    setHash(id);
    renderView(root, {route:[id], go:ctx.go, toast:ctx.toast, openThread:ctx.openThread});
  });
  inner.appendChild(tabs);

  const content = H.h('div.routines-content');
  if(tab === 'schedules') content.appendChild(buildSchedules());
  else if(tab === 'triggers') content.appendChild(buildTriggers());
  else content.appendChild(buildBoard());
  inner.appendChild(content);

  page.appendChild(inner);
  page.addEventListener('scroll', function(){ state.scroll = page.scrollTop; }, {passive:true});
  root.appendChild(page);
  currentPage = page;
  page.scrollTop = state.scroll;
}

H.views.routines = {
  title: 'Routines',
  render: function(root, ctx){ renderView(root, ctx || {}); }
};
})();

/* js/views/library.js */
/* Library · skills, memory, tools, files. Owned by the library view author. */
(function(){
const H = window.H, h = H.h;
const TABS = [
  {id:'skills', label:'Skills', icon:'sparkle'},
  {id:'memory', label:'Memory', icon:'brain'},
  {id:'tools',  label:'Tools',  icon:'plug'},
  {id:'files',  label:'Files',  icon:'folder'},
];

/* ---------------------------------------------------------------- data */
function S(name, desc, source, uses, steps, cmd, extra){
  extra = extra || {};
  return {id:name, name, desc, source, uses, steps, cmd,
    version: extra.v || '1.0.0', updated: extra.u || 'Nov 12',
    pinned: !!extra.pin, enabled: extra.enabled !== false,
    when: extra.when || '', notes: extra.notes || ''};
}
const SKILLS = [
  S('web-research','Search the web and read pages, with citations.','Built-in',12,
    ['Turn the request into two or three concrete queries.','Open at most six sources; primary docs beat blog summaries.','Record URL, title and date for every claim you keep.','Answer in your own words, then list the sources.'],
    'hermes web search "python 3.14 free-threading" --json | jq .results[0]',
    {pin:true,v:'1.4.0',u:'Nov 12',when:'Use for anything that may have changed since training, or when a claim needs a date and a source.',
     notes:'Caps at six sources and never cites a page it did not open. Roughly 1.8k tokens before the answer starts.'}),
  S('backup-verify','Check last night’s backup without touching live state.','Hub',8,
    ['Copy state.db, -wal and -shm together into a scratch directory.','Run hermes sessions verify against the copy.','Compare file counts and size with the manifest.','Report pass, or the first failing check · do not repair.'],
    'hermes backup verify ~/.hermes/backups/2026-11-18.zip',
    {v:'2.3.0',u:'Nov 18',when:'After the 02:30 backup, or whenever someone asks whether last night’s archive is safe to rely on.',
     notes:'Read-only against the live database. A failed verify blocks the retention job but deletes nothing.'}),
  S('gateway-debugging','Trace heartbeat gaps, then restart the gateway safely.','Mine',6,
    ['Read the last 200 lines of logs/gateway.log.','Check holder PIDs with hermes doctor before restarting.','Stop the dashboard, then the gateway; wait for zero holders.','Start one owner and confirm a heartbeat for 60 s.'],
    'hermes doctor --json | jq \'.holders\'',
    {v:'1.1.2',u:'Nov 19',when:'The rail shows a stale heartbeat, a turn is lost after a restart, or sessions stop answering.',
     notes:'A restart drops in-flight turns. The thread shows “Turn lost during restart” and can resume. Needs your approval.'}),
  S('inbox-triage','Sort atomicmail into replies, archive and needs-you.','Hub',14,
    ['Fetch unread since the last run, capped at 40 messages.','Group by sender and thread; never answer one thread twice.','Draft replies in the user’s voice with no greeting.','Escalate anything about money, contracts or legal dates.'],
    'hermes skills run inbox-triage --account support@ --limit 40',
    {v:'1.8.0',u:'Nov 17',when:'The morning triage turn runs, or you ask what is waiting in the inbox.',
     notes:'Drafts only. Sending needs approval unless the thread is marked auto-send; archive is always allowed.'}),
  S('shell-safety','Block destructive commands before they run.','Built-in',31,
    ['Read the command and its working directory.','Refuse rm -rf, dd to a device, and writes outside the project.','Offer a dry run with --dry-run where the tool supports it.','Log the refusal with the thread id.'],
    'hermes hooks test tool.pre --cmd "rm -rf ~/hermes-maintenance"',
    {u:'Oct 30',notes:'Fires on every tool call that starts a shell. A refusal costs one turn, not a filesystem.'}),
  S('pdf-reader','Extract text and tables from PDFs up to 200 pages.','Built-in',4,
    ['Check the page count before reading; refuse above 200 pages.','Extract text per page and keep table structure.','Quote the page number with each extracted figure.'],
    'hermes pdf text ~/Downloads/invoice-1182.pdf --pages 1-3',{u:'Nov 02'}),
  S('cron-authoring','Write and validate Hermes routines.','Built-in',9,
    ['Start from an existing routine in ~/.hermes/cron.','Keep the schedule in UTC and the delivery target explicit.','Validate before saving; a bad cron line fails silently otherwise.'],
    'hermes cron validate ~/.hermes/cron/cost-report.yaml',{u:'Nov 09'}),
  S('drive-upload','Upload large files to the OCI Drive folder.','Mine',5,
    ['Confirm the file is inside the OCI-owned workspace.','Upload with the user’s OAuth token, never the service account.','Print the Drive id and the local size after upload.'],
    'gdrive-upload.py build/hermes-2026-11-18.zip --parent 19c3PDevfxqyIe_5WSeCuWeYDw0Jg-8e-',{u:'Nov 06'}),
  S('writing-voice','Match the user’s tone: plain, terse, no preamble.','Mine',9,
    ['Lead with the answer in one sentence.','Cut greetings, restatements and closing offers.','Use sentence case and digits for numbers.','Read the draft back once for filler.'],
    'hermes skills test writing-voice --input draft.md',{pin:true,u:'Nov 14'}),
  S('mcp-setup','Add and test MCP servers without breaking running threads.','Built-in',3,
    ['Prefer stdio for local servers and http only for hosted ones.','Store tokens in auth.json, never in config.yaml.','Run hermes mcp test before telling anyone it works.'],
    'hermes mcp test github --verbose',{u:'Oct 30'}),
  S('python-env','Use hermes pm’s Python 3.14, never system pip.','Built-in',18,
    ['Call hermes pm run instead of python directly.','Install packages with hermes pm add, not pip.','Check hermes pm doctor when the interpreter misbehaves.'],
    'hermes pm run python -c "import sys; print(sys.version)"',{u:'Nov 11'}),
  S('release-notes','Turn a diff into release notes a person will read.','Hub',2,
    ['Collect commits since the last tag.','Group by what changed for a user, not by file.','Name the fix, the version and anything that needs a migration.'],
    'hermes skills run release-notes --range v0.8..HEAD',{u:'Nov 05'}),
  S('postgres-explain','Read a query plan and say what to index.','Hub',7,
    ['Run EXPLAIN (ANALYZE, BUFFERS) on a read-only connection.','Find the heaviest node, not the first seq scan.','Propose one index with the trade-off stated.'],
    'hermes mcp call postgres explain --sql "select * from sessions where updated_at > now() - interval \'1 day\'"',{u:'Nov 08'}),
  S('doc-outline','Outline a doc before writing it.','Mine',4,
    ['Write the reader’s question as the title.','List sections as claims, not nouns.','Stop at five sections; split the doc if it needs more.'],
    'hermes skills run doc-outline --topic "gateway restart"',{u:'Nov 07'}),
  S('arxiv-digest','Summarise new papers in a category since last week.','Hub',1,
    ['Fetch the category listing for the window.','Pick five papers by relevance, not by citation count.','Give one sentence of method and one of why it matters.'],
    'hermes skills run arxiv-digest --cat cs.DC --since 7d',{u:'Nov 03'}),
  S('screenshot-diff','Compare two UI screenshots and name the regressions.','Hub',0,
    ['Align both shots to the same viewport and theme.','Diff the pixels, then read the changed regions.','Report layout first, colour second, copy third.'],
    'hermes skills run screenshot-diff before.png after.png',{u:'Oct 29',enabled:false}),
  S('kanban-grooming','Keep the task board honest: merge, close, reorder.','Built-in',6,
    ['Close cards with no activity for 14 days.','Merge duplicates and keep the older id.','Move blocked cards to the top of their column.'],
    'hermes board list --stale 14d',{u:'Nov 10'}),
  S('telegram-format','Format replies for Telegram: short lines, no tables.','Built-in',22,
    ['Keep paragraphs under four lines.','Replace tables with labelled lines.','Use bold only for the first line of a list.'],
    'hermes skills run telegram-format --file reply.md',{u:'Nov 01'}),
  S('worktree-review','Review a worktree diff before it lands.','Built-in',11,
    ['Read the diff in file order, then the tests.','Check for scope creep before style.','Name one blocking issue at most.'],
    'hermes review --worktree ~/hermes-maintenance/.worktrees/ui-redesign',{u:'Nov 16'}),
  S('secret-hygiene','Keep secrets out of notes, logs and commits.','Mine',3,
    ['Scan the diff for key-shaped strings before committing.','Reference env keys by name only.','Redact caught values in the transcript.'],
    'hermes doctor secrets --path .',{u:'Nov 13'}),
  S('session-recovery','Salvage a session after a crash or bad restore.','Built-in',2,
    ['Stop every state.db holder before touching files.','Copy db, -wal and -shm together.','Run hermes sessions recover against the copy, never the original.'],
    'hermes sessions recover --dry-run',{u:'Oct 28'}),
  S('sqlite-inspect','Read state.db safely with the WAL attached.','Built-in',5,
    ['Open in read-only mode with the sidecars present.','Never copy state.db alone.','Explain the schema before writing a query.'],
    'sqlite3 "file:$HOME/.hermes/state.db?mode=ro" ".tables"',{u:'Nov 15'}),
  S('typescript-migrate','Move a JS file to strict TypeScript in small steps.','Built-in',1,
    ['Rename the file, then fix imports.','Type the exported surface first.','Turn on strict per file; keep the build green after each step.'],
    'npx tsc --noEmit --strict src/imap.ts',{u:'Oct 27'}),
  S('accessibility-audit','Check a page against WCAG AA with a real browser.','Built-in',0,
    ['Open the page in the Docker Chromium.','Check names, contrast, focus order and 200% zoom.','Report by user impact, not by rule id.'],
    'hermes browser a11y http://127.0.0.1:9119 --level AA',{u:'Nov 04'}),
  S('test-triage','Read a failing test run and name the first real cause.','Mine',7,
    ['Read the first failure, not the loudest.','Reproduce it alone before reading more code.','Fix the cause; only then re-run the suite.'],
    'hermes pm run pytest -x -q',{u:'Nov 18'}),
  S('log-digest','Turn a log window into five lines and one cause.','Built-in',8,
    ['Filter to the incident window first.','Group repeated lines and count them.','Name one likely cause and one check that would confirm it.'],
    'journalctl -u hermes-gateway --since "2 hours ago" | hermes log digest',{u:'Nov 09'}),
  S('browser-traces','Capture a Playwright trace and read the failing step.','Built-in',3,
    ['Record with screenshots and network on.','Find the first step whose screenshot differs.','Quote the selector and the response status.'],
    'hermes browser trace --url http://127.0.0.1:9222',{u:'Oct 31'}),
  S('api-contract','Compare an OpenAPI diff and flag breaking changes.','Mine',2,
    ['Diff paths, parameters and response shapes.','Mark removed fields and narrowed types as breaking.','Suggest a version bump only when a client breaks.'],
    'hermes skills run api-contract --old openapi-v1.json --new openapi-v2.json',{u:'Nov 06'}),
  S('voice-notes','Turn a voice memo into decisions and tasks.','Mine',1,
    ['Transcribe with timestamps.','Separate decisions from discussion.','Create tasks only for things with an owner.'],
    'hermes transcribe ~/voice/2026-11-18.m4a',{u:'Oct 26'}),
  S('link-archiver','Save a page with a snapshot and a date.','Built-in',0,
    ['Fetch the page and store the readable text.','Keep the original URL, fetch date and content hash.','Say when a page was already archived.'],
    'hermes web archive https://docs.python.org/3.14/whatsnew/3.14.html',{u:'Oct 25'}),
  S('pricing-page-review','Read a pricing page and list what changed.','Mine',2,
    ['Snapshot the page and diff against the last copy.','Extract plan names, prices and limits.','Flag anything that would change an invoice.'],
    'hermes browser snapshot https://stripe.com/pricing',{u:'Nov 02'}),
  S('model-routing','Pick the cheapest model that can finish the task.','Built-in',12,
    ['Estimate context and output size first.','Use flash for reads, sonnet for edits, opus for design.','Fall back only on provider errors, never on cost.'],
    'hermes models route --task "summarise 40 emails"',{u:'Nov 12'}),
  S('oauth-debug','Fix an expired MCP OAuth token without a restart.','Mine',2,
    ['Read the failing server’s last test result.','Re-auth with hermes mcp auth, then test again.','Only restart the gateway if the token file is held open.'],
    'hermes mcp auth linear --reauth',{u:'Nov 19'}),
  S('rss-brief','Build a five-item brief from subscribed feeds.','Mine',0,
    ['Fetch the last 24 hours across feeds.','Pick five items by relevance to open threads.','Give each item one line and a link.'],
    'hermes rss brief --since 24h',{u:'Oct 24'}),
];

const HUB = [
  {name:'pdf-forms', desc:'Fill, flatten and sign PDF forms without a GUI.', meta:'2.1k installs · hub team · v1.3', cat:'Documents'},
  {name:'stripe-billing', desc:'Read invoices, dunning and MRR the way finance does.', meta:'1.4k installs · billing guild · v2.0', cat:'Finance'},
  {name:'k8s-triage', desc:'The first ten minutes of a sick cluster.', meta:'890 installs · ops guild · v0.9', cat:'Ops'},
  {name:'playwright-traces', desc:'Record a browser run and read the failing step.', meta:'1.2k installs · hub team · v1.1', cat:'Browser'},
  {name:'sqlite-repair', desc:'Recover a state.db copy with its WAL attached.', meta:'640 installs · data guild · v1.0', cat:'Data'},
  {name:'semantic-scholar', desc:'Find papers by claim, not just by title.', meta:'510 installs · research guild · v0.7', cat:'Research'},
  {name:'terraform-plan', desc:'Explain a plan before anyone types apply.', meta:'780 installs · ops guild · v1.4', cat:'Ops'},
  {name:'figma-to-css', desc:'Turn a frame into tokens, spacing and layout.', meta:'960 installs · design guild · v0.6', cat:'Design'},
  {name:'webhook-debug', desc:'Replay and inspect webhook deliveries.', meta:'420 installs · hub team · v1.0', cat:'Ops'},
  {name:'cost-audit', desc:'Find the expensive calls in a trace.', meta:'530 installs · finance guild · v1.2', cat:'Finance'},
];
const BUNDLES = [
  {name:'Web research', desc:'Search, read and archive sources with citations.', members:['web-research','pdf-reader','arxiv-digest','rss-brief','link-archiver'], fit:'Best for Scout'},
  {name:'Backend review', desc:'Read the diff, the plan and the failing test before it lands.', members:['postgres-explain','api-contract','test-triage','shell-safety','worktree-review'], fit:'Best for Hermes'},
  {name:'Writing', desc:'Keep prose plain, short and in the user’s voice.', members:['writing-voice','release-notes','doc-outline','telegram-format'], fit:'All profiles'},
];

const MEMORIES = [
  {id:'m1', text:'Prefers terse replies with no preamble · answer first, reasoning after.', thread:'t-ui', date:'Nov 14'},
  {id:'m2', text:'This machine is an OCI Ampere arm64 VM with 24 GB RAM and no GPU.', thread:'t-gw', date:'Oct 12'},
  {id:'m3', text:'The gateway dashboard is loopback-only on :9119; the API is on :8642.', thread:'t-gw', date:'Nov 16'},
  {id:'m4', text:'Backups are only valid when state.db, -wal and -shm are restored together.', thread:'t-bk', date:'Nov 18'},
  {id:'m5', text:'The OCI Drive folder holds files over 100 MB and is shared with the service account.', thread:'t-ml', date:'Oct 28'},
  {id:'m6', text:'Address the user as “you” in summaries; never use their name.', thread:'t-ui', date:'Nov 05'},
  {id:'m7', text:'Atomicmail triage runs at 07:30 on weekdays against the support account.', thread:'t-tri', date:'Nov 11'},
  {id:'m8', text:'No host Chromium: browser work runs in the chromium-cdp container on :9222.', thread:'t-mcp', date:'Oct 30'},
  {id:'m9', text:'The weekly cost report is due Mondays at 09:00 and delivered to Telegram.', thread:'t-ci', date:'Nov 09'},
  {id:'m10', text:'Ledger owns billing and cron; Hermes owns maintenance and UI work.', thread:'t-ci', date:'Oct 22'},
  {id:'m11', text:'Commit messages are sentence case, with no conventional-commit prefixes.', thread:'t-ui', date:'Nov 14'},
  {id:'m12', text:'Python work uses 3.14 from hermes pm; system pip and apt packages are off-limits.', thread:'t-pr', date:'Nov 02'},
];

const JOURNEY = [
  {day:'Today · Nov 19', items:[
    {kind:'skill', title:'Created skill gateway-debugging', meta:'Learned from “Gateway heartbeat gaps after restart”. 6 uses since.'},
    {kind:'memory', title:'Remembered the gateway is loopback-only', meta:'From “Gateway heartbeat gaps after restart”. Replaces a vaguer note.'},
    {kind:'correction', title:'Stopped proposing system pip for Python work', meta:'Correction from you · now uses hermes pm for every interpreter call.'},
  ]},
  {day:'Yesterday · Nov 18', items:[
    {kind:'skill', title:'Updated backup-verify to 2.3.0', meta:'Added the manifest check after a restore drill caught 3 missing files.'},
    {kind:'memory', title:'Remembered that db, -wal and -shm travel together', meta:'From “Verify last night’s backup zip”.'},
  ]},
  {day:'Nov 17', items:[
    {kind:'skill', title:'Created skill inbox-triage', meta:'Drafted from 40 sorted messages; you edited 12 drafts before it settled.'},
  ]},
  {day:'Nov 14', items:[
    {kind:'correction', title:'Commit messages: sentence case, no prefixes', meta:'Correction from you after a “feat:” commit.'},
    {kind:'memory', title:'Remembered the terse-reply preference', meta:'From “Redesign the web UI”. Reinforced twice.'},
    {kind:'skill', title:'Pinned writing-voice', meta:'Curator pinned it after 9 uses in one week.'},
  ]},
  {day:'Nov 12', items:[
    {kind:'memory', title:'Remembered the OCI Drive folder policy', meta:'From “Compare three SMTP providers”.'},
    {kind:'skill', title:'Created skill drive-upload', meta:'Built after two manual uploads in one day.'},
  ]},
  {day:'Nov 09', items:[
    {kind:'memory', title:'Remembered the weekly cost report schedule', meta:'From “Cron: weekly cost report”.'},
    {kind:'correction', title:'Ledger, not Hermes, owns billing', meta:'Correction from you after a misrouted invoice question.'},
  ]},
  {day:'Nov 04', items:[
    {kind:'skill', title:'Updated web-research to 1.4.0', meta:'Now caps sources at six and requires a URL per claim.'},
    {kind:'memory', title:'Remembered the Docker-only browser rule', meta:'From “Test the three MCP servers”.'},
  ]},
  {day:'Oct 30', items:[
    {kind:'skill', title:'Created skill mcp-setup', meta:'First version after wiring github and postgres.'},
    {kind:'memory', title:'Remembered Python 3.14 lives in hermes pm', meta:'From “What changed in Python 3.14.2?”.'},
  ]},
];

const TOOLSETS = [
  {id:'web', name:'Web', desc:'Search the web and read pages, with citations.', tools:6},
  {id:'terminal', name:'Terminal', desc:'Run shell commands on this machine.', tools:4, risky:true},
  {id:'file', name:'Files', desc:'Read, write and organize files in the project root.', tools:7},
  {id:'browser', name:'Browser', desc:'Drive the Docker Chromium over CDP, logged in as you.', tools:9},
  {id:'code', name:'Code execution', desc:'Run Python and Node snippets in a sandbox.', tools:3, risky:true},
  {id:'vision', name:'Vision', desc:'Read screenshots, diagrams and scanned pages.', tools:2},
  {id:'image', name:'Image generation', desc:'Generate and edit images from a prompt.', tools:2, cost:'≈ $0.04 per image'},
  {id:'delegation', name:'Delegation', desc:'Hand work to another agent or a cheaper model.', tools:3},
  {id:'memory', name:'Memory', desc:'Read and write MEMORY.md, USER.md and SOUL.md.', tools:5},
  {id:'cron', name:'Cron', desc:'Create and edit routines, schedules and triggers.', tools:4},
  {id:'mcp', name:'MCP', desc:'Call tools exposed by connected MCP servers.', tools:0},
  {id:'board', name:'Task board', desc:'Create and move cards on the kanban board.', tools:3},
];
const SCOPE_DEFAULTS = {
  hermes:['web','terminal','file','browser','code','memory','cron','mcp','board'],
  scout:['web','browser','file','vision','memory','mcp'],
  ledger:['file','terminal','cron','memory','mcp','board'],
  thread:['web','file'],
};
const scopeLabel = {hermes:'Hermes', scout:'Scout', ledger:'Ledger', thread:'this thread'};

function T(name, desc, on){ return {name, desc, on:on !== false}; }
const MCP_SEED = [
  {id:'github', name:'github', desc:'Issues, pull requests and code search for this repo.', transport:'stdio',
   cmd:'npx -y @modelcontextprotocol/server-github', status:'connected', lastTest:'2m ago', oauth:false,
   tools:[T('search_repositories','Search repos by name, topic or owner'),T('get_file_contents','Read a file at a ref'),T('create_pull_request','Open a pull request from a branch'),T('list_issues','List issues with labels'),T('add_issue_comment','Comment on an issue'),T('get_pull_request_diff','Fetch a PR diff'),T('list_workflow_runs','List recent Actions runs'),T('merge_pull_request','Merge a PR when checks pass',false)]},
  {id:'postgres', name:'postgres', desc:'Read-only SQL against the local hermes database.', transport:'stdio',
   cmd:'npx -y @modelcontextprotocol/server-postgres ~/.hermes', status:'connected', lastTest:'1h ago', oauth:false,
   tools:[T('query','Run a read-only SQL query'),T('list_tables','List tables and views'),T('describe_table','Show columns and indexes'),T('explain','Explain a query plan'),T('list_schemas','List schemas'),T('list_extensions','List installed extensions')]},
  {id:'linear', name:'linear', desc:'Issues and projects for the ops team.', transport:'http',
   url:'https://mcp.linear.app/sse', status:'failed', lastTest:'12m ago', oauth:true,
   error:'401 Unauthorized · the OAuth token expired 3 days ago.',
   tools:[T('list_issues','List issues by team and state'),T('create_issue','Create an issue in a team'),T('update_issue','Change state, assignee or title'),T('add_comment','Comment on an issue'),T('list_projects','List projects and cycles')]},
  {id:'notion', name:'notion', desc:'Project notes and the OCI runbook.', transport:'http',
   url:'https://mcp.notion.com/mcp', status:'connected', lastTest:'26m ago', oauth:true,
   tools:[T('search','Search pages and databases'),T('fetch_page','Read a page as markdown'),T('create_page','Create a page under a parent',false),T('update_page','Append to or edit a page'),T('list_databases','List shared databases')]},
];
const PLUGIN_SEED = [
  {id:'browser-use', name:'browser-use', version:'2.4.1', latest:'2.5.0', desc:'Browser harness and CDP tools.', on:true},
  {id:'taste-skill', name:'taste-skill', version:'2.0.0', latest:null, desc:'Frontend art direction and review.', on:true},
  {id:'web-research', name:'web-research', version:'1.9.3', latest:'2.0.0', desc:'Search, scraping and citation helpers.', on:true},
  {id:'google-workspace', name:'google-workspace', version:'0.8.2', latest:null, desc:'Drive, Docs, Sheets and Calendar.', on:true},
  {id:'honcho-memory', name:'honcho-memory', version:'0.3.1', latest:'0.4.0', desc:'External memory provider adapter.', on:false},
];
const HOOK_SEED = [
  {id:'session.start', event:'session.start', script:'~/.hermes/hooks/load-context.sh', on:true},
  {id:'tool.pre', event:'tool.pre', script:'~/.hermes/hooks/guard-destructive.sh', on:true},
  {id:'turn.end', event:'turn.end', script:'~/.hermes/hooks/cost-log.py', on:true},
  {id:'approval.request', event:'approval.request', script:'~/.hermes/hooks/notify-telegram.sh', on:true},
];

/* -------------------------------------------------------------- files */
const SOUL_TEXT = [
  '# SOUL.md · who Hermes is','',
  'You are Hermes: a persistent engineer for this machine, not a chatbot.',
  'You work in threads, keep state across turns, and say what you did.','',
  '## Voice','- Plain, terse, factual. Answer first, reasoning second.',
  '- No preamble, no “Great question”, no closing offers.','- Sentence case in prose and in commit messages.',
  '- Numbers as digits; use an en dash for a missing value.','',
  '## Boundaries','- Ask before anything that spends money, sends mail, or deletes data.',
  '- Never print secrets; reference .env keys by name only.','- Prefer one owner process for state.db at a time.',
  '- Read before writing; verify after writing.','',
  '## Defaults','- Model: claude-sonnet-5-5. Fall back to deepseek-flash for bulk reads.',
  '- Profile: default. Ledger owns cron and billing; Scout owns research.',
  '- Browser work runs in the Docker CDP container, never on the host.','',
  '## What “done” means','A change is done when the check passed, the diff is small, and the next',
  'person can see why. Otherwise say what is still open.',
].join('\n');

const CONFIG_TEXT = [
  'profile: default','model: claude-sonnet-5-5','fallback: deepseek-flash','reasoning: medium','',
  'gateway:','  dashboard_port: 9119','  api_port: 8642','  bind: 127.0.0.1','  autostart: true','',
  'memory:','  provider: built-in','  soul: ~/.hermes/SOUL.md','  max_facts: 400','',
  'curator:','  enabled: true','  interval: 6h','  merge_threshold: 0.82','  pin_after_uses: 8','',
  'tools:','  terminal:','    approval: ask','    timeout_s: 120','  browser:','    cdp_url: http://127.0.0.1:9222','',
  'skills:','  dirs:','    - ~/.hermes/skills','  hub: https://skills.hermes.dev',
].join('\n');

const MEMORY_MD = [
  '# MEMORY.md','<!-- long-term facts; appended by the agent, pruned by the curator -->',
  '- Machine: OCI Ampere arm64, 24 GB RAM, no GPU, 200 GB boot volume.',
  '- Gateway dashboard is loopback-only on :9119; API on :8642.',
  '- state.db, -wal and -shm are one image; back them up together.',
  '- Backup archives live in ~/.hermes/backups, kept for 14 days.',
  '- Python work uses 3.14 from hermes pm; system pip is off-limits.',
  '- No host Chromium: browser work runs in the chromium-cdp container.',
  '- The OCI Drive folder holds files over 100 MB.',
  '- Ledger owns billing and cron; Hermes owns maintenance.',
  '- Weekly cost report: Mondays 09:00, delivered to Telegram.',
  '- Commit messages are sentence case, no conventional-commit prefixes.',
].join('\n');

const USER_MD = [
  '# USER.md','- Address the user as “you”; no name in replies.',
  '- Prefers terse answers: no preamble, no restating the question.',
  '- Works from Ubuntu 24.04 on arm64, terminal-first, browser for reading.',
  '- Timezone UTC; working hours 08:00–19:00, quieter on Fridays.',
  '- Wants sources for factual claims and dates on anything time-sensitive.',
  '- Approves: restarts, backups, dependency upgrades. Asks first: money, mail, deletes.',
].join('\n');

const FACTS_JSONL = [
  '{"fact":"Machine is OCI Ampere arm64, 24 GB, no GPU","source":"thread/t-gw","learned":"2026-10-12"}',
  '{"fact":"Dashboard is loopback-only on :9119","source":"thread/t-gw","learned":"2026-11-16"}',
  '{"fact":"Backups include db, -wal and -shm","source":"thread/t-bk","learned":"2026-11-18"}',
  '{"fact":"No host Chromium; use the CDP container","source":"thread/t-mcp","learned":"2026-10-30"}',
  '{"fact":"Ledger owns billing and cron","source":"thread/t-ci","learned":"2026-10-22"}',
  '{"fact":"Python 3.14 via hermes pm only","source":"thread/t-pr","learned":"2026-11-02"}',
].join('\n');

const SKILL_WEB_MD = [
  '---','name: web-research','description: Search the web, read pages, and cite what you used.',
  'allowed-tools: web, browser, file','version: 1.4.0','---','',
  '# web-research','','Use for anything that may have changed since training, or when the user',
  'asks for sources.','','## Steps','1. Turn the request into two or three concrete queries.',
  '2. Open at most six sources; primary docs beat blog summaries.',
  '3. Record URL, title and date for every claim you keep.',
  '4. Answer in your own words, then list the sources.','','## Rules',
  '- Never invent a URL to fill a gap; say the source is missing.',
  '- Paywalled pages: quote the visible abstract only.',
  '- Prefer versions pinned in the project over “latest”.','',
  '## Verify','```bash','hermes web fetch https://docs.python.org/3.14/whatsnew/3.14.html | head -40','```',
].join('\n');

const SKILL_GATEWAY_MD = [
  '---','name: gateway-debugging','description: Trace heartbeat gaps and restart the gateway safely.',
  'allowed-tools: terminal, file','version: 1.1.2','---','','# gateway-debugging','',
  '## Steps','1. Read the last 200 lines of logs/gateway.log.',
  '2. Run hermes doctor and list every holder of state.db.',
  '3. Stop the dashboard, then the gateway. Wait for zero holders.',
  '4. Start one owner; confirm a heartbeat for 60 s.','',
  '## Guardrail','Restarting drops in-flight turns. Ask first.','',
  '```bash','hermes doctor --json | jq \'.holders\'','```',
].join('\n');

const SKILL_INBOX_MD = [
  '---','name: inbox-triage','description: Sort atomicmail into replies, archive and needs-you.',
  'allowed-tools: web, file, memory','version: 1.8.0','---','','# inbox-triage','',
  '## Steps','1. Fetch unread since the last run, cap 40.',
  '2. Group by sender and thread.','3. Draft replies in the user’s voice, no greeting.',
  '4. Escalate money, contracts and legal dates.','',
  '```bash','hermes skills run inbox-triage --account support@ --limit 40','```',
].join('\n');

const LOG_GATEWAY = [
  '2026-11-19T09:12:04Z INFO  gateway started pid=1020 profile=default',
  '2026-11-19T09:12:04Z INFO  dashboard listening on 127.0.0.1:9119',
  '2026-11-19T09:12:05Z INFO  api listening on 127.0.0.1:8642',
  '2026-11-19T09:12:05Z INFO  state.db opened (wal) holders=1',
  '2026-11-19T09:14:31Z INFO  turn t-ui model=claude-sonnet-5-5 tokens=18420',
  '2026-11-19T09:16:02Z WARN  heartbeat gap 4.2s (last=09:15:57)',
  '2026-11-19T09:16:07Z INFO  heartbeat resumed gap=4.2s',
  '2026-11-19T09:41:55Z INFO  turn t-gw state=waiting approval="gateway restart"',
  '2026-11-19T10:02:10Z INFO  curator run start skills=34 facts=12',
  '2026-11-19T10:02:14Z INFO  curator proposal merge backup-verify verify-backup overlap=0.84',
  '2026-11-19T10:02:14Z INFO  curator pinned writing-voice uses=9',
  '2026-11-19T10:02:15Z INFO  curator run done proposals=1 pinned=1 merged=0',
  '2026-11-19T10:20:44Z INFO  mcp test github tools=8 ok=8 latency=212ms',
  '2026-11-19T10:21:02Z WARN  mcp test linear status=401 token_expired=3d',
  '2026-11-19T10:21:02Z INFO  tools lost=5 server=linear action=needs_you',
].join('\n');

const LOG_CURATOR = [
  '2026-11-18T04:00:02Z run start skills=33 facts=11',
  '2026-11-18T04:00:05Z prune candidate backlog-triage last_used=41d',
  '2026-11-18T04:00:05Z kept backlog-triage reason=pinned_by_user',
  '2026-11-18T04:00:07Z merge proposal backup-verify + verify-backup overlap=0.84',
  '2026-11-18T04:00:08Z pin writing-voice uses_7d=9',
  '2026-11-18T04:00:08Z run done skills=33 facts=11 changes=2',
  '2026-11-19T10:02:10Z run start skills=34 facts=12',
  '2026-11-19T10:02:14Z merge proposal backup-verify + verify-backup overlap=0.84',
  '2026-11-19T10:02:15Z run done skills=34 facts=12 changes=1',
].join('\n');

const CRON_BACKUP = [
  'id: backup-verify','schedule: "30 2 * * *"','timezone: UTC',
  'skill: backup-verify','deliver: telegram','on_failure: notify',
  'command: hermes backup run --keep 14d && hermes backup verify --latest',
].join('\n');
const CRON_COST = [
  'id: cost-report','schedule: "0 9 * * 1"','timezone: UTC','agent: ledger',
  'skill: cost-report','deliver: telegram','on_failure: retry(2)',
  'command: hermes insights cost --range 7d --format brief',
].join('\n');

const PLUGIN_JSON = [
  '{','  "name": "browser-use",','  "version": "2.5.0",','  "entry": "plugin.py",',
  '  "tools": ["browser_navigate", "browser_click", "browser_screenshot"],',
  '  "requires": ["chromium-cdp:131"]','}',
].join('\n');

const ROOTS = [
  {id:'hermes', label:'~/.hermes', defaultSel:'SOUL.md', expanded:['memories','skills','cron','logs'], tree:[
    {name:'SOUL.md', content:SOUL_TEXT},
    {name:'config.yaml', content:CONFIG_TEXT},
    {name:'memories', type:'dir', children:[
      {name:'MEMORY.md', content:MEMORY_MD},
      {name:'USER.md', content:USER_MD},
      {name:'facts.jsonl', content:FACTS_JSONL},
    ]},
    {name:'skills', type:'dir', children:[
      {name:'web-research', type:'dir', children:[{name:'SKILL.md', content:SKILL_WEB_MD}]},
      {name:'gateway-debugging', type:'dir', children:[{name:'SKILL.md', content:SKILL_GATEWAY_MD}]},
      {name:'inbox-triage', type:'dir', children:[{name:'SKILL.md', content:SKILL_INBOX_MD}]},
    ]},
    {name:'cron', type:'dir', children:[
      {name:'backup-verify.yaml', content:CRON_BACKUP},
      {name:'cost-report.yaml', content:CRON_COST},
    ]},
    {name:'logs', type:'dir', children:[
      {name:'gateway.log', content:LOG_GATEWAY},
      {name:'curator.log', content:LOG_CURATOR},
    ]},
    {name:'plugins', type:'dir', children:[
      {name:'browser-use', type:'dir', children:[{name:'plugin.json', content:PLUGIN_JSON}]},
    ]},
    {name:'vault', type:'dir', children:[
      {name:'keys.enc', secret:true, size:'1 KB'},
    ]},
    {name:'.env', secret:true, size:'2 KB'},
    {name:'auth.json', secret:true, size:'4 KB'},
    {name:'state.db', binary:true, size:'84 MB'},
    {name:'kanban.db', binary:true, size:'212 KB'},
  ]},
  {id:'maint', label:'~/hermes-maintenance', defaultSel:'CLAUDE.md', expanded:['docs','prototype','ui-redesign'], tree:[
    {name:'CLAUDE.md', content:'# Hermes maintenance\n\nHermes Agent lives in ~/.hermes. Gateway is the canonical state.db writer.\nBack up before mutating. Quiesce before repair.\n'},
    {name:'README.md', content:'# hermes-maintenance\n\nDiagnosis notes and the UI redesign prototype.\n\n- docs/ · distilled wiki\n- prototype/ · static redesign, no build step\n'},
    {name:'docs', type:'dir', children:[
      {name:'index.md', content:'# Docs index\n\n- skills/enforcing-zero-process-barrier.md\n- skills/triaging-hermes-health.md\n- concepts/operational-invariants.md\n'},
      {name:'log.md', content:'## 2026-11-18\n- Backup drill passed (214 MB, 3,912 files).\n- Gateway restart protocol verified.\n'},
    ]},
    {name:'prototype', type:'dir', children:[
      {name:'index.html', content:'<title>Hermes</title>\n<link rel="stylesheet" href="css/base.css">\n<div id="app"></div>\n<script src="js/shell.js"></script>\n'},
      {name:'js', type:'dir', children:[
        {name:'views', type:'dir', children:[
          {name:'library.js', content:'/* Library view · skills, memory, tools, files. */\n(function(){\n  const H = window.H;\n  H.views.library = { render(root, ctx){ /* ... */ } };\n})();\n'},
        ]},
      ]},
      {name:'css', type:'dir', children:[
        {name:'library.css', content:'/* library view styles · prefix every class with .library- */\n'},
      ]},
    ]},
    {name:'ui-redesign', type:'dir', children:[
      {name:'WORKER-CONTRACT.md', content:'# Worker contract\n\nOwn js/views/<name>.js and css/<name>.css. No other edits.\nReuse base.css components and tokens. Verify with node --check.\n'},
    ]},
    {name:'backups', type:'dir', children:[{name:'2026-11-18.zip', binary:true, size:'214 MB'}]},
  ]},
  {id:'mail', label:'~/atomicmail', defaultSel:'README.md', expanded:['src','migrations'], tree:[
    {name:'README.md', content:'# atomicmail\n\nIMAP triage for the support inbox. Limits: 40 messages per run.\n'},
    {name:'package.json', content:'{\n  "name": "atomicmail",\n  "private": true,\n  "type": "module",\n  "scripts": { "test": "node --test", "dev": "tsx src/server.ts" }\n}\n'},
    {name:'src', type:'dir', children:[
      {name:'imap.ts', content:'import { ImapFlow } from "imapflow";\n\nexport async function connect(user: string, pass: string) {\n  const client = new ImapFlow({ host: "127.0.0.1", port: 993, secure: true, auth: { user, pass } });\n  await client.connect();\n  return client;\n}\n'},
      {name:'triage.ts', content:'export type Bucket = "reply" | "archive" | "needs-you";\n\nexport function sort(message: { subject: string; from: string }): Bucket {\n  if (/invoice|contract|legal/i.test(message.subject)) return "needs-you";\n  return "reply";\n}\n'},
      {name:'server.ts', content:'import { connect } from "./imap.js";\n\nconst client = await connect(process.env.IMAP_USER!, process.env.IMAP_PASS!);\nconsole.log("connected", client.mailbox?.path);\n'},
    ]},
    {name:'migrations', type:'dir', children:[
      {name:'0001_init.sql', content:'create table messages (\n  id text primary key,\n  thread_id text not null,\n  bucket text not null check (bucket in (\'reply\',\'archive\',\'needs-you\')),\n  learned_at timestamptz not null default now()\n);\n'},
    ]},
    {name:'.env', secret:true, size:'1 KB'},
  ]},
];

/* -------------------------------------------------------------- state */
const state = {
  root:null, ctx:null, tab:'skills', q:'', browse:'installed',
  skill:'web-research', attached:new Set(), disabled:new Set(),
  pinned:new Set(SKILLS.filter(s => s.pinned).map(s => s.id)),
  hubInstalled:new Set(), applied:new Set(), proposal:true, curatorRan:false,
  soul:SOUL_TEXT, soulDraft:SOUL_TEXT, preview:false,
  provider:'built-in', memories:MEMORIES.map(m => Object.assign({}, m)),
  journeyFilter:'all', scope:'hermes',
  scopes:{}, mcp:MCP_SEED.map(s => Object.assign({}, s, {tools:s.tools.map(t => Object.assign({}, t))})),
  plugins:PLUGIN_SEED.map(p => Object.assign({}, p)),
  hooks:HOOK_SEED.map(x => Object.assign({}, x)),
  expandedMcp:null, fileRoot:'hermes', fileSel:'SOUL.md',
  expanded:{hermes:new Set(ROOTS[0].expanded)},
};
Object.keys(SCOPE_DEFAULTS).forEach(k => { state.scopes[k] = new Set(SCOPE_DEFAULTS[k]); });
const expandedFor = id => {
  const r = ROOTS.find(x => x.id === id);
  if (!state.expanded[id]) state.expanded[id] = new Set(r ? r.expanded : []);
  return state.expanded[id];
};
let filterActive = () => {};

/* ------------------------------------------------------------ helpers */
const toast = m => { if (state.ctx && state.ctx.toast) state.ctx.toast(m); else H.toast(m); };
function pill(text, tone){ return H.pill(text, tone || ''); }
function mcpToolCount(){
  return state.mcp.reduce((n, s) => n + (s.status === 'connected' ? s.tools.filter(t => t.on).length : 0), 0);
}
function toolCount(){
  const set = state.scopes[state.scope];
  return TOOLSETS.reduce((n, t) => n + (set.has(t.id) ? (t.id === 'mcp' ? mcpToolCount() : t.tools) : 0), 0);
}
function scopeSummary(){
  const set = state.scopes[state.scope];
  return set.size + ' of 12 toolsets on · ' + toolCount() + ' tools available to ' + scopeLabel[state.scope];
}
function hiddenAttr(el, yes){ if (yes) el.setAttribute('hidden',''); else el.removeAttribute('hidden'); }
function num(v){ return h('span.num', String(v)); }
function emptyRow(text){ return h('div.library-nores', text); }

/* -------------------------------------------------------------- shell */
function pageEl(){
  const page = h('div.page.library-page');
  const inn = h('div.library-in');
  inn.append(headEl(), tabsEl(), contentEl());
  page.append(inn);
  return page;
}
function headEl(){
  const place = {skills:'Search skills…', memory:'Search memories…', tools:'Search tools, MCP, plugins…', files:'Search files…'}[state.tab];
  const input = h('input.input.library-searchinput', {type:'search', placeholder:place, value:state.q, 'aria-label':'Search '+state.tab,
    oninput:e => { state.q = e.target.value.trim().toLowerCase(); filterActive(state.q); }});
  return h('div.page-head.library-head',
    h('div.library-headmain',
      h('h1','Library'),
      h('p','Everything Hermes knows and can reach on this machine · skills, memory, tools and the home folder.')),
    h('div.grow'),
    h('div.library-search', H.ic('search','sm'), input));
}
function tabsEl(){
  const bar = H.tabs(TABS, state.tab, id => setTab(id));
  bar.setAttribute('aria-label','Library sections');
  return h('div.library-tabsbar', bar);
}
function setTab(id){
  if (!TABS.some(t => t.id === id)) return;
  state.tab = id; state.q = ''; state.browse = state.browse || 'installed';
  history.replaceState(null, '', '#/library/' + id);
  draw();
}
function draw(){
  const prev = state.root.querySelector('.library-page');
  const top = prev ? prev.scrollTop : 0;
  state.root.replaceChildren(pageEl());
  const next = state.root.querySelector('.library-page');
  if (next && top) next.scrollTop = top;
  if (state.q && filterActive) filterActive(state.q);
}
function refreshTab(){
  history.replaceState(null, '', '#/library/' + state.tab);
  draw();
}
function contentEl(){
  if (state.tab === 'memory') return buildMemory();
  if (state.tab === 'tools') return buildTools();
  if (state.tab === 'files') return buildFiles();
  return buildSkills();
}

/* ------------------------------------------------------------- skills */
function buildSkills(){
  const wrap = h('div.library-skills');
  const summary = h('div.library-summary');
  const summaryText = () => {
    const installed = 34 + state.hubInstalled.size;
    const hub = 6 + state.hubInstalled.size;
    return [num(installed), ' installed · ', num(hub), ' from the hub · ',
      state.curatorRan ? 'curator ran just now' : 'curator last ran 2h ago'];
  };
  summary.append.apply(summary, summaryText());
  const run = h('button.btn.primary', {onclick:() => {
    if (run.disabled) return;
    run.disabled = true; run.textContent = 'Curating…';
    setTimeout(() => {
      if (!run.isConnected) return;
      run.disabled = false; run.textContent = 'Run curator';
      state.curatorRan = true;
      summary.replaceChildren.apply(summary, summaryText());
      state.proposal = true;
      refreshTab();
      toast('Curator finished · 1 merge proposed, 2 skills pinned');
    }, 900);
  }}, 'Run curator');
  const bar = h('div.library-bar', summary, h('div.grow'), run);

  const seg = H.seg([{id:'installed',label:'Installed'},{id:'hub',label:'Hub'},{id:'bundles',label:'Bundles'}], state.browse, id => {
    state.browse = id; buildBody(); if (state.q) filterActive(state.q);
  });
  seg.setAttribute('aria-label','Browse the hub');
  const segRow = h('div.library-segrow', h('span.library-seglabel','Browse the hub'), seg);

  const body = h('div.library-bodyslot');
  wrap.append(bar, segRow, body);

  function buildBody(){
    body.replaceChildren();
    if (state.browse === 'hub') { body.append(hubGrid()); filterActive = filterHub; }
    else if (state.browse === 'bundles') { body.append(bundleGrid()); filterActive = filterBundles; }
    else { body.append(installedView()); filterActive = filterInstalled; }
  }

  function installedView(){
    const holder = h('div');
    if (state.proposal) holder.append(proposalCard());
    const split = h('div.library-split');
    const list = h('div.library-list', {role:'list', 'aria-label':'Installed skills'});
    const sorted = SKILLS.slice().sort((a,b) => {
      const pa = state.pinned.has(a.id) ? 1 : 0, pb = state.pinned.has(b.id) ? 1 : 0;
      return (pb - pa) || (b.uses - a.uses);
    });
    sorted.forEach(s => list.append(skillRow(s)));
    const detail = h('div.library-detail');
    detail.append(detailContent(currentSkill()));
    split.append(list, detail);
    holder.append(split, h('div.library-listfoot',
      h('span', '34 installed · 17 built-in, 11 yours, 6 from the hub'),
      h('span.faint', 'Pinned skills stay in context between turns')));
    holder.append(h('div.library-nores', {hidden:true}, 'No installed skills match that search.'));
    return holder;
  }

  function proposalCard(){
    const card = h('div.library-proposal',
      h('span.library-proposalicon', H.ic('sparkle','sm')),
      h('div.grow',
        h('div.library-proposaltitle','Merge 2 near-duplicate skills'),
        h('div.library-proposalsub','backup-verify and verify-backup overlap 84%. The curator keeps the pinned description and folds in 6 steps. Proposed 2h ago.')),
      h('button.btn.sm', {onclick:reviewMerge}, 'Review'),
      h('button.btn.ghost.sm', {onclick:() => { card.remove(); state.proposal = false; toast('Proposal dismissed · the curator will retry in 6h'); }}, 'Dismiss'));
    return card;
  }

  function skillRow(s){
    const isPinned = state.pinned.has(s.id);
    const enabled = !state.disabled.has(s.id);
    const row = h('div.library-skill', {'data-id':s.id,
      'data-search':(s.name+' '+s.desc+' '+s.source).toLowerCase(),
      'aria-current':String(s.id === state.skill)});
    const open = h('button.library-skill-open', {onclick:() => selectSkill(s.id), 'aria-label':'Open '+s.name},
      h('div.library-skill-top', h('span.library-sname', s.name), pill(s.source)),
      h('div.library-skill-desc', s.desc),
      h('div.library-skill-meta', 'used ', h('span.num', String(s.uses)), '× this month',
        isPinned ? h('span.library-pindot', ' · pinned') : null));
    const pin = h('button.library-pin', {'aria-pressed':String(isPinned), 'aria-label':(isPinned?'Unpin ':'Pin ')+s.name,
      title:isPinned?'Unpin':'Pin to context',
      onclick:() => {
        if (state.pinned.has(s.id)) { state.pinned.delete(s.id); toast('Unpinned '+s.name); }
        else { state.pinned.add(s.id); toast('Pinned '+s.name+' · stays in context'); }
        refreshTab();
      }}, H.ic('pin','sm'));
    const sw = H.sw(enabled, v => {
      if (v) { state.disabled.delete(s.id); toast(s.name+' enabled'); }
      else { state.disabled.add(s.id); toast(s.name+' disabled · stays installed'); }
    }, s.name+' enabled');
    row.append(open, h('div.library-skill-ctl', pin, sw));
    return row;
  }

  function selectSkill(id){
    state.skill = id;
    state.root.querySelectorAll('.library-skill').forEach(n => n.setAttribute('aria-current', String(n.dataset.id === id)));
    const detail = state.root.querySelector('.library-detail');
    if (detail) detail.replaceChildren(detailContent(currentSkill()));
  }

  function detailContent(s){
    const header = h('div.library-detail-h',
      h('div.grow',
        h('div.library-detail-title', h('h3', s.name), pill(s.source)),
        h('div.library-detail-meta',
          h('span','SKILL.md'), h('span.library-dotsep','·'),
          h('span','updated '+s.updated), h('span.library-dotsep','·'),
          h('span','used '), num(s.uses), h('span','× this month'))),
      h('div.library-detail-actions',
        attachBtn(s),
        h('button.btn.sm', {onclick:() => editSkill(s)}, 'Edit'),
        h('button.btn.ghost.sm', {onclick:() => toggleDisable(s)}, state.disabled.has(s.id) ? 'Enable' : 'Disable')));
    return h('div.library-detail-inner', header, skillDoc(s));
  }

  function attachBtn(s){
    const attached = state.attached.has(s.id);
    const b = h('button.btn.sm', {'aria-pressed':String(attached), onclick:() => {
      if (state.attached.has(s.id)) { state.attached.delete(s.id); b.textContent = 'Attach to this thread'; toast('Detached '+s.name); }
      else { state.attached.add(s.id); b.textContent = 'Attached'; toast('Attached '+s.name+' · 1.8k tokens'); }
      b.setAttribute('aria-pressed', String(state.attached.has(s.id)));
    }}, attached ? 'Attached' : 'Attach to this thread');
    return b;
  }

  function toggleDisable(s){
    if (state.disabled.has(s.id)) { state.disabled.delete(s.id); toast(s.name+' enabled'); }
    else { state.disabled.add(s.id); toast(s.name+' disabled · still on disk'); }
    refreshTab();
  }

  function skillDoc(s){
    const md = h('div.library-md');
    const b = h('div.library-md-body');
    const front = ['---','name: '+s.name,'description: '+s.desc,'version: '+s.version,'updated: '+s.updated,'---'].join('\n');
    b.append(h('pre.library-front', front));
    b.append(h('h2','When to use'), h('p', s.when || s.desc));
    b.append(h('h2','Steps'));
    const ol = h('ol.library-steps');
    s.steps.forEach(t => ol.append(h('li', t)));
    b.append(ol);
    if (s.cmd){
      b.append(h('h2','Verify'));
      b.append(h('div.library-preblock',
        h('div.library-prehead', h('span','bash'), h('span.faint','run from the project root')),
        h('pre.library-pre', h('code', s.cmd))));
    }
    b.append(h('h2','Notes'), h('p', s.notes || 'Read-only by default. Ask before writing outside the project root; every write leaves a diff in the thread.'));
    b.append(h('div.library-docfoot',
      h('span','Loaded only when relevant · '), num(1200 + s.name.length * 43), h('span',' tokens'),
      h('span.library-dotsep','·'),
      h('span', state.pinned.has(s.id) ? 'Pinned, so it stays between turns' : 'Not pinned')));
    md.append(b);
    return md;
  }

  function editSkill(s){
    const value = [
      '---','name: '+s.name,'description: '+s.desc,'version: '+s.version,'---','',
      '# '+s.name,'',s.when || s.desc,'','## Steps',
      s.steps.map((t,i) => (i+1)+'. '+t).join('\n'),'','## Verify','```bash',s.cmd,'```','','## Notes',s.notes || '',
    ].join('\n');
    const ta = h('textarea.textarea.library-editor', {'aria-label':'SKILL.md source'}, value);
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Edit '+s.name),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','SKILL.md is plain text. Saving re-indexes the skill for new turns; running threads keep the old copy.'),
      ta,
      h('div.library-modalfoot',
        h('span.faint','~/.hermes/skills/'+s.name+'/SKILL.md'),
        h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.primary', {onclick:() => {
          if (!ta.value.trim()){ ta.classList.add('library-invalid'); return; }
          m.close(); toast('Saved SKILL.md · curator re-indexes in 2m');
        }}, 'Save skill'))), {width:720});
  }

  function reviewMerge(){
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Merge 2 skills'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','The curator would keep backup-verify and fold in 6 steps from verify-backup. Pins, hub installs and running threads are untouched.'),
      h('div.library-compare',
        h('div.library-comparecol', h('div.library-comparehead', pill('Keep'), h('b','backup-verify')),
          h('p','Checks state.db, -wal and -shm in a scratch directory.'), h('span.faint','used 8× this month · pinned description')),
        h('div.library-comparecol', h('div.library-comparehead', pill('Fold in'), h('b','verify-backup')),
          h('p','Compares a zip against its manifest. 6 steps overlap with the skill on the left.'), h('span.faint','used 2× this month · last used 19 days ago'))),
      h('div.library-modalfoot',
        h('span.faint','A merge is reversible for 30 days'),
        h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Keep both'),
        h('button.btn.primary', {onclick:() => { m.close(); state.proposal = false; refreshTab(); toast('Merged 2 skills · backup-verify updated'); }}, 'Merge skills'))), {width:640});
  }

  function hubGrid(){
    const holder = h('div');
    const grid = h('div.library-hubgrid');
    HUB.forEach(x => {
      const installed = state.hubInstalled.has(x.name);
      const btn = h('button.btn.sm', installed ? {disabled:true} : {onclick:() => {
        state.hubInstalled.add(x.name); btn.textContent = 'Installed'; btn.disabled = true;
        summary.replaceChildren.apply(summary, summaryText());
        toast('Installed '+x.name+' · tools available next turn');
      }}, installed ? 'Installed' : 'Install');
      grid.append(h('div.library-hubcard', {'data-search':(x.name+' '+x.desc+' '+x.cat).toLowerCase()},
        h('div.library-hubtop', h('div', h('div.library-hubname', x.name), h('div.library-hubcat', x.cat)), btn),
        h('p.library-hubdesc', x.desc),
        h('div.library-hubmeta', x.meta)));
    });
    holder.append(h('div.library-hubhead',
      h('div', h('h2','Hub'), h('p','Reviewed skills you can install with one click. Pinned after 8 uses.')),
      h('span.faint','10 skills · updated this week')),
      grid, h('div.library-nores','No hub skills match that search.'));
    return holder;
  }
  function bundleGrid(){
    const holder = h('div');
    const grid = h('div.library-bundles');
    BUNDLES.forEach(b => {
      const applied = state.applied.has(b.name);
      const btn = h('button.btn.sm', applied ? {disabled:true} : {onclick:() => {
        state.applied.add(b.name); btn.textContent = 'Applied'; btn.disabled = true;
        toast('Applied “'+b.name+'” to Hermes · 0 conflicts');
      }}, applied ? 'Applied' : 'Apply');
      grid.append(h('div.library-bundle', {'data-search':(b.name+' '+b.desc+' '+b.members.join(' ')).toLowerCase()},
        h('div.library-hubtop', h('div', h('div.library-hubname', b.name), h('div.library-hubcat', b.fit)), btn),
        h('p.library-hubdesc', b.desc),
        h('div.library-members', b.members.map(n => h('span.library-member', n))),
        h('div.library-hubmeta', b.members.length+' skills · no dependencies')));
    });
    holder.append(h('div.library-hubhead',
      h('div', h('h2','Bundles'), h('p','Prepared sets for a kind of work. Applying a bundle turns its skills on; nothing is installed twice.')),
      h('span.faint','3 bundles · 14 skills')), grid,
      h('div.library-nores','No bundles match that search.'));
    return holder;
  }

  function filterInstalled(q){
    const items = wrap.querySelectorAll('.library-skill');
    let n = 0;
    items.forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) n++; });
    const nr = wrap.querySelector('.library-nores');
    if (nr) nr.hidden = n > 0;
    if (!q) items.forEach(el => el.hidden = false);
  }
  function filterHub(q){
    const items = wrap.querySelectorAll('.library-hubcard'); let n = 0;
    items.forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) n++; });
    const nr = wrap.querySelector('.library-nores'); if (nr) nr.hidden = n > 0;
  }
  function filterBundles(q){
    const items = wrap.querySelectorAll('.library-bundle'); let n = 0;
    items.forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) n++; });
    const nr = wrap.querySelector('.library-nores'); if (nr) nr.hidden = n > 0;
  }
  function filterSkills(q){
    if (state.browse === 'hub') filterHub(q);
    else if (state.browse === 'bundles') filterBundles(q);
    else filterInstalled(q);
  }

  buildBody();
  filterActive = filterSkills;
  return wrap;
}

function currentSkill(){ return SKILLS.find(s => s.id === state.skill) || SKILLS[0]; }

/* ------------------------------------------------------------- memory */
function buildMemory(){
  const wrap = h('div.library-memorywrap');
  const grid = h('div.library-memory');
  const facts = h('div.library-facts');
  const factsNone = h('div.library-nores', {hidden:true}, 'No memories match that search.');
  const memCount = pill('', '');
  const updateCount = () => {
    memCount.textContent = state.memories.length + ' facts';
  };
  updateCount();

  /* soul */
  const ta = h('textarea.textarea.library-soultext', {'aria-label':'SOUL.md', spellcheck:'false'}, state.soulDraft);
  const preview = h('div.library-reply', {hidden:true},
    h('div.library-replybubble',
      H.avatar(H.agent('hermes'), 26),
      h('div', h('div.library-replyname','Hermes'),
        h('p','Backup verified: 214 MB, 3,912 files. state.db, -wal and -shm restored cleanly in a scratch directory. Nothing needs you.'))),
    h('div.library-replymeta','Preview · sample turn, not saved'));
  ta.addEventListener('input', () => { state.soulDraft = ta.value; });
  const previewBtn = h('button.btn.ghost', {onclick:() => {
    const show = preview.hasAttribute('hidden');
    if (show){ preview.removeAttribute('hidden'); previewBtn.textContent = 'Hide preview'; }
    else { preview.setAttribute('hidden',''); previewBtn.textContent = 'Preview how it sounds'; }
  }}, 'Preview how it sounds');
  const soul = h('div.card.library-soul',
    h('div.card-h', h('span','Soul'), h('span.library-path','SOUL.md'),
      h('div.grow'), h('span.faint','Saved 12m ago')),
    h('div.card-b',
      h('p.library-hint','SOUL.md is prepended to every system prompt. Edit tone, boundaries and defaults · not facts; those go in memory.'),
      ta,
      h('div.library-soulrow',
        h('button.btn.primary', {onclick:() => {
          if (ta.value === state.soul){ toast('SOUL.md is already up to date'); return; }
          state.soul = ta.value; state.soulDraft = ta.value;
          toast('SOUL.md saved · takes effect next turn');
        }}, 'Save'),
        h('button.btn', {onclick:() => {
          state.soulDraft = state.soul; ta.value = state.soul;
          toast('Reverted to the saved SOUL.md');
        }}, 'Revert'),
        previewBtn,
        h('div.grow'),
        h('span.faint','~/.hermes/SOUL.md · 28 lines'))),
    preview);

  /* memories */
  function memRow(m){
    const row = h('div.library-mem', {'data-search':(m.text+' '+(m.thread ? (H.thread(m.thread) ? H.thread(m.thread).title : m.thread) : '')).toLowerCase()});
    const t = m.thread ? H.thread(m.thread) : null;
    row.append(
      h('div.library-mem-main',
        h('div.library-mem-text', m.text),
        h('div.library-mem-meta',
          t ? h('span', 'from ', h('button.library-link', {onclick:() => state.ctx.openThread(m.thread)}, t.title))
            : h('span', 'from this thread'),
          h('span.library-dotsep','·'), h('span','learned '+m.date))),
      h('button.btn.ghost.sm.library-forget', {onclick:() => {
        row.replaceChildren(
          h('div.library-confirmtext', 'Forget “'+(m.text.length > 74 ? m.text.slice(0,74)+'…' : m.text)+'”? ',
            h('span.faint','Removes it from MEMORY.md. The source thread keeps its copy.')),
          h('button.btn.sm.danger', {onclick:() => {
            state.memories = state.memories.filter(x => x.id !== m.id);
            row.remove(); updateCount(); paintProvider();
            if (!state.memories.length) facts.append(h('div.empty','Nothing remembered yet.'));
            toast('Forgotten · '+state.memories.length+' facts left');
          }}, 'Forget'),
          h('button.btn.ghost.sm', {onclick:() => row.replaceWith(memRow(m))}, 'Keep'));
      }}, 'Forget'));
    return row;
  }
  state.memories.forEach(m => facts.append(memRow(m)));

  const addInput = h('input.input', {placeholder:'Add a memory · e.g. “Invoices go to finance@”', 'aria-label':'Add a memory',
    onkeydown:e => { if (e.key === 'Enter') addMemory(); }});
  const err = h('div.library-err', {hidden:true}, 'Type a fact first.');
  const addBtn = h('button.btn', {onclick:addMemory}, 'Add');
  function addMemory(){
    const v = addInput.value.trim();
    if (!v){ err.removeAttribute('hidden'); addInput.classList.add('library-invalid'); return; }
    err.setAttribute('hidden',''); addInput.classList.remove('library-invalid');
    const m = {id:'m'+Date.now(), text:v, thread:null, date:'Today'};
    const empty = facts.querySelector('.empty');
    if (empty) empty.remove();
    state.memories.unshift(m);
    facts.prepend(memRow(m));
    addInput.value = ''; updateCount(); paintProvider();
    toast('Memory added · '+state.memories.length+' facts');
  }

  const providerStatus = h('span');
  const PSTAT = {
    'built-in':() => ['Active · '+state.memories.length+' facts in MEMORY.md','pos'],
    honcho:() => ['Connected · 2 peers, synced 2m ago','pos'],
    mem0:() => ['Needs an API key · add it in Settings → Keys','warn'],
    supermemory:() => ['Connected · 12 documents indexed','pos'],
  };
  function paintProvider(){
    const st = PSTAT[state.provider]();
    providerStatus.replaceChildren(h('span.dot' + (st[1] === 'pos' ? '.pos' : '.warn')), h('span', st[0]));
  }
  paintProvider();
  const provider = h('select.select.library-provider#library-provider-sel',
    { 'aria-label':'Memory provider', onchange:e => {
      state.provider = e.target.value; paintProvider();
      toast('Memory provider: '+e.target.options[e.target.selectedIndex].text);
    }},
    [['built-in','Built-in'],['honcho','Honcho'],['mem0','Mem0'],['supermemory','Supermemory']].map(([id,label]) =>
      h('option', {value:id, selected:state.provider === id}, label)));

  const memCard = h('div.card.library-memcard',
    h('div.card-h', h('span','What Hermes remembers'), memCount, h('div.grow'), h('span.faint','curator keeps 400 max')),
    h('div.library-providerrow',
      h('label', {for:'library-provider-sel'}, 'Memory provider'), provider, providerStatus),
    facts, factsNone,
    h('div.library-addmem', addInput, addBtn, err));

  /* journey */
  const journeyBox = h('div.library-journey');
  const noRes = h('div.library-nores', {hidden:true}, 'Nothing learned matches that search.');
  function journeyList(){
    const items = [];
    JOURNEY.forEach(g => {
      const group = h('div.library-jgroup');
      const entries = g.items.filter(x => state.journeyFilter === 'all' ||
        (state.journeyFilter === 'skills' ? x.kind === 'skill' : x.kind !== 'skill'));
      if (!entries.length) return;
      group.append(h('div.library-jday', h('span', g.day), h('span.faint', entries.length + (entries.length === 1 ? ' item' : ' items'))));
      const tl = h('div.library-tl');
      entries.forEach(x => tl.append(h('div.library-tev', {'data-search':(x.title+' '+x.meta+' '+x.kind).toLowerCase(), 'data-kind':x.kind},
        h('span.library-tdot' + (x.kind === 'correction' ? '.warn' : '')),
        h('div.library-tbody',
          h('div.library-ttitle', x.title),
          h('div.library-tmeta', h('span.library-tkind', x.kind === 'skill' ? 'Skill' : x.kind === 'correction' ? 'Correction' : 'Memory'),
            h('span.library-dotsep','·'), h('span', x.meta))))));
      group.append(tl);
      items.push(group);
    });
    journeyBox.replaceChildren.apply(journeyBox, items);
    if (!items.length) journeyBox.append(h('div.empty','Nothing in the last 3 weeks for this filter.'));
  }
  journeyList();
  const jseg = H.seg([{id:'all',label:'All'},{id:'skills',label:'Skills'},{id:'memories',label:'Memories'}], state.journeyFilter, id => {
    state.journeyFilter = id; journeyList(); if (state.q) filterMemory(state.q);
  });
  jseg.setAttribute('aria-label','Filter journey');
  const journey = h('div.sec.library-journeysec',
    h('div.library-journeyhead',
      h('div', h('h2','Journey'), h('p.library-hint','What Hermes learned in the last three weeks · skills, memories and corrections.')),
      h('div.grow'), jseg),
    journeyBox, noRes);

  grid.append(soul, memCard);
  wrap.append(grid, journey);

  function filterMemory(q){
    let nf = 0;
    facts.querySelectorAll('.library-mem').forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) nf++; });
    factsNone.hidden = nf > 0;
    let nj = 0;
    journeyBox.querySelectorAll('.library-tev').forEach(el => { const hit = !q || el.dataset.search.includes(q); el.hidden = !hit; if (hit) nj++; });
    journeyBox.querySelectorAll('.library-jgroup').forEach(g => {
      g.hidden = !g.querySelector('.library-tev:not([hidden])');
    });
    noRes.hidden = nj > 0;
  }
  filterActive = filterMemory;
  return wrap;
}

/* -------------------------------------------------------------- tools */
function buildTools(){
  const wrap = h('div.library-toolswrap');
  const scope = h('select.select.library-scope#library-scope-sel', {
    'aria-label':'Toolsets for', onchange:e => {
      state.scope = e.target.value;
      grid.replaceChildren.apply(grid, toolCards());
      updateSummary();
      if (state.q) filterTools(state.q);
    }},
    [['hermes','Hermes'],['scout','Scout'],['ledger','Ledger'],['thread','This thread']].map(([id,label]) =>
      h('option', {value:id, selected:state.scope === id}, label)));
  const summary = h('div.library-summary', {'data-toolsummary':''}, scopeSummary());
  const bar = h('div.library-bar',
    h('label.library-inline-label', {for:'library-scope-sel'}, 'For:'), scope, summary,
    h('div.grow'), h('span.faint','Changes apply to new turns'));

  const grid = h('div.library-toolgrid');
  function toolCards(){
    return TOOLSETS.map(t => {
      const on = state.scopes[state.scope].has(t.id);
      const count = t.id === 'mcp' ? mcpToolCount() : t.tools;
      const sw = H.sw(on, v => {
        const set = state.scopes[state.scope];
        if (v){ set.add(t.id); if (t.risky) toast(t.name+' on for '+scopeLabel[state.scope]+' · commands still need approval'); }
        else set.delete(t.id);
        card.setAttribute('data-on', String(v));
        updateSummary();
      }, t.name+' for '+scopeLabel[state.scope]);
      const card = h('div.library-tool', {'data-search':(t.name+' '+t.desc).toLowerCase(), 'data-on':String(on)},
        h('div.library-tool-h', h('span.library-tool-name', t.name), sw),
        h('p.library-tool-desc', t.desc),
        h('div.library-tool-foot',
          h('span', h('span.num', String(count)), ' tools'),
          t.risky ? pill('Runs commands','warn') : null,
          t.cost ? h('span.faint', t.cost) : null));
      if (t.id === 'mcp') card.querySelector('.library-tool-foot span').setAttribute('data-mcpfoot','');
      return card;
    });
  }
  grid.append.apply(grid, toolCards());
  const mcpCountText = h('span.faint', state.mcp.length+' servers · '+mcpToolCount()+' tools available');
  function updateSummary(){
    summary.textContent = scopeSummary();
    const foot = wrap.querySelector('[data-mcpfoot]');
    if (foot) foot.replaceChildren(h('span.num', String(mcpToolCount())), ' tools');
    mcpCountText.textContent = state.mcp.length + ' servers · ' + mcpToolCount() + ' tools available';
  }

  /* mcp */
  const table = h('table.tbl.library-mcptbl');
  table.append(h('thead', h('tr',
    h('th','Server'), h('th','Transport'), h('th','Status'), h('th.r','Tools'), h('th','Last test'), h('th.r', h('span.sr','Actions')))));
  const tbody = h('tbody');
  state.mcp.forEach(s => mcpRows(s));
  table.append(tbody);

  function statusNode(s){
    const map = {connected:['pos','Connected'], failed:['neg','Failed'], 'needs auth':['warn','Needs auth']};
    const st = map[s.status] || ['','Unknown'];
    return h('span.library-status', h('span.dot.'+st[0]), st[1]);
  }
  function toolLine(t, s){
    return h('div.library-mcptool',
      h('div.grow', h('div.library-mcptoolname', t.name), h('div.library-mcptooldesc', t.desc)),
      H.sw(t.on, v => { t.on = v; updateSummary(); toast(t.name+(v?' on':' off')+' · '+(s.name)); }, t.name+' enabled'));
  }
  function mcpRows(s){
    const detail = h('tr.library-mcpdetailrow', {hidden: state.expandedMcp !== s.id, 'data-server':s.id, 'data-search':(s.name+' '+s.desc).toLowerCase()},
      h('td', {colspan:'6'},
        h('div.library-mcpdetail',
          s.error ? h('div.library-mcperror', H.ic('warn','sm'), h('div', h('b','Last error · '), s.error, h('div.faint','Expanding still shows the registered tools. Reconnect to refresh the token.'))) : null,
          h('div.library-mcptools', s.tools.map(t => toolLine(t, s))),
          h('div.library-mcpnote',
            h('span', h('span.num', String(s.tools.length)), ' tools registered'),
            h('span.library-dotsep','·'),
            h('span', s.transport === 'stdio' ? s.cmd : s.url),
            s.oauth ? h('span.library-dotsep','·') : null,
            s.oauth ? h('span','OAuth token stored in auth.json') : null))));
    const err = s.error ? h('div.library-mcperr', s.error) : null;
    const status = statusNode(s);
    const last = h('span.library-lasttest', s.lastTest);
    const chev = h('span.library-mchev', H.ic('chev','sm'));
    const nameBtn = h('button.library-mcpname', {'aria-expanded':String(state.expandedMcp === s.id), onclick:() => {
      const open = detail.hasAttribute('hidden');
      if (open){ detail.removeAttribute('hidden'); state.expandedMcp = s.id; }
      else { detail.setAttribute('hidden',''); state.expandedMcp = null; }
      nameBtn.setAttribute('aria-expanded', String(open));
    }}, chev, h('span', s.name));
    const test = h('button.btn.sm', {onclick:() => {
      if (test.disabled) return;
      test.disabled = true; test.textContent = 'Testing…';
      setTimeout(() => {
        if (!test.isConnected) return;
        test.disabled = false; test.textContent = 'Test';
        last.textContent = 'just now';
        if (s.status === 'failed'){
          toast(s.name+': still failing · 401 Unauthorized');
        } else {
          toast(s.name+': '+s.tools.length+' tools responded in 212 ms');
        }
        updateSummary();
      }, 650);
    }}, 'Test');
    const rec = h('button.btn.sm', {onclick:() => {
      if (s.status === 'connected'){ toast(s.name+' is already connected'); return; }
      rec.disabled = true; rec.textContent = 'Reconnecting…';
      setTimeout(() => {
        if (!rec.isConnected) return;
        s.status = 'connected'; s.error = null; s.lastTest = 'just now';
        rec.disabled = false; rec.textContent = 'Reconnect';
        status.replaceWith(statusNode(s)); last.textContent = 'just now';
        if (err) err.remove();
        updateSummary();
        toast(s.name+' reconnected · token valid for 30 days');
      }, 800);
    }}, 'Reconnect');
    const del = h('button.btn.ghost.sm', {onclick:() => {
      const m = H.modal(h('div.library-modal',
        h('div.library-modal-h', h('h3','Remove '+s.name+'?'),
          h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
        h('p.library-modalsub','Hermes loses access to '+s.tools.length+' tools. Running threads keep their last result, but the next call will fail.'),
        h('div.library-modalfoot', h('span.faint','Config is kept until you save'),
          h('div.grow'),
          h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
          h('button.btn.danger', {onclick:() => {
            m.close();
            state.mcp = state.mcp.filter(x => x.id !== s.id);
            refreshTab(); toast('Removed '+s.name+' · '+s.tools.length+' tools no longer available');
          }}, 'Remove server'))), {width:520});
    }}, 'Remove');
    const row = h('tr.library-mcprow', {'data-search':(s.name+' '+s.desc+' '+s.transport).toLowerCase()},
      h('td', h('div.library-mcpcell', nameBtn, err ? err : h('div.library-mcpdesc', s.desc))),
      h('td', h('span.mono.library-transport', s.transport)),
      h('td', status),
      h('td.r', h('span.num', String(s.tools.length))),
      h('td', last),
      h('td.r', h('div.library-mcpacts', test, rec, del)));
    tbody.append(row, detail);
  }

  const addBtn = h('button.btn.primary', {onclick:addServer}, 'Add MCP server');
  const mcpSec = h('div.sec.library-mcpsec',
    h('div.library-journeyhead',
      h('div', h('h2','MCP servers'), h('p.library-hint','Model Context Protocol servers Hermes can call. One failed server does not stop the others.')),
      h('div.grow'), mcpCountText, addBtn),
    h('div.scroll-x', table));

  function addServer(){
    const nameIn = h('input.input', {placeholder:'linear', 'aria-label':'Server name'});
    const cmdIn = h('input.input', {placeholder:'npx -y @modelcontextprotocol/server-filesystem ~/hermes-maintenance', 'aria-label':'Command'});
    const argsIn = h('input.input', {placeholder:'(optional) extra arguments', 'aria-label':'Arguments'});
    const envIn = h('textarea.textarea', {rows:'2', placeholder:'GITHUB_TOKEN=…  (one KEY=value per line)', 'aria-label':'Environment'});
    const urlIn = h('input.input', {placeholder:'https://mcp.linear.app/sse', 'aria-label':'Server URL'});
    const oauthStat = h('span.library-oauthstat', 'Not connected');
    const oauthBtn = h('button.btn.sm', {onclick:() => {
      oauthBtn.disabled = true; oauthBtn.textContent = 'Connected';
      oauthStat.textContent = 'Connected · token expires in 30 days';
      oauthStat.classList.add('library-oauthok');
      toast('OAuth connected · token stored in auth.json');
    }}, 'Connect');
    const stdioBox = h('div.library-mform', h('div.field', h('label','Command'), cmdIn),
      h('div.field', h('label','Arguments'), argsIn, h('span.hint','Passed to the command after the binary.')),
      h('div.field', h('label','Environment'), envIn, h('span.hint','Stored in auth.json, never in config.yaml.')));
    const httpBox = h('div.library-mform', {hidden:true},
      h('div.field', h('label','Server URL'), urlIn),
      h('div.library-oauthrow', h('span.library-inline-label','OAuth'), oauthBtn, oauthStat));
    let transport = 'stdio';
    const seg = H.seg([{id:'stdio',label:'stdio'},{id:'http',label:'http'}], 'stdio', id => {
      transport = id;
      hiddenAttr(stdioBox, id !== 'stdio'); hiddenAttr(httpBox, id !== 'http');
    });
    const errLine = h('div.library-err', {hidden:true}, 'Add a name and a command or URL.');
    const m = H.modal(h('div.library-modal',
      h('div.library-modal-h', h('h3','Add MCP server'),
        h('button.btn.ghost.icon.sm', {'aria-label':'Close', onclick:() => m.close()}, H.ic('x','sm'))),
      h('p.library-modalsub','Hermes starts stdio servers itself; http servers need a reachable URL. Test it before telling anyone it works.'),
      h('div.library-mform',
        h('div.field', h('label','Name'), nameIn),
        h('div.field', h('label','Transport'), seg)),
      stdioBox, httpBox, errLine,
      h('div.library-modalfoot', h('span.faint','Server config is written to ~/.hermes/config.yaml'),
        h('div.grow'),
        h('button.btn.ghost', {onclick:() => m.close()}, 'Cancel'),
        h('button.btn.primary', {onclick:() => {
          const name = nameIn.value.trim();
          const ok = name && (transport === 'stdio' ? cmdIn.value.trim() : urlIn.value.trim());
          if (!ok){ errLine.removeAttribute('hidden'); nameIn.classList.toggle('library-invalid', !name);
            if (transport === 'stdio') cmdIn.classList.toggle('library-invalid', !cmdIn.value.trim());
            else urlIn.classList.toggle('library-invalid', !urlIn.value.trim()); return; }
          const server = {id:name, name, desc:'Added from the prototype.', transport,
            cmd:transport === 'stdio' ? (cmdIn.value.trim()+' '+argsIn.value.trim()).trim() : '',
            url:transport === 'http' ? urlIn.value.trim() : '',
            status: transport === 'http' && oauthStat.classList.contains('library-oauthok') ? 'connected' : transport === 'stdio' ? 'connected' : 'needs auth',
            lastTest:'never', oauth:transport === 'http', tools:[]};
          state.mcp.push(server);
          m.close(); refreshTab();
          toast('Added '+name+' · run Test to list its tools');
        }}, 'Add server'))), {width:620});
  }

  /* plugins + hooks */
  function pluginRow(p){
    const ver = h('span.library-plugin-ver.mono', 'v'+p.version);
    const flag = p.latest ? pill('Update available','warn') : h('span.faint','Up to date');
    const upd = p.latest ? h('button.btn.sm', {onclick:() => {
      p.version = p.latest; p.latest = null;
      ver.textContent = 'v'+p.version;
      flag.replaceWith(h('span.faint','Updated just now'));
      upd.remove();
      toast(p.name+' updated to v'+p.version+' · restart at next turn');
    }}, 'Update') : null;
    return h('div.row.library-plugin', {'data-search':(p.name+' '+p.desc).toLowerCase()},
      h('div.grow', h('div.library-plugin-name', p.name), h('div.s', p.desc)),
      ver, flag, upd,
      H.sw(p.on, v => { p.on = v; toast(p.name+(v?' enabled':' disabled')); }, p.name+' enabled'));
  }
  const plugins = h('div.card.library-plugins',
    h('div.card-h', h('span','Plugins'), h('span.faint', state.plugins.length+' installed · 3 updates'), h('div.grow'), h('span.faint','~/.hermes/plugins')),
    h('div.list', state.plugins.map(pluginRow)));

  const hooks = h('div.card.library-hooks',
    h('div.card-h', h('span','Hooks'), h('span.faint', state.hooks.length+' on'), h('div.grow'), h('span.faint','run in order')),
    h('div.list', state.hooks.map(x => h('div.row.library-hook', {'data-search':(x.event+' '+x.script).toLowerCase()},
      h('div.grow', h('div.library-hookevt', x.event), h('div.library-hookscript', x.script)),
      H.sw(x.on, v => { x.on = v; toast(x.event+(v?' hook on':' hook off')); }, x.event+' hook')))));

  const lower = h('div.library-grid2', plugins, hooks);
  wrap.append(bar, grid, mcpSec, lower);

  function filterTools(q){
    wrap.querySelectorAll('.library-tool').forEach(el => {
      el.hidden = !!q && !el.dataset.search.includes(q);
    });
    wrap.querySelectorAll('.library-mcprow').forEach(el => {
      el.hidden = !!q && !el.dataset.search.includes(q);
    });
    wrap.querySelectorAll('.library-mcpdetailrow').forEach(el => {
      el.hidden = q ? true : el.dataset.server !== state.expandedMcp;
    });
    wrap.querySelectorAll('.library-plugin, .library-hook').forEach(el => {
      el.hidden = !!q && !el.dataset.search.includes(q);
    });
    const mcpSecEl = wrap.querySelector('.library-mcpsec');
    if (mcpSecEl){
      mcpSecEl.hidden = !!q && !mcpSecEl.querySelector('.library-mcprow:not([hidden])');
    }
  }
  filterActive = filterTools;
  return wrap;
}

/* -------------------------------------------------------------- files */
function buildFiles(){
  const wrap = h('div.library-fileswrap');
  const rootSel = h('select.select.library-rootsel', {'aria-label':'Project root', onchange:e => {
    state.fileRoot = e.target.value;
    const r = ROOTS.find(x => x.id === state.fileRoot);
    state.fileSel = r.defaultSel;
    expandedFor(state.fileRoot);
    refreshTree(); refreshPreview(); paintHint();
  }}, ROOTS.map(r => h('option', {value:r.id, selected:state.fileRoot === r.id}, r.label)));

  const hint = h('span.library-filehint');
  function currentRoot(){ return ROOTS.find(r => r.id === state.fileRoot) || ROOTS[0]; }
  function leavesOf(nodes, parent){
    let out = [];
    nodes.forEach(n => {
      const p = parent ? parent + '/' + n.name : n.name;
      if (n.type === 'dir') out = out.concat(leavesOf(n.children || [], p));
      else out.push({leaf:n, path:p});
    });
    return out;
  }
  function paintHint(){
    const all = leavesOf(currentRoot().tree, '');
    const hidden = all.filter(x => x.leaf.secret).length;
    hint.textContent = all.length + ' files · ' + hidden + ' hidden by design';
  }
  function treeEl(){
    const box = h('div.library-tree', {role:'tree', 'aria-label':'Files in '+currentRoot().label});
    const q = state.q;
    if (q){
      const hits = leavesOf(currentRoot().tree, '').filter(x => (x.path + ' ' + x.leaf.name).toLowerCase().includes(q));
      if (!hits.length){ box.append(h('div.library-treeempty','No files match “'+q+'”.')); return box; }
      hits.forEach(x => box.append(flatRow(x.leaf, x.path)));
      return box;
    }
    const walk = (nodes, depth, parent) => {
      nodes.forEach(n => {
        const p = parent ? parent + '/' + n.name : n.name;
        if (n.type === 'dir'){
          const set = expandedFor(state.fileRoot);
          const open = set.has(p);
          const btn = h('button.library-folder', {'aria-expanded':String(open), onclick:() => {
            if (set.has(p)) set.delete(p); else set.add(p);
            btn.setAttribute('aria-expanded', String(set.has(p)));
            const kids = btn.nextElementSibling;
            if (kids) hiddenAttr(kids, !set.has(p));
            btn.querySelector('svg.library-chev').style.transform = set.has(p) ? 'rotate(90deg)' : '';
          }},
          h('span.library-chev', H.ic('chev','sm')), H.ic('folder','sm'), h('span.grow.ellip', n.name));
          btn.style.paddingLeft = (8 + depth * 14) + 'px';
          const kids = h('div.library-treekids', {role:'group'}, walk(n.children || [], depth + 1, p));
          hiddenAttr(kids, !open);
          box.append(btn, kids);
        } else {
          box.append(leafRow(n, p, depth));
        }
      });
    };
    walk(currentRoot().tree, 0, '');
    return box;
  }
  function leafRow(leaf, path, depth){
    const sel = path === state.fileSel;
    const b = h('button.library-leaf', {'aria-current':String(sel), 'aria-label':(leaf.secret ? 'Hidden file ' : 'File ') + leaf.name,
      onclick:() => { state.fileSel = path; refreshTree(); refreshPreview(); }},
      h('span.library-leaficon', H.ic(leaf.secret ? 'lock' : 'file','sm')), h('span.grow.ellip', leaf.name),
      leaf.size ? h('span.library-size', leaf.size) : null);
    b.style.paddingLeft = (8 + depth * 14) + 'px';
    return b;
  }
  function flatRow(leaf, path){
    const b = h('button.library-flatrow', {'aria-current':String(path === state.fileSel),
      onclick:() => { state.fileSel = path; refreshTree(); refreshPreview(); }},
      H.ic(leaf.secret ? 'lock' : 'file','sm'),
      h('div.grow', h('div', leaf.name), h('div.library-flatpath', path)),
      leaf.size ? h('span.library-size', leaf.size) : null);
    return b;
  }
  function findLeaf(path){
    const parts = path.split('/');
    let nodes = currentRoot().tree, leaf = null;
    parts.forEach((name, i) => {
      const n = (nodes || []).find(x => x.name === name);
      if (!n) return;
      if (i === parts.length - 1) leaf = n; else nodes = n.children || [];
    });
    return leaf;
  }
  function previewEl(){
    const path = state.fileSel;
    const leaf = findLeaf(path);
    const root = currentRoot();
    if (!leaf) return h('div.library-preview', h('div.empty','Select a file to preview it.'));
    const body = h('div.library-previewbody');
    if (leaf.secret){
      body.append(h('div.library-secret',
        h('span.library-seclogo', H.ic('lock','lg')),
        h('div.library-sectitle','Hidden by design'),
        h('p','Hermes never prints .env, auth.json or vault contents into the workspace. Read a key with ', h('span.mono','hermes config get'), ' or edit the file on the machine.')));
    } else if (leaf.binary){
      body.append(h('div.library-secret',
        h('span.library-seclogo', H.ic('file','lg')),
        h('div.library-sectitle','Binary file'),
        h('p', (leaf.size || 'unknown size') + ' · nothing to preview. Open a shell in ', h('span.mono', root.label), ' to inspect it.')));
    } else {
      const content = leaf.content || '';
      const code = h('div.library-code');
      content.split('\n').forEach((line, i) => {
        code.append(h('div.library-cline', h('span.library-ln', String(i+1)), h('span.library-lc', line.length ? line : ' ')));
      });
      body.append(code);
    }
    const openBtn = h('button.btn.sm', {onclick:() => {
      if (leaf.secret){ toast('Secrets open only in the terminal editor · hermes env edit'); return; }
      if (leaf.binary){ toast(leaf.name+' is binary · no editor preview'); return; }
      toast('Opening '+leaf.name+' in $EDITOR');
    }}, 'Open in editor');
    return h('div.library-preview',
      h('div.library-preview-h',
        h('span.library-fileicon', H.ic(leaf.secret ? 'lock' : 'file','sm')),
        h('div.grow', h('div.library-preview-name', path),
          h('div.library-preview-meta', root.label + ' · ' + (leaf.secret ? 'secret · hidden' : leaf.binary ? 'binary · ' + (leaf.size || '') : 'text · ' + (leaf.content || '').split('\n').length + ' lines'))),
        h('div.library-preview-actions', openBtn)),
      body);
  }
  let treeHolder = treeEl();
  let previewHolder = previewEl();
  function refreshTree(){
    const next = treeEl();
    treeHolder.replaceWith(next); treeHolder = next;
  }
  function refreshPreview(){
    const next = previewEl();
    previewHolder.replaceWith(next); previewHolder = next;
  }
  paintHint();

  const bar = h('div.library-filesbar',
    h('label.library-inline-label','Root'), rootSel, hint,
    h('div.grow'), h('span.faint','Read-only preview · 2 hidden files'));
  const files = h('div.library-files', treeHolder, previewHolder);
  wrap.append(bar, files);
  filterActive = () => refreshTree();
  return wrap;
}

/* --------------------------------------------------------------- view */
H.views.library = {
  title: 'Library',
  render(root, ctx){
    state.ctx = ctx;
    state.root = root;
    const tab = ctx.route && ctx.route[0];
    state.tab = TABS.some(t => t.id === tab) ? tab : 'skills';
    state.q = '';
    history.replaceState(null, '', '#/library/' + state.tab);
    root.replaceChildren(pageEl());
  }
};
})();

/* js/views/channels.js */
/* Channels · where Hermes meets people and other systems.
   Tabs: platforms · people · endpoints · peers. Sample data lives in this file. */
(function(){
const H = window.H;

const TABS = [
  {id:'platforms', label:'Platforms'},
  {id:'people',    label:'People'},
  {id:'endpoints', label:'Endpoints'},
  {id:'peers',     label:'Peers'}
];

const HOME_OPTIONS = [
  {v:'origin', t:'Reply where the message came from'},
  {v:'#ops',   t:'#ops · ops room'},
  {v:'dm-ana', t:'Direct message · Ana Ruiz'},
  {v:'none',   t:'None · scheduled results stay in the dashboard'}
];

const PLATFORMS = [
  {
    id:'telegram', name:'Telegram', icon:'send', state:'connected', enabled:true, chats:3, unit:'chats', last:'2m ago',
    tokenEnv:'TELEGRAM_BOT_TOKEN', tokenLabel:'Bot token', handle:'@hermes_oci_bot', home:'#ops',
    allowed:[
      {n:'Ana Ruiz', s:'@anaruiz · paired'},
      {n:'#ops', s:'group chat · 6 members'},
      {n:'Jonas Weber', s:'@jwbr · paired'}
    ],
    opts:{mentionOnly:true, threading:true, progress:false},
    activity:[
      {tone:'pos',  text:'Ana asked for last night’s backup status', at:'2m'},
      {tone:'',     text:'Cron “Weekly cost report” delivered to #ops', at:'1h'},
      {tone:'live', text:'Turn running in “Gateway heartbeat gaps”', at:'1h'},
      {tone:'',     text:'Jonas Weber paired with code K7M-4QX', at:'Yesterday'}
    ],
    guide:{where:'Open @BotFather in Telegram, send /newbot, and copy the HTTP API token it returns.'}
  },
  {
    id:'discord', name:'Discord', icon:'chat', state:'connected', enabled:true, chats:5, unit:'chats', last:'11m ago',
    tokenEnv:'DISCORD_BOT_TOKEN', tokenLabel:'Bot token', handle:'hermes#4412', home:'#hermes-ops',
    allowed:[
      {n:'#hermes-ops', s:'channel · 4 members'},
      {n:'#build-alerts', s:'channel · read-only'},
      {n:'Marta Nowak', s:'@marta_n · paired'}
    ],
    opts:{mentionOnly:true, threading:false, progress:true},
    activity:[
      {tone:'', text:'Build alert forwarded to #build-alerts', at:'11m'},
      {tone:'', text:'Marta asked about deploy status', at:'38m'},
      {tone:'pos', text:'Message content intent approved', at:'2d'}
    ],
    guide:{where:'In the Discord Developer Portal open your app → Bot → Reset Token. Enable the Message Content intent.'}
  },
  {
    id:'slack', name:'Slack', icon:'hash', state:'connected', enabled:true, chats:2, unit:'chats', last:'34m ago',
    tokenEnv:'SLACK_BOT_TOKEN', tokenLabel:'Bot token', handle:'hermes', home:'#ops',
    allowed:[
      {n:'#ops', s:'channel · 9 members'},
      {n:'#releases', s:'channel · 6 members'},
      {n:'Ana Ruiz', s:'@ana · paired'}
    ],
    opts:{mentionOnly:true, threading:true, progress:false},
    activity:[
      {tone:'', text:'Threaded reply posted in #releases', at:'34m'},
      {tone:'', text:'Slash command /hermes used by Ana', at:'2h'},
      {tone:'pos', text:'Events API subscription verified', at:'6d'}
    ],
    guide:{where:'At api.slack.com/apps open OAuth & Permissions and copy the bot token after installing the app.'}
  },
  {
    id:'whatsapp', name:'WhatsApp', icon:'at', state:'token', enabled:false, chats:0, unit:'chats', last:'–',
    tokenEnv:'WHATSAPP_ACCESS_TOKEN', tokenLabel:'Access token', handle:'not connected', home:'origin',
    allowed:[], opts:{mentionOnly:false, threading:false, progress:false}, activity:[],
    guide:{where:'In Meta Business Suite open WhatsApp → API setup and copy the permanent access token and phone number ID.'}
  },
  {
    id:'signal', name:'Signal', icon:'radio', state:'connected', enabled:true, chats:1, unit:'chats', last:'1h ago',
    tokenEnv:'SIGNAL_ACCOUNT', tokenLabel:'Linked device token', handle:'+44 •••• 0192', home:'dm-ana',
    allowed:[{n:'Ana Ruiz', s:'+44 •••• 0192 · paired'}],
    opts:{mentionOnly:false, threading:false, progress:false},
    activity:[
      {tone:'', text:'Ana sent a voice note (transcribed, 42s)', at:'1h'},
      {tone:'pos', text:'signal-cli linked as a secondary device', at:'12d'}
    ],
    guide:{where:'Run signal-cli link on the host and paste the device link token printed by the command.'}
  },
  {
    id:'matrix', name:'Matrix', icon:'hash', state:'off', enabled:false, chats:0, unit:'chats', last:'–',
    tokenEnv:'MATRIX_ACCESS_TOKEN', tokenLabel:'Access token', handle:'not connected', home:'origin',
    allowed:[], opts:{mentionOnly:true, threading:true, progress:false}, activity:[],
    guide:{where:'In Element open Settings → Help & About → Access token. The homeserver is matrix.org unless you self-host.'}
  },
  {
    id:'email', name:'Email', icon:'inbox', state:'connected', enabled:true, chats:2, unit:'mailboxes', last:'6m ago',
    tokenEnv:'EMAIL_APP_PASSWORD', tokenLabel:'App password', handle:'hermes@localhost', home:'dm-ana',
    allowed:[
      {n:'ops@localhost', s:'IMAP + SMTP · primary'},
      {n:'Ana Ruiz', s:'ana@localhost · paired sender'},
      {n:'alerts@github', s:'sender · notifications only'}
    ],
    opts:{mentionOnly:false, threading:true, progress:false},
    activity:[
      {tone:'', text:'Triaged 4 messages in ops@localhost', at:'6m'},
      {tone:'', text:'Draft reply waiting for approval', at:'24m'},
      {tone:'pos', text:'IMAP IDLE reconnected cleanly', at:'3h'}
    ],
    guide:{where:'Create an app password in your mailbox settings, then enter the IMAP host and the password here.'}
  },
  {
    id:'sms', name:'SMS', icon:'radio', state:'token', enabled:false, chats:0, unit:'chats', last:'–',
    tokenEnv:'TWILIO_AUTH_TOKEN', tokenLabel:'Auth token', handle:'not connected', home:'origin',
    allowed:[], opts:{mentionOnly:false, threading:false, progress:false}, activity:[],
    guide:{where:'In the Twilio console copy the Account SID and Auth token, then add the sending number.'}
  },
  {
    id:'mattermost', name:'Mattermost', icon:'chat', state:'off', enabled:false, chats:0, unit:'chats', last:'–',
    tokenEnv:'MATTERMOST_TOKEN', tokenLabel:'Bot token', handle:'not connected', home:'origin',
    allowed:[], opts:{mentionOnly:true, threading:true, progress:false}, activity:[],
    guide:{where:'In System Console → Integrations → Bot accounts create a bot and copy its access token.'}
  },
  {
    id:'teams', name:'Teams', icon:'users', state:'off', enabled:false, chats:0, unit:'chats', last:'–',
    tokenEnv:'TEAMS_CLIENT_SECRET', tokenLabel:'Client secret', handle:'not connected', home:'origin',
    allowed:[], opts:{mentionOnly:true, threading:true, progress:false}, activity:[],
    guide:{where:'In the Azure Bot resource open Configuration and copy the Microsoft App ID and client secret.'}
  },
  {
    id:'imessage', name:'iMessage bridge', icon:'chat', state:'connected', enabled:true, chats:1, unit:'chats', last:'3h ago',
    tokenEnv:'BLUEBUBBLES_PASSWORD', tokenLabel:'Bridge password', handle:'hermes@ana-mac.local', home:'dm-ana',
    allowed:[{n:'Ana Ruiz', s:'+44 •••• 0192 · paired'}],
    opts:{mentionOnly:false, threading:false, progress:false},
    activity:[
      {tone:'', text:'Delivered routine summary to Ana', at:'3h'},
      {tone:'pos', text:'Bridge heartbeat recovered after wake', at:'1d'}
    ],
    guide:{where:'In BlueBubbles Server → Settings copy the server URL and API password.'}
  },
  {
    id:'line', name:'LINE', icon:'at', state:'off', enabled:false, chats:0, unit:'chats', last:'–',
    tokenEnv:'LINE_CHANNEL_TOKEN', tokenLabel:'Channel token', handle:'not connected', home:'origin',
    allowed:[], opts:{mentionOnly:false, threading:false, progress:false}, activity:[],
    guide:{where:'In LINE Developers open your Messaging API channel and copy the channel access token.'}
  },
  {
    id:'feishu', name:'Feishu', icon:'layers', state:'token', enabled:false, chats:0, unit:'chats', last:'–',
    tokenEnv:'FEISHU_APP_SECRET', tokenLabel:'App secret', handle:'not connected', home:'origin',
    allowed:[], opts:{mentionOnly:true, threading:true, progress:false}, activity:[],
    guide:{where:'In the Feishu Open Platform open your app → Credentials and copy the app ID and app secret.'}
  },
  {
    id:'irc', name:'IRC', icon:'hash', state:'connected', enabled:true, chats:2, unit:'channels', last:'22m ago',
    tokenEnv:'IRC_SASL_PASSWORD', tokenLabel:'SASL password', handle:'hermes@libera', home:'#hermes',
    allowed:[
      {n:'#hermes', s:'channel · 3 members'},
      {n:'#libera-help', s:'channel · read-only'}
    ],
    opts:{mentionOnly:true, threading:false, progress:false},
    activity:[
      {tone:'', text:'Answered a question in #hermes', at:'22m'},
      {tone:'', text:'NickServ identify renewed for 30 days', at:'2d'},
      {tone:'pos', text:'SASL authentication succeeded', at:'9d'}
    ],
    guide:{where:'Register a nick with NickServ on Libera.chat, then create a SASL password in the account settings.'}
  }
];

const PEOPLE_PENDING = [
  {code:'K7M-4QX', platform:'Telegram', name:'Marta Nowak',   handle:'@marta_n',  at:'4m ago'},
  {code:'B3T-9WD', platform:'WhatsApp', name:'Unknown sender', handle:'+1 ••• ••• 4417', at:'19m ago'},
  {code:'Q2F-8HN', platform:'Discord',  name:'#build-alerts', handle:'channel · 6 members', at:'1h ago'}
];

const PEOPLE = [
  {id:'p1', name:'Ana Ruiz',    handle:'@anaruiz',  platform:'Telegram', agent:'hermes', role:'Owner',  last:'2m ago'},
  {id:'p2', name:'Jonas Weber', handle:'@jwbr',     platform:'Slack',    agent:'ledger', role:'Member', last:'41m ago'},
  {id:'p3', name:'Priya Nair',  handle:'@priya',    platform:'WhatsApp', agent:'hermes', role:'Member', last:'3h ago'},
  {id:'p4', name:'Marco Silva', handle:'@marco:matrix.org', platform:'Matrix', agent:'scout', role:'Member', last:'Yesterday'},
  {id:'p5', name:'#ops-room',   handle:'channel',   platform:'Discord',  agent:'ledger', role:'Member', last:'18m ago'}
];

const ENDPOINTS = [
  {id:'dashboard', name:'Dashboard', port:9119, bind:'127.0.0.1:9119', exposure:'Loopback only', exposureTone:'', auth:'Session cookie', enabled:true, url:'http://127.0.0.1:9119',
   lead:'The dashboard you are using. Sign-in issues a 24-hour session cookie; an OAuth provider plugs in for SSO.',
   code:'dashboard.port: 9119\nauth.session.ttl: 24h'},
  {id:'api', name:'API server', port:8642, bind:'127.0.0.1:8642', exposure:'Loopback only', exposureTone:'', auth:'Bearer key', enabled:true, url:'http://127.0.0.1:8642'},
  {id:'webhooks', name:'Webhooks', port:8644, bind:'127.0.0.1:8644', exposure:'Loopback only', exposureTone:'', auth:'HMAC + bearer', enabled:true, url:'http://127.0.0.1:8644',
   lead:'Signed callbacks from GitHub, Stripe and Gmail push. Each source has its own path and HMAC secret in .env.',
   code:'POST /webhooks/github\nX-Hub-Signature-256: sha256=…'},
  {id:'webapp', name:'Webapp', port:9120, bind:'0.0.0.0:9120', exposure:'Public · no auth', exposureTone:'neg', auth:'None', enabled:false, refused:true, url:'http://oci-box:9120',
   lead:'The optional mobile web app. It shares the API but has its own listener; public access requires auth.'},
  {id:'proxy', name:'Subscription proxy', port:8645, bind:'127.0.0.1:8645', exposure:'Loopback only', exposureTone:'', auth:'Bearer key', enabled:true, url:'http://127.0.0.1:8645',
   lead:'OpenAI-compatible subscription proxy. Point CLI clients at this base URL.',
   code:'OPENAI_BASE_URL=http://127.0.0.1:8645/v1'}
];

const PEERS = [
  {id:'yggdrasil', host:'yggdrasil.local:9119', agent:'Hermes', trust:'trusted', last:'2m ago',
   reply:'Confirmed from yggdrasil. Last backup finished 04:12 with exit 0; the mirror is 214 MB.'},
  {id:'studio', host:'studio-mini.lan:9119', agent:'Scout', trust:'trusted', last:'26m ago',
   reply:'Scout here. I have three cached sources on arm64 Chromium sandboxing · say the word and I’ll send the list.'},
  {id:'metal', host:'metal-02.lan:9119', agent:'Ledger', trust:'pending', last:'3h ago',
   reply:'Pairing is still pending on this side.'},
  {id:'nuc', host:'old-nuc.lan:9119', agent:'Hermes', trust:'revoked', last:'4d ago',
   reply:'Trust has been revoked.'}
];

const AGENT_IDS = ['hermes','scout','ledger'];

const S = {
  root:null, ctx:null, tab:'platforms', q:'', filter:'all',
  openId:null, drawerEl:null, scrimEl:null, drawerTrigger:null,
  confirmRestart:false, restarting:false, uptime:'6d 4h',
  pending:PEOPLE_PENDING.map(x => Object.assign({}, x)),
  people:PEOPLE.map(x => Object.assign({}, x)),
  epSel:'api', apiProfile:'default', warnOpen:false,
  apiKeys:[
    {id:'k1', name:'cli-laptop',    masked:'hrms_••••••7f2a', created:'Nov 12', last:'2h ago'},
    {id:'k2', name:'nightly-backup',masked:'hrms_••••••1c04', created:'Oct 28', last:'Yesterday'}
  ],
  peerId:'yggdrasil', peerTyping:null,
  chats:{ yggdrasil:[{from:'them', text:'Backup mirror is current (214 MB, 3,912 files). Nothing queued.'}] }
};
let timers = [];

/* ---------- small utilities ---------- */
const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const findPlatform = id => PLATFORMS.find(p => p.id === id);
const findPeer = id => PEERS.find(p => p.id === id);
const findEndpoint = id => ENDPOINTS.find(e => e.id === id);
const toast = msg => { if (S.ctx && typeof S.ctx.toast === 'function') S.ctx.toast(msg); else H.toast(msg); };
const agentName = id => { const a = (H.data && H.data.agents || []).find(x => x.id === id); return a ? a.name : (id || '—'); };
const agentOptions = () => (H.data && H.data.agents || []).map(a => ({v:a.id, t:a.name}));

function later(fn, ms){
  const id = setTimeout(() => { timers = timers.filter(t => t !== id); fn(); }, ms);
  timers.push(id);
  return id;
}
function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

function copyText(text, msg){
  const done = () => toast(msg || 'Copied');
  const fallback = () => {
    try {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
    } catch (e) { /* clipboard is best-effort in the prototype */ }
    done();
  };
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
      return;
    }
  } catch (e) { /* fall through */ }
  fallback();
}

function article(word){ return /^[aeiou]/i.test(word) ? 'an' : 'a'; }

function statusOf(p){
  if (p.state === 'connected') {
    if (!p.enabled) return {text:'Off · configured', tone:'', dot:''};
    const n = p.chats || 0;
    const unit = p.unit || 'chats';
    return {text:'Connected · ' + n + ' ' + (n === 1 ? unit.replace(/s$/, '') : unit), tone:'pos', dot:'pos'};
  }
  if (p.state === 'token') {
    const label = (p.tokenLabel || 'bot token').toLowerCase();
    return {text:'Needs ' + article(label) + ' ' + label, tone:'warn', dot:'warn'};
  }
  return {text:'Off', tone:'', dot:''};
}

/* ---------- page skeleton ---------- */
function render(root, ctx){
  cleanup();
  root.innerHTML = '';
  S.root = root;
  S.ctx = ctx || {};
  const routeTab = (S.ctx.route && S.ctx.route[0]) || '';
  S.tab = TABS.some(t => t.id === routeTab) ? routeTab : 'platforms';
  paint();
}

function cleanup(){
  closeDrawer();
  clearTimers();
}

function paint(){
  if (!S.root) return;
  const page = buildPage();
  S.root.innerHTML = '';
  S.root.appendChild(page);
  if (S.openId) mountDrawer(S.openId, null);
}

function repaintPage(){
  if (!S.root) return;
  const page = S.root.querySelector('.channels-page');
  if (!page) { paint(); return; }
  const top = page.scrollTop;
  const fresh = buildPage();
  page.replaceWith(fresh);
  fresh.scrollTop = top;
  if (S.tab === 'peers') {
    const chat = fresh.querySelector('.channels-chat');
    if (chat) chat.scrollTop = chat.scrollHeight;
  }
}

function buildPage(){
  return H.h('div.page.channels-page',
    H.h('div.page-in.channels-page-in',
      pageHead(), gatewayStrip(), tabsRow(), tabPanel()
    )
  );
}

function pageHead(){
  return H.h('div.page-head.channels-page-head',
    H.h('div',
      H.h('h1', 'Channels'),
      H.h('p', 'Where Hermes meets people and other systems · 25+ messaging platforms, DM pairing, local listeners and peer gateways.')
    ),
    H.h('div.grow'),
    H.h('button.btn.primary', {onclick: openConnectDialog}, H.ic('plus','sm'), 'Connect a platform')
  );
}

function gatewayStrip(){
  const wrap = H.h('div.channels-gw');
  if (S.restarting) {
    wrap.append(
      H.h('span.dot.warn'),
      H.h('strong', 'Restarting gateway…'),
      H.h('span.channels-gw-sep', '·'),
      H.h('span.muted', 'Seven sessions resume automatically; webhooks retry once.')
    );
    return wrap;
  }
  wrap.append(
    H.h('div.channels-gw-main',
      H.h('span.dot.pos'),
      H.h('strong', 'Gateway healthy'),
      H.h('span.channels-gw-sep', '·'),
      H.h('span.muted', 'up ' + S.uptime),
      H.h('span.channels-gw-sep', '·'),
      H.h('span.muted', '7 live sessions')
    ),
    H.h('div.grow'),
    H.h('button.btn.ghost.sm', {onclick: () => { S.confirmRestart = true; repaintPage(); }}, 'Restart gateway')
  );
  if (S.confirmRestart) {
    wrap.appendChild(H.h('div.channels-gw-confirm',
      H.h('div.grow',
        H.h('div.channels-gw-ct', 'Restart the gateway now?'),
        H.h('div.channels-gw-cs', 'Two active turns pause for about three seconds and resume where they stopped. Webhooks retry once.')
      ),
      H.h('button.btn.sm.danger', {onclick: () => {
        S.confirmRestart = false; S.restarting = true; repaintPage();
        later(() => {
          S.restarting = false; S.uptime = '0m'; repaintPage();
          toast('Gateway restarted · 7 sessions resumed');
        }, 1800);
      }}, 'Restart gateway'),
      H.h('button.btn.sm.ghost', {onclick: () => { S.confirmRestart = false; repaintPage(); }}, 'Cancel')
    ));
  }
  return wrap;
}

function tabsRow(){
  const items = TABS.map(t => ({
    id:t.id,
    label:t.label,
    count: t.id === 'platforms' ? PLATFORMS.length
      : t.id === 'people' ? S.pending.length + S.people.length
      : t.id === 'endpoints' ? ENDPOINTS.length
      : PEERS.length
  }));
  return H.h('div.channels-tabsrow', H.tabs(items, S.tab, pickTab));
}

function pickTab(id){
  if (S.tab === id) return;
  closeDrawer();
  S.tab = id;
  try { history.replaceState(null, '', '#/channels/' + id); } catch (e) { /* file:// may refuse */ }
  paint();
  const page = S.root && S.root.querySelector('.channels-page');
  if (page) page.scrollTop = 0;
}

function tabPanel(){
  if (S.tab === 'people') return peoplePanel();
  if (S.tab === 'endpoints') return endpointsPanel();
  if (S.tab === 'peers') return peersPanel();
  return platformsPanel();
}

/* ---------- platforms ---------- */
function platformsPanel(){
  const wrap = H.h('div.channels-platforms');
  const count = H.h('span.channels-count');
  const grid = H.h('div.channels-grid');

  const search = H.h('input.input.channels-search', {
    type:'search', placeholder:'Search platforms', 'aria-label':'Search platforms',
    value:S.q
  });
  search.oninput = () => { S.q = search.value; drawGrid(); };

  const seg = H.seg([
    {id:'all', label:'All'},
    {id:'connected', label:'Connected'},
    {id:'off', label:'Off'}
  ], S.filter, id => { S.filter = id; drawGrid(); });

  function filtered(){
    const q = S.q.trim().toLowerCase();
    return PLATFORMS.filter(p => {
      if (q && !(p.name + ' ' + p.id).toLowerCase().includes(q)) return false;
      const live = p.state === 'connected' && p.enabled;
      if (S.filter === 'connected' && !live) return false;
      if (S.filter === 'off' && live) return false;
      return true;
    });
  }
  function drawGrid(){
    const list = filtered();
    grid.innerHTML = '';
    count.textContent = list.length + ' of ' + PLATFORMS.length;
    if (!list.length) {
      grid.appendChild(H.h('div.empty.channels-grid-empty',
        H.h('div', 'No platforms match.'),
        H.h('div.muted', 'Try a different name, or switch the filter back to All.')
      ));
      return;
    }
    list.forEach(p => grid.appendChild(platformCard(p)));
  }
  drawGrid();

  wrap.append(
    H.h('div.channels-tools',
      search,
      H.h('div.grow'),
      count,
      seg
    ),
    grid
  );
  return wrap;
}

function platformCard(p){
  const st = statusOf(p);
  const card = H.h('div.channels-pcard', {role:'button', tabindex:'0', 'aria-label':p.name + ' · ' + st.text});
  card.append(
    H.h('div.channels-pcard-top',
      H.h('span.channels-picon', H.ic(p.icon, 'sm')),
      H.h('span.channels-pname.ellip', p.name),
      H.h('div.grow'),
      H.h('div.channels-switch-wrap', {onclick:e => e.stopPropagation()},
        H.sw(p.enabled, v => {
          p.enabled = v;
          if (v && p.state === 'token') {
            const label = (p.tokenLabel || 'token').toLowerCase();
            toast('Add ' + article(label) + ' ' + label + ' to finish connecting ' + p.name);
          }
          else toast(p.name + (v ? ' enabled' : ' disabled'));
          repaintPage();
        }, 'Enable ' + p.name)
      )
    ),
    H.h('div.channels-pcard-state',
      H.h('span.dot' + (st.dot ? '.' + st.dot : ''), {style:{marginRight:'7px'}}),
      st.text
    ),
    H.h('div.channels-pcard-foot',
      H.h('span', 'Last message ' + (p.last || '–')),
      H.h('span.channels-pcard-chev', H.ic('chev', 'sm'))
    )
  );
  card.onclick = () => openDrawer(p.id, card);
  card.onkeydown = e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(p.id, card); }
  };
  return card;
}

function openConnectDialog(){
  const open = PLATFORMS.filter(p => p.state !== 'connected');
  const body = H.h('div.channels-picklist');
  body.appendChild(H.h('p.channels-dialog-note', open.length
    ? open.length + ' platforms are not connected yet. Pick one to open its setup guide.'
    : 'Every platform is connected.'));
  if (open.length) {
    const list = H.h('div.channels-pick-rows');
    open.forEach(p => {
      const row = H.h('button.channels-pick', {type:'button'},
        H.h('span.channels-picon', H.ic(p.icon, 'sm')),
        H.h('span.grow',
          H.h('span.channels-pick-name', p.name),
          H.h('span.channels-pick-sub', p.state === 'token'
            ? 'Needs ' + article((p.tokenLabel || 'token').toLowerCase()) + ' ' + (p.tokenLabel || 'token').toLowerCase()
            : 'Off · set up to connect')
        ),
        H.ic('chev', 'sm')
      );
      row.onclick = () => { dlg.m.close(); openDrawer(p.id, null); };
      list.appendChild(row);
    });
    body.appendChild(list);
  }
  const dlg = dialog({
    title:'Connect a platform',
    width:460,
    body,
    foot:[H.h('button.btn', {onclick:() => dlg.m.close()}, 'Close')]
  });
}

/* ---------- drawer ---------- */
function openDrawer(id, trigger){
  const p = findPlatform(id);
  if (!p) return;
  closeDrawer();
  S.openId = id;
  S.drawerTrigger = trigger || document.activeElement;
  S.scrimEl = H.h('div.scrim.channels-scrim', {onclick: closeDrawer});
  S.drawerEl = buildDrawer(p);
  if (S.root) S.root.append(S.scrimEl, S.drawerEl);
  document.addEventListener('keydown', drawerKey);
  const first = S.drawerEl.querySelector('[data-close]');
  if (first) setTimeout(() => { try { first.focus(); } catch (e) {} }, 0);
}

function closeDrawer(){
  document.removeEventListener('keydown', drawerKey);
  if (S.scrimEl) { S.scrimEl.remove(); S.scrimEl = null; }
  if (S.drawerEl) { S.drawerEl.remove(); S.drawerEl = null; }
  S.openId = null;
  const t = S.drawerTrigger;
  S.drawerTrigger = null;
  if (t && t.isConnected && typeof t.focus === 'function') { try { t.focus(); } catch (e) {} }
}

function drawerKey(e){
  if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); return; }
  if (e.key !== 'Tab' || !S.drawerEl) return;
  const f = Array.from(S.drawerEl.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]'))
    .filter(n => n.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

function rerenderDrawer(){
  if (!S.openId || !S.drawerEl) return;
  const p = findPlatform(S.openId);
  if (!p) return;
  const fresh = buildDrawer(p);
  S.drawerEl.replaceWith(fresh);
  S.drawerEl = fresh;
}

function buildDrawer(p){
  const st = statusOf(p);
  const body = H.h('div.channels-dr-body');
  if (p.state === 'connected') buildConnectedBody(body, p);
  else buildGuide(body, p);

  return H.h('aside.channels-drawer', {role:'dialog', 'aria-modal':'true', 'aria-label':p.name + ' settings'},
    H.h('div.channels-dr-head',
      H.h('div.grow',
        H.h('h2', p.name),
        H.h('div.channels-dr-sub',
          H.h('span.dot' + (st.dot ? '.' + st.dot : '')),
          H.h('span', st.text),
          H.h('span.channels-gw-sep', '·'),
          H.h('span', 'Last message ' + (p.last || '–'))
        )
      ),
      H.h('button.btn.icon.sm.ghost', {'data-close':'', 'aria-label':'Close ' + p.name + ' settings', onclick:closeDrawer}, H.ic('x','sm'))
    ),
    body
  );
}

function section(title, ...kids){
  const s = H.h('div.channels-dr-sec');
  if (title) s.appendChild(H.h('h3', title));
  kids.forEach(k => { if (k != null && k !== false) s.appendChild(k); });
  return s;
}

function buildConnectedBody(body, p){
  if (!p.enabled) {
    body.appendChild(H.h('div.channels-dr-note',
      H.h('div.grow',
        H.h('div.channels-dr-note-t', 'Paused'),
        H.h('div.channels-dr-note-s', 'No messages are delivered while this platform is off. Scheduled results stay queued.')
      ),
      H.sw(p.enabled, v => {
        p.enabled = v; rerenderDrawer(); repaintPage();
        toast(p.name + (v ? ' enabled' : ' disabled'));
      }, 'Enable ' + p.name)
    ));
  }

  /* connection */
  const conn = section('Connection');
  const masked = H.h('div.channels-secret',
    H.h('span.mono.channels-masked', '••••••••••••'),
    H.pill('Stored in .env'),
    H.h('div.grow'),
    H.h('button.btn.sm', {disabled:true, 'aria-disabled':'true', title:'Reveal is disabled by design · secrets never leave the host'}, 'Reveal'),
    H.h('button.btn.sm', {'data-replace':'', onclick: toggleReplace}, 'Replace…')
  );
  const hint = H.h('div.channels-hint', 'Stored as ', H.h('code', p.tokenEnv), ' in ', H.h('code','~/.hermes/.env'), '. Reveal is disabled by design; read the file on the host instead.');
  let replaceForm = null;
  function toggleReplace(){
    if (replaceForm) { replaceForm.remove(); replaceForm = null; return; }
    const err = H.h('div.channels-err', {role:'alert'});
    const input = H.h('input.input', {type:'password', placeholder:'Paste a new ' + (p.tokenLabel || 'token').toLowerCase(), autocomplete:'off', 'aria-label':'New ' + (p.tokenLabel || 'token')});
    replaceForm = H.h('div.channels-replace',
      input,
      H.h('div.channels-hint', 'Saved straight to .env. It is never displayed again.'),
      err,
      H.h('div.channels-row-actions',
        H.h('button.btn.sm', {onclick: () => {
          const v = input.value.trim();
          if (v.length < 8) { err.textContent = 'That looks too short. Paste the full credential.'; input.focus(); return; }
          p.tokenUpdated = true; replaceForm.remove(); replaceForm = null;
          hint.textContent = 'Replacement saved. Restart the gateway to apply it.';
          toast('Token saved to ' + p.tokenEnv);
        }}, 'Save'),
        H.h('button.btn.sm.ghost', {onclick: () => { replaceForm.remove(); replaceForm = null; }}, 'Cancel')
      )
    );
    conn.appendChild(replaceForm);
    input.focus();
  }
  conn.append(masked, hint);
  body.appendChild(conn);

  /* allowed */
  const allow = section('Allowed people and chats', H.h('div.channels-hint', 'Only these people and chats reach the agent. Everyone else is ignored.'));
  const allowList = H.h('div.channels-allowlist');
  if (!p.allowed.length) allowList.appendChild(H.h('div.channels-emptyline', 'Nobody allowed yet.'));
  p.allowed.forEach((a, i) => {
    allowList.appendChild(H.h('div.channels-allow',
      H.h('div.grow',
        H.h('div.channels-allow-n', a.n),
        H.h('div.channels-allow-s', a.s)
      ),
      H.h('button.btn.icon.sm.ghost', {type:'button', 'aria-label':'Remove ' + a.n, onclick: () => {
        p.allowed.splice(i, 1); rerenderDrawer(); toast('Removed ' + a.n);
      }}, H.ic('x','sm'))
    ));
  });
  const addInput = H.h('input.input', {placeholder:'@handle, email or chat id', 'aria-label':'Add person or chat'});
  const addBtn = H.h('button.btn.sm', {onclick: () => {
    const v = addInput.value.trim();
    if (!v) { addInput.focus(); return; }
    if (p.allowed.some(a => a.n.toLowerCase() === v.toLowerCase())) { toast('Already allowed'); return; }
    p.allowed.push({n:v, s:'added just now'});
    rerenderDrawer(); toast('Added ' + v);
  }}, 'Add');
  addInput.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addBtn.click(); } };
  allow.append(allowList, H.h('div.channels-addrow', addInput, addBtn));
  body.appendChild(allow);

  /* home channel */
  const home = section('Home channel', H.h('div.channels-hint', 'Where cron results and alerts land.'));
  const homeSel = H.h('select.select', {'aria-label':'Home channel for ' + p.name});
  HOME_OPTIONS.forEach(o => homeSel.appendChild(H.h('option', {value:o.v, selected: p.home === o.v}, o.t)));
  homeSel.value = p.home;
  homeSel.onchange = () => {
    p.home = homeSel.value;
    const opt = HOME_OPTIONS.find(o => o.v === p.home);
    toast('Home channel set to ' + (opt ? opt.t.split(' · ')[0] : p.home));
  };
  home.appendChild(homeSel);
  body.appendChild(home);

  /* options */
  const opts = section('Options');
  [
    ['mentionOnly', 'Mention-only in groups', 'Only reply when the bot is @mentioned.'],
    ['threading', 'Reply threading', 'Keep replies in the thread they came from.'],
    ['progress', 'Show tool progress', 'Post “running shell…” style lines while working.']
  ].forEach(([key, label, desc]) => {
    opts.appendChild(H.h('div.channels-opt',
      H.h('div.grow',
        H.h('div.channels-opt-t', label),
        H.h('div.channels-opt-s', desc)
      ),
      H.sw(!!p.opts[key], v => { p.opts[key] = v; }, label + ' for ' + p.name)
    ));
  });
  body.appendChild(opts);

  /* test message */
  const test = section('Send a test message');
  const log = H.h('div.channels-log');
  const renderLog = () => {
    log.innerHTML = '';
    if (!p.testLog || !p.testLog.length) { log.appendChild(H.h('div.channels-emptyline', 'No test messages sent.')); return; }
    p.testLog.forEach(entry => {
      log.appendChild(H.h('div.channels-log-row',
        H.h('span.mono.channels-log-time', entry.at),
        H.h('span.channels-log-text', entry.text)
      ));
    });
  };
  const ta = H.h('textarea.textarea.channels-test-ta', {rows:2, placeholder:'Send a message as Hermes to ' + homeLabel(p), 'aria-label':'Test message for ' + p.name});
  const sendBtn = H.h('button.btn.sm', {disabled:true, onclick: () => {
    const text = ta.value.trim();
    if (!text) return;
    p.testLog = p.testLog || [];
    p.testLog.unshift({at: nowTime(), text:text});
    ta.value = ''; sendBtn.disabled = true;
    renderLog();
    toast('Test message sent to ' + homeLabel(p));
  }}, H.ic('send','sm'), 'Send');
  ta.oninput = () => { sendBtn.disabled = !ta.value.trim(); };
  test.append(ta, H.h('div.channels-row-actions', H.h('span.channels-hint', 'Posts as Hermes, not as you.'), H.h('div.grow'), sendBtn), log);
  renderLog();
  body.appendChild(test);

  /* activity */
  const act = section('Recent activity');
  const actList = H.h('div.channels-act');
  if (!p.activity || !p.activity.length) actList.appendChild(H.h('div.channels-emptyline', 'No activity yet.'));
  (p.activity || []).forEach(a => {
    actList.appendChild(H.h('div.channels-act-row',
      H.h('span.dot' + (a.tone ? '.' + a.tone : '')),
      H.h('span.channels-act-text', a.text),
      H.h('span.channels-act-at', a.at)
    ));
  });
  act.appendChild(actList);
  body.appendChild(act);
}

function homeLabel(p){
  const o = HOME_OPTIONS.find(x => x.v === p.home);
  if (!o || p.home === 'none') return 'the dashboard';
  return o.t.split(' · ')[0];
}

function buildGuide(body, p){
  const st = statusOf(p);
  const step1Text = (p.guide && p.guide.where) || 'Create a bot in the platform’s developer settings and copy its credential.';

  body.appendChild(H.h('div.channels-dr-note',
    H.h('span.dot' + (st.dot ? '.' + st.dot : '')),
    H.h('div.grow',
      H.h('div.channels-dr-note-t', p.state === 'token' ? 'Not connected yet' : p.name + ' is off'),
      H.h('div.channels-dr-note-s', 'Three steps, about a minute. Nothing goes live until verification passes.')
    )
  ));

  const err = H.h('div.channels-err', {role:'alert'});
  const input = H.h('input.input', {type:'password', placeholder:'Paste the ' + (p.tokenLabel || 'token').toLowerCase(), autocomplete:'off', 'aria-label': p.tokenLabel || 'Token'});
  const verifyBtn = H.h('button.btn', {onclick: verify}, 'Verify connection');
  const verifyHint = H.h('div.channels-hint', 'Hermes checks the credential with ' + p.name + ' before enabling anything.');

  function verify(){
    const v = input.value.trim();
    if (!v) {
      const label = (p.tokenLabel || 'token').toLowerCase();
      err.textContent = 'Paste ' + article(label) + ' ' + label + ' first.';
      input.focus();
      return;
    }
    err.textContent = '';
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verifying…';
    later(() => {
      p.state = 'connected';
      p.enabled = true;
      p.chats = p.chats || 1;
      p.last = 'just now';
      p.allowed = p.allowed || [];
      p.opts = p.opts || {mentionOnly:true, threading:true, progress:false};
      p.activity = p.activity || [];
      p.activity.unshift({tone:'pos', text:'Credential verified · ' + p.name + ' connected', at:'now'});
      rerenderDrawer();
      repaintPage();
      toast(p.name + ' connected · 1 allowed chat');
    }, 900);
  }

  const steps = H.h('ol.channels-steps',
    H.h('li',
      H.h('span.channels-step-n', '1'),
      H.h('div',
        H.h('div.channels-step-t', 'Get the ' + (p.tokenLabel || 'token').toLowerCase()),
        H.h('p.channels-step-s', step1Text)
      )
    ),
    H.h('li',
      H.h('span.channels-step-n', '2'),
      H.h('div',
        H.h('div.channels-step-t', 'Paste it here'),
        input,
        H.h('div.channels-hint', 'Stored in ', H.h('code','~/.hermes/.env'), ' as ', H.h('code', p.tokenEnv), '. It is never shown again.')
      )
    ),
    H.h('li',
      H.h('span.channels-step-n', '3'),
      H.h('div',
        H.h('div.channels-step-t', 'Verify'),
        verifyBtn,
        verifyHint
      )
    )
  );
  input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); verify(); } };
  body.appendChild(H.h('div.channels-guide', steps, err));
}

function nowTime(){
  const d = new Date();
  return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
}

/* ---------- people ---------- */
function peoplePanel(){
  const wrap = H.h('div.channels-people');

  const inviteBtn = H.h('button.btn', {onclick: openInvite}, H.ic('key','sm'), 'Create invite code');
  wrap.appendChild(H.h('div.channels-sec-head',
    H.h('h2', 'Pairing requests'),
    S.pending.length ? H.pill(S.pending.length + ' waiting', 'warn') : null,
    H.h('div.grow'),
    inviteBtn
  ));

  const pendCard = H.h('div.card.channels-pending');
  if (!S.pending.length) {
    pendCard.appendChild(H.h('div.empty',
      H.h('div', 'No one is waiting to pair.'),
      H.h('div.muted', 'Pairing codes appear here when someone DMs the bot.')
    ));
  } else {
    S.pending.forEach(r => {
      pendCard.appendChild(H.h('div.channels-pend',
        H.h('span.channels-code-chip', r.code),
        H.h('div.grow',
          H.h('div.channels-pend-name', r.name),
          H.h('div.channels-pend-sub', r.platform + ' · ' + r.handle + ' · asked ' + r.at)
        ),
        H.h('div.channels-pend-actions',
          H.h('button.btn.sm', {onclick: () => approve(r)}, 'Approve'),
          H.h('button.btn.sm.ghost', {onclick: () => reject(r)}, 'Reject')
        )
      ));
    });
  }
  wrap.appendChild(pendCard);

  const approvedHead = H.h('div.channels-sec-head.channels-sec-head-gap',
    H.h('h2', 'People'),
    H.pill(S.people.length + ' approved'),
    H.h('div.grow'),
    H.h('span.channels-hint', 'Everyone here can DM the agent they are assigned to.')
  );
  wrap.appendChild(approvedHead);

  const tbody = H.h('tbody');
  S.people.forEach(person => {
    tbody.appendChild(peopleRow(person));
  });

  const table = H.h('table.tbl.channels-people-tbl',
    H.h('thead', H.h('tr',
      H.h('th', 'Person'),
      H.h('th', 'Platform'),
      H.h('th', 'Talks to'),
      H.h('th', 'Role'),
      H.h('th', 'Last seen'),
      H.h('th.r', 'Access')
    )),
    tbody
  );
  wrap.appendChild(H.h('div.card.channels-people-card', H.h('div.scroll-x', table)));

  if (!S.people.length) {
    wrap.appendChild(H.h('div.empty', H.h('div','No one approved yet.'), H.h('div.muted','Approve a pairing request to give someone access.')));
  }
  return wrap;
}

function peopleRow(person){
  const agentSel = H.h('select.select.channels-mini-select', {'aria-label':'Agent for ' + person.name});
  agentOptions().forEach(o => agentSel.appendChild(H.h('option', {value:o.v, selected:person.agent === o.v}, o.t)));
  agentSel.onchange = () => { person.agent = agentSel.value; toast(person.name + ' now talks to ' + agentName(person.agent)); };

  const roleSel = H.h('select.select.channels-mini-select', {'aria-label':'Role for ' + person.name});
  ['Owner','Member'].forEach(r => roleSel.appendChild(H.h('option', {value:r, selected:person.role === r}, r)));
  roleSel.onchange = () => {
    if (roleSel.value === 'Owner') S.people.forEach(o => { if (o !== person) o.role = 'Member'; });
    person.role = roleSel.value;
    repaintPage();
    toast(person.name + ' is now ' + person.role);
  };

  const actionCell = H.h('td.r', H.h('div.channels-confirm-cell',
    H.h('button.btn.sm.ghost.danger', {onclick: () => {
      actionCell.innerHTML = '';
      actionCell.appendChild(H.h('div.channels-confirm-cell',
        H.h('span.channels-confirm-text', 'Revoke access?'),
        H.h('button.btn.sm.danger', {onclick: () => {
          S.people = S.people.filter(x => x !== person);
          repaintPage();
          toast('Revoked ' + person.name + '’s access');
        }}, 'Revoke'),
        H.h('button.btn.sm.ghost', {onclick: () => repaintPage()}, 'Cancel')
      ));
    }}, 'Revoke')
  ));

  return H.h('tr',
    H.h('td',
      H.h('div.channels-cell-t', person.name),
      H.h('div.channels-cell-s', person.handle)
    ),
    H.h('td', H.h('span.channels-cell-s', person.platform)),
    H.h('td', agentSel),
    H.h('td', roleSel),
    H.h('td', H.h('span.channels-cell-s', person.last)),
    actionCell
  );
}

function approve(r){
  S.pending = S.pending.filter(x => x !== r);
  S.people.push({id:'p-' + Date.now(), name:r.name, handle:r.handle, platform:r.platform, agent:'hermes', role:'Member', last:'just now'});
  repaintPage();
  toast(r.name + ' approved on ' + r.platform);
}

function reject(r){
  S.pending = S.pending.filter(x => x !== r);
  repaintPage();
  toast('Rejected pairing code ' + r.code);
}

function openInvite(){
  const code = inviteCode();
  let left = 600;
  let iv = null;
  const countdown = H.h('span.channels-countdown.num', {});
  const copyBtn = H.h('button.btn', {onclick: () => copyText(code, 'Invite code copied')}, 'Copy code');
  const body = H.h('div.channels-invite',
    H.h('p.channels-dialog-note', 'Share this with one person. Their next DM to the bot pairs them automatically. Single use.'),
    H.h('div.channels-invite-row',
      H.h('div',
        H.h('div.channels-field-label', 'Invite code'),
        H.h('div.channels-invite-code', code)
      ),
      H.h('div.channels-countdown-box',
        H.h('div.channels-field-label', 'Expires in'),
        countdown
      )
    ),
    H.h('div.channels-qrwrap',
      H.html(qrSvg(code)),
      H.h('div.channels-qrside',
        H.pill('Sample', 'warn'),
        H.h('div.channels-qr-label', 'Layout placeholder · not a scannable QR.'),
        H.h('div.channels-hint', 'Production draws this from the pairing URL and the code above.')
      )
    )
  );

  const dlg = dialog({
    title:'Invite code',
    width:470,
    body,
    foot:[H.h('button.btn.ghost', {onclick:() => dlg.m.close()}, 'Done'), copyBtn],
    onClose:() => { if (iv) clearInterval(iv); }
  });

  function tick(){
    const m = Math.floor(Math.max(left,0) / 60);
    const s = Math.max(left,0) % 60;
    countdown.textContent = left > 0 ? m + ':' + String(s).padStart(2,'0') : 'Expired';
    if (left <= 0) {
      clearInterval(iv);
      countdown.classList.add('channels-expired');
      copyBtn.disabled = true;
    }
    left--;
  }
  tick();
  iv = setInterval(tick, 1000);
}

function inviteCode(){
  const A = 'ACDEFGHJKLMNPQRSTUVWXYZ23456789';
  const pick = n => { let s = ''; for (let i=0;i<n;i++) s += A[Math.floor(Math.random()*A.length)]; return s; };
  return pick(3) + '-' + pick(3);
}

function qrSvg(code){
  const N = 25;
  let seed = 2166136261;
  for (let i=0;i<code.length;i++) seed = Math.imul(seed ^ code.charCodeAt(i), 16777619) >>> 0;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const grid = Array.from({length:N}, () => Array(N).fill(0));
  const reserved = Array.from({length:N}, () => Array(N).fill(false));
  function finder(x0, y0){
    for (let y=-1;y<8;y++) for (let x=-1;x<8;x++) {
      const gx = x0+x, gy = y0+y;
      if (gx<0 || gy<0 || gx>=N || gy>=N) continue;
      reserved[gy][gx] = true;
      if (x>=0 && x<7 && y>=0 && y<7) {
        const edge = x===0 || x===6 || y===0 || y===6;
        const core = x>=2 && x<=4 && y>=2 && y<=4;
        grid[gy][gx] = (edge || core) ? 1 : 0;
      }
    }
  }
  finder(0,0); finder(N-7,0); finder(0,N-7);
  for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
    if (reserved[y][x]) continue;
    if (y === 6) { reserved[y][x] = true; grid[y][x] = x % 2 === 0 ? 1 : 0; }
    else if (x === 6) { reserved[y][x] = true; grid[y][x] = y % 2 === 0 ? 1 : 0; }
  }
  const ax = N-9, ay = N-9;
  for (let y=0;y<5;y++) for (let x=0;x<5;x++) {
    reserved[ay+y][ax+x] = true;
    const ring = x===0 || x===4 || y===0 || y===4;
    const centre = x===2 && y===2;
    grid[ay+y][ax+x] = (ring || centre) ? 1 : 0;
  }
  for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
    if (reserved[y][x]) continue;
    grid[y][x] = rnd() > 0.52 ? 1 : 0;
  }
  let rects = '';
  for (let y=0;y<N;y++) for (let x=0;x<N;x++) {
    if (grid[y][x]) rects += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
  }
  return '<svg class="channels-qr" viewBox="0 0 ' + N + ' ' + N + '" role="img" aria-label="Sample QR pattern, not scannable" shape-rendering="crispEdges">' + rects + '</svg>';
}

/* ---------- endpoints ---------- */
function endpointsPanel(){
  const wrap = H.h('div.channels-endpoints');
  if (ENDPOINTS.some(e => e.refused)) wrap.appendChild(warningCard());

  wrap.appendChild(H.h('div.channels-sec-head',
    H.h('h2', 'Listeners'),
    H.pill(ENDPOINTS.filter(e => e.enabled).length + ' running'),
    H.h('div.grow'),
    H.h('span.channels-hint', 'Loopback is the default. Public listeners must authenticate.')
  ));

  const tbody = H.h('tbody');
  ENDPOINTS.forEach(ep => {
    const swWrap = H.h('div', {onclick:e => e.stopPropagation()},
      H.sw(ep.enabled, v => {
        if (v && ep.refused) {
          ep.enabled = false;
          S.warnOpen = true;
          repaintPage();
          toast('Cannot start: set dashboard.basic_auth or an OAuth provider');
          return;
        }
        ep.enabled = v;
        repaintPage();
        toast(ep.name + ' listener ' + (v ? 'started' : 'stopped'));
      }, 'Enable ' + ep.name)
    );
    const copyBtn = H.h('button.btn.sm.ghost.channels-copybtn', {
      'aria-label':'Copy URL for ' + ep.name,
      onclick:e => { e.stopPropagation(); copyText(ep.url, ep.name + ' URL copied'); }
    }, H.ic('copy','sm'), 'Copy URL');

    const nameBtn = H.h('button.channels-epname', {
      type:'button',
      'aria-expanded': String(S.epSel === ep.id),
      onclick:e => { e.stopPropagation(); selectEndpoint(ep.id); }
    }, ep.name);

    const row = H.h('tr.channels-ep-row' + (S.epSel === ep.id ? '.is-sel' : ''),
      H.h('td', nameBtn),
      H.h('td', H.h('span.mono.channels-bind', ep.bind)),
      H.h('td', H.pill(ep.exposure, ep.exposureTone)),
      H.h('td', H.h('span.channels-cell-s', ep.auth)),
      H.h('td', swWrap),
      H.h('td.r', copyBtn)
    );
    row.onclick = () => selectEndpoint(ep.id);
    tbody.appendChild(row);
  });

  const table = H.h('table.tbl.channels-eptbl',
    H.h('thead', H.h('tr',
      H.h('th', 'Listener'),
      H.h('th', 'Bind address'),
      H.h('th', 'Exposure'),
      H.h('th', 'Auth'),
      H.h('th', 'On'),
      H.h('th.r', 'URL')
    )),
    tbody
  );
  wrap.appendChild(H.h('div.card.channels-epcard', H.h('div.scroll-x', table)));
  wrap.appendChild(endpointDetail(findEndpoint(S.epSel) || ENDPOINTS[1]));
  return wrap;
}

function selectEndpoint(id){
  if (S.epSel === id) return;
  S.epSel = id;
  repaintPage();
}

function warningCard(){
  const fix = H.h('div.channels-fix', {hidden: !S.warnOpen},
    H.h('ol.channels-fix-list',
      H.h('li', 'Set a credential: ', H.h('code', "hermes config set dashboard.basic_auth '<user>:<bcrypt-hash>'"), '. Use a hash, never a plain password.'),
      H.h('li', 'Or attach an OAuth provider: ', H.h('code','hermes config set auth.oauth.provider google'), '.'),
      H.h('li', 'Restart the gateway, then turn the listener back on.')
    ),
    H.h('div.channels-hint', 'While unauthenticated, the listener refuses to bind on 0.0.0.0. Loopback still works.')
  );
  const btn = H.h('button.btn.sm.ghost', {'aria-expanded': String(S.warnOpen), onclick: () => {
    S.warnOpen = !S.warnOpen;
    fix.hidden = !S.warnOpen;
    btn.setAttribute('aria-expanded', String(S.warnOpen));
    btn.textContent = S.warnOpen ? 'Hide fix' : 'How to fix';
  }}, S.warnOpen ? 'Hide fix' : 'How to fix');

  return H.h('div.card.channels-warning',
    H.h('span.channels-warn-ic', H.ic('warn','lg')),
    H.h('div.grow',
      H.h('div.channels-warn-head',
        H.h('strong', 'Webapp is public without auth'),
        H.pill('Refused to start', 'neg')
      ),
      H.h('div.channels-warn-body', 'Refuses to start: set ', H.h('code','dashboard.basic_auth'), ' or an OAuth provider.'),
      H.h('div.channels-warn-sub', '0.0.0.0:9120 · exposure Public · no auth'),
      fix
    ),
    btn
  );
}

function endpointDetail(ep){
  const card = H.h('div.card.channels-ep-detail');
  card.appendChild(H.h('div.card-h',
    H.h('h2.channels-card-h', ep.id === 'api' ? 'API access' : ep.name),
    H.pill(ep.enabled ? 'On' : 'Off', ep.enabled ? 'pos' : ''),
    H.h('div.grow'),
    H.h('span.mono.channels-detail-url', ep.url),
    H.h('button.btn.sm.ghost', {onclick: () => copyText(ep.url, ep.name + ' URL copied')}, H.ic('copy','sm'), 'Copy URL')
  ));

  const body = H.h('div.card-b.channels-ep-body');
  if (ep.id === 'api') {
    body.appendChild(H.h('p.channels-lead', 'OpenAI-compatible chat completions. Profile prefixes scope keys, models and memory; the default profile uses the bare path.'));

    const profile = H.h('select.select.channels-profile', {'aria-label':'API profile'});
    [['default','default'],['scout','scout'],['ledger','ledger']].forEach(([v,t]) => {
      profile.appendChild(H.h('option', {value:v, selected:S.apiProfile === v}, t));
    });
    const codeBox = H.h('pre.channels-code');
    const codeEl = H.h('code');
    codeBox.appendChild(codeEl);
    const bar = H.h('div.channels-codebar',
      H.h('span.channels-codebar-t', 'curl · chat completions'),
      H.h('div.grow'),
      H.h('button.btn.sm.ghost', {onclick: () => copyText(codeEl.textContent, 'curl example copied')}, H.ic('copy','sm'), 'Copy')
    );
    const wrapCode = H.h('div.channels-codewrap', bar, codeBox);

    const baseUrl = H.h('div.mono.channels-form-url');
    function drawCurl(){
      const p = S.apiProfile;
      const path = p === 'default' ? '/v1' : '/p/' + p + '/v1';
      const model = p === 'default' ? 'hermes-default' : 'hermes-' + p;
      baseUrl.textContent = ep.url + path;
      const text = 'curl ' + ep.url + path + '/chat/completions \\\n' +
        '  -H "Authorization: Bearer $HERMES_API_KEY" \\\n' +
        '  -H "Content-Type: application/json" \\\n' +
        "  -d '{\"model\":\"" + model + "\",\"messages\":[{\"role\":\"user\",\"content\":\"What failed in last night’s backup?\"}]}'";
      codeEl.textContent = text;
    }
    drawCurl();
    profile.onchange = () => { S.apiProfile = profile.value; drawCurl(); };

    body.appendChild(H.h('div.channels-form-row',
      H.h('div.field.channels-field-220', H.h('label','Profile'), profile),
      H.h('div.channels-form-note',
        H.h('div.channels-form-note-t', 'Base URL'),
        baseUrl
      )
    ));
    body.appendChild(wrapCode);

    const keysHead = H.h('div.channels-keys-head',
      H.h('h3', 'API keys'),
      H.pill(S.apiKeys.length + ' active'),
      H.h('div.grow'),
      H.h('button.btn.sm', {onclick: openKeyDialog}, 'Create API key')
    );
    const keyList = H.h('div.channels-keylist');
    if (!S.apiKeys.length) keyList.appendChild(H.h('div.channels-emptyline', 'No keys. Create one for each client.'));
    S.apiKeys.forEach(k => {
      keyList.appendChild(H.h('div.channels-key',
        H.h('div.grow',
          H.h('div.channels-key-name', k.name),
          H.h('div.channels-key-meta', k.masked + ' · created ' + k.created + ' · last used ' + k.last)
        ),
        H.h('button.btn.sm.ghost.danger', {onclick: () => {
          S.apiKeys = S.apiKeys.filter(x => x !== k);
          repaintPage();
          toast('Key “' + k.name + '” revoked');
        }}, 'Revoke')
      ));
    });
    body.append(keysHead, keyList);
  } else {
    body.appendChild(H.h('p.channels-lead', ep.lead || ''));
    if (ep.code) {
      const pre = H.h('pre.channels-code');
      const codeEl = H.h('code', ep.code);
      pre.appendChild(codeEl);
      body.appendChild(H.h('div.channels-codewrap',
        H.h('div.channels-codebar',
          H.h('span.channels-codebar-t', 'config snippet'),
          H.h('div.grow'),
          H.h('button.btn.sm.ghost', {onclick: () => copyText(ep.code, 'Snippet copied')}, H.ic('copy','sm'), 'Copy')
        ),
        pre
      ));
    }
    if (ep.refused) {
      body.appendChild(H.h('div.channels-inline-warn',
        H.h('span.dot.neg'),
        H.h('span', 'Refuses to start while 0.0.0.0 is bound without auth. Use the fix above or bind 127.0.0.1.')
      ));
    }
  }
  card.appendChild(body);
  return card;
}

function openKeyDialog(){
  let keyValue = '';
  let createdName = '';
  const body = H.h('div.channels-dialog-body');
  const foot = H.h('div.channels-dlg-foot');

  const dlg = dialog({
    title:'Create API key',
    width:470,
    body,
    foot
  });

  function formView(){
    body.innerHTML = '';
    const err = H.h('div.channels-err', {role:'alert'});
    const name = H.h('input.input', {placeholder:'e.g. laptop-cli', 'aria-label':'Key name'});
    const create = H.h('button.btn', {onclick: () => {
      const v = name.value.trim();
      if (!v) { err.textContent = 'Give the key a name so you can revoke it later.'; name.focus(); return; }
      createdName = v;
      keyValue = 'sample-key-shown-once-not-valid-0000';
      S.apiKeys.unshift({id:'k-' + Date.now(), name:v, masked:'hrms_••••••0000', created:'Today', last:'never'});
      repaintPage();
      onceView();
    }}, 'Create key');
    body.append(
      H.h('div.field', H.h('label','Name'), name, H.h('div.hint','For the client that will use it · not the key itself.')),
      H.h('p.channels-dialog-note', 'The key is shown once. Hermes stores only a hash.'),
      err
    );
    foot.innerHTML = '';
    foot.append(H.h('button.btn.ghost', {onclick:() => dlg.m.close()}, 'Cancel'), create);
    name.focus();
  }

  function onceView(){
    body.innerHTML = '';
    const pre = H.h('pre.channels-code.channels-code-single');
    const codeEl = H.h('code', keyValue);
    pre.appendChild(codeEl);
    body.append(
      H.h('div.channels-once-banner',
        H.h('span.dot.warn'),
        H.h('span', 'Copy it now · it will not be shown again.')
      ),
      pre,
      H.h('div.channels-hint', 'Sample key for the prototype. No server accepts it; nothing here is a real credential.'),
      H.h('div.channels-key-meta', 'Key “' + createdName + '” now appears masked in the list.')
    );
    foot.innerHTML = '';
    foot.append(
      H.h('button.btn.ghost', {onclick:() => dlg.m.close()}, 'Done'),
      H.h('button.btn', {onclick:() => copyText(keyValue, 'Sample key copied')}, 'Copy key')
    );
  }

  formView();
}

/* ---------- peers ---------- */
function peersPanel(){
  const wrap = H.h('div.channels-peers-wrap');
  wrap.appendChild(H.h('div.channels-sec-head',
    H.h('h2', 'Peer gateways'),
    H.pill(PEERS.filter(p => p.trust === 'trusted').length + ' trusted'),
    H.h('div.grow'),
    H.h('button.btn', {onclick: openPeerDialog}, H.ic('plus','sm'), 'Add peer')
  ));
  wrap.appendChild(H.h('p.channels-section-note', 'Bot-to-bot DMs over hermes peer. Both sides must approve the pairing code before messages flow.'));

  const grid = H.h('div.channels-peers');
  const listCard = H.h('div.card.channels-peerlist');
  const list = H.h('div.list');
  PEERS.forEach(peer => {
    const tone = peer.trust === 'trusted' ? 'pos' : peer.trust === 'pending' ? 'warn' : 'neg';
    const label = peer.trust === 'trusted' ? 'Trusted' : peer.trust === 'pending' ? 'Pending approval' : 'Revoked';
    const row = H.h('div.row.click.channels-peer' + (S.peerId === peer.id ? '.is-sel' : ''), {role:'button', tabindex:'0'},
      H.h('div.grow',
        H.h('div.t.channels-peer-host', peer.host),
        H.h('div.s', peer.agent + ' · last handshake ' + peer.last)
      ),
      H.pill(label, tone),
      H.h('span.channels-peer-chev', H.ic('chev','sm'))
    );
    row.onclick = () => { S.peerId = peer.id; repaintPage(); };
    row.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.peerId = peer.id; repaintPage(); } };
    list.appendChild(row);
  });
  listCard.appendChild(list);
  grid.append(listCard, askCard());
  wrap.appendChild(grid);
  return wrap;
}

function askCard(){
  const peer = findPeer(S.peerId) || PEERS[0];
  const trusted = peer.trust === 'trusted';
  const typing = S.peerTyping === peer.id;
  const card = H.h('div.card.channels-ask');

  const sel = H.h('select.select', {'aria-label':'Peer to ask'});
  PEERS.forEach(p => sel.appendChild(H.h('option', {value:p.id, selected:p.id === peer.id}, p.host)));
  sel.onchange = () => { S.peerId = sel.value; repaintPage(); };

  const chat = H.h('div.channels-chat', {'aria-live':'polite'});
  const history = S.chats[peer.id] || [];
  if (!history.length && !typing) {
    chat.appendChild(H.h('div.channels-chat-empty', 'No messages yet. Peers reply asynchronously.'));
  }
  history.forEach(m => {
    chat.appendChild(H.h('div.channels-bubble.' + (m.from === 'me' ? 'me' : 'them'), m.text));
  });
  if (typing) chat.appendChild(H.h('div.channels-bubble.them.channels-typing', '…'));

  const ta = H.h('textarea.textarea.channels-ask-ta', {rows:2, placeholder:'Ask ' + peer.agent + ' about its machine…', 'aria-label':'Message to ' + peer.host, disabled: !trusted || typing});
  const send = H.h('button.btn', {disabled: !trusted || typing, onclick: () => {
    const text = ta.value.trim();
    if (!text || S.peerTyping) return;
    S.chats[peer.id] = S.chats[peer.id] || [];
    S.chats[peer.id].push({from:'me', text:text});
    S.peerTyping = peer.id;
    repaintPage();
    later(() => {
      S.chats[peer.id].push({from:'them', text: peer.reply});
      S.peerTyping = null;
      repaintPage();
    }, 1500);
  }}, H.ic('send','sm'), 'Send');
  ta.oninput = () => { send.disabled = !ta.value.trim() || !trusted || !!S.peerTyping; };
  ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (!send.disabled) send.click(); } };

  card.append(
    H.h('div.card-h',
      H.h('h2.channels-card-h', 'Ask a peer'),
      H.h('div.grow'),
      H.pill(trusted ? 'Trusted' : peer.trust === 'pending' ? 'Pending' : 'Revoked', trusted ? 'pos' : peer.trust === 'pending' ? 'warn' : 'neg')
    ),
    H.h('div.card-b.channels-ask-body',
      H.h('div.field', H.h('label','Peer'), sel),
      !trusted ? H.h('div.channels-inline-warn',
        H.h('span.dot' + (peer.trust === 'pending' ? '.warn' : '.neg')),
        H.h('span', peer.trust === 'pending' ? 'Waiting for ' + peer.host + ' to approve the pairing code.' : 'Trust was revoked. Pair again before messaging.')
      ) : null,
      chat,
      H.h('div.channels-ask-form', ta, send),
      H.h('div.channels-hint', trusted ? 'Delivered over the peer channel; replies may take a few seconds.' : 'Messages stay disabled until trust is approved.')
    )
  );
  return card;
}

function openPeerDialog(){
  const body = H.h('div.channels-dialog-body');
  const err = H.h('div.channels-err', {role:'alert'});
  const url = H.h('input.input', {placeholder:'https://studio-mini.lan:9119', 'aria-label':'Peer gateway URL'});
  const code = H.h('input.input', {placeholder:'K7M-4QX', 'aria-label':'Peer pairing code'});
  body.append(
    H.h('div.field', H.h('label','Gateway URL'), url, H.h('div.hint','Reachable from this machine. Peer traffic uses the dashboard port.')),
    H.h('div.field', H.h('label','Pairing code'), code, H.h('div.hint','Run hermes peer pair on the other machine to get a code.')),
    err
  );
  const add = H.h('button.btn', {onclick: () => {
    const u = url.value.trim();
    const c = code.value.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(u)) { err.textContent = 'Enter a full URL starting with http:// or https://.'; url.focus(); return; }
    if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/i.test(c)) { err.textContent = 'Pairing codes look like K7M-4QX.'; code.focus(); return; }
    const id = 'peer-' + Date.now();
    PEERS.push({id:id, host:u.replace(/^https?:\/\//,'').replace(/\/$/,''), agent:'Unknown', trust:'pending', last:'never', reply:'Pairing is pending on this side.'});
    S.peerId = id;
    dlg.m.close();
    repaintPage();
    toast('Pairing request sent to ' + u.replace(/^https?:\/\//,''));
  }}, 'Add peer');

  const dlg = dialog({
    title:'Add a peer',
    width:470,
    body,
    foot:[H.h('button.btn.ghost', {onclick:() => dlg.m.close()}, 'Cancel'), add]
  });
  setTimeout(() => { try { url.focus(); } catch (e) {} }, 0);
}

/* ---------- dialogs ---------- */
function dialog({title, body, foot, width = 480, onClose}){
  const bodyWrap = H.h('div.channels-dlg-body', body);
  const footNode = !foot ? null : Array.isArray(foot) ? H.h('div.channels-dlg-foot', foot) : foot;
  const content = H.h('div.channels-dlg',
    H.h('div.channels-dlg-head',
      H.h('div.grow', H.h('h2', title)),
      H.h('button.btn.icon.sm.ghost', {'aria-label':'Close dialog'}, H.ic('x','sm'))
    ),
    bodyWrap,
    footNode
  );
  const m = H.modal(content, {width, onClose});
  content.querySelector('[aria-label="Close dialog"]').onclick = m.close;
  return {m, body: bodyWrap};
}

H.views.channels = { title:'channels', render };
})();

/* js/views/insights.js */
/* Insights · what Hermes spent, did, and logged. Charts are hand-drawn SVG (no libraries).
   Sample data is generated from a seeded PRNG so a given range/profile always looks the same. */
(function(){
const H = window.H;
const SVGNS = 'http://www.w3.org/2000/svg';

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
  const maxV = niceMax(Math.max.apply(null, d.spend.concat([0.01])), 4);
  const svg = svgEl('svg', {viewBox:'0 0 ' + width + ' ' + h, class:'insights-chart', 'aria-label':'Daily spend bar chart'});
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
    tx.textContent = axisMoney(maxV * i / 4);
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
    const label = d.labels[i].full + ' · ' + money(v) + (v > 0 ? ' · ' + pct(v / (d.total || 1), 1) + ' of range' : ' · no spend');
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
      log: makeLogs(),
      level: 'all',
      src: 'all',
      q: '',
      follow: true,
      paused: false,
      expanded: new Set(),
      explained: new Set(),
    };
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
      const rangeSeg = H.seg(RANGE_IDS.map(id => ({id, label:id})), state.range, id => {
        state.range = id;
        paint();
      });
      const sel = H.h('select.select.insights-select', {'aria-label':'Profile'});
      PROFILES.forEach(p => sel.appendChild(H.h('option', {value:p.id}, p.label)));
      sel.value = state.profile;
      sel.addEventListener('change', () => {
        state.profile = sel.value;
        paint();
      });
      return H.h('div.page-head.insights-head',
        H.h('div',
          H.h('h1', 'Insights'),
          H.h('p', 'What Hermes spent, ran and logged · ' + rangeLabel() + ' · ' + profileLabel().toLowerCase() + ' · sample data')
        ),
        H.h('div.grow'),
        H.h('div.insights-controls',
          H.h('label.insights-ctl', H.h('span.insights-ctl-l', 'Range'), rangeSeg),
          H.h('label.insights-ctl', H.h('span.insights-ctl-l', 'Profile'), sel)
        )
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
      const partialNote = d.range === '24h' ? 'current hour is partial' : 'today is partial';
      const caption = 'Peak ' + money(d.spend[peakIdx]) + ' on ' + peakLabel + ' · ' + partialNote + ' · zero baseline';
      return H.h('div.card.insights-chart-card', wrap, H.h('div.insights-chart-cap', caption));
    }

    function threadTable(d){
      const card = H.h('div.card.insights-threadcard');
      const table = H.h('table.tbl.insights-threads');
      const thead = H.h('thead');
      thead.appendChild(H.h('tr',
        H.h('th', 'Thread'), H.h('th', 'Agent'), H.h('th', 'Model'),
        H.h('th.r', 'Tokens'), H.h('th.r', 'Cost')
      ));
      table.appendChild(thead);
      const tbody = H.h('tbody');
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
      body.appendChild(budgetRow(d));

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
      const chartNote = (d.range === '24h' ? 'Last 24 hours' : 'Last ' + d.meta.buckets + ' days') + ' to ' + d.todayLabel + ' · USD';
      body.appendChild(section('Daily spend', chartCard(d, wrap), chartNote));

      const modelMax = Math.max.apply(null, d.byModel.map(m => m.tokens).concat([1]));
      const agentMax = Math.max.apply(null, d.byAgent.map(a => a.tokens).concat([1]));
      const lists = H.h('div.grid.cols-2.insights-lists',
        hlistCard('By model', d.byModel.map(m => ({id:m.id, name:m.id, provider:m.provider, tokens:m.tokens, cost:m.cost, share:m.share})), modelMax, 'model'),
        hlistCard('By agent', d.byAgent.map(a => ({id:a.id, name:a.name, role:a.role, tokens:a.tokens, cost:a.cost, share:a.share})), agentMax, 'agent')
      );
      body.appendChild(section('Where the spend went', lists, 'Share of tokens in this range'));

      body.appendChild(section('Most expensive threads',
        H.h('div.insights-bottom', threadTable(d), cacheCard(d)),
        'Click a row to open the thread'
      ));
    }

    /* ---------- activity ---------- */
    function activityView(body, d){
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
    function filteredLogs(){ return state.log.filter(lineMatches); }
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
      return Object.assign({
        at:l.t.toISOString(),
        level:l.level,
        source:l.source,
        seq:l.seq,
      }, l.fields);
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
      line.appendChild(H.h('span.insights-log-ts', timeFull(l.t)));
      line.appendChild(H.h('span.insights-lvl.' + l.level, l.level));
      line.appendChild(H.h('span.insights-log-src', l.source));
      const msg = H.h('span.insights-log-msg');
      msg.appendChild(highlight(l.msg, state.q));
      if (l.level === 'error'){
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
      countEl.textContent = 'Showing ' + shown + ' of ' + state.log.length + ' lines';
    }
    function syncStatus(){
      if (!statusEl) return;
      statusEl.innerHTML = '';
      if (state.paused) statusEl.append(H.h('span.dot'), 'Paused');
      else if (state.follow) statusEl.append(H.h('span.dot.live'), 'Following · one line every 1.2 s');
      else statusEl.append(H.h('span.dot'), 'Not following');
    }
    function renderLogList(){
      if (!listEl) return;
      listEl.innerHTML = '';
      const rows = filteredLogs();
      rows.forEach(l => listEl.appendChild(logRow(l)));
      if (!rows.length){
        listEl.appendChild(H.h('div.empty', H.h('div', 'No log lines match these filters.'),
          H.h('button.btn.sm', {onclick:() => {
            state.q = ''; state.level = 'all'; state.src = 'all';
            const search = listEl.closest('.insights-logs') && listEl.closest('.insights-logs').querySelector('.insights-log-search');
            if (search) search.value = '';
            const seg = listEl.closest('.insights-logs') && listEl.closest('.insights-logs').querySelectorAll('.insights-log-toolbar .seg button');
            if (seg && seg.length) seg.forEach(b => b.setAttribute('aria-pressed', String(b.textContent === 'All')));
            paint();
          }}, 'Reset filters')));
      }
      updateCount();
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
        l.t.toISOString().slice(11, 23) + ' ' + l.level.toUpperCase().padEnd(5) + ' ' + l.source.padEnd(7) + ' ' + l.msg
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
      ], state.level, id => { state.level = id; renderLogList(); });

      const srcSel = H.h('select.select.insights-log-src-select', {'aria-label':'Log source'});
      [['all', 'All sources'], ['agent', 'agent'], ['gateway', 'gateway'], ['cron', 'cron'], ['mcp', 'mcp'], ['errors', 'Errors only']]
        .forEach(([v, label]) => srcSel.appendChild(H.h('option', {value:v}, label)));
      srcSel.value = state.src;
      srcSel.addEventListener('change', () => { state.src = srcSel.value; renderLogList(); });

      const search = H.h('input.input.insights-log-search', {
        type:'search', placeholder:'Search messages, sources, error codes', 'aria-label':'Search logs',
        value:state.q,
      });
      search.addEventListener('input', () => { state.q = search.value.trim(); renderLogList(); });

      followSw = H.sw(state.follow, v => {
        state.follow = v;
        if (v) startFollow(); else clearTimer();
        syncStatus();
      }, 'Follow new log lines');

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

      toolbar.append(levelSeg,
        H.h('div.insights-log-src', srcSel),
        search,
        H.h('div.insights-follow', H.h('span', 'Follow'), followSw),
        pauseBtn, clearBtn, copyBtn
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
      renderLogList();
      syncStatus();
      scrollBottom();
    }

    /* ---------- section helper + paint ---------- */
    function section(title, content, note){
      const s = H.h('div.sec');
      const h = H.h('h2', title);
      if (note) h.appendChild(H.h('span.insights-note', note));
      s.append(h, content);
      return s;
    }

    function paint(){
      clearTimer();
      pending = [];
      let page = root.querySelector('.insights-page');
      if (!page){
        page = H.h('div.page.insights-page');
        root.appendChild(page);
      }
      page.scrollTop = 0;
      page.innerHTML = '';
      const d = dataFor();
      const pageIn = H.h('div.page-in.insights-page-in');
      pageIn.appendChild(head());
      pageIn.appendChild(H.h('div.insights-tabbar', tabsBar()));
      const body = H.h('div.insights-body');
      if (state.tab === 'usage') usageView(body, d);
      else if (state.tab === 'activity') activityView(body, d);
      else logsView(body, d);
      pageIn.appendChild(body);
      page.appendChild(pageIn);

      pending.forEach(fn => fn());
      pending = [];
      if (state.tab === 'logs'){
        startFollow();
        scrollBottom();
      }
    }

    paint();
  },
};
})();

/* js/views/settings.js */
/* Settings · every Hermes configuration and admin surface, grouped for humans.
   Owns: this file + css/settings.css. Registers H.views.settings. */
(function(){
const H = window.H;

/* ---------- static sample data ---------- */
const TABS = [
  {id:'general',  label:'General',         icon:'gear'},
  {id:'models',   label:'Models',          icon:'cpu'},
  {id:'agent',    label:'Agent',           icon:'brain'},
  {id:'tools',    label:'Tools & terminal',icon:'terminal'},
  {id:'keys',     label:'Keys & secrets',  icon:'key'},
  {id:'security', label:'Security',        icon:'shield'},
  {id:'profiles', label:'Profiles',        icon:'users'},
  {id:'system',   label:'System',          icon:'db'},
  {id:'advanced', label:'Advanced',        icon:'file'}
];

const MODELS = [
  {id:'claude-sonnet-5-5', name:'Claude Sonnet 5.5', provider:'Anthropic', ctx:'1M'},
  {id:'claude-opus-5-5',   name:'Claude Opus 5.5',   provider:'Anthropic', ctx:'1M'},
  {id:'deepseek-flash',    name:'DeepSeek Flash',    provider:'DeepSeek',  ctx:'1M'},
  {id:'gemini-flash',      name:'Gemini Flash',      provider:'Google',    ctx:'1M'},
  {id:'hermes-local',      name:'Hermes Local 8B',   provider:'Ollama',    ctx:'64k'}
];
const MODEL = id => MODELS.find(m => m.id === id) || MODELS[0];
const GROUPS = ['Anthropic','DeepSeek','Google','Ollama'];

const AUX = [
  {id:'vision',     name:'Vision',             desc:'Describes images for text-only models', key:'auxiliary.vision'},
  {id:'compression',name:'Compression',        desc:'Summarises a thread before the context limit', key:'auxiliary.compression'},
  {id:'web',        name:'Web extract',        desc:'Turns a fetched page into clean text', key:'auxiliary.web_extract'},
  {id:'titles',     name:'Thread titles',      desc:'Names a thread from its first turn', key:'auxiliary.title'},
  {id:'approval',   name:'Approval classifier',desc:'Reads risky commands for the smart policy', key:'auxiliary.approval'},
  {id:'memory',     name:'Memory curator',     desc:'Merges durable notes after a turn', key:'auxiliary.memory'}
];

const SKINS = [
  {id:'default', name:'Default', bg:'var(--sunk)', fg:'var(--text)', accent:'var(--live)'},
  {id:'nord',    name:'Nord',    bg:'var(--live-soft)', fg:'var(--live)', accent:'var(--positive)'},
  {id:'gruvbox', name:'Gruvbox', bg:'var(--warn-bg)', fg:'var(--warn-ink)', accent:'var(--warning)'},
  {id:'paper',   name:'Paper',   bg:'var(--surface)', fg:'var(--muted)', accent:'var(--text)'},
  {id:'mono',    name:'Mono',    bg:'var(--raised)', fg:'var(--text)', accent:'var(--faint)'}
];

const SHORTCUTS = [
  [['⌘','K'],'Command palette'], [['⌘','N'],'New thread'], [['⌘','/'],'Keyboard shortcuts'],
  [['⌘','.'],'Stop the agent'], [['⌘','⇧','P'],'Switch profile'], [['⌘','⇧','M'],'Change model'],
  [['⌘','B'],'Toggle agent rail'], [['⌘','I'],'Toggle inspector'], [['⌘','↵'],'Send message'],
  [['Esc'],'Close a dialog or panel'], [['⌘','⇧','C'],'Copy the transcript'], [['⌘','⇧','T'],'Open the terminal tab']
];

const YAML_BASE = [
  'model: claude-sonnet-5-5',
  'model_provider: anthropic',
  'api_key: ${ANTHROPIC_API_KEY}',
  'provider_routing:',
  '  strategy: cost-first',
  '  allow_fallbacks: true',
  'fallback_providers:',
  '  - claude-opus-5-5',
  '  - gemini-flash',
  'fallback:',
  '  min_switch_reset_seconds: 60',
  'auxiliary:',
  '  vision:',
  '    model: gemini-flash',
  '  compression:',
  '    model: deepseek-flash',
  '    no_progress_timeout: 60',
  '  web_extract:',
  '    model: gemini-flash',
  '  approval:',
  '    model: deepseek-flash',
  'agent:',
  '  max_turns: 500',
  '  reasoning_effort: medium',
  '  image_input_mode: auto',
  'compression:',
  '  engine: summary',
  '  threshold: 0.8',
  '  keep_recent_turns: 8',
  'terminal:',
  '  backend: local',
  '  cwd: ~/hermes-maintenance',
  '  timeout: 180',
  '  env_passthrough:',
  '    - PATH',
  '    - SSH_AUTH_SOCK',
  '  shell_init_files:',
  '    - ~/.bashrc',
  'browser:',
  '  cdp_url: http://127.0.0.1:9222',
  '  headed: false',
  '  use_real_profile: false',
  'approvals:',
  '  mode: smart',
  '  timeout: 300',
  'command_allowlist:',
  '  - git status',
  '  - git diff *',
  'dashboard:',
  '  host: 127.0.0.1',
  '  port: 9119',
  '  basic_auth: false',
  'gateway:',
  '  port: 9119',
  '  heartbeat_seconds: 30',
  'secrets:',
  '  bitwarden:',
  '    enabled: true',
  '    project: hermes-prod',
  'display:',
  '  interface: web',
  '  skin: default',
  '  density: comfortable'
].join('\n');

/* ---------- persistent view state (survives tab switches) ---------- */
const state = {
  tab:'general',
  theme:'system', density:'comfortable',
  iface:'web', skin:'default', pets:'faces', language:'en-US',
  notify:{approvals:true, finished:true, failed:false},
  quiet:{on:true, from:'22:00', to:'07:00'},
  model:'claude-sonnet-5-5', effort:'medium',
  fallbacks:['claude-opus-5-5','gemini-flash'],
  aux:{vision:'gemini-flash',compression:'deepseek-flash',web:'gemini-flash',titles:'deepseek-flash',approval:'deepseek-flash',memory:'main'},
  moa:{on:false, a:'claude-opus-5-5', b:'gemini-flash', agg:'claude-sonnet-5-5'},
  agent:{maxTurns:500, compress:80, delegation:2, checkpoints:true, worktree:true, memory:true},
  approval:'smart',
  backend:'local',
  envVars:['PATH','SSH_AUTH_SOCK','ANTHROPIC_*'],
  browser:{cdp:'http://127.0.0.1:9222', headless:true, profile:'isolated', test:'idle'},
  providers:['parallel','exa','firecrawl','brave','tavily'],
  envKeys:[
    {name:'ANTHROPIC_API_KEY', set:true, changed:'12 Oct 2026'},
    {name:'DEEPSEEK_API_KEY', set:true, changed:'2 Nov 2026'},
    {name:'GEMINI_API_KEY', set:true, changed:'28 Oct 2026'},
    {name:'TELEGRAM_BOT_TOKEN', set:true, changed:'4 Sep 2026'},
    {name:'OPENAI_API_KEY', set:false, changed:'–'},
    {name:'HERMES_DASHBOARD_SESSION_TOKEN', set:false, changed:'–'}
  ],
  confirmKey:null,
  managers:{bitwarden:true, onepassword:false},
  proxy:{running:true},
  allowlist:[
    {pattern:'git status', scope:'This profile', by:'you', date:'12 Nov'},
    {pattern:'git diff *', scope:'This profile', by:'you', date:'12 Nov'},
    {pattern:'npm run *', scope:'This profile', by:'Hermes', date:'8 Nov'},
    {pattern:'hermes doctor', scope:'All profiles', by:'you', date:'2 Nov'},
    {pattern:'rg *', scope:'This profile', by:'Hermes', date:'28 Oct'},
    {pattern:'pytest *', scope:'This profile', by:'Hermes', date:'21 Oct'}
  ],
  suggestions:[
    {cmd:'systemctl --user status hermes-gateway', uses:12, note:'read-only status'},
    {cmd:'docker ps', uses:9, note:'read-only'},
    {cmd:'hermes status --full', uses:7, note:'read-only'},
    {cmd:'sqlite3 state.db "PRAGMA table_info(sessions)"', uses:4, note:'read-only · token masked'}
  ],
  dashboard:{mode:'loopback', user:'hermes', oauth:false},
  profiles:[
    {name:'default',  hue:212, model:'claude-sonnet-5-5', home:'~/.hermes', disk:'1.8 GB', sessions:7},
    {name:'research', hue:158, model:'deepseek-flash',   home:'~/.hermes/profiles/research', disk:'640 MB', sessions:2},
    {name:'ops',      hue:32,  model:'gemini-flash',     home:'~/.hermes/profiles/ops', disk:'912 MB', sessions:3}
  ],
  activeProfile:'default',
  deleteName:null,
  health:[
    {id:'python',  label:'Python',          detail:'3.14.2 · pm-managed interpreter', status:'ok'},
    {id:'db',      label:'state.db',        detail:'quick_check passed · 412 MB', status:'ok'},
    {id:'wal',     label:'WAL checkpoint',  detail:'48 MB WAL · last checkpoint 9h ago', status:'fail', fix:'Checkpoint now'},
    {id:'gateway', label:'Gateway',         detail:'pid 1020 · up 6d 4h · :9119', status:'ok'},
    {id:'mcp',     label:'MCP servers',     detail:'2 of 3 connected · filesystem timed out after 30s', status:'warn', fix:'Retest'},
    {id:'node',    label:'Node.js',         detail:'22.14.0 · TUI and web build', status:'ok'},
    {id:'browser', label:'Browser',         detail:'No local Chromium · CDP at 127.0.0.1:9222', status:'warn', fix:'Open settings'},
    {id:'config',  label:'Config',          detail:'config.yaml valid · 3 keys pinned', status:'ok'}
  ],
  doctorAt:'2m ago',
  version:{checking:false, checked:false},
  backups:[
    {id:'b1', name:'hermes-backup-2026-11-19-0300.zip', size:'214 MB', when:'Today 03:00', kind:'Nightly'},
    {id:'b2', name:'hermes-backup-2026-11-18-0300.zip', size:'211 MB', when:'Yesterday 03:00', kind:'Nightly'},
    {id:'b3', name:'hermes-backup-2026-11-17-0300.zip', size:'209 MB', when:'17 Nov 03:00', kind:'Nightly'},
    {id:'b4', name:'config.yaml.pre-import.2026-11-15.zip', size:'18 KB', when:'15 Nov 18:22', kind:'Config'}
  ],
  restoreId:null,
  gateway:{state:'running', pid:1020, uptime:'6d 4h'},
  paused:false,
  yaml:YAML_BASE, baseline:YAML_BASE, yamlSearch:'', validation:'idle'
};

/* ---------- small helpers ---------- */
let seq = 0;

function iconBtn(name, label, onclick, cls){
  return H.h('button.btn.sm.icon.ghost' + (cls ? '.' + cls : ''), {'aria-label':label, title:label, onclick}, H.ic(name,'sm'));
}
function btn(label, opts){
  opts = opts || {};
  const cls = '.btn' + (opts.sm ? '.sm' : '') + (opts.ghost ? '.ghost' : '') +
    (opts.primary ? '.primary' : '') + (opts.danger ? '.danger' : '') + (opts.cls ? '.' + opts.cls : '');
  const b = H.h('button' + cls, {onclick:opts.onclick || null, type:'button', 'aria-label':opts.aria || null},
    opts.icon ? H.ic(opts.icon,'sm') : null, label);
  if (opts.disabled) b.disabled = true;
  return b;
}
function pill(text, tone){ return H.pill(text, tone); }
function note(text, tone, icon){
  return H.h('div.settings-note' + (tone ? '.' + tone : ''),
    H.ic(icon || 'warn','sm'),
    H.h('span', text));
}
function field(label, control, hint){
  return H.h('label.field.settings-field',
    H.h('span.settings-flabel', label),
    control,
    hint ? H.h('span.hint', hint) : null);
}
function card(head, body, actions){
  const c = H.h('div.card.settings-card');
  if (head != null || actions) {
    c.appendChild(H.h('div.card-h.settings-card-h',
      H.h('div.settings-grow', head != null ? head : ''),
      actions ? H.h('div.settings-hacts', actions) : null));
  }
  c.appendChild(body);
  return c;
}
function bodyBox(...kids){ return H.h('div.settings-card-b', kids); }
function srow(title, desc, key, panel){
  const id = 'settings-h-' + (++seq);
  return H.h('div.settings-row',
    H.h('div.settings-label',
      H.h('h2', {id}, title),
      desc ? H.h('p', desc) : null,
      key ? H.h('div.settings-key', key) : null),
    H.h('div.settings-panel', {role:'group','aria-labelledby':id}, panel));
}
function choice(title, sub, active, onclick, opts){
  opts = opts || {};
  return H.h('button.settings-choice' + (opts.danger ? '.danger' : ''),
    {'aria-pressed':String(!!active), onclick, type:'button'},
    H.h('span.settings-radio'),
    H.h('span.settings-choice-txt',
      H.h('span.t', title),
      sub ? H.h('span.s', sub) : null,
      opts.extra || null));
}
function toggle(title, desc, on, cb){
  return H.h('div.settings-tog',
    H.h('div.settings-grow',
      H.h('div.t', title),
      desc ? H.h('div.s', desc) : null),
    H.sw(on, cb, title));
}
function modelSelect(value, onchange, opts){
  opts = opts || {};
  const s = H.h('select.select.settings-select', {'aria-label':opts.aria || 'Choose a model'});
  if (opts.main) s.appendChild(H.h('option', {value:'main'}, 'Same as main model'));
  GROUPS.forEach(g => {
    const list = MODELS.filter(m => m.provider === g);
    if (!list.length) return;
    const og = H.h('optgroup', {label:g});
    list.forEach(m => og.appendChild(H.h('option', {value:m.id}, m.name + ' · ' + m.ctx)));
    s.appendChild(og);
  });
  s.value = value;
  s.onchange = () => onchange(s.value);
  return s;
}
function select(options, value, onchange, aria){
  const s = H.h('select.select.settings-select', {'aria-label':aria || ''});
  options.forEach(o => {
    const val = typeof o === 'string' ? o : o.value;
    const lab = typeof o === 'string' ? o : o.label;
    s.appendChild(H.h('option', {value:val}, lab));
  });
  s.value = value;
  s.onchange = () => onchange(s.value);
  return s;
}
function input(value, attrs){
  return H.h('input.input', Object.assign({type:'text', value:value == null ? '' : value}, attrs || {}));
}
function tbl(cols, rows){
  const t = H.h('table.tbl');
  t.appendChild(H.h('thead', H.h('tr', cols.map(c => H.h('th', c.cls ? {class:c.cls} : null, c.label || c)))));
  const tb = H.h('tbody');
  rows.forEach(r => {
    const tr = H.h('tr');
    r.forEach((cell, i) => {
      const c = cols[i] || {};
      tr.appendChild(H.h('td', c.cls ? {class:c.cls} : null, cell == null ? '–' : cell));
    });
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  return H.h('div.scroll-x.settings-tablewrap', t);
}
function lockedRow(title, value, source){
  return H.h('div.settings-locked',
    H.ic('lock','sm'),
    H.h('div.settings-grow',
      H.h('div.t', title),
      H.h('div.s', source)),
    H.h('code.settings-code', value),
    H.h('span.pill.settings-lockpill', 'Set by your administrator'));
}
function code(text){ return H.h('code.settings-code', text); }
function kv(label, value){
  return H.h('div.settings-kv', H.h('span.k', label), H.h('span.v', value));
}
function cap(s){ return s.charAt(0).toUpperCase() + s.slice(1); }

/* ---------- 1. General ---------- */
function buildGeneral(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');

  const themeHint = H.h('div.settings-hintline',
    state.theme === 'system' ? 'Following the operating system appearance.' : cap(state.theme) + ' theme is pinned for this browser.');
  const themeSeg = H.seg([{id:'system',label:'System'},{id:'light',label:'Light'},{id:'dark',label:'Dark'}], state.theme, id => {
    state.theme = id;
    if (id === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = id;
    themeHint.textContent = id === 'system' ? 'Following the operating system appearance.' : cap(id) + ' theme is pinned for this browser.';
    toast(id === 'system' ? 'Theme follows the system' : cap(id) + ' theme applied');
  });
  rows.appendChild(srow('Theme', 'How this browser workspace looks. The terminal skin is set separately.', 'display.theme',
    card(null, bodyBox(themeSeg, themeHint))));

  const densityHint = H.h('div.settings-hintline',
    state.density === 'compact' ? 'Tighter rows; more settings per screen.' : 'Roomier rows and labels.');
  const densitySeg = H.seg([{id:'comfortable',label:'Comfortable'},{id:'compact',label:'Compact'}], state.density, id => {
    state.density = id;
    if (id === 'compact') document.documentElement.dataset.density = 'compact';
    else delete document.documentElement.dataset.density;
    densityHint.textContent = id === 'compact' ? 'Tighter rows; more settings per screen.' : 'Roomier rows and labels.';
    toast(id === 'compact' ? 'Compact density' : 'Comfortable density');
  });
  rows.appendChild(srow('Density', 'Row height across Settings. Applies immediately; other spaces keep their own rhythm.', 'display.density',
    card(null, bodyBox(densitySeg, densityHint))));

  const ifaceBox = H.h('div.settings-choices');
  const IFACES = [
    ['web','Chat workspace','Threads, inspector and approvals in the browser. Default on this machine.'],
    ['tui','Terminal UI','Full-screen terminal with the same sessions, tools and approvals.'],
    ['cli','Classic CLI','One prompt at a time. No panels, inspector or activity feed.']
  ];
  IFACES.forEach(([id,title,sub]) => {
    ifaceBox.appendChild(choice(title, sub, state.iface === id, () => {
      state.iface = id;
      [...ifaceBox.children].forEach((b,i) => b.setAttribute('aria-pressed', String(IFACES[i][0] === id)));
      toast('Default interface: ' + title);
    }));
  });
  rows.appendChild(srow('Default interface', 'What `hermes` opens when no surface is named. The gateway and gateway sessions are unaffected.', 'display.interface',
    card(null, ifaceBox)));

  const skinSel = select(SKINS.map(s => ({value:s.id,label:s.name})), state.skin, setSkin, 'Terminal skin');
  const skinBox = H.h('div.settings-skins');
  SKINS.forEach(s => {
    const sw = H.h('button.settings-skin', {'aria-pressed':String(state.skin === s.id), title:'Use the ' + s.name + ' skin', onclick:() => setSkin(s.id)},
      H.h('span.settings-skin-prev', {style:{background:s.bg, color:s.fg}},
        H.h('span.settings-skin-line', {style:{background:'currentColor'}}),
        H.h('span.settings-skin-line.settings-skin-line-2', {style:{background:s.accent}}),
        H.h('span.settings-skin-line.settings-skin-line-3', {style:{background:'currentColor'}})),
      H.h('span.settings-skin-name', s.name));
    skinBox.appendChild(sw);
  });
  function setSkin(id){
    state.skin = id;
    skinSel.value = id;
    [...skinBox.children].forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('title') === 'Use the ' + (SKINS.find(s=>s.id===id)||{}).name + ' skin')));
    toast('Skin: ' + (SKINS.find(s => s.id === id) || {}).name);
  }
  rows.appendChild(srow('Terminal skin', 'Colours for the CLI and TUI. The web workspace follows the theme above.', 'display.skin',
    card(null, bodyBox(field('Skin', skinSel, 'Used by `hermes` and the terminal tab.'), skinBox))));

  const petBox = H.h('div.settings-pets');
  const PETS = [
    ['faces','Faces'],
    ['initials','Initials'],
    ['pets','Pets']
  ];
  PETS.forEach(([id,label]) => {
    let prev;
    if (id === 'faces') prev = H.avatar(H.data.agents[0], 30);
    else if (id === 'initials') prev = H.h('span.settings-initials', 'H');
    else prev = H.html('<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M5 9 4 5l4 2h8l4-2-1 4v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V9z"/><circle cx="9.5" cy="12" r="1"/><circle cx="14.5" cy="12" r="1"/><path d="M9.8 15.4c1.4 1.2 3 1.2 4.4 0"/></svg>');
    petBox.appendChild(choice(label, id === 'pets' ? 'Small creatures that blink and look around.' : id === 'initials' ? 'A single letter with the profile hue.' : 'The Hermes face, animated by presence.', state.pets === id,
      () => {
        state.pets = id;
        [...petBox.children].forEach((b,i) => b.setAttribute('aria-pressed', String(PETS[i][0] === id)));
        toast('Avatar style: ' + label);
      }, {extra:null}));
    const last = petBox.lastChild;
    last.insertBefore(prev, last.querySelector('.settings-choice-txt'));
    last.classList.add('settings-pet');
  });
  rows.appendChild(srow('Agent avatars', 'How presence is drawn in the rail, inbox and thread header.', 'display.avatars',
    card(null, petBox)));

  const lang = select([
    {value:'en-US',label:'English (US)'},
    {value:'en-GB',label:'English (UK)'},
    {value:'de-DE',label:'Deutsch'},
    {value:'fr-FR',label:'Français'},
    {value:'ja-JP',label:'日本語'}
  ], state.language, v => { state.language = v; toast('Language: ' + (lang.options[lang.selectedIndex] || {}).text); }, 'Interface language');
  rows.appendChild(srow('Language', 'Menus, dates and number formats in the web workspace. Agent replies keep their own language.', 'display.language',
    card(null, bodyBox(field('Interface language', lang)))));

  rows.appendChild(srow('Diagnostics reporting', 'Anonymous crash reports and coarse tool counters. Off means nothing leaves this machine.', 'privacy.diagnostics',
    H.h('div.card.settings-card',
      lockedRow('Diagnostics reporting', 'off', '/etc/hermes/config.yaml pins this key on managed hosts'))));

  const notifList = H.h('div.list');
  notifList.appendChild(toggle('Approvals waiting', 'A command or file write needs your decision.', state.notify.approvals, v => {
    state.notify.approvals = v; toast('Approval notifications ' + (v ? 'on' : 'off'));
  }));
  notifList.appendChild(toggle('Run finished', 'A thread or routine completes while you are elsewhere.', state.notify.finished, v => {
    state.notify.finished = v; toast('Finished notifications ' + (v ? 'on' : 'off'));
  }));
  notifList.appendChild(toggle('Run failed', 'A provider error, failed tool or exhausted fallback chain.', state.notify.failed, v => {
    state.notify.failed = v; toast('Failure notifications ' + (v ? 'on' : 'off'));
  }));
  const from = H.h('input.input.settings-time', {type:'time', value:state.quiet.from, 'aria-label':'Quiet hours start'});
  const to = H.h('input.input.settings-time', {type:'time', value:state.quiet.to, 'aria-label':'Quiet hours end'});
  from.onchange = () => { state.quiet.from = from.value; toast('Quiet hours start ' + from.value); };
  to.onchange = () => { state.quiet.to = to.value; toast('Quiet hours end ' + to.value); };
  const quietSw = H.sw(state.quiet.on, v => {
    state.quiet.on = v;
    from.disabled = !v; to.disabled = !v;
    toast('Quiet hours ' + (v ? 'on · ' + state.quiet.from + '–' + state.quiet.to : 'off'));
  }, 'Quiet hours');
  from.disabled = !state.quiet.on; to.disabled = !state.quiet.on;
  notifList.appendChild(H.h('div.settings-tog.settings-quiet-row',
    H.h('div.settings-grow',
      H.h('div.t','Quiet hours'),
      H.h('div.s','Hold non-urgent notifications. Approvals still arrive.')),
    H.h('div.settings-quiet', from, H.h('span.settings-quiet-dash','to'), to),
    quietSw));
  rows.appendChild(srow('Notifications', 'Delivered to the Desktop app and the gateway channels you enabled.', 'notifications',
    card(null, notifList)));

  const keyRows = SHORTCUTS.map(([keys, label]) =>
    [H.h('span.settings-keys', keys.map(k => H.h('kbd.kbd', k))), label]);
  rows.appendChild(srow('Keyboard shortcuts', 'Every shortcut in the Chat workspace. On Linux, ⌘ is Ctrl.', 'display.shortcuts',
    card(null, tbl([{label:'Keys'},{label:'Action'}], keyRows))));

  return rows;
}

/* ---------- 2. Models ---------- */
function buildModels(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');

  const modelMeta = H.h('div.settings-meta');
  function setMeta(id){
    const m = MODEL(id);
    modelMeta.textContent = m.provider + ' · ' + m.ctx + ' context · ' + (m.provider === 'Ollama' ? 'on this machine' : 'credential pool');
  }
  setMeta(state.model);
  const defaultSel = modelSelect(state.model, id => {
    state.model = id;
    setMeta(id);
    toast('Default model: ' + MODEL(id).name);
    if (typeof drawChain === 'function') drawChain();
  }, {aria:'Default model'});
  rows.appendChild(srow('Default model', 'Used for new threads in this profile. Existing threads keep their model until switched.', 'model',
    card(null, bodyBox(field('Model', defaultSel), modelMeta))));

  const effortHint = H.h('div.settings-hintline', {
    off:'No extra reasoning tokens. Fastest and cheapest.',
    low:'A little deliberation on ambiguous steps.',
    medium:'The default balance for maintenance and coding.',
    high:'More deliberation; slower and more expensive per turn.'
  }[state.effort]);
  const effortSeg = H.seg([{id:'off',label:'Off'},{id:'low',label:'Low'},{id:'medium',label:'Medium'},{id:'high',label:'High'}], state.effort, id => {
    state.effort = id;
    effortHint.textContent = {off:'No extra reasoning tokens. Fastest and cheapest.',low:'A little deliberation on ambiguous steps.',medium:'The default balance for maintenance and coding.',high:'More deliberation; slower and more expensive per turn.'}[id];
    toast('Reasoning effort: ' + cap(id));
  });
  rows.appendChild(srow('Reasoning effort', 'How long the model may think before it acts. Per-model overrides still win.', 'agent.reasoning_effort',
    card(null, bodyBox(effortSeg, effortHint))));

  const providerGrid = H.h('div.settings-providers');
  providerGrid.appendChild(H.h('div.settings-provider',
    H.h('div.settings-provider-top', H.h('span.t','Anthropic'), pill('Connected via OAuth','pos')),
    H.h('div.s','OAuth token · refreshes in 46 min'),
    H.h('div.settings-provider-foot', btn('Refresh token', {sm:true, ghost:true, onclick:()=>toast('OAuth token refreshed · valid for 8h')}))));
  providerGrid.appendChild(H.h('div.settings-provider',
    H.h('div.settings-provider-top', H.h('span.t','DeepSeek'), pill('API key set','pos')),
    H.h('div.s','2 keys in the pool · last used 4m ago'),
    H.h('div.settings-provider-foot', btn('Test', {sm:true, ghost:true, onclick:()=>toast('DeepSeek reachable · 212 ms')}))));
  providerGrid.appendChild(H.h('div.settings-provider',
    H.h('div.settings-provider-top', H.h('span.t','Google'), pill('Missing','warn')),
    H.h('div.s','No Gemini key in .env for this profile'),
    H.h('div.settings-provider-foot', btn('Add key', {sm:true, ghost:true, onclick:()=>{ env.selectTab('keys'); toast('Add a Google key under Keys & secrets'); }}))));
  providerGrid.appendChild(H.h('div.settings-provider',
    H.h('div.settings-provider-top', H.h('span.t','Ollama'), pill('Local · reachable','pos')),
    H.h('div.s','127.0.0.1:11434 · hermes-local, 64k context'),
    H.h('div.settings-provider-foot', btn('Test', {sm:true, ghost:true, onclick:()=>toast('Ollama reachable · 24 ms')}))));
  rows.appendChild(srow('Providers', 'Where credentials live and whether they can answer right now.', 'providers',
    card(null, providerGrid)));

  const poolRows = [
    [H.h('div', H.h('div.t','Anthropic · OAuth'), H.h('div.s.mono','…k7f2')), 'Anthropic', pill('Active','pos'), H.h('span.num','1')],
    [H.h('div', H.h('div.t','Anthropic · API key'), H.h('div.s.mono','…m4q9')), 'Anthropic', pill('Cooling · 429','warn'), H.h('span.num','2')],
    [H.h('div', H.h('div.t','DeepSeek · key 1'), H.h('div.s.mono','…p2x8')), 'DeepSeek', pill('Active','pos'), H.h('span.num','1')],
    [H.h('div', H.h('div.t','Google'), H.h('div.s','no key')), 'Google', pill('Missing','neg'), H.h('span.num','–')]
  ];
  rows.appendChild(srow('Credential pool', 'Keys are tried in priority order. A 429 cools down instead of failing the turn.', 'credential_pool_strategies',
    card('Priority order', tbl([{label:'Key'},{label:'Provider'},{label:'Status'},{label:'Priority',cls:'r'}], poolRows))));

  const chainBox = H.h('div.settings-chain');
  let dragIndex = null;
  function drawChain(){
    chainBox.innerHTML = '';
    const ids = [state.model].concat(state.fallbacks);
    ids.forEach((id, i) => {
      const m = MODEL(id);
      const row = H.h('div.settings-chain-row', {draggable:String(i > 0)},
        H.h('span.settings-drag', {title:i === 0 ? 'Primary model' : 'Drag to reorder fallback'}, H.ic('more','sm')),
        pill(i === 0 ? 'Primary' : 'Fallback ' + i, i === 0 ? 'live' : ''),
        H.h('div.settings-grow', H.h('div.t', m.name), H.h('div.s', m.provider + ' · ' + m.ctx)),
        i > 1 ? iconBtn('chevu','Move fallback up', () => {
          const [x] = state.fallbacks.splice(i - 1, 1); state.fallbacks.splice(i - 2, 0, x); drawChain(); toast('Fallback order updated');
        }) : null,
        i > 0 && i < ids.length - 1 ? iconBtn('chevd','Move fallback down', () => {
          const [x] = state.fallbacks.splice(i - 1, 1); state.fallbacks.splice(i, 0, x); drawChain(); toast('Fallback order updated');
        }) : null,
        i > 0 ? iconBtn('x','Remove ' + m.name + ' from the fallback chain', () => {
          state.fallbacks.splice(i - 1, 1); drawChain(); toast(m.name + ' removed from fallbacks');
        }) : H.h('span.settings-chain-fixed','fixed'));
      if (i > 0){
        row.ondragstart = e => { dragIndex = i - 1; row.classList.add('is-dragging'); if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'; };
        row.ondragover = e => { if (dragIndex != null){ e.preventDefault(); row.classList.add('is-over'); } };
        row.ondragleave = () => row.classList.remove('is-over');
        row.ondrop = e => {
          e.preventDefault();
          if (dragIndex == null) return;
          const [x] = state.fallbacks.splice(dragIndex, 1);
          state.fallbacks.splice(i - 1, 0, x);
          dragIndex = null; drawChain(); toast('Fallback order updated');
        };
        row.ondragend = () => { dragIndex = null; row.classList.remove('is-dragging'); };
      }
      chainBox.appendChild(row);
    });
  }
  const addFallback = btn('Add fallback', {sm:true, icon:'plus', onclick:() => {
    const used = [state.model].concat(state.fallbacks);
    const next = MODELS.find(m => used.indexOf(m.id) < 0);
    if (!next){ toast('Every available model is already in the chain'); return; }
    state.fallbacks.push(next.id); drawChain(); toast('Fallback added: ' + next.name);
  }});
  drawChain();
  const chainCard = card('Tried in order', bodyBox(note('Switching model mid-thread invalidates the prompt cache.'), chainBox), addFallback);
  rows.appendChild(srow('Fallback chain', 'If a provider fails or a pool is exhausted, the next model takes the turn. The primary stays fixed.', 'fallback_providers',
    chainCard));

  const auxRows = AUX.map(t => [
    H.h('div', H.h('div.t', t.name), H.h('div.s', t.desc)),
    H.h('div.settings-auxsel', modelSelect(state.aux[t.id], v => {
      state.aux[t.id] = v;
      toast(t.name + ': ' + (v === 'main' ? 'same as main model' : MODEL(v).name));
    }, {main:true, aria:t.name + ' model'}))
  ]);
  rows.appendChild(srow('Auxiliary tasks', 'Side jobs with their own model. Leave one on “same as main” unless cost says otherwise.', 'auxiliary',
    card('6 tasks', tbl([{label:'Task'},{label:'Model'}], auxRows))));

  const moaSlots = H.h('div.settings-slots');
  [['a','Proposer A'],['b','Proposer B'],['agg','Aggregator']].forEach(([k,label]) => {
    const sel = modelSelect(state.moa[k], v => { state.moa[k] = v; toast(label + ': ' + MODEL(v).name); }, {aria:label});
    sel.disabled = !state.moa.on;
    moaSlots.appendChild(field(label, sel));
  });
  const moaSw = H.sw(state.moa.on, v => {
    state.moa.on = v;
    moaSlots.querySelectorAll('select').forEach(s => s.disabled = !v);
    toast('Mixture of Agents ' + (v ? 'enabled' : 'disabled'));
  }, 'Mixture of Agents');
  rows.appendChild(srow('Mixture of Agents', 'Several models answer in parallel; the aggregator writes the final reply. Only runs when `/moa` is on.', 'moa',
    card(H.h('span.settings-grow','MoA slots'), bodyBox(moaSlots, note('Each turn makes three extra calls. Keep it off for routine maintenance.', 'info', 'info')), moaSw)));

  return rows;
}

/* ---------- 3. Agent ---------- */
function buildAgent(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');

  function slider(key, label, desc, min, max, step, format, minLabel, maxLabel){
    const out = H.h('span.settings-range-val', format(state.agent[key]));
    const r = H.h('input.settings-range', {type:'range', min:String(min), max:String(max), step:String(step), value:String(state.agent[key]), 'aria-label':label});
    r.oninput = () => { state.agent[key] = Number(r.value); out.textContent = format(Number(r.value)); };
    r.onchange = () => toast(label + ': ' + format(state.agent[key]));
    return H.h('div.settings-slider',
      H.h('div.settings-slider-top', H.h('div', H.h('div.t', label), H.h('div.s', desc)), out),
      r,
      H.h('div.settings-slider-ends', H.h('span', minLabel), H.h('span', maxLabel)));
  }
  rows.appendChild(srow('Limits', 'How much work one turn may do before Hermes stops and writes a summary.', 'agent',
    card(null, bodyBox(
      slider('maxTurns','Max turns per request','Tool-calling iterations before a work summary.',50,1000,50,v => v + ' turns','50','1,000'),
      slider('compress','Compression threshold','Compress context before the provider truncates it.',50,95,5,v => v + '%','50%','95%'),
      slider('delegation','Delegation depth','How many levels of subagents a subagent may spawn. 0 disables nesting.',0,5,1,v => v === 0 ? 'Off' : v + (v===1?' level':' levels'),'Off','5 levels')
    ))));

  const auto = H.h('div.list');
  auto.appendChild(toggle('Checkpoint before edits','Snapshot the worktree before each file write; `/undo` restores it.', state.agent.checkpoints, v => { state.agent.checkpoints = v; toast('Checkpoints ' + (v ? 'on' : 'off')); }));
  auto.appendChild(toggle('Auto worktree per thread','Give each thread its own git worktree under `~/.hermes/worktrees`.', state.agent.worktree, v => { state.agent.worktree = v; toast('Per-thread worktrees ' + (v ? 'on' : 'off')); }));
  auto.appendChild(toggle('Persistent memory','Carry durable notes across threads, stored under `memories/`.', state.agent.memory, v => { state.agent.memory = v; toast('Persistent memory ' + (v ? 'on' : 'off')); }));
  rows.appendChild(srow('Automation', 'Safety nets around edits, branches and memory. Changes apply to the next turn.', 'agent.*',
    card(null, auto)));

  const approvalBox = H.h('div.settings-choices');
  const MODES = [
    ['manual','Ask every time','Every tool call that can run a command or write a file waits for you.'],
    ['smart','Ask for risky only','Read-only and previously approved patterns run; writes and new commands ask.'],
    ['off','Auto-approve','Everything runs. Use only inside a throwaway container.']
  ];
  MODES.forEach(([id,title,sub]) => {
    approvalBox.appendChild(choice(title, sub, state.approval === id, () => {
      state.approval = id;
      [...approvalBox.children].forEach((b,i) => b.setAttribute('aria-pressed', String(MODES[i][0] === id)));
      toast('Approval mode: ' + title);
    }, id === 'off' ? {
      danger:true,
      extra:H.h('div.settings-danger',
        H.ic('warn','sm'),
        H.h('span','Any command runs without asking, including a delete outside the worktree. Deny globs still apply, but nothing checks intent.'))
    } : null));
  });
  rows.appendChild(srow('Approvals', 'What Hermes may do without a human. Applies to shell commands, file writes and MCP tools.', 'approvals.mode',
    card(null, approvalBox)));

  return rows;
}

/* ---------- 4. Tools & terminal ---------- */
function buildTools(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');
  const backendBox = H.h('div.settings-choices');
  const fieldsBox = H.h('div.settings-backend-fields');

  const BACKENDS = [
    ['local','Local','Runs directly on this machine as your user. No isolation.'],
    ['docker','Docker','Container from an image; iron-proxy can inject credentials at the boundary.'],
    ['ssh','SSH','Runs on a remote host over SSH. Files stay on that host.'],
    ['modal','Modal','Serverless sandbox; starts cold and bills per second.']
  ];
  function drawBackendFields(){
    fieldsBox.innerHTML = '';
    if (state.backend === 'local'){
      fieldsBox.appendChild(H.h('div.settings-fgrid',
        field('Command timeout', input('180', {type:'number', min:'30', max:'3600', 'aria-label':'Command timeout seconds'}), 'Seconds before a command is stopped.'),
        field('Persistent shell', H.sw(true, v => toast('Persistent shell ' + (v ? 'on' : 'off')), 'Persistent shell'), 'Keeps cwd and exported variables between commands.')));
    } else if (state.backend === 'docker'){
      fieldsBox.appendChild(H.h('div.settings-fgrid',
        field('Docker image', input('ghcr.io/hermes/agent-sandbox:3.14', {'aria-label':'Docker image'}), 'Pin a digest in production.'),
        field('Container memory', input('5120', {type:'number', 'aria-label':'Container memory MB'}), 'MB. CPU is capped at 1 core.'),
        field('Forwarded env', input('PATH, SSH_AUTH_SOCK', {'aria-label':'Forwarded env'}), 'Names only; values stay on the host.'),
        field('Keep container', H.sw(true, v => toast('Container kept ' + (v ? 'between turns' : 'only for one turn')), 'Keep container'))));
    } else if (state.backend === 'ssh'){
      fieldsBox.appendChild(H.h('div.settings-fgrid',
        field('Host', input('ubuntu@hermes-builder', {'aria-label':'SSH host'}), 'Alias from ~/.ssh/config or user@host.'),
        field('Port', input('22', {type:'number', 'aria-label':'SSH port'}), 'SSH port.'),
        field('Identity file', input('~/.ssh/id_ed25519', {'aria-label':'SSH identity file'}), 'Key must be loaded in the agent.'),
        field('Remote cwd', input('/home/ubuntu', {'aria-label':'Remote working directory'}), 'Working directory on the remote host.')));
    } else {
      fieldsBox.appendChild(H.h('div.settings-fgrid',
        field('App', input('hermes-sandbox', {'aria-label':'Modal app'}), 'Modal app that hosts the sandbox.'),
        field('Environment', input('main', {'aria-label':'Modal environment'}), 'Modal environment name.'),
        field('Token reference', input('${MODAL_TOKEN_ID}', {readOnly:true, 'aria-label':'Modal token reference'}), 'Secrets stay in .env; config stores the reference.'),
        field('Idle timeout', input('900', {type:'number', 'aria-label':'Idle timeout'}), 'Seconds before the sandbox is torn down.')));
    }
    fieldsBox.appendChild(note('Changing the backend starts a new shell. Running commands keep their original backend until they finish.', 'info', 'info'));
  }
  BACKENDS.forEach(([id,title,sub]) => {
    backendBox.appendChild(choice(title, sub, state.backend === id, () => {
      state.backend = id;
      [...backendBox.children].forEach((b,i) => b.setAttribute('aria-pressed', String(BACKENDS[i][0] === id)));
      drawBackendFields();
      toast('Terminal backend: ' + title);
    }));
  });
  drawBackendFields();
  rows.appendChild(srow('Terminal backend', 'Where shell commands run. The browser and file tools follow the same sandbox.', 'terminal.backend',
    card(null, bodyBox(backendBox, fieldsBox))));

  const cwd = input('~/hermes-maintenance', {'aria-label':'Working directory'});
  cwd.onchange = () => toast('Working directory: ' + cwd.value);
  rows.appendChild(srow('Working directory', 'Default project directory for new threads and terminal tabs.', 'terminal.cwd',
    card(null, bodyBox(field('Directory', cwd, 'Relative paths resolve from the profile home.')))));

  const chips = H.h('div.settings-chips');
  const envInput = input('', {placeholder:'Add a variable name', 'aria-label':'Add an environment variable'});
  function drawChips(){
    chips.innerHTML = '';
    state.envVars.forEach(v => {
      chips.appendChild(H.h('span.settings-chip', H.h('span.mono', v), iconBtn('x','Remove ' + v, () => {
        state.envVars = state.envVars.filter(x => x !== v); drawChips(); toast(v + ' no longer passed through');
      })));
    });
  }
  function addEnv(){
    const v = envInput.value.trim().toUpperCase();
    if (!/^[A-Z][A-Z0-9_]*$|\*$/.test(v)){ toast('Use an UPPER_SNAKE name'); return; }
    if (state.envVars.indexOf(v) >= 0){ toast(v + ' is already passed through'); return; }
    state.envVars.push(v); envInput.value = ''; drawChips(); toast(v + ' will be passed through');
  }
  envInput.onkeydown = e => { if (e.key === 'Enter'){ e.preventDefault(); addEnv(); } };
  drawChips();
  rows.appendChild(srow('Environment passthrough', 'Variables copied into the backend. Secrets stay in `.env`; names only cross the boundary.', 'terminal.env_passthrough',
    card(null, bodyBox(chips, H.h('div.settings-inline-field', envInput, btn('Add', {sm:true, onclick:addEnv}))))));

  const shell = input('~/.bashrc, ~/.profile', {'aria-label':'Shell init files'});
  shell.onchange = () => toast('Shell init files saved');
  rows.appendChild(srow('Shell init files', 'Sourced before each command. Setting this replaces the `.bashrc` default, so include it to keep it.', 'terminal.shell_init_files',
    card(null, bodyBox(field('Files, comma separated', shell, 'One path per file; `~` expands to the profile home.')))));

  const cdp = input(state.browser.cdp, {'aria-label':'CDP URL'});
  cdp.onchange = () => { state.browser.cdp = cdp.value; toast('CDP URL saved'); };
  const testPill = H.h('span.pill' + (state.browser.test === 'ok' ? '.pos' : ''),
    state.browser.test === 'ok' ? 'Connected · Chromium 131' : 'Not tested');
  const testBtn = btn('Test connection', {sm:true, onclick:() => {
    if (state.browser.test === 'testing') return;
    state.browser.test = 'testing';
    testPill.className = 'pill'; testPill.textContent = 'Testing…';
    testBtn.disabled = true;
    setTimeout(() => {
      state.browser.test = 'ok';
      testPill.className = 'pill pos'; testPill.textContent = 'Connected · Chromium 131';
      testBtn.disabled = false;
      toast('Browser connected · Chromium 131');
    }, 700);
  }});
  const browserProfile = select([
    {value:'isolated',label:'Isolated profile · ~/.hermes/browser-profile/default'},
    {value:'real',label:'Copy the real Chrome profile on first use'},
    {value:'temp',label:'Temporary profile, discarded on exit'}
  ], state.browser.profile, v => { state.browser.profile = v; toast('Browser profile updated'); }, 'Browser profile');
  rows.appendChild(srow('Browser', 'CDP endpoint for the browser toolset. On this machine Chromium runs in Docker, so Hermes connects instead of installing one.', 'browser.cdp_url',
    card(null, bodyBox(
      H.h('div.settings-inline-field', cdp, testBtn),
      H.h('div.settings-testline', testPill, H.h('span.settings-hintline','Chromium 131.0.6778.85 · loopback only')),
      H.h('div.sep'),
      toggle('Headless','No visible window. Keep on for the Docker browser.', state.browser.headless, v => { state.browser.headless = v; toast('Headless ' + (v ? 'on' : 'off')); }),
      field('Profile', browserProfile, 'Logins and 2FA seeds live in the encrypted browser vault.'),
      H.h('div.settings-inline-field.settings-vault',
        H.h('div.settings-grow', H.h('div.t','Browser vault'), H.h('div.s','12 logins · 2 TOTP seeds · unlocked 14m ago')),
        btn('Open vault', {sm:true, ghost:true, icon:'lock', onclick:()=>toast('Vault is locked · unlock in Desktop')}))))));

  const webBox = H.h('div.settings-web');
  const WEB = {
    parallel:{name:'Parallel',status:'API key set',tone:'pos'},
    exa:{name:'Exa',status:'API key set',tone:'pos'},
    firecrawl:{name:'Firecrawl',status:'Missing',tone:'warn'},
    brave:{name:'Brave',status:'API key set',tone:'pos'},
    tavily:{name:'Tavily',status:'Missing',tone:'warn'}
  };
  function drawWeb(){
    webBox.innerHTML = '';
    state.providers.forEach((id, i) => {
      const p = WEB[id];
      webBox.appendChild(H.h('div.settings-web-row',
        H.h('span.settings-web-num.num', String(i + 1)),
        H.h('div.settings-grow', H.h('div.t', p.name), H.h('div.s', i === 0 ? 'Tried first' : 'Falls through on error')),
        pill(p.status, p.tone),
        iconBtn('chevu','Move ' + p.name + ' up', () => {
          if (i === 0) return;
          const [x] = state.providers.splice(i,1); state.providers.splice(i-1,0,x); drawWeb(); toast(p.name + ' moved up');
        }),
        iconBtn('chevd','Move ' + p.name + ' down', () => {
          if (i === state.providers.length - 1) return;
          const [x] = state.providers.splice(i,1); state.providers.splice(i+1,0,x); drawWeb(); toast(p.name + ' moved down');
        })));
    });
  }
  drawWeb();
  rows.appendChild(srow('Web provider order', 'Search and extraction try providers in this order. A missing key is skipped.', 'web.provider_order',
    card('Fallback order', webBox)));

  return rows;
}

/* ---------- 5. Keys & secrets ---------- */
function buildSecrets(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');
  const keysBox = H.h('div.settings-keys');

  function drawKeys(){
    keysBox.innerHTML = '';
    if (!state.envKeys.length){
      keysBox.appendChild(H.h('div.empty', H.h('div','No keys in this profile.')));
      return;
    }
    const rowsData = state.envKeys.map(k => {
      const actions = H.h('div.settings-actions');
      actions.appendChild(H.h('span.settings-tip', {'data-tip':'Secrets are never shown'},
        H.h('button.btn.sm.icon.ghost', {disabled:true, 'aria-label':'Reveal ' + k.name}, H.ic('eye','sm'))));
      actions.appendChild(btn('Replace', {sm:true, onclick:()=>replaceKey(k)}));
      if (state.confirmKey === k.name){
        actions.appendChild(btn('Remove key', {sm:true, danger:true, onclick:()=>{
          state.envKeys = state.envKeys.filter(x => x.name !== k.name); state.confirmKey = null; drawKeys(); toast(k.name + ' removed from .env');
        }}));
        actions.appendChild(btn('Cancel', {sm:true, ghost:true, onclick:()=>{ state.confirmKey = null; drawKeys(); }}));
      } else {
        actions.appendChild(btn('Remove', {sm:true, danger:true, onclick:()=>{ state.confirmKey = k.name; drawKeys(); }}));
      }
      return [
        H.h('span.mono.settings-keyname', k.name),
        k.set ? pill('Set','pos') : pill('Missing','warn'),
        H.h('span.s', k.changed),
        actions
      ];
    });
    keysBox.appendChild(tbl([{label:'Key'},{label:'Status'},{label:'Last changed'},{label:'Actions',cls:'r'}], rowsData));
  }

  function replaceKey(k){
    const val = H.h('input.input', {type:'password', placeholder:'Paste the new value', autocomplete:'off', 'aria-label':'New value for ' + k.name});
    const err = H.h('div.settings-formerr');
    const save = btn('Replace key', {primary:true, disabled:true, onclick:()=>{
      if (val.value.length < 8){ err.textContent = 'At least 8 characters.'; return; }
      k.set = true; k.changed = 'just now'; state.confirmKey = null; drawKeys(); m.close();
      toast('Key replaced · ' + k.name + ' · written to .env');
    }});
    val.oninput = () => { save.disabled = val.value.length < 8; err.textContent = ''; };
    const closeBtn = iconBtn('x','Close',()=>{});
    const box = H.h('div.settings-dialog',
      H.h('div.settings-dialog-h', H.h('div.settings-grow', H.h('h2','Replace ' + k.name), H.h('p','The old value is overwritten in `.env`. It is never read back into the UI.')), closeBtn),
      H.h('div.settings-dialog-b', field('New value', val, 'Stored in `.env`; `config.yaml` keeps a ${VAR} reference.'), err),
      H.h('div.settings-dialog-f', btn('Cancel', {ghost:true, onclick:()=>m.close()}), save));
    const m = H.modal(box, {width:520});
    closeBtn.onclick = () => m.close();
    setTimeout(() => val.focus(), 30);
  }

  function addKeyDialog(){
    const name = input('', {placeholder:'e.g. BRAVE_API_KEY', autocomplete:'off', 'aria-label':'Key name'});
    const val = H.h('input.input', {type:'password', placeholder:'Paste the value', autocomplete:'off', 'aria-label':'Key value'});
    const err = H.h('div.settings-formerr');
    const create = btn('Add key', {primary:true, disabled:true, onclick:()=>{
      const n = name.value.trim();
      if (!/^[A-Z][A-Z0-9_]*$/.test(n)){ err.textContent = 'Use UPPER_SNAKE_CASE, starting with a letter.'; return; }
      if (state.envKeys.some(k => k.name === n)){ err.textContent = 'That key already exists in this profile.'; return; }
      if (val.value.length < 8){ err.textContent = 'The value needs at least 8 characters.'; return; }
      state.envKeys.unshift({name:n, set:true, changed:'just now'});
      drawKeys(); m.close(); toast(n + ' added to .env');
    }});
    function check(){
      const n = name.value.trim();
      const nameOk = /^[A-Z][A-Z0-9_]*$/.test(n) && !state.envKeys.some(k => k.name === n);
      create.disabled = !nameOk || val.value.length < 8;
      err.textContent = '';
    }
    name.oninput = check; val.oninput = check;
    const closeBtn = iconBtn('x','Close',()=>{});
    const box = H.h('div.settings-dialog',
      H.h('div.settings-dialog-h', H.h('div.settings-grow', H.h('h2','Add an environment key'), H.h('p','Secrets go to this profile’s `.env`. Only the name is ever displayed again.')), closeBtn),
      H.h('div.settings-dialog-b',
        field('Name', name, 'UPPER_SNAKE_CASE. Referenced from `config.yaml` as `${NAME}`.'),
        field('Value', val, 'Masked as you type. Not written to logs.'),
        err),
      H.h('div.settings-dialog-f', btn('Cancel', {ghost:true, onclick:()=>m.close()}), create));
    const m = H.modal(box, {width:540});
    closeBtn.onclick = () => m.close();
    setTimeout(() => name.focus(), 30);
  }

  drawKeys();
  rows.appendChild(srow('Environment keys', 'The profile’s `.env`. Values are never rendered; config refers to them as `${VAR}`.', '.env',
    card('6 keys', keysBox, btn('Add key', {sm:true, icon:'plus', onclick:addKeyDialog}))));

  const managerGrid = H.h('div.settings-managers');
  const bwPill = pill('Connected','pos');
  managerGrid.appendChild(H.h('div.settings-manager',
    H.h('div.settings-manager-top', H.ic('key','sm'), H.h('span.t','Bitwarden'), bwPill),
    H.h('div.s','Service account · project `hermes-prod`'),
    H.h('div.settings-manager-meta','14 secrets synced 6m ago'),
    H.h('div.settings-manager-foot',
      btn('Sync now', {sm:true, ghost:true, onclick:()=>toast('Bitwarden synced · 14 secrets')}),
      btn('Revoke', {sm:true, ghost:true, onclick:()=>toast('Bitwarden connection kept (prototype)')}))));
  const opPill = pill('Not set up','');
  const opCard = H.h('div.settings-manager',
    H.h('div.settings-manager-top', H.ic('key','sm'), H.h('span.t','1Password'), opPill),
    H.h('div.s','`op` CLI is installed but not signed in'),
    H.h('div.settings-manager-meta','No vault connected'),
    H.h('div.settings-manager-foot', btn('Connect', {sm:true, onclick:()=>{
      const b = opCard.querySelector('button');
      b.disabled = true; b.textContent = 'Connecting…'; opPill.className = 'pill'; opPill.textContent = 'Checking…';
      setTimeout(() => {
        opPill.className = 'pill pos'; opPill.textContent = 'Connected';
        opCard.querySelector('.s').textContent = 'Service account · vault `Hermes`';
        opCard.querySelector('.settings-manager-meta').textContent = '9 secrets available';
        b.textContent = 'Manage'; b.disabled = false;
        toast('1Password connected · 9 secrets');
      }, 800);
    }})));
  managerGrid.appendChild(opCard);
  rows.appendChild(srow('Secret managers', 'Pulled at launch; a manager can supply keys the local `.env` does not have.', 'secrets',
    card(null, managerGrid)));

  const proxyBox = H.h('div.settings-proxy');
  function drawProxy(){
    proxyBox.innerHTML = '';
    const running = state.proxy.running;
    proxyBox.appendChild(H.h('div.settings-proxy-top',
      H.h('div.settings-grow',
        H.h('div.settings-proxy-status', H.h('span.dot' + (running ? '.pos' : '.neg')), H.h('span.t','iron-proxy'), running ? pill('Running','pos') : pill('Stopped','neg')),
        H.h('div.s','Egress firewall · HTTPS :9090 · HTTP :9091')),
      btn(running ? 'Stop' : 'Start', {sm:true, danger:running, onclick:()=>{
        state.proxy.running = !state.proxy.running; drawProxy();
        toast(running ? 'iron-proxy stopped · sandbox egress blocked' : 'iron-proxy started · credentials injected at the boundary');
      }})));
    proxyBox.appendChild(H.h('div.settings-proxy-hosts',
      H.h('span.settings-proxy-label','Allowlisted hosts'),
      H.h('div.settings-chips', ['api.anthropic.com','generativelanguage.googleapis.com','api.deepseek.com','github.com','pypi.org','registry.npmjs.org'].map(h => H.h('span.settings-chip.mono', h)))));
    proxyBox.appendChild(note(running
      ? 'Sandboxed containers see opaque tokens; real keys are swapped in at the host boundary.'
      : 'Sandbox traffic is blocked until the proxy is running. Local terminal commands are unaffected.', running ? 'info' : 'warn', running ? 'info' : 'warn'));
  }
  drawProxy();
  rows.appendChild(srow('Egress firewall', 'Keeps real provider keys out of Docker and Modal sandboxes.', 'security.egress_proxy',
    card(null, proxyBox)));

  return rows;
}

/* ---------- 6. Security ---------- */
function buildSecurity(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');
  const allowBox = H.h('div.settings-allow');
  const sugBox = H.h('div.settings-suggestions');

  function drawAllow(){
    allowBox.innerHTML = '';
    if (!state.allowlist.length){ allowBox.appendChild(H.h('div.empty','No command patterns are allowed without asking.')); return; }
    allowBox.appendChild(tbl([{label:'Pattern'},{label:'Scope'},{label:'Added by'},{label:'Date'},{label:'',cls:'r'}],
      state.allowlist.map((a,i) => [
        H.h('span.mono', a.pattern),
        H.h('span.s', a.scope),
        H.h('span.s', a.by),
        H.h('span.s', a.date),
        btn('Remove', {sm:true, danger:true, onclick:()=>{
          state.allowlist.splice(i,1); drawAllow(); toast('Allowlist entry removed · ' + a.pattern);
        }})
      ])));
  }
  function drawSuggestions(){
    sugBox.innerHTML = '';
    if (!state.suggestions.length){ sugBox.appendChild(H.h('div.empty', H.h('div','No new patterns in the last 90 days.'))); return; }
    state.suggestions.forEach((s,i) => {
      sugBox.appendChild(H.h('div.settings-suggest',
        H.h('div.settings-grow',
          H.h('div.mono.t', s.cmd),
          H.h('div.s', 'Approved ' + s.uses + '× · ' + s.note)),
        btn('Add', {sm:true, icon:'plus', onclick:()=>{
          const [x] = state.suggestions.splice(i,1);
          state.allowlist.unshift({pattern:x.cmd, scope:'This profile', by:'you', date:'today'});
          drawSuggestions(); drawAllow(); toast('Added to the allowlist · ' + x.cmd);
        }})));
    });
  }
  drawAllow(); drawSuggestions();
  rows.appendChild(srow('Command allowlist', 'Patterns that never prompt. Matching is exact plus `*` globs; destructive classes are excluded.', 'command_allowlist',
    card(H.h('span.settings-grow', state.allowlist.length + ' patterns'), allowBox)));
  rows.appendChild(srow('Mined suggestions', 'Read-only commands you approved repeatedly, mined from 90 days of approvals by `hermes approvals suggest`.', 'approvals.suggest',
    card('Review before adding', sugBox)));

  const dashBox = H.h('div.settings-choices');
  const dashFields = H.h('div.settings-dashfields');
  function drawDash(){
    dashFields.innerHTML = '';
    if (state.dashboard.mode === 'public'){
      dashFields.appendChild(H.h('div.settings-fgrid',
        field('Username', input(state.dashboard.user, {'aria-label':'Dashboard username', autocomplete:'off'}), 'Basic auth user.'),
        field('Password', H.h('input.input', {type:'password', placeholder:'Set a new password', autocomplete:'new-password', 'aria-label':'Dashboard password'}), 'Stored as a hash; never shown again.'),
        field('Session length', select([{value:'8h',label:'8 hours'},{value:'24h',label:'24 hours'},{value:'7d',label:'7 days'}], '8h', ()=>toast('Session length saved'), 'Session length'), 'How long a dashboard login lasts.')));
      dashFields.appendChild(toggle('Require GitHub OAuth','Sign-in through GitHub instead of a local password.', state.dashboard.oauth, v => { state.dashboard.oauth = v; toast('GitHub OAuth ' + (v ? 'required' : 'off')); }));
      dashFields.appendChild(note('A non-loopback bind fails closed until basic auth or OAuth is configured. The dashboard serves every profile on :9119.', 'warn'));
    } else {
      dashFields.appendChild(note('Only 127.0.0.1 can reach the dashboard. This is the safe setting for a single-user machine.', 'info', 'info'));
    }
  }
  [['loopback','Loopback only','http://127.0.0.1:9119 · no sign-in required.'],
   ['public','Public','Reachable from the LAN; basic auth and TLS are required.']].forEach(([id,title,sub]) => {
    dashBox.appendChild(choice(title, sub, state.dashboard.mode === id, () => {
      state.dashboard.mode = id;
      [...dashBox.children].forEach((b,i) => b.setAttribute('aria-pressed', String((i === 0 ? 'loopback' : 'public') === id)));
      drawDash(); toast('Dashboard exposure: ' + title);
    }, id === 'public' ? {danger:true} : null));
  });
  drawDash();
  rows.appendChild(srow('Dashboard exposure', 'The web dashboard serves every profile from one port. Loopback is the default.', 'dashboard.*',
    card(null, bodyBox(dashBox, dashFields))));

  const AUDIT = [
    ['14:32','hermes gateway restart','Approved','pos','you'],
    ['13:58','git push origin ui-redesign','Approved','pos','you'],
    ['13:41','rm -rf .venv','Denied','neg','policy · destructive'],
    ['12:07','docker ps','Auto','','allowlist'],
    ['11:52','sqlite3 state.db "PRAGMA wal_checkpoint"','Approved','pos','you'],
    ['10:14','npm run build','Auto','','allowlist'],
    ['09:03','curl https://get.example.sh | sh','Denied','neg','policy · pipe to shell'],
    ['Yesterday','hermes backup','Auto','','allowlist']
  ];
  rows.appendChild(srow('Approval audit', 'The last eight decisions from `state.db`. Denials include the policy that matched.', 'approvals.audit',
    card('Last 8', tbl([{label:'When'},{label:'Command'},{label:'Decision'},{label:'By'}],
      AUDIT.map(a => [H.h('span.s.num', a[0]), H.h('span.mono', a[1]), pill(a[2], a[3]), H.h('span.s', a[4])])))));

  return rows;
}

/* ---------- 7. Profiles ---------- */
function buildProfiles(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');
  const grid = H.h('div.settings-profiles');

  function drawProfiles(){
    grid.innerHTML = '';
    state.profiles.forEach((p, idx) => {
      const active = p.name === state.activeProfile;
      const buttons = H.h('div.settings-profile-actions');
      buttons.appendChild(btn(active ? 'Active' : 'Switch', {sm:true, onclick:()=>{
        if (active) return;
        state.activeProfile = p.name; drawProfiles(); env.refreshProfile();
        toast('Switched to ' + p.name + ' · commands need -p ' + p.name);
      }, disabled:active}));
      buttons.appendChild(btn('Clone', {sm:true, ghost:true, onclick:()=>newProfileDialog(p)}));
      buttons.appendChild(btn('Delete', {sm:true, danger:true, disabled:p.name === 'default',
        onclick:()=>{ state.deleteName = p.name; drawProfiles(); }}));
      const cardEl = H.h('div.settings-profile' + (active ? '.is-active' : ''),
        H.h('div.settings-profile-top',
          H.avatar({name:p.name, hue:p.hue, kind:idx}, 36),
          H.h('div.settings-grow', H.h('div.t', p.name), H.h('div.s', MODEL(p.model).name)),
          active ? pill('Active','pos') : null),
        H.h('div.settings-profile-meta',
          kv('Home', H.h('span.mono', p.home)),
          kv('Disk', p.disk + ' · ' + p.sessions + ' sessions')),
        buttons);
      if (state.deleteName === p.name){
        const confirmInput = input('', {placeholder:p.name, 'aria-label':'Type ' + p.name + ' to confirm deletion'});
        const del = btn('Delete profile', {sm:true, danger:true, disabled:true, onclick:()=>{
          state.profiles = state.profiles.filter(x => x.name !== p.name);
          state.deleteName = null; drawProfiles(); toast(p.name + ' deleted · 0 bytes reclaimed (prototype)');
        }});
        confirmInput.oninput = () => { del.disabled = confirmInput.value !== p.name; };
        cardEl.appendChild(H.h('div.settings-confirm',
          H.h('div.s','This removes `' + p.home + '`: config, `.env`, sessions and memories.'),
          H.h('div.settings-confirm-row', confirmInput, btn('Cancel', {sm:true, ghost:true, onclick:()=>{ state.deleteName = null; drawProfiles(); }}), del)));
      }
      grid.appendChild(cardEl);
    });
  }

  function newProfileDialog(from){
    const name = input(from ? from.name + '-copy' : '', {placeholder:'e.g. lab', autocomplete:'off', 'aria-label':'Profile name'});
    const err = H.h('div.settings-formerr');
    const cloneSel = select([{value:'',label:'Nothing · start empty'}].concat(state.profiles.map(p => ({value:p.name,label:'Clone ' + p.name + ' (config, skills, memory)'}))), from ? from.name : 'default', ()=>{}, 'Clone from');
    let hue = from ? from.hue : 280;
    const hueBox = H.h('div.settings-hues');
    [212,158,32,280,344,116].forEach(h => {
      hueBox.appendChild(H.h('button.settings-hue', {'aria-pressed':String(h === hue), 'aria-label':'Icon hue ' + h, onclick:()=>{
        hue = h; [...hueBox.children].forEach(b => b.setAttribute('aria-pressed', String(Number(b.getAttribute('aria-label').split(' ').pop()) === h)));
      }}, H.avatar({name:'p', hue:h, kind:0}, 24)));
    });
    const create = btn('Create profile', {primary:true, disabled:true, onclick:()=>{
      const n = name.value.trim();
      if (!/^[a-z][a-z0-9-]{1,30}$/.test(n)){ err.textContent = 'Lowercase letters, digits and dashes; 2–31 characters.'; return; }
      if (state.profiles.some(p => p.name === n)){ err.textContent = 'A profile with that name already exists.'; return; }
      const src = state.profiles.find(p => p.name === cloneSel.value);
      state.profiles.push({name:n, hue, model:src ? src.model : 'claude-sonnet-5-5',
        home:'~/.hermes/profiles/' + n, disk:'0 MB', sessions:0});
      drawProfiles(); m.close(); toast('Profile ' + n + ' created · run hermes -p ' + n);
    }});
    function check(){
      const n = name.value.trim();
      create.disabled = !/^[a-z][a-z0-9-]{1,30}$/.test(n) || state.profiles.some(p => p.name === n);
      err.textContent = '';
    }
    name.oninput = check;
    const closeBtn = iconBtn('x','Close',()=>{});
    const box = H.h('div.settings-dialog',
      H.h('div.settings-dialog-h', H.h('div.settings-grow', H.h('h2','New profile'), H.h('p','An isolated home: config, `.env`, sessions, memories and cron.')), closeBtn),
      H.h('div.settings-dialog-b',
        field('Name', name, 'Used as `hermes -p <name>`; becomes `~/.hermes/profiles/<name>`.'),
        field('Clone from', cloneSel, 'Copies config, skills and memory. Sessions and `state.db` stay behind.'),
        field('Icon hue', hueBox, 'Identity colour for the avatar and the rail.'),
        err),
      H.h('div.settings-dialog-f', btn('Cancel', {ghost:true, onclick:()=>m.close()}), create));
    const m = H.modal(box, {width:560});
    closeBtn.onclick = () => m.close();
    setTimeout(() => name.focus(), 30);
  }

  drawProfiles();
  rows.appendChild(srow('Profiles', 'Separate homes on one host. Each has its own config, `.env`, sessions and memories; `auth.json` is shared unless isolated.', 'profiles',
    card(H.h('span.settings-grow', state.profiles.length + ' profiles on this host'),
      bodyBox(grid, note('Commands for a named profile always run with -p <name>. Without it Hermes silently targets the default profile.', 'warn')),
      btn('New profile', {sm:true, icon:'plus', onclick:()=>newProfileDialog(null)}))));

  return rows;
}

/* ---------- 8. System ---------- */
function quiesceDialog(env, action){
  const sw = H.sw(false, v => { go.disabled = !v; }, 'All Hermes processes are stopped');
  const cancel = btn('Cancel', {ghost:true, onclick:()=>m.close()});
  const go = btn(action, {primary:true, disabled:true, onclick:()=>{
    m.close();
    env.toast('Queued: ' + action + ' · 0 holder PIDs (prototype)');
    env.state.doctorAt = 'just now';
  }});
  const closeBtn = iconBtn('x','Close',()=>{});
  const box = H.h('div.settings-dialog',
    H.h('div.settings-dialog-h', H.h('div.settings-grow', H.h('h2','Quiesce before touching state.db'), H.h('p','Repair while any Hermes process runs becomes a competing writer.')), closeBtn),
    H.h('div.settings-dialog-b',
      H.h('ol.settings-steps',
        H.h('li', H.h('span','Stop the gateway: '), code('hermes gateway stop')),
        H.h('li', H.h('span','Stop the dashboard: '), code('hermes dashboard --stop')),
        H.h('li', H.h('span','Quit Desktop, then run '), code('hermes doctor'), H.h('span',' until it lists zero holder PIDs.'))),
      H.h('div.settings-checkline', sw, H.h('span','All Hermes processes are stopped')),
      note('Quiesce first: stop the gateway, the dashboard and Desktop. A `--fix` or repair with a live holder is unsafe.', 'danger')),
    H.h('div.settings-dialog-f', cancel, go));
  const m = H.modal(box, {width:560});
  closeBtn.onclick = () => m.close();
}

function buildSystem(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');
  const healthBox = H.h('div.settings-health');

  function drawHealth(){
    healthBox.innerHTML = '';
    state.health.forEach(h => {
      const tone = h.status === 'ok' ? 'pos' : h.status === 'warn' ? 'warn' : 'neg';
      const label = h.status === 'ok' ? 'OK' : h.status === 'warn' ? 'Warn' : 'Fail';
      healthBox.appendChild(H.h('div.settings-health-row' + (h.status === 'fail' ? '.is-fail' : ''),
        pill(label, tone),
        H.h('div.settings-grow',
          H.h('div.t', h.label),
          H.h('div.s', h.detail),
          h.status === 'fail' ? H.h('div.settings-health-explain','Quiesce first: stop the gateway, the dashboard and Desktop.') : null),
        h.fix ? btn(h.fix, {sm:true, onclick:()=>{
          if (h.id === 'wal') quiesceDialog(env, 'Checkpoint WAL and optimize');
          else if (h.id === 'mcp'){
            h.detail = 'Retesting 3 servers…'; drawHealth();
            setTimeout(() => { h.status = 'ok'; h.fix = null; h.detail = '3 of 3 connected · 480 ms'; drawHealth(); toast('MCP servers reconnected'); }, 900);
          } else if (h.id === 'browser'){
            env.selectTab('tools'); toast('Browser settings opened');
          }
        }}) : null));
    });
  }
  drawHealth();
  const doctorHead = H.h('span.settings-grow', 'Checked ' + state.doctorAt);
  rows.appendChild(srow('Health check', 'Read-only checks from `hermes doctor`. Fixes that write require every Hermes process to be stopped.', 'hermes doctor',
    card(doctorHead, healthBox, btn('Run doctor', {sm:true, icon:'retry', onclick:()=>{
      state.doctorAt = 'running…';
      doctorHead.textContent = 'Checked running…';
      const b = doctorHead.parentElement.querySelector('.settings-hacts button');
      if (b) b.disabled = true;
      setTimeout(() => {
        state.doctorAt = 'just now';
        doctorHead.textContent = 'Checked just now';
        if (b) b.disabled = false;
        drawHealth(); toast('Doctor finished · 1 failure, 2 warnings');
      }, 900);
    }}))));

  const versionBody = H.h('div.settings-version');
  const vPill = H.h('span.pill' + (state.version.checked ? '.pos' : ''), state.version.checked ? 'Up to date' : 'Stable channel');
  const checkBtn = btn('Check for updates', {sm:true, onclick:()=>{
    if (state.version.checking) return;
    state.version.checking = true; checkBtn.disabled = true;
    prog.hidden = false; progBar.style.width = '0%';
    let pct = 0;
    const timer = setInterval(() => {
      pct = Math.min(100, pct + 20); progBar.style.width = pct + '%';
      if (pct >= 100){
        clearInterval(timer);
        state.version.checking = false; state.version.checked = true;
        vPill.className = 'pill pos'; vPill.textContent = 'Up to date';
        checkBtn.disabled = false; checkBtn.textContent = 'Check again';
        toast('Hermes 0.9.4 is current');
      }
    }, 110);
  }});
  var prog = H.h('div.settings-progress', {hidden:true});
  var progBar = H.h('span', {style:{width:'0%'}});
  prog.appendChild(progBar);
  versionBody.appendChild(H.h('div.settings-version-top',
    H.h('div.settings-grow', H.h('div.settings-vnum','0.9.4'), H.h('div.s','Build a1f3c2 · 12 Nov 2026 · Python 3.14.2')),
    vPill));
  versionBody.appendChild(H.h('div.settings-inline-field', checkBtn, prog));
  versionBody.appendChild(H.h('div.settings-hintline','Updates stop the gateway and restart it once the new build is healthy.'));
  rows.appendChild(srow('Version', 'Installed build and update channel. `hermes update` uses the same check.', 'updates.channel',
    card(null, bodyBox(versionBody))));

  const backupsBox = H.h('div.settings-backups');
  function drawBackups(){
    backupsBox.innerHTML = '';
    state.backups.forEach(b => {
      const confirming = state.restoreId === b.id;
      const actions = H.h('div.settings-actions');
      if (confirming){
        actions.appendChild(btn('Restore', {sm:true, danger:true, onclick:()=>{
          state.restoreId = null; drawBackups();
          toast('Restored ' + b.name + ' · gateway stays stopped (prototype)');
        }}));
        actions.appendChild(btn('Cancel', {sm:true, ghost:true, onclick:()=>{ state.restoreId = null; drawBackups(); }}));
      } else {
        actions.appendChild(btn('Restore', {sm:true, onclick:()=>{ state.restoreId = b.id; drawBackups(); }}));
      }
      backupsBox.appendChild(H.h('div.settings-backup',
        H.h('div.settings-grow',
          H.h('div.mono.t', b.name),
          H.h('div.s', b.when + ' · ' + b.kind + ' · ' + b.size),
          confirming ? H.h('div.settings-health-explain','Restores replace state.db, -wal and -shm together.') : null),
        b.running ? pill('Running','live') : pill('Ready','pos'),
        actions));
    });
  }
  drawBackups();
  rows.appendChild(srow('Backups', '`hermes backup` writes one zip with the database image, config and profile home.', 'backup',
    card(H.h('span.settings-grow', state.backups.length + ' backups · 2.6 GB'), backupsBox, btn('Back up now', {sm:true, icon:'archive', onclick:()=>{
      const id = 'b-' + Date.now();
      state.backups.unshift({id, name:'hermes-backup-2026-11-19-1542.zip', size:'—', when:'Just now', kind:'Manual', running:true});
      drawBackups(); toast('Backing up the profile…');
      setTimeout(() => {
        const b = state.backups.find(x => x.id === id);
        if (b){ b.running = false; b.size = '218 MB'; b.when = 'Just now'; }
        drawBackups(); toast('Backup written · 218 MB');
      }, 1200);
    }}))));

  rows.appendChild(srow('State database', 'One SQLite image: `state.db`, `-wal` and `-shm`. Never copy the database file on its own.', 'database',
    card('state.db',
      bodyBox(
        H.h('div.settings-deflist',
          kv('Database', '412 MB · schema v19'),
          kv('WAL', '48 MB · last checkpoint 9h ago'),
          kv('FTS index', 'healthy · rebuilt 4 Nov'),
          kv('Sessions', '7 active · 214 archived')),
        H.h('div.settings-actions.settings-dbactions',
          btn('Optimize', {sm:true, onclick:()=>quiesceDialog(env, 'hermes sessions optimize')}),
          btn('Repair…', {sm:true, onclick:()=>quiesceDialog(env, 'hermes sessions repair')}),
          btn('Vacuum', {sm:true, ghost:true, onclick:()=>quiesceDialog(env, 'VACUUM state.db')})),
        note('Repair and optimize are refused while the gateway, dashboard or Desktop hold the database. Quiesce first.', 'warn')))));

  const gwBox = H.h('div.settings-gateway');
  function drawGateway(){
    gwBox.innerHTML = '';
    const g = state.gateway;
    const running = g.state === 'running';
    const busy = g.state === 'restarting';
    gwBox.appendChild(H.h('div.settings-gateway-top',
      H.h('div.settings-grow',
        H.h('div.settings-gateway-status', H.h('span.dot' + (running ? '.live' : busy ? '.warn' : '')),
          H.h('span.t','hermes-gateway.service'),
          running ? pill('Running','pos') : busy ? pill('Restarting','warn') : pill('Parked','')),
        H.h('div.s','systemd user unit · ' + (running ? 'pid ' + g.pid + ' · up ' + g.uptime : busy ? 'waiting for health check' : 'stops only this profile'))),
      H.h('div.settings-actions',
        btn('Reinstall unit', {sm:true, ghost:true, onclick:()=>toast('Unit reinstalled · systemctl --user daemon-reload')}),
        btn('Restart', {sm:true, disabled:busy, onclick:()=>{
          state.gateway = {state:'restarting', pid:g.pid, uptime:g.uptime}; drawGateway(); toast('Gateway restarting…');
          setTimeout(() => { state.gateway = {state:'running', pid:2214, uptime:'0m'}; drawGateway(); toast('Gateway back · pid 2214'); }, 1000);
        }}),
        btn(running ? 'Park' : 'Start', {sm:true, onclick:()=>{
          if (running){ state.gateway = {state:'parked', pid:g.pid, uptime:g.uptime}; drawGateway(); toast('default profile parked · other profiles keep serving'); }
          else { state.gateway = {state:'running', pid:2214, uptime:'0m'}; drawGateway(); toast('Gateway started · pid 2214'); }
        }}))));
    gwBox.appendChild(H.h('div.settings-deflist',
      kv('Dashboard', '127.0.0.1:9119 · loopback'),
      kv('API', '127.0.0.1:8642 · bearer token'),
      kv('Channels', 'Telegram · Discord · Slack · email')));
  }
  drawGateway();
  rows.appendChild(srow('Gateway service', 'The canonical writer of `state.db`. Park one profile without stopping the others.', 'gateway',
    card(null, gwBox)));

  const pauseBox = H.h('div.settings-emergency');
  function drawPause(){
    pauseBox.innerHTML = '';
    pauseBox.appendChild(H.h('div.settings-emergency-top',
      H.h('div.settings-grow',
        H.h('div.t', state.paused ? 'All agents paused' : 'Pause every agent'),
        H.h('div.s', state.paused ? '7 sessions and 3 routines are parked. Running tool calls were allowed to finish.' : 'Stops new turns, routines and gateway work. Use when a loop is burning tokens or writing where it should not.')),
      state.paused ? pill('Paused','neg') : null));
    pauseBox.appendChild(H.h('div.settings-actions',
      state.paused
        ? btn('Resume all agents', {onclick:()=>{ state.paused = false; drawPause(); toast('Agents resumed · 7 sessions unparked'); }})
        : btn('Pause all agents', {danger:true, cls:'settings-dangerbtn', onclick:()=>{
            const closeBtn = iconBtn('x','Close',()=>{});
            const box = H.h('div.settings-dialog',
              H.h('div.settings-dialog-h', H.h('div.settings-grow', H.h('h2','Pause all agents?'), H.h('p','7 sessions and 3 routines will hold their next turn.')), closeBtn),
              H.h('div.settings-dialog-b',
                H.h('p.settings-dialog-p','Running tool calls are allowed to finish so nothing is left half-written. New turns are refused until you resume.'),
                note('The gateway keeps running; only agent work is paused.', 'warn')),
              H.h('div.settings-dialog-f', btn('Cancel', {ghost:true, onclick:()=>m.close()}), btn('Pause all', {danger:true, cls:'settings-dangerbtn', onclick:()=>{
                state.paused = true; m.close(); drawPause(); toast('All agents paused · 7 sessions parked');
              }})));
            const m = H.modal(box, {width:520});
            closeBtn.onclick = () => m.close();
          }})));
  }
  drawPause();
  rows.appendChild(srow('Emergency', 'One switch for a runaway agent, routine or gateway turn.', 'runtime.pause',
    H.h('div.card.settings-card.settings-emergency-card', pauseBox)));

  rows.appendChild(srow('Terminal', 'The terminal is a tab in the workspace, never the default surface. It opens on the active thread.', 'display.terminal',
    card(null, bodyBox(H.h('div.settings-terminal-row',
      H.h('div.settings-grow', H.h('div.t','Open a terminal tab'), H.h('div.s','Same profile, same worktree, same environment as the thread.')),
      btn('Open the terminal', {ghost:true, icon:'terminal', onclick:()=>{
        env.ctx.go('#/thread/t-ui'); env.toast('Terminal tab opened');
      }}))))));

  return rows;
}

/* ---------- 9. Advanced ---------- */
function keyMap(text){
  const map = {};
  const stack = [];
  let listIdx = 0;
  text.split('\n').forEach(raw => {
    if (!raw.trim() || /^\s*#/.test(raw) || raw.trim() === '---') return;
    const indent = raw.match(/^\s*/)[0].length;
    const t = raw.trim();
    if (t.indexOf('- ') === 0){
      const parent = stack.filter(s => s.indent < indent).pop();
      if (parent){ map[parent.path + '[' + (listIdx++) + ']'] = t.slice(2); }
      return;
    }
    const m = /^([^:#]+):(.*)$/.exec(t);
    if (!m) return;
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    const path = (stack.length ? stack[stack.length - 1].path + '.' : '') + m[1].trim();
    stack.push({indent, path});
    const val = m[2].trim();
    if (val) map[path] = val;
  });
  return map;
}
function diffKeys(base, cur){
  const b = keyMap(base), c = keyMap(cur), out = [];
  Object.keys(c).forEach(k => { if (b[k] !== c[k]) out.push({key:k, from:b[k] == null ? '—' : b[k], to:c[k]}); });
  Object.keys(b).forEach(k => { if (!(k in c)) out.push({key:k, from:b[k], to:'removed'}); });
  return out;
}

function buildAdvanced(env){
  const {state, toast} = env;
  const rows = H.h('div.settings-rows');

  const ta = H.h('textarea.textarea.settings-yaml', {spellcheck:'false', 'aria-label':'config.yaml contents'});
  ta.value = state.yaml;
  const ymap = H.h('div.settings-ymap');
  const search = H.h('input.input.settings-search', {type:'search', value:state.yamlSearch, placeholder:'Find a key or value', 'aria-label':'Find in config.yaml'});
  const count = H.h('span.settings-searchcount', '');
  const keyCount = H.h('span.settings-keycount', '');
  const result = H.h('div.settings-result');
  const diffBox = H.h('div.settings-diff', {hidden:true});
  let activeHit = -1;

  function setResult(tone, label, text){
    result.innerHTML = '';
    result.appendChild(tone ? pill(label, tone) : H.h('span.pill', label));
    result.appendChild(H.h('span.settings-result-txt', text));
  }
  setResult(null, 'Not validated', 'Validate after editing. Nothing is written until you apply.');

  function linesOf(){ return ta.value.split('\n'); }
  function hits(q){ return linesOf().map((l,i)=>[l,i]).filter(([l]) => q && l.toLowerCase().indexOf(q.toLowerCase()) >= 0).map(([,i])=>i); }
  function paintMap(){
    const q = state.yamlSearch.trim();
    const list = linesOf();
    const hs = hits(q);
    if (activeHit >= hs.length) activeHit = hs.length - 1;
    ymap.innerHTML = '';
    list.forEach((l, i) => {
      const hit = q && l.toLowerCase().indexOf(q.toLowerCase()) >= 0;
      const b = H.h('button.settings-yline' + (hit ? '.is-hit' : '') + (i === hs[activeHit] ? '.is-active' : ''),
        {tabindex:'-1', title:'Go to line ' + (i+1), onclick:()=>{
          const off = list.slice(0, i).join('\n').length + (i ? 1 : 0);
          ta.focus(); ta.setSelectionRange(off, off + l.length);
          ta.scrollTop = Math.max(0, i * 20 - 60); ymap.scrollTop = ta.scrollTop;
        }},
        H.h('span.settings-yno', String(i + 1)),
        H.h('span.settings-ytext', l.length ? l : ' '));
      ymap.appendChild(b);
    });
    keyCount.textContent = Object.keys(keyMap(ta.value)).length + ' keys';
    if (q) count.textContent = hs.length ? (Math.max(0, activeHit) + 1) + ' / ' + hs.length : 'No matches';
    else count.textContent = list.length + ' lines';
    ymap.scrollTop = ta.scrollTop;
  }
  function jumpTo(i){
    if (i < 0 || i >= linesOf().length) return;
    const list = linesOf(), off = list.slice(0, i).join('\n').length + (i ? 1 : 0);
    ta.focus(); ta.setSelectionRange(off, off + list[i].length);
    ta.scrollTop = Math.max(0, i * 20 - 60); ymap.scrollTop = ta.scrollTop;
  }
  function nextHit(){
    const hs = hits(state.yamlSearch.trim());
    if (!hs.length) return;
    activeHit = (activeHit + 1) % hs.length;
    paintMap(); jumpTo(hs[activeHit]);
  }
  function updateDiff(){
    const d = diffKeys(state.baseline, ta.value);
    if (!d.length){ diffBox.hidden = true; diffBox.innerHTML = ''; return; }
    diffBox.hidden = false;
    const head = H.h('div.settings-diff-h',
      H.h('div.settings-grow', H.h('div.t', d.length + (d.length === 1 ? ' key changed' : ' keys changed')), H.h('div.s','`config.yaml` differs from the last applied version.')),
      H.h('div.settings-actions',
        btn('Discard', {sm:true, ghost:true, onclick:()=>{
          state.yaml = state.baseline; ta.value = state.baseline; state.yamlSearch = '';
          state.validation = 'idle'; setResult(null, 'Not validated', 'Validate after editing. Nothing is written until you apply.');
          paintMap(); updateDiff(); toast('Changes discarded');
        }}),
        btn('Apply changes', {sm:true, primary:true, onclick:()=>{
          state.baseline = ta.value; updateDiff();
          setResult('pos', 'Applied', 'Config saved · automatic backup kept · gateway reload in 2s');
          toast('Config applied · 1 backup kept');
        }})));
    const list = H.h('div.settings-diff-list');
    d.slice(0, 4).forEach(x => {
      list.appendChild(H.h('div.settings-diff-row',
        H.h('span.mono.settings-diff-key', x.key),
        H.h('span.settings-diff-from', x.from.length > 34 ? x.from.slice(0,33) + '…' : x.from),
        H.h('span.settings-diff-arrow','→'),
        H.h('span.settings-diff-to', x.to.length > 34 ? x.to.slice(0,33) + '…' : x.to)));
    });
    if (d.length > 4) list.appendChild(H.h('div.settings-diff-more','+' + (d.length - 4) + ' more'));
    diffBox.replaceChildren(head, list);
  }

  search.oninput = () => {
    state.yamlSearch = search.value;
    activeHit = 0;
    paintMap();
    const hs = hits(state.yamlSearch.trim());
    if (hs.length && state.yamlSearch.trim()) jumpTo(hs[0]);
  };
  search.onkeydown = e => {
    if (e.key === 'Enter'){ e.preventDefault(); nextHit(); }
    if (e.key === 'Escape'){ search.value = ''; state.yamlSearch = ''; activeHit = -1; paintMap(); }
  };
  ta.oninput = () => {
    state.yaml = ta.value;
    state.validation = 'idle';
    setResult(null, 'Not validated', 'Validate after editing. Nothing is written until you apply.');
    paintMap(); updateDiff();
  };
  ta.onscroll = () => { ymap.scrollTop = ta.scrollTop; };

  const validate = btn('Validate', {sm:true, onclick:()=>{
    validate.disabled = true; validate.textContent = 'Validating…';
    setTimeout(() => {
      validate.disabled = false; validate.textContent = 'Validate';
      if (/\t/.test(ta.value)){
        state.validation = 'invalid';
        setResult('neg', 'Invalid · 1 error', 'Tab character found. YAML requires spaces.');
        toast('Config invalid · tab character');
        return;
      }
      if (ta.value.indexOf('model:') < 0){
        state.validation = 'invalid';
        setResult('neg', 'Invalid · 1 error', 'A top-level `model` key is required.');
        toast('Config invalid · model missing');
        return;
      }
      state.validation = 'valid';
      setResult('pos', 'Valid · 0 warnings', 'Parsed ' + Object.keys(keyMap(ta.value)).length + ' keys in 4ms.');
      toast('Config valid · 0 warnings');
    }, 380);
  }});

  const editorCard = card(
    H.h('span.settings-grow', H.h('span','config.yaml'), H.h('span.settings-editor-path',' · ~/.hermes/config.yaml')),
    H.h('div.settings-editorwrap',
      H.h('div.settings-editorbar',
        H.h('span.settings-searchwrap', H.ic('search','sm'), search),
        count,
        keyCount,
        validate),
      H.h('div.settings-editor', ta, ymap),
      H.h('div.settings-editorfoot',
        H.h('span.s','UTF-8 · LF · automatic backup kept'),
        result)),
    null);
  rows.appendChild(srow('Raw config.yaml', 'Dotted keys live here. Prefer `hermes config set`; edit by hand only for keys with literal dots, and take a backup.', '~/.hermes/config.yaml',
    H.h('div.settings-advanced', editorCard, diffBox)));

  rows.appendChild(srow('Managed pins', 'Leaf keys pinned by a sysadmin override the profile in every mode. Remote config makes the whole file read-only.', '/etc/hermes/*',
    card(H.h('span.settings-grow', 'Managed scope detected'), bodyBox(
      H.h('div.settings-locked-list',
        lockedRow('Gateway host', '127.0.0.1', 'Pinned in /etc/hermes/config.yaml'),
        lockedRow('Provider routing', 'cost-first', 'Pinned in /etc/hermes/config.yaml'),
        lockedRow('Egress proxy', 'http://127.0.0.1:9090', 'Pinned in /etc/hermes/.env')),
      note('HERMES_CONFIG_BACKEND is not set here, so this profile’s config.yaml is authoritative. In remote mode the local file is neither read nor written, and every row above stays locked.', 'info', 'info')))));

  paintMap(); updateDiff();
  return rows;
}

/* ---------- view ---------- */
const BUILD = {
  general:buildGeneral, models:buildModels, agent:buildAgent, tools:buildTools,
  keys:buildSecrets, security:buildSecurity, profiles:buildProfiles,
  system:buildSystem, advanced:buildAdvanced
};

H.views.settings = {
  title:'settings',
  render(root, ctx){
    ctx = ctx || {};
    const routeTab = ctx.route && ctx.route[0];
    const alias = {secrets:'keys', keys:'keys'};
    const want = alias[routeTab] || routeTab;
    state.tab = TABS.some(t => t.id === want) ? want : 'general';

    const page = H.h('div.page.settings-page');
    const inside = H.h('div.settings-page-in');

    const profilePill = H.h('button.pill.settings-profilepill', {type:'button', title:'Active profile', onclick:()=>selectTab('profiles')});
    const managedBtn = btn('3 keys pinned', {sm:true, ghost:true, icon:'lock', onclick:()=>selectTab('advanced')});
    function paintProfilePill(){
      profilePill.replaceChildren(H.h('span.dot.pos'), state.activeProfile + ' profile');
    }
    paintProfilePill();

    const head = H.h('div.page-head.settings-head',
      H.h('div.settings-headtxt',
        H.h('h1','Settings'),
        H.h('p','Every knob for the default profile. The gateway, Desktop and CLI read the same config.yaml.'),
        H.h('div.settings-machine','Ubuntu 24.04 · arm64 · gateway :9119 · Python 3.14.2')),
      H.h('div.grow'),
      H.h('div.settings-headmeta',
        profilePill,
        managedBtn));

    const nav = H.h('nav.settings-nav', {'aria-label':'Settings sections'});
    TABS.forEach(t => {
      nav.appendChild(H.h('button.settings-navitem',
        {'aria-current':state.tab === t.id ? 'page' : null, type:'button', onclick:()=>selectTab(t.id)},
        H.ic(t.icon,'sm'),
        H.h('span', t.label)));
    });

    let body;
    const env = {
      ctx, state, toast: msg => (ctx.toast ? ctx.toast(msg) : H.toast(msg)),
      selectTab: id => selectTab(id),
      refreshProfile: paintProfilePill
    };
    function buildBody(){
      const node = BUILD[state.tab](env);
      node.classList.add('settings-body');
      return node;
    }
    function selectTab(id){
      if (!BUILD[id]) id = 'general';
      state.tab = id;
      try { history.replaceState(null, '', '#/settings/' + id); } catch(e){}
      nav.querySelectorAll('button').forEach((b,i) => {
        if (TABS[i].id === id) b.setAttribute('aria-current','page');
        else b.removeAttribute('aria-current');
      });
      const next = buildBody();
      body.replaceWith(next);
      body = next;
      page.scrollTop = 0;
    }

    body = buildBody();
    inside.append(head, H.h('div.settings-layout', nav, body));
    page.appendChild(inside);
    root.appendChild(page);
  }
};
})();

/* js/views/history.js */
/* History · every thread this machine has run: search, filter, export, prune.
   Own file: js/views/history.js + css/history.css. */
(function(){
const H = window.H;
if (!H || !H.views) return;

const TODAY = '19 Nov 2026';

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
const projectName = id => (H.project(id) || {}).name || 'No project';
const agentOf = id => H.agent(id) || {name:id, hue:212, kind:0, state:'idle'};
const rangeDays = r => r === 'today' ? 0 : Number(r);

function rowsAll(){
  return ROWS.concat(imported).filter(r => !archived.has(r.id) && !deleted.has(r.id));
}
function filtered(){
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

function clearFilters(){
  q = ''; fAgent = ''; fProject = ''; fSource = ''; fRange = 'all'; sort = 'newest';
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
    H.h('td.history-projcell', H.h('div.history-proj', {title:projectName(r.project)}, projectName(r.project))),
    H.h('td.history-avcell', H.avatar(agentOf(r.agent), 24, 'idle')),
    H.h('td', H.pill(r.source)),
    H.h('td.history-modelcell', H.h('div.history-model', {title:r.model}, r.model)),
    H.h('td.r.num', H.fmt.n(r.msgs)),
    H.h('td.r.num', H.fmt.k(r.tokens)),
    H.h('td.r.num', H.fmt.usd(r.cost)),
    H.h('td.history-last', r.last)
  );
}

function tableCard(){
  const list = filtered();
  const card = H.h('section.card.history-card');
  const bulkHost = H.h('div.history-bulk-host');
  card.appendChild(bulkHost);

  card.appendChild(H.h('div.history-card-top',
    H.h('span.history-showing', 'Showing ' + list.length + ' of ' + rowsAll().length + ' sessions'),
    H.h('span.history-hint', 'Click a row to preview · Space to select')
  ));

  const table = H.h('table.tbl.history-table',
    H.h('thead', H.h('tr',
      H.h('th.history-cbcell', {scope:'col'}, headCheckbox(list)),
      H.h('th', {scope:'col'}, 'Title'),
      H.h('th', {scope:'col'}, 'Snippet'),
      H.h('th', {scope:'col'}, 'Project'),
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
  card.appendChild(H.h('div.scroll-x.history-scroll', table));

  if (!list.length){
    card.appendChild(H.h('div.empty.history-empty',
      H.ic('search','lg'),
      H.h('div.history-empty-t', q ? 'No sessions mention “' + q + '”' : 'No sessions match these filters'),
      H.h('div.history-empty-s', q ? 'Search looks at titles and snippets only.' : 'Try another agent, project, source or date range.'),
      H.h('button.btn.sm', {type:'button', onclick:clearFilters}, 'Clear filters')
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
function syncHeadCheck(){
  const list = filtered();
  const cb = viewRoot.querySelector('.history-head-cb');
  if (!cb) return;
  const n = list.filter(r => selected.has(r.id)).length;
  cb.checked = n > 0 && n === list.length;
  cb.indeterminate = n > 0 && n < list.length;
}

function archiveSelected(){
  const n = selected.size;
  if (!n) return;
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
      exported: TODAY,
      count: rows.length,
      sessions: rows.map(r => ({
        id:r.id, title:r.title, snippet:r.snippet, project:projectName(r.project),
        agent:r.agent, source:r.source, model:r.model, messages:r.msgs,
        tokens:r.tokens, cost:r.cost, lastActive:r.last,
      })),
    }, null, 2);
  }
  const head = '| Title | Project | Agent | Source | Model | Messages | Tokens | Cost | Last active |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- |';
  const body = rows.map(r => '| ' + [r.title, projectName(r.project), agentOf(r.agent).name, r.source, r.model,
    r.msgs, H.fmt.k(r.tokens), H.fmt.usd(r.cost), r.last].join(' | ') + ' |').join('\n');
  return '# Hermes session export\n\n' + TODAY + ' · ' + rows.length + ' sessions\n\n' + head + '\n' + body + '\n';
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

function importDialog(){
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
    draw();
  },
};
})();

/* js/chat.js */
/* Thread view: talk to the agent and watch it work. Everything secondary opens in the Details drawer (inspector.js). */
(function(){
const H = window.H, h = H.h, D = H.data;
const MODEL_NAME = {'claude-sonnet-5-5':'Claude Sonnet 5.5','claude-opus-5-5':'Claude Opus 5.5','deepseek-flash':'DeepSeek Flash','gemini-flash':'Gemini Flash','hermes-local':'Hermes local'};
const modelName = id => MODEL_NAME[id] || (id||'').replace(/-/g,' ');
const PERM_NAME = {Ask:'Ask before running','Auto-edit':'Auto-edit files','Full access':'Full access'};
let live = null;                 // the mounted thread screen, so H.openTerminal always targets it
H.openTerminal = () => { live && live.openTerminal(); };

/* ---------- tiny markdown ---------- */
function md(src){
  const inline = s => H.esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  const out = []; let list = null;
  src.split('\n').forEach(line => {
    const li = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(line);
    if (li) { if (!list) { list = []; out.push(list); } list.push(li[1]); return; }
    list = null; if (line.trim()) out.push(line);
  });
  const root = h('div.md');
  out.forEach(b => { if (Array.isArray(b)) root.append(h('ul', ...b.map(x => h('li', {html:inline(x)})))); else if (/^###?\s/.test(b)) root.append(h('h4', {html:inline(b.replace(/^#+\s/,''))})); else root.append(h('p', {html:inline(b)})); });
  return root;
}
H.md = md;

/* ---------- seeded transcripts ---------- */
const STEP_IC = {read:'file', search:'search', edit:'edit', run:'terminal', browse:'globe', mcp:'plug', think:'brain', delegate:'users', memory:'brain', skill:'sparkle'};
const DIFF_A = [
 ['@@ web/src/pages/ChatPage.tsx','h'],
 [' export default function ChatPage() {','c'],
 ['-  const term = useXterm(ptyUrl)','d'],
 ['-  return <div ref={term.ref} className="h-full bg-black" />','d'],
 ['+  const thread = useThread(sessionId)','a'],
 ['+  return (','a'],
 ['+    <ThreadLayout inspector={<Inspector thread={thread} />}>','a'],
 ['+      <Transcript turns={thread.turns} />','a'],
 ['+      <Composer onSend={thread.send} />','a'],
 ['+    </ThreadLayout>','a'],
 ['+  )','a'],
 [' }','c']];
const SEED = {
 't-ui': [
  {role:'user', text:'The web UI feels like a terminal. Redesign it chat-first, keep every capability, and take cues from Grok Bot, Codex, T3, MonoCode and Orca.'},
  {role:'agent', dur:'2m 08s', tokens:'41.2k', cost:0.31, blocks:[
    {t:'work', summary:'Worked for 2m 08s', counts:'read 9 files · searched 4 times · ran 3 commands', steps:[
      {k:'read', l:'Read web/AGENTS.md', d:'The dashboard embeds the real TUI over /api/pty (xterm.js)', dur:'0.4s'},
      {k:'read', l:'Read apps/desktop/src/AGENTS.md', d:'Desktop already renders a native transcript over JSON-RPC', dur:'0.5s'},
      {k:'run', l:'hermes dashboard --help', d:'port 9119, loopback only, session token auth', dur:'1.1s', out:'usage: hermes dashboard [-h] [--port PORT] [--host HOST] …'},
      {k:'search', l:'Searched the web: “Grok Bot design persistent agents”', d:'6 results · x.ai/news/designing-grok-bot', dur:'3.2s'},
      {k:'delegate', l:'Delegated capability inventory to a DeepSeek worker', d:'Worker fb74bc · 17 pages, 52 endpoints', dur:'1m 12s'},
      {k:'edit', l:'Wrote prototype/css/base.css', d:'tokens, components', dur:'0.2s'}]},
    {t:'text', md:'I read how the dashboard works today. Its chat tab is the **real TUI inside xterm.js**, which is why it feels like a terminal. The desktop app already speaks the same JSON-RPC to the gateway with a native transcript, so a non-terminal chat is feasible without touching the agent.\n\nThe new design makes **threads** the unit of work, shows the agent as a **persistent teammate** with presence, and moves everything else into calm spaces.'},
    {t:'plan', items:[['Capability inventory of every page, endpoint and slash command','done'],['Design system and shell (rail, thread, inspector)','done'],['Secondary spaces: inbox, routines, library, channels, insights, settings','active'],['Terminal as an optional view, not the default','todo'],['Verify in a real browser at 3 widths','todo']]},
    {t:'agents', rows:[['Inbox + History views','done','deepseek-flash','2m 41s'],['Routines + task board','done','deepseek-flash','3m 02s'],['Library, Channels, Insights, Settings','active','deepseek-flash','working']]},
    {t:'checkpoint', label:'Checkpoint · before secondary views'},
    {t:'diff', files:[['css/base.css',148,0],['js/ui.js',132,0],['js/shell.js',50,34],['js/chat.js',70,50],['js/views/*.js',12,12]], hunk:DIFF_A},
    {t:'text', md:'Everything is wired to sample data so the interaction model can be judged now. Next I will check each view in a real browser at 1440, 768 and 390px.'}]},
 ],
 't-gw': [
  {role:'user', text:'Heartbeat gaps keep showing up in the gateway log after the restart. Find out why.'},
  {role:'agent', dur:'46s', tokens:'12.8k', cost:0.09, blocks:[
    {t:'work', summary:'Worked for 46s', counts:'read 3 files · ran 4 commands', steps:[
      {k:'run', l:'hermes status --full', d:'gateway running · pid 1020 · 7 sessions', dur:'1.2s', out:'Gateway  ● running  pid 1020  uptime 6d 4h\nDashboard 127.0.0.1:9119  ok\nAPI server 127.0.0.1:8642  ok'},
      {k:'run', l:'tail -n 200 ~/.hermes/logs/gateway.log', d:'14 × “heartbeat late (>30s)” between 03:10 and 03:42', dur:'0.3s'},
      {k:'read', l:'Read docs/skills/diagnosing-gateway-problems.md', d:'USR2 dump, watchdog, exit codes', dur:'0.2s'}]},
    {t:'text', md:'The gaps line up with `state.db` checkpoint pauses on the 03:00 cron backup, not with a crash. A clean restart clears a stale WAL reader that is holding the checkpoint. I need your OK to restart the gateway; active sessions will show “Turn lost during restart” and can be resumed.'},
    {t:'approval', cmd:'hermes gateway restart', cwd:'~/hermes-maintenance', risk:'medium', why:'Clears the stale WAL reader that blocks checkpoints.'}]},
 ],
 't-bk': [
  {role:'user', text:'Verify last night’s backup zip restores cleanly.'},
  {role:'agent', dur:'1m 20s', tokens:'9.1k', cost:0.02, blocks:[
    {t:'work', summary:'Worked for 1m 20s', counts:'ran 5 commands', steps:[
      {k:'run', l:'unzip -tq ~/.hermes/backups/hermes-2026-11-19.zip', d:'No errors in 3,912 files', dur:'4.1s'},
      {k:'run', l:'sqlite3 scratch/state.db "PRAGMA integrity_check"', d:'ok · WAL and SHM present together', dur:'0.8s'}]},
    {t:'text', md:'The backup is good: **214 MB, 3,912 files**, and `state.db` with its `-wal` and `-shm` restored as one image and passed the integrity check. Nothing to fix.'}]},
 ],
};
function seedFor(t){ return SEED[t.id] || (t.fresh ? [] : [
  {role:'user', text: t.title},
  {role:'agent', dur:'31s', tokens:'6.4k', cost:0.04, blocks:[{t:'work', summary:'Worked for 31s', counts:'read 2 files · searched once', steps:[{k:'search', l:'Searched the web', d:'5 results', dur:'2.4s'},{k:'read', l:'Read 2 sources', d:'', dur:'1.1s'}]},{t:'text', md:'This is sample history for the prototype. Open **Redesign the web UI** for the full transcript with plan, delegated workers, checkpoints and diffs.'}]}]); }

/* ---------- blocks ---------- */
const worked = (s, n) => s.replace(/^Worked for /,'Worked ') + ', ' + n + (n===1?' step':' steps');

function stepNode(s, live){
  const n = h('div.step'+(live?'.live':''), {tabindex:s.out?0:-1},
    h('span.sic', H.ic(STEP_IC[s.k]||'file','sm')),
    h('span.sl', h('span.sn', s.l), s.d?h('span.sd', s.d):null, live?h('span.dot.live'):null),
    live ? null : h('span.sdur', s.dur||''));
  if (!s.out) return n;
  const o = h('pre.out', s.out); o.hidden = true; n.classList.add('has');
  n.onclick = () => { o.hidden = !o.hidden; };
  return h('div', n, o);
}
function workGroup(o){
  const lab = h('span.wt', o.label);
  const counts = h('div.wcount', o.counts || '');
  const body = h('div.work-b', counts);
  if (o.steps) o.steps.forEach(s => body.append(stepNode(s)));
  const head = h('button.work-h', {'aria-expanded':String(!!o.open)}, H.ic('chev','sm c'), lab);
  const el = h('div.work'+(o.open?'.open':''), head, h('div.workclip', body));
  head.onclick = () => { const on = !el.classList.contains('open'); el.classList.toggle('open', on); head.setAttribute('aria-expanded', String(on)); };
  return {el, lab, counts, body, add:n => body.append(n),
    open(){ el.classList.add('open'); head.setAttribute('aria-expanded','true'); },
    close(){ el.classList.remove('open'); head.setAttribute('aria-expanded','false'); }};
}
function checkpointNode(b){
  return h('div.cp', h('span.cl'),
    h('button.cpb', {onclick:()=>H.toast('Restored files and conversation to this checkpoint (sample)')}, H.ic('undo','sm'), b.label, h('span', ' · Restore')),
    h('span.cl'));
}
function approvalCard(b, onDecide){
  const c = h('div.appr');
  const finish = (res, label) => {
    c.classList.add('done');
    c.replaceChildren(h('div.receipt', H.ic(res==='deny'?'x':'check','sm'), h('span', (res==='deny'?'Denied':'Allowed')+' · '+label), h('span.muted','· just now'), h('code', b.cmd)));
    onDecide && onDecide(res);
    H.toast(res==='deny' ? 'Denied' : 'Approved · Hermes continues');
  };
  const extra = h('div.omenu'); extra.hidden = true;
  const more = h('button.omore', {'aria-expanded':'false'}, 'More options');
  more.onclick = () => { extra.hidden = !extra.hidden; more.setAttribute('aria-expanded', String(!extra.hidden)); };
  extra.append(
    h('button', {onclick:()=>finish('allow','Allowed for this thread')}, 'Allow for this thread'),
    h('button', {onclick:()=>finish('allow','Added to allowlist')}, 'Always allow…'),
    h('button.danger', {onclick:()=>finish('deny','Denied')}, 'Deny'));
  c.append(
    h('div.ahead', h('span.dot.warn'), h('b','Needs your approval'), h('span.risk', b.risk+' risk')),
    h('pre.cmd', b.cmd),
    h('p.awhy', b.why+' · runs in ', h('code', b.cwd)),
    h('div.aact', h('button.btn.primary.big', {onclick:()=>finish('allow','Allowed once')}, 'Allow once'), more),
    extra);
  return c;
}
function clarifyCard(b, onPick){
  const c = h('div.appr.q', h('div.ahead', h('span.dot.warn'), h('b', b.q)));
  const row = h('div.aact'); b.options.forEach(o => row.append(h('button.btn', {onclick:()=>{ c.replaceChildren(h('div.receipt', H.ic('check','sm'), 'You chose: '+o)); onPick&&onPick(o); }}, o)));
  c.append(row); return c;
}
function renderBlock(b, api){
  switch(b.t){
    case 'work': return workGroup({label:worked(b.summary, b.steps.length), counts:b.counts, steps:b.steps}).el;
    case 'text': return md(b.md);
    case 'checkpoint': return checkpointNode(b);
    case 'approval': return approvalCard(b);
    case 'clarify': return clarifyCard(b);
    default: return h('div');
  }
}
function userMsg(m){
  return h('div.turn.user', h('div.ub', m.text, (m.files||[]).map(f => h('span.fil', H.ic('paperclip','sm'), f))));
}
function turnActions(){
  return h('div.tact', ...[['copy','Copy',()=>H.toast('Copied')],['retry','Retry',()=>H.toast('Retrying turn')],['fork','Branch from here',()=>H.toast('Forked into a new thread')],['undo','Undo turn',()=>H.toast('Turn undone; files restored')]].map(([i,l,f]) => h('button.btn.ghost.icon.sm', {'aria-label':l,title:l,onclick:f}, H.ic(i,'sm'))));
}
function agentMsg(m, t, api){
  const a = H.agent(t.agent);
  const body = h('div.abody');
  const plan = m.blocks.find(b=>b.t==='plan'), crew = m.blocks.find(b=>b.t==='agents'), diff = m.blocks.find(b=>b.t==='diff');
  let chips = null;
  m.blocks.forEach(b => {
    if (b.t==='plan' || b.t==='agents' || b.t==='diff'){
      if (!chips){
        chips = h('div.chips');
        if (plan) chips.append(h('button.chipb', {onclick:()=>api.inspect('plan')}, 'Plan '+plan.items.filter(i=>i[1]==='done').length+' of '+plan.items.length));
        if (crew) chips.append(h('button.chipb', {onclick:()=>api.inspect('plan')}, crew.rows.length+' workers'));
        if (diff){ const tot = diff.files.reduce((x,f)=>[x[0]+f[1],x[1]+f[2]],[0,0]); chips.append(h('button.chipb', {onclick:()=>api.inspect('changes')}, diff.files.length+' files ', h('span.add','+'+tot[0]), ' ', h('span.del','−'+tot[1]))); }
        body.append(chips);
      }
      return;
    }
    body.append(renderBlock(b, api));
  });
  return h('div.turn.agent', h('div.aav', H.avatar(a, 22, avState(t.state))), body,
    h('div.afoot', h('span.num', m.dur||''), h('span.dotsep'), h('span.num', (m.tokens||'')+' tokens'), h('span.dotsep'), h('span.num', m.cost!=null?H.fmt.usd(m.cost):''), h('span.grow'), turnActions()));
}
const avState = s => ({working:'working', thinking:'thinking', waiting:'waiting', failed:'blocked', done:'done'})[s] || 'idle';

/* ---------- composer menus ---------- */
function openMenu(wrap, groups){
  const m = h('div.menu', {role:'menu'});
  groups.forEach((g,gi) => {
    if (gi) m.append(h('div.msep'));
    if (g.label) m.append(h('div.mlabel', g.label));
    g.items.forEach(it => m.append(h('button'+(it.on?'.on':'')+(it.tone==='neg'?'.neg':''), {role:'menuitemradio','aria-checked':String(!!it.on), onclick:()=>{ it.run(); m.remove(); }},
      h('span.grow', it.label), it.note?h('span.muted', it.note):null, it.on?H.ic('check','sm'):null)));
  });
  wrap.append(m);
  const off = e => { if (!m.contains(e.target)){ m.remove(); document.removeEventListener('click', off); } };
  setTimeout(()=>document.addEventListener('click', off), 0);
}

/* ---------- the view ---------- */
H.views.thread = { render(root, ctx){
  const t = H.thread(ctx.route[0]);
  if (!t) { root.append(h('div.empty', 'Thread not found')); return; }
  const agent = H.agent(t.agent);
  const S = {running:false, queue:[], effort:'Medium', perm:'Ask', model:t.model, ctxUsed: t.fresh?34:t.id==='t-ui'?186:41,
    tab:(t.adds||t.dels)?'changes':'context'};
  let details = null;
  const api = {inspect, S, thread:t};

  /* frame */
  const ghost = h('div.ghostw', {'aria-hidden':'true','data-w':agent.name});
  const title = h('h1.tt', {contenteditable:'plaintext-only', spellcheck:'false', role:'textbox', 'aria-label':'Thread title',
    onblur:e => { t.title = e.target.textContent.trim() || t.title; e.target.textContent = t.title; H.refreshRail(); }}, t.title);
  const stateEl = h('span.tstate');
  const dbtn = h('button.btn.ghost.dbtn', {'aria-label':'Details', title:'Details', onclick:()=>openDetails()}, H.ic('panel'), h('span.dl','Details'));
  const head = h('header.thead', title, stateEl, h('span.grow'), dbtn);
  const col = h('div.col');
  const scroller = h('div.scroll', {tabindex:'-1'}, col);
  const cf = h('footer.cfoot');
  const chat = h('div.chat', ghost, head, scroller, cf);
  root.append(chat);
  function drawState(){
    const m = {working:['live','Working'], thinking:['live','Working'], waiting:['warn','Needs you'], done:['pos','Finished'], failed:['neg','Failed']}[t.state] || ['','Idle'];
    stateEl.replaceChildren(h('span.dot'+(m[0]?'.'+m[0]:''), {'aria-hidden':'true'}), m[1]);
  }

  /* details drawer */
  function openDetails(tab){
    if (tab) S.tab = tab;
    if (details){ details.show(S.tab); return; }
    details = H.details(t, S, {tab:S.tab, onClose:()=>{ details = null; }});
  }
  function inspect(tab){ openDetails(tab); }
  live = {openTerminal:()=>openDetails('terminal')};

  /* transcript */
  seedFor(t).forEach(m => col.append(m.role==='user' ? userMsg(m) : agentMsg(m, t, api)));
  if (t.fresh) col.hidden = true;
  const toBottom = () => { scroller.scrollTop = scroller.scrollHeight; };

  /* composer */
  const ta = h('textarea.cta', {rows:1, placeholder: window.innerWidth<520 ? `Message ${agent.name}…` : `Message ${agent.name} · / commands · @ files`, 'aria-label':'Message'});
  const pop = h('div.cpop'); pop.hidden = true;
  const queueBox = h('div.cqueue');
  const meta = h('div.cmeta');
  const plusMenu = h('div.cmenu'); plusMenu.hidden = true;
  const plus = h('button.btn.ghost.icon', {'aria-label':'Add', title:'Attach, mention, commands, voice', 'aria-haspopup':'menu'}, H.ic('plus'));
  const sendBtn = h('button.btn.primary.icon', {'aria-label':'Send'});
  const cbox = h('div.cbox', plus, plusMenu, pop, ta, sendBtn);
  const comp = h('div.comp', queueBox, cbox, meta);
  const autosize = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 220)+'px'; };
  plus.onclick = e => { e.stopPropagation(); plusMenu.hidden = !plusMenu.hidden; };
  const plusItem = (label, ic, run) => h('button', {onclick:()=>{ plusMenu.hidden = true; run(); }}, H.ic(ic,'sm'), label);
  plusMenu.append(
    plusItem('Attach file','paperclip', ()=>{ ta.value += ' [spec.pdf]'; ta.focus(); H.toast('Attached spec.pdf (sample)'); }),
    plusItem('Mention','at', ()=>{ ta.value += '@'; ta.focus(); showPop(); }),
    plusItem('Commands','slash', ()=>{ ta.value = '/'; ta.focus(); showPop(); }),
    plusItem('Voice','mic', ()=>H.toast('Listening… (sample)')));
  const closePlus = e => { if (!plusMenu.hidden && !cbox.contains(e.target)) plusMenu.hidden = true; };
  document.addEventListener('click', closePlus);

  const drawSend = () => {
    const stop = S.running && !ta.value.trim();
    sendBtn.replaceChildren(H.ic(stop ? 'stop':'send'));
    sendBtn.setAttribute('aria-label', stop ? 'Stop':'Send');
    sendBtn.classList.toggle('stopb', stop);
  };
  const modelGroups = () => [
    {label:'Model', items:D.models.map(m => ({label:modelName(m.id), note:m.provider, on:S.model===m.id, run:()=>{ S.model = m.id; drawMeta(); H.toast('Model · '+modelName(m.id)); }}))},
    {label:'Reasoning', items:['Off','Low','Medium','High'].map(x => ({label:x, on:S.effort===x, run:()=>{ S.effort = x; drawMeta(); H.toast('Reasoning · '+x); }}))}];
  const permGroups = () => [{label:'Running commands', items:[
    {label:'Ask before running', on:S.perm==='Ask', run:()=>{ S.perm='Ask'; drawMeta(); }},
    {label:'Auto-edit files', note:'no command prompts', on:S.perm==='Auto-edit', run:()=>{ S.perm='Auto-edit'; drawMeta(); }},
    {label:'Full access', note:'never asks', tone:'neg', on:S.perm==='Full access', run:()=>{ S.perm='Full access'; drawMeta(); H.toast('Auto-approve on for this thread'); }}]}];
  function drawMeta(){
    const seg = (label, groups, cls) => { const w = h('span.cseg'); w.append(h('button'+(cls?'.'+cls:''), {'aria-haspopup':'menu', onclick:e=>{ e.stopPropagation(); meta.querySelectorAll('.menu').forEach(n=>n.remove()); openMenu(w, groups()); }}, label)); return w; };
    meta.replaceChildren(
      seg(modelName(S.model), modelGroups),
      h('span.csep','·'),
      seg(PERM_NAME[S.perm]||S.perm, permGroups, S.perm==='Full access'?'coral':''),
      h('span.csep','·'),
      h('span.cseg', h('button', {title:'Context used', onclick:()=>openDetails('context')}, S.ctxUsed+'k of 1M')));
  }
  const showPop = () => {
    const v = ta.value; const m = /(^|\s)([/@])([\w-]*)$/.exec(v); if (!m) { pop.hidden = true; return; }
    const q = m[3].toLowerCase(); let items;
    if (m[2]==='/') items = D.slash.filter(([c])=>c.slice(1).startsWith(q)).map(([c,d])=>({k:c,d,ins:c+' '}));
    else items = [['@ChatPage.tsx','web/src/pages'],['@SOUL.md','~/.hermes'],['@skill:web-research','skill'],['@thread:Gateway heartbeat gaps','thread'],['@AGENTS.md','repo root'],['@config.yaml','~/.hermes']].filter(([c])=>c.toLowerCase().slice(1).includes(q)).map(([c,d])=>({k:c,d,ins:c+' '}));
    pop.replaceChildren(...items.slice(0,8).map((it,i) => h('button'+(i===0?'.sel':''), {onclick:()=>{ ta.value = v.slice(0, v.length-m[0].length+m[1].length)+it.ins; pop.hidden = true; ta.focus(); autosize(); }}, h('span.mono', it.k), h('span.muted', it.d)))); pop.hidden = !items.length;
  };
  ta.addEventListener('input', () => { autosize(); showPop(); drawSend(); });
  ta.addEventListener('keydown', e => {
    if (!pop.hidden && (e.key==='Tab' || (e.key==='Enter' && !e.metaKey))) { const first = pop.querySelector('button'); if (first){ e.preventDefault(); first.click(); return; } }
    if (e.key==='Escape') pop.hidden = true;
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); submit(e.metaKey||e.ctrlKey); }
  });
  sendBtn.onclick = () => { if (S.running && !ta.value.trim()) stopRun(); else submit(false); };

  /* empty poster, with the composer docked in it */
  let poster = null;
  function dockEmpty(){
    if (!t.fresh) { cf.append(comp); return; }
    poster = emptyState(t, agent, txt => { ta.value = txt; ta.focus(); autosize(); });
    poster.querySelector('.pdock').append(comp);
    scroller.append(poster);
  }
  function dropEmpty(){ if (poster){ poster.remove(); poster = null; cf.append(comp); } }
  const unempty = () => { dropEmpty(); col.hidden = false; };

  /* ---------- live simulation ---------- */
  let timers = []; const later = (fn, ms) => { const id = setTimeout(() => { if (root.isConnected) fn(); }, ms); timers.push(id); return id; };
  function setState(s){ t.state = s; drawState(); H.refreshRail(); }
  function submit(steer){
    const v = ta.value.trim(); if (!v) return;
    ta.value = ''; autosize(); pop.hidden = true; drawSend();
    if (v.startsWith('/')) { slashCmd(v); return; }
    if (S.running && !steer) { S.queue.push(v); drawQueue(); H.toast('Queued · sends when this turn finishes'); return; }
    if (S.running && steer) { col.append(userMsg({text:v})); toBottom(); H.toast('Steering: Hermes sees this on its next step'); return; }
    runTurn(v);
  }
  function slashCmd(v){
    const c = v.split(' ')[0];
    if (c==='/new') return H.newThread();
    if (c==='/compress'){ unempty(); S.ctxUsed = 41; col.append(h('div.note', H.ic('layers','sm'), 'Context compressed · 186k → 41k tokens · summary kept in the system prompt')); toBottom(); drawMeta(); return; }
    if (c==='/usage'){ openDetails('context'); return; }
    if (c==='/checkpoint'){ unempty(); col.append(checkpointNode({label:'Checkpoint · saved now'})); toBottom(); return; }
    if (c==='/yolo'){ S.perm = 'Full access'; drawMeta(); H.toast('Auto-approve on for this thread'); return; }
    if (c==='/cron'){ H.toast('Opening “New routine” with this thread as the prompt'); location.hash = '#/routines/schedules'; return; }
    if (c==='/memory'||c==='/skills'||c==='/tools'){ location.hash = '#/library/'+(c==='/memory'?'memory':c==='/skills'?'skills':'tools'); return; }
    if (c==='/model'||c==='/reasoning'){ H.toast('Use the model and reasoning options under the composer'); return; }
    H.toast(c+' is available · sample');
  }
  function drawQueue(){ queueBox.replaceChildren(...S.queue.map((q,i) => h('div.qi', H.ic('clock','sm'), h('span.grow.ellip', q), h('button.btn.ghost.sm', {onclick:()=>{ S.queue.splice(i,1); drawQueue(); }}, 'Remove')))); }
  function stopRun(){
    timers.forEach(clearTimeout); timers = []; S.running = false; setState('idle');
    liveEl && liveEl.querySelector('.av')?.setAttribute('data-state','idle');
    col.append(h('div.note', H.ic('stop','sm'), 'Interrupted by you. Files changed so far are kept; use Undo turn to revert.'));
    toBottom(); drawSend();
  }
  let liveEl = null;
  function runTurn(prompt){
    S.running = true; unempty();
    col.append(userMsg({text:prompt})); toBottom(); setState('thinking'); drawSend();
    const body = h('div.abody');
    const av = H.avatar(agent, 22, 'thinking');
    const think = h('div.think', h('span.dot.live'), 'Thinking…');
    const turn = h('div.turn.agent', h('div.aav', av), body); liveEl = turn;
    col.append(turn); body.append(think); toBottom();
    const grp = workGroup({label:'Working…', open:true});
    const script = [
      {k:'think', l:'Reading the request', d:'', dur:'0.6s'},
      {k:'read', l:'Read '+(H.project(t.project).path)+'/CLAUDE.md', d:'project instructions and invariants', dur:'0.3s'},
      {k:'search', l:'Searched the codebase', d:'6 matches in 3 files', dur:'0.9s'},
      {k:'run', l:'hermes doctor', d:'read-only · 0 holder PIDs', dur:'2.4s', out:'ok python 3.14 · ok state.db · ok gateway · warn mcp “atlas” unreachable'},
    ];
    let i = 0; const t0 = Date.now();
    later(() => { think.remove(); setState('working'); av.setAttribute('data-state','working'); body.append(grp.el); toBottom(); next(); }, 900);
    function next(){
      if (i >= script.length) return approve();
      const s = script[i++]; const row = stepNode(s, true); grp.add(row); toBottom();
      later(() => { const done = stepNode(s, false); row.replaceWith(done); next(); }, 650);
    }
    function approve(){
      setState('waiting'); av.setAttribute('data-state','waiting'); grp.lab.textContent = 'Waiting for your approval';
      const card = approvalCard({cmd:'hermes mcp test atlas --timeout 20', cwd:H.project(t.project).path, risk:'low', why:'Probing the one failing MCP server before suggesting a fix.'}, res => {
        setState('working'); av.setAttribute('data-state','working');
        if (res==='deny') return finish(true);
        later(()=>finish(false), 900);
      });
      body.append(card); toBottom();
    }
    function finish(denied){
      const secs = Math.max(4, Math.round((Date.now()-t0)/1000));
      grp.lab.textContent = worked('Worked for '+secs+'s', script.length);
      grp.counts.textContent = 'read 1 file · searched once · ran 2 commands';
      grp.close();
      const out = h('div.md'); body.append(out);
      const text = denied ? 'Understood, I skipped the probe. `hermes doctor` shows **one warning**: the MCP server `atlas` is unreachable. I can test it whenever you allow the command, or leave it as is.' : 'Done. `hermes doctor` is clean except **one warning**: the MCP server `atlas` is unreachable. `hermes mcp test` shows the connection is refused on port 7410, so the server process is down rather than misconfigured.\n\nSuggested next step: restart that server, then run the test again. I can do it from the **Library → Tools** page, or from here if you want.';
      const words = text.split(' '); let w = 0; const p = h('p'); out.append(p); av.setAttribute('data-state','working');
      const tick = () => { p.textContent += (w?' ':'')+words[w++]; toBottom(); if (w < words.length) later(tick, 28); else end(); };
      tick();
    }
    function end(){
      const rendered = md([...turn.querySelectorAll('.abody .md p')].map(p=>p.textContent).join('\n\n'));
      turn.querySelector('.abody .md').replaceWith(rendered);
      turn.append(h('div.afoot', h('span.num','22s'), h('span.dotsep'), h('span.num','8.3k tokens'), h('span.dotsep'), h('span.num','$0.04'), h('span.grow'), turnActions()));
      av.setAttribute('data-state','done'); setTimeout(()=>av.setAttribute('data-state','idle'), 1800);
      S.running = false; S.ctxUsed += 8; t.age = 'now'; setState('done'); drawSend(); toBottom();
      if (S.queue.length){ const nx = S.queue.shift(); drawQueue(); later(()=>runTurn(nx), 500); }
    }
  }

  /* ---------- mount ---------- */
  const onKey = e => { if (e.key==='`' && (e.metaKey||e.ctrlKey)){ e.preventDefault(); if (details && details.tab()==='terminal') details.close(); else openDetails('terminal'); } };
  const cleanup = () => { if (root.isConnected) return; document.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onNav); document.removeEventListener('click', closePlus); if (details){ details.close(); details = null; } };
  const onNav = () => setTimeout(cleanup, 260);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', onNav);

  drawState(); drawMeta(); dockEmpty(); drawSend(); autosize();
  requestAnimationFrame(toBottom);
}};

/* ---------- empty state: a poster, not a form ---------- */
function emptyState(t, agent, fill){
  const sug = [['Summarise what changed in my repos today','Review'],['Check gateway and MCP health, fix what is safe','Diagnose'],['Every weekday at 8: brief me on my calendar','Routine']];
  return h('div.poster',
    h('div.pcopy', h('h1.plead', `What should ${agent.name} take on?`), h('div.pdock'),
      h('div.psug', ...sug.map(([s,l]) => h('button.psg', {onclick:()=>fill(s), title:l}, h('span', s), H.ic('chev','sm'))))),
    h('div.par', H.mosaic({glyph:'home', seed:21, label:agent.name+' illustration'})));
}
})();

/* js/inspector.js */
/* Details drawer: Changes · Plan · Files · Shell · Browser · Context · Terminal. Also the full-screen Terminal (TUI) view. */
(function(){
const H = window.H, h = H.h;
const TABS = [['changes','Changes'],['plan','Plan'],['files','Files'],['shell','Shell'],['browser','Browser'],['context','Context'],['terminal','Terminal']];

function diffBlock(lines){ return h('pre.diff', ...lines.map(([t,c]) => h('span.dl.'+c, t+'\n'))); }
const FILES = [
 ['web/src/pages/ChatPage.tsx', 86, 41, [['@@ -12,9 +12,14 @@','h'],[' export default function ChatPage() {','c'],['-  const term = useXterm(ptyUrl)','d'],['-  return <div ref={term.ref} className="h-full bg-black" />','d'],['+  const thread = useThread(sessionId)','a'],['+  return (','a'],['+    <ThreadLayout inspector={<Inspector thread={thread} />}>','a'],['+      <Transcript turns={thread.turns} />','a'],['+    </ThreadLayout>','a'],['+  )','a'],[' }','c']]],
 ['web/src/components/Transcript.tsx', 142, 0, [['@@ -0,0 +1,142 @@','h'],['+export function Transcript({ turns }: Props) {','a'],['+  return turns.map(t => <Turn key={t.id} {...t} />)','a'],['+}','a']]],
 ['web/src/components/Composer.tsx', 98, 0, [['@@ -0,0 +1,98 @@','h'],['+export function Composer({ onSend }: Props) {','a'],['+  // slash menu, @mentions, model + permission chips','a'],['+}','a']]],
 ['web/src/lib/gatewayClient.ts', 24, 11, [['@@ -40,7 +40,20 @@','h'],['-  onEvent(e) { this.pty.write(e.data) }','d'],['+  onEvent(e) { this.turns.apply(e) }  // message.delta, tool.*, approval.request','a']]],
 ['web/src/pages/ChatPage.test.tsx', 62, 44, [['@@ -1,6 +1,6 @@','h'],['-it("mounts the terminal", …)','d'],['+it("renders the transcript", …)','a']]],
];

function changes(t){
  const w = h('div.ib');
  const scope = H.seg([{id:'turn',label:'This turn'},{id:'thread',label:'Thread'},{id:'branch',label:'vs main'}], 'thread', ()=>H.toast('Scope changed'));
  const tot = FILES.reduce((a,f)=>[a[0]+f[1],a[1]+f[2]],[0,0]);
  w.append(h('div.irow', scope), h('div.isum', h('b', FILES.length+' files'), h('span.add.num','+'+tot[0]), h('span.del.num','−'+tot[1]), h('span.grow'), h('button.btn.sm', {onclick:()=>H.toast('Reverted all changes in this thread')}, 'Revert all')));
  FILES.forEach(f => { const r = h('button.drow', {'aria-expanded':'false'}, H.ic('chev','sm c'), h('span.fn', f[0].split('/').pop(), h('span.muted', ' '+f[0].split('/').slice(0,-1).join('/'))), h('span.add.num','+'+f[1]), f[2]?h('span.del.num','−'+f[2]):null);
    const b = h('div.dfile', diffBlock(f[3])); b.hidden = true; r.onclick = () => { b.hidden = !b.hidden; r.setAttribute('aria-expanded', String(!b.hidden)); }; w.append(r, b); });
  const msg = h('textarea.textarea', {rows:2, placeholder:'Commit message', 'aria-label':'Commit message'}); msg.value = 'web: replace embedded TUI with native thread view';
  w.append(h('div.icommit', msg, h('div.irow', h('button.btn.primary', {onclick:()=>H.toast('Committed 5 files to '+(t.branch||'main'))}, 'Commit'), h('button.btn', {onclick:()=>H.toast('Pull request draft opened (sample)')}, H.ic('branch','sm'), 'Open PR'), h('span.grow'), h('span.muted', t.mode==='worktree'?'worktree ui-redesign':'local checkout'))));
  return w;
}
function plan(){
  const w = h('div.ib');
  const items = [['Capability inventory of every page, endpoint and slash command','done'],['Design system and shell','done'],['Secondary spaces','active'],['Terminal as an optional view','todo'],['Verify in a real browser','todo']];
  w.append(h('div.isec','Plan'), ...items.map(([x,s]) => h('div.pi.'+s, h('span.pbox', s==='done'?H.ic('check','sm'):s==='active'?h('span.dot.live'):null), h('span', x))));
  w.append(h('div.isec','Workers'), ...[['deepseek-flash','Inbox + History','done','2m 41s','$0.02'],['deepseek-flash','Routines + board','done','3m 02s','$0.03'],['deepseek-flash','Library','active','1m 20s','$0.01'],['deepseek-flash','Settings','active','1m 18s','$0.01']].map(([m,x,s,d,c]) => h('div.irow.wk', h('span.dot'+(s==='done'?'.pos':'.live')), h('span.grow', x), h('span.muted.mono', m), h('span.muted.num', d), h('span.muted.num', c))));
  w.append(h('div.isec','Delegation'), h('p.muted', 'Up to 3 workers in parallel · depth 1. Workers cannot approve their own commands.'));
  return w;
}
function files(t){
  const w = h('div.ib'); const q = h('input.input', {placeholder:'Filter files…', 'aria-label':'Filter files'});
  const tree = [['web/',0,1],['src/',1,1],['pages/',2,1],['ChatPage.tsx',3,0,'M'],['SessionsPage.tsx',3,0],['components/',2,1],['Transcript.tsx',3,0,'A'],['Composer.tsx',3,0,'A'],['lib/',2,1],['gatewayClient.ts',3,0,'M'],['hermes_cli/',0,1],['web_server.py',1,0],['docs/',0,1],['index.md',1,0],['CLAUDE.md',0,0]];
  const list = h('div.ftree'); const draw = () => { list.replaceChildren(...tree.filter(r=>!q.value||r[0].toLowerCase().includes(q.value.toLowerCase())).map(([n,d,dir,st]) => h('div.fr', {style:{paddingLeft:(8+d*14)+'px'}, onclick:()=>!dir&&H.toast('Opened '+n+' in the editor pane (sample)')}, H.ic(dir?'folder':'file','sm'), h('span.grow', n), st?h('span.pill.'+(st==='A'?'pos':'warn'), st):null))); };
  q.oninput = draw; draw(); w.append(h('div.irow', q), list, h('div.irow.muted', h('span', H.project(t.project).path)));
  return w;
}
function shell(t, go){
  const w = h('div.ib.shellib'); const out = h('div.term-out', {role:'log'}); const inp = h('input.term-in', {'aria-label':'Shell command', placeholder:'hermes status', spellcheck:'false'});
  const canned = {'hermes status':'Gateway  running  pid 1020\nDashboard 127.0.0.1:9119\nAPI       127.0.0.1:8642\nSessions  1,284 · state.db ok','ls':'CLAUDE.md  docs  ui-redesign','pwd':H.project(t.project).path.replace('~','/home/ubuntu'),'hermes doctor':'ok python 3.14 · ok state.db · ok gateway · warn mcp “atlas” unreachable'};
  out.append(h('div.muted','Real shell in the thread’s working directory. Same engine as the TUI.'));
  inp.onkeydown = e => { if (e.key==='Enter' && inp.value.trim()){ out.append(h('div.tl-in','$ '+inp.value), h('pre.tl-o', canned[inp.value.trim()] || 'command not found (sample shell)')); inp.value=''; out.scrollTop = out.scrollHeight; } };
  w.append(out, h('div.term-bar', h('span.mono','$'), inp), h('div.irow', h('button.btn.sm', {onclick:()=>go('terminal')}, H.ic('maximize','sm'), 'Open Terminal tab')));
  return w;
}
function browser(){
  const w = h('div.ib');
  w.append(h('div.urlbar', H.ic('lock','sm'), h('span.grow.ellip','https://x.ai/news/designing-grok-bot'), h('span.pill.live', h('span.dot.live'), 'Hermes is reading')),
    h('div.shot', h('div.sk.t'), h('div.sk.l1'), h('div.sk.l2'), h('div.sk.l3'), h('div.sk.b')),
    h('div.irow', h('button.btn.primary.sm', {onclick:()=>H.toast('You have control of the browser. Hermes waits.')}, 'Take over'), h('button.btn.sm', {onclick:()=>H.toast('Screenshot attached to thread')}, 'Attach screenshot'), h('span.grow'), h('span.muted','CDP 127.0.0.1:9222')),
    h('div.isec','Recent pages'), ...[['Designing Grok Bot for a world of persistent agents','x.ai'],['T3 Code · deep dive','flaviocopes.com'],['Worktrees · Orca Docs','orca.dev']].map(([a,b]) => h('div.irow', H.ic('globe','sm'), h('span.grow.ellip', a), h('span.muted', b))));
  return w;
}
function context(t, S){
  const w = h('div.ib'); const parts = [['System prompt + SOUL.md',7,'var(--text)'],['Memory',3,'var(--muted)'],['Skills (2 loaded)',9,'var(--faint)'],['Tool schemas',14,'var(--control)'],['Conversation',S.ctxUsed-33,'var(--live)']];
  const total = parts.reduce((a,p)=>a+p[1],0);
  w.append(h('div.kpi', h('div.v.num', S.ctxUsed+'k'), h('div.l', 'of 1M context · '+(S.ctxUsed/10).toFixed(1)+'% used')),
    h('div.stack', ...parts.map(p => h('span', {style:{flex:p[1]/total, background:p[2]}}))),
    ...parts.map(p => h('div.irow', h('span.sw', {style:{background:p[2]}}), h('span.grow', p[0]), h('span.muted.num', p[1]+'k'))),
    h('div.irow', h('button.btn.sm', {onclick:()=>H.toast('Compressing… 186k → 41k (sample)')}, 'Compress now'), h('span.muted','auto at 80%')),
    h('div.isec','Loaded skills'), h('div.ichips', ...['web-research','delegate','taste-skill'].map(s => h('span.pill', H.ic('sparkle','sm'), s))),
    h('div.isec','Memory used this turn'), ...['Prefers browsers in Docker, never host Chrome','Uses ~/.local/bin/hermes only'].map(x => h('div.irow', H.ic('brain','sm'), h('span.grow', x))),
    h('div.isec','Prompt cache'), h('div.irow', h('span.pill.pos','Warm'), h('span.grow','94% of the last turn was cached'), h('span.muted','saves $0.18')),
    h('p.muted', 'Changing model or toolsets mid-thread rebuilds the prompt and loses this cache.'));
  return w;
}

/* The Details drawer: the whole inspector, tabs included, in the kit's drawer. */
H.details = function(t, S, o){
  o = o || {};
  let cur = o.tab || 'changes';
  const dr = H.drawer({title:'Details', width:'min(560px,100vw)', onClose:()=>{ o.onClose && o.onClose(); }});
  const tabs = h('div.tabs.dtabs', {role:'tablist', 'aria-label':'Thread details'});
  const pane = h('div.dpane');
  dr.body.append(h('div.dwrap', tabs, pane));
  const bodies = {
    changes:()=>changes(t), plan:()=>plan(), files:()=>files(t), shell:()=>shell(t, show),
    browser:()=>browser(), context:()=>context(t, S), terminal:()=>H.terminalFull(t, ()=>dr.close()),
  };
  function drawTabs(){ tabs.replaceChildren(...TABS.map(([id,l]) => h('button', {role:'tab','aria-selected':String(cur===id), onclick:()=>show(id)}, l))); }
  function show(id){
    cur = id; drawTabs();
    pane.className = 'dpane'+(id==='terminal'?' term':'');
    pane.scrollTop = 0; pane.replaceChildren(bodies[id]());
  }
  drawTabs(); show(cur);
  return {el:dr.el, close:dr.close, show, tab:()=>cur};
};

/* Full terminal (TUI): the escape hatch that keeps 100% of the CLI available */
H.terminalFull = function(t, back){
  const out = h('div.tui-out', {role:'log', tabindex:0});
  const line = (c, x) => out.append(h('div.'+(c||'tl'), x));
  line('tl','╭─ Hermes Agent  ·  claude-sonnet-5-5  ·  ~/hermes-maintenance');
  line('tl','│ session '+t.id+'  ·  '+t.title);
  line('tl','╰─ /help for commands · Ctrl+C to interrupt');
  line('tl-dim','');
  line('tl-u','› The web UI feels like a terminal. Redesign it chat-first…');
  line('tl-a','⏺ I read how the dashboard works today. Its chat tab is the real TUI inside xterm.js…');
  line('tl-dim','  ⎿ read web/AGENTS.md · searched 4× · ran 3 commands');
  const inp = h('input.term-in', {'aria-label':'TUI input', placeholder:'Type a message or /command', spellcheck:'false'});
  inp.onkeydown = e => { if (e.key==='Enter' && inp.value.trim()){ line('tl-u','› '+inp.value); line('tl-a','⏺ (sample terminal · in the real app this is the same engine as the chat view)'); inp.value=''; out.scrollTop = out.scrollHeight; } };
  return h('div.tui', h('div.tui-bar', h('span.muted','Terminal'), h('span.pill', 'same session as Chat'), h('span.grow'), h('button.btn.sm', {onclick:back}, H.ic('chat','sm'), 'Back to chat')), out, h('div.term-bar.big', h('span.mono','›'), inp));
};
})();

/* js/stages.js */
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

H.defineStage({
  name: 'routines',
  title: 'Routines',
  ch: 'routines',
  glyph: 'routines',
  seed: 31,
  work: 'routines',
  workTitle: 'Routines',
  handle: 'All routines',
  handleCount: 8,
  lead: 'Hermes works while you sleep.',
  sub: 'Morning briefing in 6h 00m 00s',
  primary: {label: 'New routine'},
  secondary: {label: 'Pause all'},
  doors: [
    {label: 'Schedules', count: 8, tab: 'schedules'},
    {label: 'Triggers', count: 4, tab: 'triggers'},
    {label: 'Board', count: 12, tab: 'board'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('schedules'));

    const sub = el.querySelector('.stage-sub');
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
  handleCount: 34,
  lead: 'Teach Hermes something new.',
  sub: '34 skills, 12 memories and 6 toolsets are ready.',
  primary: {label: 'Add a skill'},
  doors: [
    {label: 'Skills', count: 34, tab: 'skills'},
    {label: 'Memory', count: 12, tab: 'memory'},
    {label: 'Tools', count: 6, tab: 'tools'},
    {label: 'Files', count: 24, tab: 'files'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('skills'));
    cap(el, '.stage-sub', 380);
    cap(el, '.stage-doors', 300);
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
  handleCount: 4,
  lead: 'Reach people where they are.',
  sub: '4 platforms connected, 7 live chats.',
  primary: {label: 'Connect a platform'},
  doors: [
    {label: 'Platforms', count: 4, tab: 'platforms'},
    {label: 'People', count: 7, tab: 'people'},
    {label: 'Endpoints', count: 5, tab: 'endpoints'},
    {label: 'Peers', count: 4, tab: 'peers'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('platforms'));
    cap(el, '.stage-doors', 300);
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
  handleCount: 7,
  lead: '$18.42 this week.',
  sub: '14% less than last week. 62% of the monthly cap.',
  primary: {label: 'See the breakdown'},
  doors: [
    {label: 'Usage', count: 5, tab: 'usage'},
    {label: 'Activity', count: 96, tab: 'activity'},
    {label: 'Logs', count: 212, tab: 'logs'}
  ],
  mount(el, api){
    onPrimary(el, () => api.openWork('usage'));
    cap(el, '.stage-sub', 380);
    cap(el, '.stage-doors', 340);
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
  handleCount: 1284,
  lead: 'Everything Hermes has done.',
  sub: '1,284 threads, 211 MB, all healthy.',
  primary: {label: 'Search history'},
  mount(el, api){ onPrimary(el, () => api.openWork()); }
});
})();

/* js/stages-inbox.js */
/* Inbox stage · one decision at a time.
   Own file: js/stages-inbox.js. Loads after js/views/inbox.js (the dense workbench)
   and before js/shell.js. The dense Inbox stays reachable behind the "Everything" handle. */
(function(){
const H = window.H, h = H.h;
if (!H || !H.views) return;

/* ---------- the dense view becomes the workbench, then we take its place ---------- */
if (H.views.inbox) H.work.inbox = H.views.inbox;

/* state survives navigation across views */
H.inboxStage = H.inboxStage || {resolved:{}};
H.inboxStage.resolved = H.inboxStage.resolved || {};

const NEEDS = ['approval','clarify','secret','handoff'];
const ORDER = ['approval','clarify','secret','handoff','review','done','failed'];
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- our own copy of the mock list (never mutate H.data.inbox) ---------- */
const EXTRA = {
  i1: {
    cmd:'hermes gateway restart', cwd:'~/hermes-maintenance', requested:'4m ago',
    why:'Heartbeat gaps persist after the 21:04 restart. Two gaps of 41 s and 49 s were recorded in the last hour; the dashboard still answers on :9119. A clean restart should clear the stale worker. Active sessions will see “Turn lost during restart” and can be resumed.',
  },
  i2: {
    why:'Two sending identities are configured for atomicmail. The thread has 6 drafts ready to send; picking one here applies to the whole batch.',
  },
  i3: {
    summary:'Last night’s archive opened in a scratch directory and every table passed integrity checks. state.db, its -wal and -shm were copied together, so no checkpoint was lost.',
  },
  i4: {
    error:'HTTP 429 from provider "google" after 2 attempts (retry-after: 60s).\nFallback deepseek-flash timed out after 60s with no first token.',
    routine:'Routine “Weekly cost report” · Mon 14:02 · cron',
  },
  i5: {
    branch:'ui-redesign',
    files:[
      {path:'css/base.css', add:84, del:42},
      {path:'js/ui.js', add:38, del:21},
      {path:'js/shell.js', add:96, del:18},
      {path:'index.html', add:12, del:3},
      {path:'js/views/inbox.js', add:122, del:6},
      {path:'css/inbox.css', add:28, del:2},
      {path:'js/views/history.js', add:24, del:2},
      {path:'css/history.css', add:6, del:0},
      {path:'js/data.js', add:2, del:2},
    ],
  },
};

const ITEMS = H.data.inbox.map(i => Object.assign({}, i));
ITEMS.forEach(it => Object.assign(it, EXTRA[it.id] || {}));

/* the two extra mock rows the dense view adds: secret and handoff (browser hand-over) */
ITEMS.push({
  id:'i6', kind:'secret', thread:'t-gw', agent:'hermes',
  title:'Needs the Telegram bot token', body:'TELEGRAM_BOT_TOKEN is unset in .env', age:'21m', unread:true,
  secretName:'TELEGRAM_BOT_TOKEN', varName:'TELEGRAM_BOT_TOKEN',
  why:'The gateway restarted cleanly but the Telegram channel stays disconnected until the bot token is present. Hermes will not read the value back, and it will not appear in the transcript.',
});
ITEMS.push({
  id:'i7', kind:'handoff', thread:'t-ui', agent:'hermes',
  title:'Paused on a GitHub login page', body:'Needs a signed-in session to read the token list', age:'6m', unread:true,
  page:'https://github.com/settings/tokens', waiting:'3m',
  why:'Hermes opened its own Chromium session to check whether the existing PAT still has repo scope. GitHub asked for a password, so the run is holding here instead of guessing.',
});

const needsYou = () => ITEMS.filter(it => NEEDS.indexOf(it.kind) !== -1 && !H.inboxStage.resolved[it.id]).length;
/* the rail badge reads this */
H.inboxPending = needsYou;

/* ---------- small helpers ---------- */
const firstSentence = s => { const m = String(s || '').match(/^[\s\S]*?[.!?](?=\s|$)/); return (m ? m[0] : String(s || '')).trim(); };

function queue(){
  return ITEMS.filter(it => !H.inboxStage.resolved[it.id])
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

function reviewCount(it){
  const files = it.files || [];
  const adds = files.reduce((n, f) => n + f.add, 0);
  const dels = files.reduce((n, f) => n + f.del, 0);
  return files.length + ' files, +' + adds + ' −' + dels;
}

function subOf(it){
  if (it.kind === 'approval') return 'Runs ' + it.cmd + ' in ' + it.cwd + ', ' + it.risk + ' risk.';
  if (it.kind === 'clarify') return firstSentence(it.why) || it.body || '';
  if (it.kind === 'secret') return firstSentence(it.why) || it.body || '';
  if (it.kind === 'handoff') return 'Paused on ' + it.page.replace(/^https?:\/\//, '') + ' · ' + String(it.body || '').replace(/\.$/, '') + '.';
  if (it.kind === 'done') return firstSentence(it.summary) || it.body || '';
  if (it.kind === 'review') return 'Branch ' + (it.branch || 'main') + ', ' + reviewCount(it) + ', tests not run yet.';
  if (it.kind === 'failed') return firstSentence(it.error) || it.body || '';
  return it.body || '';
}

/* ---------- styles the stage kit does not cover (injected once) ---------- */
const CSS = `
.stage[data-ch="inbox"] .stage-copy{max-width:min(470px,44cqw)}
@container stage (max-width:760px){.stage[data-ch="inbox"] .stage-copy{max-width:100%} .stage .stage-lead.inbox-lead{-webkit-line-clamp:3}}
.stage .stage-lead.inbox-lead{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.stage-actions.inbox-stack{flex-direction:column;align-items:stretch;max-width:min(460px,100%)}
.stage-actions.inbox-stack .btn{justify-content:flex-start;text-align:left}
.inbox-stage-link{align-self:start;background:none;border:0;padding:0;margin-top:2px;color:inherit;font:600 14px/1.4 var(--font);text-decoration:underline;text-underline-offset:4px;text-decoration-thickness:1.5px;opacity:.82;transition:opacity var(--t-mid) var(--ease)}
.inbox-stage-link:hover,.inbox-stage-link:focus-visible{opacity:1}
.inbox-stage-cmd{display:grid;gap:8px;width:100%;max-width:min(560px,100%)}
.inbox-stage-cmd[hidden]{display:none}
.inbox-stage-pre{margin:0;padding:10px 12px;background:color-mix(in srgb,var(--on) 13%,transparent);border:1px solid color-mix(in srgb,var(--on) 24%,transparent);border-radius:var(--r-ctl);font:400 12.5px/1.55 var(--mono);overflow-x:auto;white-space:pre-wrap;word-break:break-word}
.inbox-stage-meta{font-size:12.5px;font-weight:600;opacity:.74}
.inbox-stage-input{height:clamp(46px,3.2vw + 20px,58px);width:min(300px,100%);padding:0 14px;border-radius:var(--r-ctl);border:1px solid color-mix(in srgb,var(--on) 35%,transparent);background:color-mix(in srgb,var(--on) 7%,transparent);color:var(--on);font:500 clamp(15px,.5vw + 12px,17px)/1 var(--font);outline:none;transition:border-color var(--t-mid) var(--ease),box-shadow var(--t-mid) var(--ease)}
.inbox-stage-input::placeholder{color:color-mix(in srgb,var(--on) 55%,transparent)}
.inbox-stage-input:focus{border-color:var(--on);box-shadow:0 0 0 3px color-mix(in srgb,var(--on) 22%,transparent)}
.inbox-stage-input[aria-invalid="true"]{border-color:var(--negative);box-shadow:0 0 0 3px color-mix(in srgb,var(--negative) 22%,transparent)}
.inbox-stage-progress{margin:-4px 0 0;font-size:12.5px;font-weight:600;letter-spacing:.01em;opacity:.72}
.stage .swap{animation:rise var(--t-slow) var(--ease) both}
.stage-copy.is-out{opacity:0;transform:translateY(-10px);transition:opacity var(--t-fast) var(--ease),transform var(--t-fast) var(--ease)}
`;
function ensureCSS(){
  if (document.getElementById('inbox-stage-css')) return;
  document.head.appendChild(h('style#inbox-stage-css', CSS));
}

/* ---------- the stage ---------- */
function build(ctx){
  ensureCSS();

  const toast = msg => (ctx && ctx.toast ? ctx.toast(msg) : H.toast(msg));
  const openThread = id => {
    if (!id) return;
    if (ctx && ctx.openThread) ctx.openThread(id);
    else if (ctx && ctx.go) ctx.go('#/thread/' + id);
  };

  const first = queue()[0];
  const foot = h('p.inbox-stage-progress');
  let el, copy, lead, sub, actions, cmdLink, more, primaryBtn = null, glyphNow = 'inbox', painted = 0;

  function setGlyph(name){
    if (glyphNow === name) return;
    const wrap = el && el.querySelector('.stage-art');
    if (!wrap) return;
    wrap.replaceChildren(H.mosaic({size:33, seed:44, glyph:name}));
    glyphNow = name;
  }

  function swap(){
    [lead, sub, actions].forEach(n => { if (!n) return; n.classList.remove('swap'); void n.offsetWidth; n.classList.add('swap'); });
  }

  function fadeTo(fn){
    copy.classList.add('is-out');
    setTimeout(() => {
      copy.classList.remove('is-out');
      if (!el || !el.isConnected) return;
      fn();
    }, REDUCE ? 0 : 130);
  }

  function resolve(it, msg, o){
    o = o || {};
    H.inboxStage.resolved[it.id] = msg;
    toast(msg);
    H.refreshRail && H.refreshRail();
    if (o.open) { openThread(it.thread); return; }
    fadeTo(paint);
  }

  function addAction(kind, label, onclick){
    const cls = kind === 'primary' ? 'primary' : 'line';
    const b = h('button.btn.big.' + cls, {type:'button', onclick}, label);
    actions.appendChild(b);
    if (kind === 'primary' && !primaryBtn) primaryBtn = b;
    return b;
  }

  /* --- main's body per kind --- */
  function paintItem(it){
    lead.textContent = it.title;
    sub.textContent = subOf(it);
    actions.replaceChildren();
    actions.className = 'stage-actions';
    primaryBtn = null;
    cmdLink.hidden = true;
    more.hidden = true;
    more.replaceChildren();
    setGlyph('inbox');

    if (it.kind === 'approval'){
      addAction('primary', 'Allow once', () => resolve(it, 'Allowed once · ' + it.cmd));
      addAction('line', 'Deny', () => resolve(it, 'Denied · ' + it.title.toLowerCase() + '. Hermes will ask again next turn.'));
      cmdLink.hidden = false;
      cmdLink.setAttribute('aria-expanded', 'false');
      cmdLink.textContent = 'Show the command';
      more.replaceChildren(
        h('pre.inbox-stage-pre', h('code', it.cmd)),
        h('span.inbox-stage-meta', it.cwd + ' · ' + it.risk + ' risk · no allowlist rule matches')
      );
    }

    if (it.kind === 'clarify'){
      actions.className = 'stage-actions inbox-stack';
      (it.options || []).slice(0, 3).forEach(o => addAction(primaryBtn ? 'line' : 'primary', o, () => {
        it.answer = o;
        resolve(it, 'Answered · ' + o);
      }));
    }

    if (it.kind === 'secret'){
      const input = h('input.inbox-stage-input', {
        type:'password', placeholder:'Paste the token', 'aria-label':'Value for ' + it.varName,
        autocomplete:'off', spellcheck:'false',
      });
      actions.appendChild(input);
      const provide = h('button.btn.big.primary', {type:'button', onclick:() => {
        if (!input.value.trim()){
          input.setAttribute('aria-invalid', 'true');
          input.focus();
          toast('Enter a value first, or skip');
          return;
        }
        input.value = '';
        resolve(it, 'Secret provided · ' + it.varName + ' written to .env');
      }}, 'Provide');
      actions.appendChild(provide);
      primaryBtn = provide;
      addAction('line', 'Skip', () => resolve(it, 'Skipped · the Telegram channel stays off'));
      setTimeout(() => { if (el && el.isConnected) input.focus(); }, 60);
    }

    if (it.kind === 'handoff'){
      addAction('primary', 'Take over', () => resolve(it, 'Browser handed over · the tab is yours'));
    }

    if (it.kind === 'done' || it.kind === 'review'){
      addAction('primary', 'Open thread', () => resolve(it, 'Opened · ' + it.title.toLowerCase(), {open:true}));
      addAction('line', 'Archive', () => resolve(it, 'Archived · moved to History'));
    }

    if (it.kind === 'failed'){
      addAction('primary', 'Retry', () => resolve(it, 'Retrying · same model, new turn'));
      addAction('line', 'Open thread', () => resolve(it, 'Opened · ' + it.title.toLowerCase(), {open:true}));
    }

    const total = ITEMS.length;
    const done = total - queue().length;
    foot.textContent = (done + 1) + ' of ' + total + ' waiting';
  }

  function paintClear(){
    lead.textContent = 'All clear.';
    sub.textContent = 'Hermes will tell you when something needs you.';
    actions.replaceChildren();
    actions.className = 'stage-actions';
    primaryBtn = null;
    cmdLink.hidden = true;
    more.hidden = true;
    more.replaceChildren();
    foot.textContent = '';
    setGlyph('clear');
    const last = H.data.threads[0];
    if (last){
      const b = h('button.btn.big.primary', {type:'button', onclick:() => openThread(last.id)}, 'Open the last thread');
      actions.appendChild(b);
      primaryBtn = b;
    }
  }

  function paint(){
    const it = queue()[0];
    if (it) paintItem(it); else paintClear();
    const hc = el.querySelector('.stage-handle .hc');
    if (hc) hc.textContent = String(ITEMS.length);
    if (painted++) swap();
    H.inboxPending = needsYou;
  }

  const def = {
    name:'inbox', ch:'inbox', title:'Inbox', glyph:'inbox', seed:44,
    lead:first ? first.title : 'All clear.',
    sub:first ? subOf(first) : 'Hermes will tell you when something needs you.',
    work:'inbox', handle:'Everything', handleCount:ITEMS.length, foot,
    mount(_el){
      el = _el;
      copy = el.querySelector('.stage-copy');
      lead = el.querySelector('.stage-lead');
      sub = el.querySelector('.stage-sub');
      actions = el.querySelector('.stage-actions');
      if (!copy || !lead || !sub || !actions) return;

      lead.classList.add('inbox-lead');
      copy.setAttribute('aria-live', 'polite');

      cmdLink = h('button.inbox-stage-link', {type:'button', 'aria-expanded':'false', onclick:() => {
        const open = more.hidden;
        more.hidden = !open;
        cmdLink.setAttribute('aria-expanded', String(open));
        cmdLink.textContent = open ? 'Hide the command' : 'Show the command';
      }}, 'Show the command');
      more = h('div.inbox-stage-cmd', {hidden:true});
      copy.insertBefore(cmdLink, foot);
      copy.insertBefore(more, foot);

      el.tabIndex = -1;
      el.addEventListener('keydown', e => {
        if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return;
        const t = e.target;
        if (t && (t.tagName === 'BUTTON' || t.tagName === 'A' || t.tagName === 'TEXTAREA')) return;
        if (document.querySelector('.drawer')) return;
        if (!primaryBtn) return;
        e.preventDefault();
        primaryBtn.click();
      });

      paint();
      setTimeout(() => { if (el.isConnected && !document.querySelector('.drawer')) el.focus({preventScroll:true}); }, 40);
    },
  };

  const st = H.stage(def, ctx);
  return st.el;
}

H.views.inbox = {
  title:'Inbox',
  render(root, ctx){
    root.appendChild(build(ctx || {}));
  },
};
})();

/* js/shell.js */
(function(){
const H = window.H, h = H.h, D = H.data;
const app = document.getElementById('app');
const state = { agent: 'all', closed: {}, paused: false };
const NAV = [['inbox','Inbox','inbox'],['routines','Routines','clock'],['library','Library','book'],['channels','Channels','radio'],['insights','Insights','chart']];
const presenceText = { hermes:'Editing ChatPage.tsx', scout:'Idle · read 2 pages 12m ago', ledger:'Waiting on your approval' };

/* ---------- rail: collapsed icons by default, expands to agents + threads ---------- */
const rail = h('aside.rail', {'aria-label':'Navigation'});
const main = h('main.main');
const topbar = h('div.topbar-m');
app.append(rail, h('div.mainwrap', topbar, main));
let open = false; try { open = localStorage.getItem('hermes-rail') === 'full'; } catch(e){}
const setOpen = v => { open = v; rail.dataset.open = String(v); try { localStorage.setItem('hermes-rail', v?'full':'min'); } catch(e){} renderRail(); };
H.toggleRail = () => setOpen(!open);

function threadGlyph(t){
  const w = h('span.tst');
  if (t.state==='working' || t.state==='thinking') w.append(h('span.dot.live'));
  else if (t.state==='waiting') { w.classList.add('ask'); w.append(H.ic('warn','sm')); }
  else if (t.state==='done') { w.classList.add('ok'); w.append(H.ic('check','sm')); }
  else if (t.state==='failed') { w.classList.add('fail'); w.append(H.ic('x','sm')); }
  else w.append(h('span.dot'));
  return w;
}
function pending(){ return H.inboxPending ? H.inboxPending() : D.inbox.filter(i => ['approval','clarify','secret','handoff'].includes(i.kind) && !i.resolved).length; }
function renderRail(){
  const route = currentRoute();
  const needs = pending();
  rail.dataset.open = String(open); rail.replaceChildren();
  const sel = state.agent==='all' ? D.agents[0] : H.agent(state.agent);
  const item = (href, ic, label, cur, extra) => h('a.nav', {href, title:label, 'aria-label':label, 'aria-current':cur?'page':null, onclick:closeRail}, H.ic(ic), h('span.lbl', label), extra||null);
  const top = h('div.rail-top', h('button.mk', {'aria-label': open?'Collapse sidebar':'Expand sidebar', title:(open?'Collapse':'Expand')+'  [', onclick:()=>setOpen(!open)}, H.mark(24)), h('span.lbl.name','Hermes'), h('span.grow'),
    h('button.btn.ghost.icon.sm.lbl', {'aria-label':'Toggle theme', title:'Toggle theme', onclick:toggleTheme}, H.ic('moon')));
  const who = h('div.rail-who', h('button.avbtn', {'aria-label':'Agents', title:sel.name+' · '+sel.role, onclick:()=>setOpen(true)}, H.avatar(sel, 30)), h('div.lbl.presence', h('b', sel.name), h('span', presenceText[sel.id])));
  const roster = h('div.roster.lbl', {role:'group','aria-label':'Agents'}, h('button.all', {'aria-pressed':String(state.agent==='all'), onclick:()=>{state.agent='all'; renderRail();}}, 'All'),
    ...D.agents.map(a => h('button', {'aria-pressed':String(state.agent===a.id), title:a.name+' · '+a.role, onclick:()=>{state.agent = state.agent===a.id?'all':a.id; renderRail();}}, H.avatar(a, 26))));
  const mk = h('div.rail-acts', h('button.btn.primary.newbtn', {title:'New thread  ⌘N', 'aria-label':'New thread', onclick:()=>newThread()}, H.ic('plus'), h('span.lbl','New thread')),
    h('button.btn.ghost.searchbtn', {title:'Search  ⌘K','aria-label':'Search', onclick:openPalette}, H.ic('search'), h('span.lbl','Search'), h('span.kbd.lbl','⌘K')));
  const nav = h('nav.navlist', {'aria-label':'Spaces'},
    h('button.nav', {title:'Threads', 'aria-label':'Threads', 'aria-current': route.name==='thread'?'page':null, onclick:()=>{ if (!open) setOpen(true); else if (route.name!=='thread') location.hash='#/thread/t-ui'; }}, H.ic('chat'), h('span.lbl','Threads')),
    ...NAV.map(([id,label,ic]) => { const a = item('#/'+id, ic, label, route.name===id); if (id==='inbox' && needs) a.append(h('span.badge', String(needs))); return a; }));
  const tl = h('div.threads');
  D.projects.forEach(p => {
    let ts = D.threads.filter(t => t.project===p.id && (state.agent==='all' || t.agent===state.agent)); if (!ts.length) return;
    ts = ts.slice().sort((a,b)=> (b.pinned?1:0)-(a.pinned?1:0));
    const g = h('div.tgroup'+(state.closed[p.id]?'.closed':''));
    g.append(h('button.gh', {onclick:()=>{state.closed[p.id]=!state.closed[p.id]; g.classList.toggle('closed');}, 'aria-expanded':String(!state.closed[p.id])}, H.ic('chevd','sm c'), h('span.grow', p.name), p.dirty?h('span.faint', {title:p.dirty+' uncommitted files'}, '±'+p.dirty):null));
    const l = h('div.tl'); ts.forEach(t => l.append(h('a.th'+(t.unread?'.unread':''), {href:'#/thread/'+t.id, 'aria-current': route.name==='thread'&&route.args[0]===t.id?'page':null, onclick:closeRail}, threadGlyph(t), h('span.ti', t.title), h('span.age', t.age))));
    g.append(l); tl.append(g);
  });
  const foot = h('div.rail-foot',
    h('button.gw', {title:'Gateway healthy', onclick:()=>{location.hash='#/settings/system';closeRail();}}, h('span.dot.pos'), h('span.lbl.grow', `Gateway healthy · ${D.gateway.sessions} sessions`)),
    item('#/history','archive','History', route.name==='history'), item('#/settings','gear','Settings', route.name==='settings'),
    h('button.nav.fold', {title:open?'Collapse  [':'Expand  [', 'aria-label':open?'Collapse sidebar':'Expand sidebar', onclick:()=>setOpen(!open)}, H.ic(open?'sidebar':'chev'), h('span.lbl','Collapse')));
  rail.append(top, who, roster, mk, nav, tl, foot);
  topbar.replaceChildren(h('button.btn.ghost.icon', {'aria-label':'Open menu', onclick:()=>{ document.body.classList.add('rail-open'); }}, H.ic('sidebar')), h('span.t', route.name==='thread' ? 'Hermes' : (route.title||'Hermes')), h('button.btn.ghost.icon', {'aria-label':'Search', onclick:openPalette}, H.ic('search')));
}
function closeRail(){ document.body.classList.remove('rail-open'); }
document.addEventListener('click', e => { if (document.body.classList.contains('rail-open') && !e.target.closest('.rail') && !e.target.closest('.topbar-m')) closeRail(); });
H.refreshRail = renderRail;

function toggleTheme(){
  const r = document.documentElement; const dark = (r.dataset.theme==='dark') || (!r.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
  r.dataset.theme = dark ? 'light' : 'dark';
  try{ localStorage.setItem('hermes-theme', r.dataset.theme); }catch(e){}
}
try{ const t = localStorage.getItem('hermes-theme'); if (t) document.documentElement.dataset.theme = t; }catch(e){}

function newThread(){
  const id = 't-new'+Date.now().toString(36);
  const t = {id, project:'maint', agent: state.agent==='all'?'hermes':state.agent, title:'New thread', state:'idle', age:'now', model:'claude-sonnet-5-5', mode:'local', branch:'main', adds:0, dels:0, fresh:true};
  D.threads.unshift(t); location.hash = '#/thread/'+id; closeRail();
}
H.newThread = newThread;

/* ---------- router: fast fade out, slow rise in ---------- */
const TITLES = {inbox:'Inbox',routines:'Routines',library:'Library',channels:'Channels',insights:'Insights',settings:'Settings',history:'History'};
function currentRoute(){
  const parts = (location.hash.replace(/^#\/?/,'') || 'thread/t-ui').split('/').filter(Boolean);
  const name = parts[0]; const args = parts.slice(1);
  const t = name==='thread' ? H.thread(args[0]) : null;
  return {name, args, title: name==='thread' ? (t?t.title:'Thread') : (TITLES[name]||'Hermes')};
}
let cur = {key:'', api:null};
function route(){
  const r = currentRoute();
  const key = r.name+'/'+(r.name==='thread'?r.args[0]:'');
  const v = H.views[r.name];
  if (!v) { location.hash = '#/thread/t-ui'; return; }
  renderRail();
  if (key === cur.key && cur.api && cur.api.update) { cur.api.update(r.args); return; }
  cur.key = key;
  const old = main.querySelector('.view:not(.leave)'); if (old) { old.classList.add('leave'); setTimeout(() => old.remove(), 200); }
  const root = h('div.view.enter'); main.append(root);
  cur.api = v.render(root, ctx(r)) || null;
  document.title = (r.title ? r.title+' · ' : '') + 'Hermes';
}
function ctx(r){ return { route:r.args, go:(hash)=>{ location.hash = hash; }, toast:H.toast, openThread:(id)=>{ location.hash='#/thread/'+id; } }; }
window.addEventListener('hashchange', route);

/* ---------- command palette ---------- */
function openPalette(){
  const input = h('input', {placeholder:'Search threads, spaces, commands…', 'aria-label':'Search', autofocus:true});
  const res = h('div.res', {role:'listbox'});
  const foot = h('div.foot', h('span','↑↓ to move'), h('span','↵ to open'), h('span','esc to close'));
  const box = h('div.pal', input, res, foot);
  const m = H.modal(box, {width:620});
  const items = () => {
    const q = input.value.trim().toLowerCase();
    const all = [];
    D.threads.forEach(t => all.push({g:'Threads', t:t.title, s:H.project(t.project).name+' · '+H.agent(t.agent).name, ic:'chat', run:()=>location.hash='#/thread/'+t.id}));
    NAV.concat([['history','History','archive'],['settings','Settings','gear']]).forEach(([id,l,ic]) => all.push({g:'Go to', t:l, ic, run:()=>location.hash='#/'+id}));
    [['Models','settings/models','cpu'],['Keys & secrets','settings/keys','key'],['Security & approvals','settings/security','shield'],['Profiles','settings/profiles','users'],['Health check (doctor)','settings/system','heart'],['Raw config.yaml','settings/advanced','file'],['Skills','library/skills','sparkle'],['Memory & SOUL.md','library/memory','brain'],['MCP servers','library/tools','plug'],['Cron schedules','routines/schedules','clock'],['Webhooks','routines/triggers','webhook'],['Task board','routines/board','board'],['Pairing codes','channels/people','users'],['Logs','insights/logs','terminal']].forEach(([l,p,ic]) => all.push({g:'Go to', t:l, s:'#/'+p, ic, run:()=>location.hash='#/'+p}));
    [['New thread','plus',newThread],['Toggle light / dark','moon',toggleTheme],['Pause all agents','pause',()=>H.toast('Paused: cron and new turns stopped')],['Open raw terminal (TUI)','terminal',()=>{ location.hash='#/thread/t-ui'; setTimeout(()=>H.openTerminal&&H.openTerminal(),60); }]].forEach(([l,ic,run]) => all.push({g:'Actions', t:l, ic, run}));
    D.slash.forEach(([c,d]) => all.push({g:'Slash commands', t:c, s:d, ic:'slash', run:()=>{ H.toast(c+' · runs inside a thread'); }}));
    return all.filter(x => !q || (x.t+' '+(x.s||'')).toLowerCase().includes(q)).slice(0, 40);
  };
  let list = [], sel = 0;
  const draw = () => {
    list = items(); sel = Math.min(sel, Math.max(0,list.length-1)); res.replaceChildren();
    if (!list.length) res.append(h('div.empty', 'Nothing matches “'+input.value+'”'));
    let g = '';
    list.forEach((x,i) => { if (x.g!==g) { g = x.g; res.append(h('div.grp', g)); }
      const it = h('div.it', {role:'option','aria-selected':String(i===sel), onclick:()=>{ m.close(); x.run(); }, onmousemove:()=>{ if (sel!==i){ sel=i; res.querySelectorAll('.it').forEach((n,j)=>n.setAttribute('aria-selected',String(j===i))); } }}, H.ic(x.ic), h('div.grow.ellip', x.t, x.s?h('span.s', ' · '+x.s):null));
      res.append(it); });
  };
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', e => {
    if (e.key==='ArrowDown'){ sel = Math.min(list.length-1, sel+1); draw(); res.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'}); e.preventDefault(); }
    else if (e.key==='ArrowUp'){ sel = Math.max(0, sel-1); draw(); res.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'}); e.preventDefault(); }
    else if (e.key==='Enter'){ const x = list[sel]; if (x){ m.close(); x.run(); } }
  });
  draw(); setTimeout(()=>input.focus(), 20);
}
H.openPalette = openPalette;
document.addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  if (mod && e.key.toLowerCase()==='k'){ e.preventDefault(); openPalette(); }
  else if (mod && e.key.toLowerCase()==='n' && !e.shiftKey){ e.preventDefault(); newThread(); }
  else if (e.key==='[' && !mod && !/^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName||'') && !(e.target||{}).isContentEditable){ H.toggleRail(); }
});

if (!location.hash) location.hash = '#/thread/t-ui';
route();
})();
