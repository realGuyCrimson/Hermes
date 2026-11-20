/* Details drawer: Changes · Plan · Files · Shell · Browser · Context · Terminal. Also the full-screen Terminal (TUI) view. */
(function(){
const H = window.H, h = H.h;
const LIVE = H.live;
const TABS = [['changes','Changes'],['plan','Plan'],['files','Files'],['shell','Shell'],['browser','Browser'],['context','Context'],['terminal','Terminal']];
function liveTabs(){ return TABS.filter(([id]) => id!=='changes' && id!=='browser'); }

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

/* ---------- live inspector (H.live): real data or an honest empty state ---------- */
let xtermP = null;
function loadXterm(){
  if (window.Terminal && window.FitAddon) return Promise.resolve({Terminal:window.Terminal, FitAddon:window.FitAddon});
  if (xtermP) return xtermP;
  const base = (H.api.base || '') + '/assets/studio/vendor/xterm/';
  const loadScript = (src, test) => new Promise((ok, bad) => {
    const s = document.createElement('script'); s.src = src;
    s.onload = () => test() ? ok() : bad(new Error('missing global from ' + src));
    s.onerror = () => bad(new Error('could not load ' + src));
    document.head.append(s);
  });
  if (!document.querySelector('link[data-xterm-css]')) {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'xterm.css'; css.dataset.xtermCss = '1'; document.head.append(css);
  }
  xtermP = loadScript(base + 'xterm.js', () => !!window.Terminal)
    .then(() => loadScript(base + 'addon-fit.js', () => !!window.FitAddon))
    .then(() => ({Terminal: window.Terminal, FitAddon: window.FitAddon}))
    .catch(e => { xtermP = null; throw e; });
  return xtermP;
}
H.loadXterm = loadXterm;

/* The real TUI, exactly like web/src/pages/ChatPage.tsx: one /api/pty socket per
   tab, `channel` names the PTY child, `resume` asks it to continue this session,
   resize rides in-band as \x1b[RESIZE:cols;rows]. */
function ptyTerminal(t, back){
  const status = h('span.pill', 'Connecting…');
  const host = h('div.pty-host');
  const root = h('div.tui', h('div.tui-bar', h('span.muted','Terminal'), h('span.pill','real TUI'), h('span.grow'), status, back ? h('button.btn.sm', {onclick:back}, H.ic('chat','sm'), 'Back to chat') : null), host);
  let ws = null, term = null, ro = null;
  (async () => {
    const X = await loadXterm();
    term = new X.Terminal({convertEol:true, cursorBlink:true, fontFamily:'Geist Mono, ui-monospace, monospace', fontSize:12.5, scrollback:4000, theme:{background:'#060338', foreground:'#f4f1e6'}});
    const fit = new X.FitAddon.FitAddon(); term.loadAddon(fit);
    term.open(host); setTimeout(() => { try { fit.fit(); } catch (e) {} }, 0);
    const sid = t && t.id && t.id !== 'new' ? t.id : '';
    const channel = 'studio-' + Math.random().toString(36).slice(2);
    const params = {channel, attach: channel};
    if (sid) params.resume = sid;
    const url = await H.api.wsUrl('/api/pty', params);
    ws = new WebSocket(url); ws.binaryType = 'arraybuffer';
    const dec = new TextDecoder(); const enc = new TextEncoder();
    const resize = () => { try { fit.fit(); if (ws && ws.readyState === WebSocket.OPEN) ws.send('\x1b[RESIZE:' + term.cols + ';' + term.rows + ']'); } catch (e) {} };
    ws.onopen = () => { status.replaceChildren(h('span.dot.live'), 'Live'); resize(); };
    ws.onmessage = ev => { try { term.write(typeof ev.data === 'string' ? ev.data : dec.decode(ev.data, {stream:true})); } catch (e) {} };
    ws.onclose = () => { status.replaceChildren(h('span.dot.neg'), 'Disconnected'); term.write('\r\n\x1b[2m[socket closed · reopen the tab to reconnect]\x1b[0m\r\n'); };
    ws.onerror = () => { status.replaceChildren(h('span.dot.neg'), 'Connection error'); };
    term.onData(d => { if (ws && ws.readyState === WebSocket.OPEN) ws.send(d); });
    ro = new ResizeObserver(resize); ro.observe(host);
    const tick = setInterval(() => {
      if (root.isConnected) return;
      clearInterval(tick);
      try { ws && ws.close(); } catch (e) {}
      try { ro && ro.disconnect(); } catch (e) {}
      try { term && term.dispose(); } catch (e) {}
    }, 800);
  })().catch(e => { host.append(h('div.note', 'Couldn\'t start the terminal: ' + e.message)); status.replaceChildren(h('span.dot.neg'), 'Failed'); });
  return root;
}

function livePlan(){
  const w = h('div.ib');
  const todos = (H.liveThread && H.liveThread.todos) || [];
  w.append(h('div.isec', 'Plan'));
  if (!todos.length) { w.append(h('p.muted', 'Hermes has not published a plan for this thread. It appears here when the agent updates its todos.')); return w; }
  todos.forEach(x => {
    const st = x.status === 'completed' ? 'done' : (x.status === 'in_progress' || x.status === 'active') ? 'active' : 'todo';
    w.append(h('div.pi.' + st, h('span.pbox', st === 'done' ? H.ic('check','sm') : st === 'active' ? h('span.dot.live') : null), h('span', x.content || x.text || x.title || '')));
  });
  return w;
}

function liveFiles(t){
  const w = h('div.ib');
  const start = (H.liveThread && H.liveThread.cwd) || '';
  const bar = h('div.irow');
  const q = h('input.input', {placeholder:'Filter…', 'aria-label':'Filter files'});
  const list = h('div.ftree');
  const crumb = h('span.grow.mono', start || 'Working directory unknown');
  let path = start, rows = [];
  bar.append(crumb);
  w.append(bar, list, h('div.irow.muted', h('span', 'Read-only · '), h('span.mono', '/')));
  const draw = () => {
    const f = q.value.toLowerCase();
    list.replaceChildren(...rows.filter(r => !f || r.name.toLowerCase().includes(f)).map(r => h('div.fr', {onclick:()=>{ if (r.is_directory){ open(r.path); } else preview(r.path); }},
      H.ic(r.is_directory ? 'folder' : 'file','sm'), h('span.grow', r.name), r.size != null ? h('span.muted.num', H.fmt.n(r.size) + ' B') : null)));
  };
  async function open(p){
    path = p; crumb.textContent = p; list.replaceChildren(h('div.fr.muted','Loading…'));
    try {
      if (p !== start) list.append(h('div.fr', {onclick:()=>open(p.split('/').slice(0,-1).join('/') || '/')}, H.ic('chev','sm'), h('span.grow','..')));
      const res = await H.api.get('/api/files?path=' + encodeURIComponent(p));
      rows = (res.entries || []).slice().sort((a,b) => (b.is_directory?1:0)-(a.is_directory?1:0) || a.name.localeCompare(b.name));
      draw();
    } catch (e) { list.replaceChildren(h('div.fr.muted', 'Couldn\'t list files: ' + e.message)); }
  }
  async function preview(p){
    const box = h('pre.out'); box.textContent = 'Loading…';
    list.append(box);
    try {
      const res = await H.api.get('/api/files/read?path=' + encodeURIComponent(p));
      const m = /^data:([^;,]*)(;base64)?,(.*)$/.exec(res.data_url || '');
      if (!m) throw new Error('no content');
      const text = m[2] ? decodeURIComponent(escape(atob(m[3]))) : decodeURIComponent(m[3]);
      box.textContent = text.slice(0, 40000) + (text.length > 40000 ? '\n… truncated' : '');
    } catch (e) { box.textContent = 'Couldn\'t read file: ' + e.message; }
  }
  q.oninput = draw;
  if (!start) { list.append(h('div.fr.muted', 'The session reports no working directory.')); return w; }
  open(start);
  return w;
}

function liveContext(t, S){
  const w = h('div.ib');
  const used = S.ctxUsed || 0, max = S.ctxMax || 0;
  const pct = max ? (used / max * 100) : 0;
  if (!used) {
    w.append(h('p.muted', 'Hermes has not reported context usage for this thread yet. It appears after the first turn.'));
    return w;
  }
  w.append(h('div.kpi', h('div.v.num', used + 'k'), h('div.l', (max ? 'of ' + max + 'k context · ' : 'tokens · ') + (max ? pct.toFixed(1) + '% used' : 'reported'))),
    h('div.stack', h('span', {style:{flex:Math.max(1,pct), background:'var(--live)'}}), h('span', {style:{flex:Math.max(1,100-pct), background:'var(--control)'}})),
    h('div.irow', h('span.sw', {style:{background:'var(--live)'}}), h('span.grow','Conversation + prompt'), h('span.muted.num', used + 'k')),
    h('div.irow', h('button.btn.sm', {onclick:()=>{ if (!t.id) return H.toast('No session yet'); H.rpc.call('session.compress', {session_id:t.id}).then(()=>H.toast('Compression requested')).catch(e=>H.toast('Couldn\'t compress: ' + e.message)); }}, 'Compress now'), h('span.grow')));
  if (S.tokens) w.append(h('div.irow', h('span.grow','Total tokens this session'), h('span.muted.num', H.fmt.n(S.tokens) + ' tokens')));
  if (S.cost != null) w.append(h('div.irow', h('span.grow','Cost'), h('span.muted.num', H.fmt.usd(S.cost))));
  return w;
}

function liveShell(go){
  const w = h('div.ib');
  w.append(h('div.isec','Shell'), h('p.muted','A shell for this thread runs inside the Terminal tab as the real TUI (same session, same working directory). Open it to run commands.'), h('div.irow', h('button.btn.primary.sm', {onclick:()=>go('terminal')}, H.ic('terminal','sm'), 'Open Terminal')));
  return w;
}

/* The Details drawer: the whole inspector, tabs included, in the kit's drawer. */
H.details = function(t, S, o){
  o = o || {};
  const tabsFor = () => LIVE ? liveTabs() : TABS;
  let cur = o.tab || (LIVE ? 'context' : 'changes');
  if (LIVE && cur === 'changes') cur = 'context';
  const dr = H.drawer({title:'Details', width:'min(560px,100vw)', onClose:()=>{ o.onClose && o.onClose(); }});
  const tabs = h('div.tabs.dtabs', {role:'tablist', 'aria-label':'Thread details'});
  const pane = h('div.dpane');
  dr.body.append(h('div.dwrap', tabs, pane));
  const bodies = LIVE ? {
    plan:()=>livePlan(), files:()=>liveFiles(t), shell:()=>liveShell(show),
    context:()=>liveContext(t, S), terminal:()=>ptyTerminal(t, ()=>dr.close()),
  } : {
    changes:()=>changes(t), plan:()=>plan(), files:()=>files(t), shell:()=>shell(t, show),
    browser:()=>browser(), context:()=>context(t, S), terminal:()=>H.terminalFull(t, ()=>dr.close()),
  };
  function drawTabs(){ tabs.replaceChildren(...tabsFor().map(([id,l]) => h('button', {role:'tab','aria-selected':String(cur===id), onclick:()=>show(id)}, l))); }
  function show(id){
    const list = tabsFor(); if (!list.some(([x]) => x === id)) id = list[0][0];
    cur = id; drawTabs();
    pane.className = 'dpane'+(id==='terminal'?' term':'');
    pane.scrollTop = 0; pane.replaceChildren(bodies[id] ? bodies[id]() : h('div'));
  }
  drawTabs(); show(cur);
  return {el:dr.el, close:dr.close, show, tab:()=>cur};
};

/* Full terminal (TUI): the escape hatch that keeps 100% of the CLI available */
H.terminalFull = function(t, back){
  if (LIVE) return ptyTerminal(t, back);
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
