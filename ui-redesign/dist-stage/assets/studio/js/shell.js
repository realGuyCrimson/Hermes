(function(){
const H = window.H, h = H.h, D = H.data;
const LIVE = H.live;
const app = document.getElementById('app');
const state = { agent: 'all', closed: {}, paused: false };
const NAV = [['inbox','Inbox','inbox'],['routines','Routines','clock'],['library','Library','book'],['channels','Channels','radio'],['insights','Insights','chart']];
const presenceText = { hermes:'Editing ChatPage.tsx', scout:'Idle · read 2 pages 12m ago', ledger:'Waiting on your approval' };
/* live presence: what this agent is doing right now, from its active session (never invented copy) */
function presenceOf(a){
  if (!a) return '';
  if (!LIVE) return presenceText[a.id] || '';
  const busy = D.threads.find(t => t.agent === a.id && (t.state === 'working' || t.state === 'thinking'));
  if (busy) return 'Working · ' + busy.title;
  const mine = D.threads.filter(t => t.agent === a.id).length;
  return mine ? 'Idle · ' + mine + (mine === 1 ? ' thread' : ' threads') : 'Idle · no threads yet';
}
/* live gateway pill: real gateway state and the real active-session count */
function gatewayPill(){
  const g = D.gateway || {};
  if (!LIVE) return {text:'Gateway healthy · ' + g.sessions + ' sessions', tone:'pos', title:'Gateway healthy'};
  if (g.state === 'healthy') {
    const n = Number(g.sessions || 0);
    return {text:'Gateway healthy · ' + n + (n === 1 ? ' session' : ' sessions'), tone:'pos', title:'Gateway healthy' + (g.pid ? ' · pid ' + g.pid : '')};
  }
  if (g.state === 'stopped') return {text:'Gateway not running', tone:'neg', title:'The gateway process is not running'};
  return {text:'Hermes unreachable', tone:'warn', title:'Could not reach the Hermes API'};
}

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
  const sel = (state.agent==='all' ? D.agents[0] : H.agent(state.agent)) || D.agents[0] || {id:'hermes', name:'Hermes', role:'Hermes', hue:212, kind:0, state:'idle'};
  const item = (href, ic, label, cur, extra) => h('a.nav', {href, title:label, 'aria-label':label, 'aria-current':cur?'page':null, onclick:closeRail}, H.ic(ic), h('span.lbl', label), extra||null);
  const top = h('div.rail-top', h('button.mk', {'aria-label': open?'Collapse sidebar':'Expand sidebar', title:(open?'Collapse':'Expand')+'  [', onclick:()=>setOpen(!open)}, H.mark(24)), h('span.lbl.name','Hermes'), h('span.grow'),
    h('button.btn.ghost.icon.sm.lbl', {'aria-label':'Toggle theme', title:'Toggle theme', onclick:toggleTheme}, H.ic('moon')));
  const who = h('div.rail-who', h('button.avbtn', {'aria-label':'Agents', title:sel.name+' · '+sel.role, onclick:()=>setOpen(true)}, H.avatar(sel, 30)), h('div.lbl.presence', h('b', sel.name), h('span', presenceOf(sel))));
  const roster = !D.agents.length ? null : h('div.roster.lbl', {role:'group','aria-label':'Agents'}, h('button.all', {'aria-pressed':String(state.agent==='all'), onclick:()=>{state.agent='all'; renderRail();}}, 'All'),
    ...D.agents.map(a => h('button', {'aria-pressed':String(state.agent===a.id), title:a.name+' · '+a.role, onclick:()=>{state.agent = state.agent===a.id?'all':a.id; renderRail();}}, H.avatar(a, 26))));
  const mk = h('div.rail-acts', h('button.btn.primary.newbtn', {title:'New thread  ⌘N', 'aria-label':'New thread', onclick:()=>newThread()}, H.ic('plus'), h('span.lbl','New thread')),
    h('button.btn.ghost.searchbtn', {title:'Search  ⌘K','aria-label':'Search', onclick:openPalette}, H.ic('search'), h('span.lbl','Search'), h('span.kbd.lbl','⌘K')));
  const nav = h('nav.navlist', {'aria-label':'Spaces'},
    h('button.nav', {title:'Threads', 'aria-label':'Threads', 'aria-current': route.name==='thread'?'page':null, onclick:()=>{ if (!open) setOpen(true); else if (route.name!=='thread') location.hash = LIVE && H.homeHash ? H.homeHash() : '#/thread/t-ui'; }}, H.ic('chat'), h('span.lbl','Threads')),
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
  /* live: honest empty state instead of an empty rail */
  if (LIVE && !D.threads.length) tl.append(h('div.empty', 'No threads yet', h('div', {style:{opacity:'.7', marginTop:'4px'}}, 'Start one with New thread.')));
  const gw = gatewayPill();
  const foot = h('div.rail-foot',
    h('button.gw', {title:gw.title, onclick:()=>{location.hash='#/settings/system';closeRail();}}, h('span.dot.'+gw.tone), h('span.lbl.grow', gw.text)),
    item('#/history','archive','History', route.name==='history'), item('#/settings','gear','Settings', route.name==='settings'));
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
  /* live: the chat module creates the session on the first send, so just open a fresh thread */
  if (LIVE) { location.hash = '#/thread/new'; closeRail(); return; }
  const id = 't-new'+Date.now().toString(36);
  const t = {id, project:'maint', agent: state.agent==='all'?'hermes':state.agent, title:'New thread', state:'idle', age:'now', model:'claude-sonnet-5-5', mode:'local', branch:'main', adds:0, dels:0, fresh:true};
  D.threads.unshift(t); location.hash = '#/thread/'+id; closeRail();
}
H.newThread = newThread;

/* ---------- router: fast fade out, slow rise in ---------- */
const TITLES = {inbox:'Inbox',routines:'Routines',library:'Library',channels:'Channels',insights:'Insights',settings:'Settings',history:'History'};
function currentRoute(){
  const home = LIVE && H.homeHash ? H.homeHash() : '#/thread/t-ui';
  const parts = (location.hash.replace(/^#\/?/,'') || home.replace(/^#\//,'')).split('/').filter(Boolean);
  const name = parts[0]; const args = parts.slice(1);
  const t = name==='thread' ? H.thread(args[0]) : null;
  return {name, args, title: name==='thread' ? (t?t.title:'Thread') : (TITLES[name]||'Hermes')};
}
let cur = {key:'', api:null};
function route(){
  const r = currentRoute();
  const key = r.name+'/'+(r.name==='thread'?r.args[0]:'');
  const v = H.views[r.name];
  if (!v) { location.hash = LIVE && H.homeHash ? H.homeHash() : '#/thread/t-ui'; return; }
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
    const match = v => !q || String(v || '').toLowerCase().includes(q);
    const all = [];
    /* live can have dozens of threads: keep the most recent 12 so agents and Go-to stay reachable */
    D.threads.filter(t => match(t.title)).slice(0, 12).forEach(t => { const p = H.project(t.project), a = H.agent(t.agent); all.push({g:'Threads', t:t.title, s:[p&&p.name, a&&a.name].filter(Boolean).join(' · '), ic:'chat', run:()=>location.hash='#/thread/'+t.id}); });
    if (LIVE) D.agents.forEach(a => all.push({g:'Agents', t:a.name, s:a.role + (a.state==='working' ? ' · working' : ''), ic:'users', run:()=>{
      state.agent = a.id;
      const t = D.threads.find(x => x.agent === a.id);
      renderRail();
      location.hash = t ? '#/thread/'+t.id : (LIVE && H.homeHash ? H.homeHash() : '#/thread/t-ui');
    }}));
    NAV.concat([['history','History','archive'],['settings','Settings','gear']]).forEach(([id,l,ic]) => all.push({g:'Go to', t:l, ic, run:()=>location.hash='#/'+id}));
    [['Models','settings/models','cpu'],['Keys & secrets','settings/keys','key'],['Security & approvals','settings/security','shield'],['Profiles','settings/profiles','users'],['Health check (doctor)','settings/system','heart'],['Raw config.yaml','settings/advanced','file'],['Skills','library/skills','sparkle'],['Memory & SOUL.md','library/memory','brain'],['MCP servers','library/tools','plug'],['Cron schedules','routines/schedules','clock'],['Webhooks','routines/triggers','webhook'],['Task board','routines/board','board'],['Pairing codes','channels/people','users'],['Logs','insights/logs','terminal']].forEach(([l,p,ic]) => all.push({g:'Go to', t:l, s:'#/'+p, ic, run:()=>location.hash='#/'+p}));
    const actions = [['New thread','plus',newThread],['Toggle light / dark','moon',toggleTheme]];
    /* no global pause endpoint exists in the REST API, so it is sample-only */
    if (!LIVE) actions.push(['Pause all agents','pause',()=>H.toast('Paused: cron and new turns stopped')]);
    actions.push(['Open raw terminal (TUI)','terminal',()=>{ location.hash = LIVE && H.homeHash ? H.homeHash() : '#/thread/t-ui'; setTimeout(()=>H.openTerminal&&H.openTerminal(),60); }]);
    actions.forEach(([l,ic,run]) => all.push({g:'Actions', t:l, ic, run}));
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

/* live mode: H.boot() (js/live.js) hydrates agents, threads and gateway status from the real API before the first route */
Promise.resolve(H.boot ? H.boot() : null).catch(e => { console.warn('boot failed', e); H.toast && H.toast('Could not load from Hermes: ' + (e && e.message || e)); }).then(() => {
  /* live: land on the most recent real thread (or a fresh one); sample keeps its showcase thread */
  if (!location.hash) location.hash = LIVE && H.homeHash ? H.homeHash() : '#/thread/t-ui';
  route();
});
})();
