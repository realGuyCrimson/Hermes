/* Details drawer: Changes · Plan · Files · Shell · Browser · Context · Terminal. Also the full-screen Terminal (TUI) view. */
(function(){
const H = window.H, h = H.h;
const LIVE = H.live;
const TABS = [['changes','Changes'],['plan','Plan'],['files','Files'],['shell','Shell'],['browser','Browser'],['context','Context'],['terminal','Terminal']];
/* Live mode has no browser pane (Hermes has none); Changes is real now. */
function liveTabs(){ return TABS.filter(([id]) => id!=='browser'); }

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

/* ---------- live Changes tab: real git (web_git routers) + session checkpoints ----------
   Shapes reused from the Desktop review pane (apps/desktop/src/app/right-sidebar/review):
   /api/git/status -> {branch,defaultBranch,detached,ahead,behind,changed,added,removed,files[]}
   /api/git/review/list -> {files:[{path,added,removed,status,staged}],base}
   /api/git/review/diff -> {diff}; stage/unstage/revert/commit/push -> {ok} (400 on failure).
   Checkpoints ride the session gateway: rollback.list / rollback.diff / rollback.restore. */
const enc = v => encodeURIComponent(v || '');

async function liveCwd(t){
  if (H.liveThread && H.liveThread.cwd) return H.liveThread.cwd;
  const id = t && t.id && t.id !== 'new' ? t.id : '';
  if (!id) return '';
  try { const s = await H.api.get('/api/sessions/' + enc(id)); return (s && s.cwd) || ''; } catch (e) { return ''; }
}

function diffClass(line){
  if (line.startsWith('@@') || line.startsWith('+++') || line.startsWith('---')) return 'h';
  if (/^(diff --git|index |new file|deleted file|old mode|new mode|similarity|dissimilarity|rename |copy |\\ )/.test(line)) return 'm';
  if (line.startsWith('+')) return 'a';
  if (line.startsWith('-')) return 'd';
  return 'c';
}
function liveDiff(text){
  const src = String(text == null ? '' : text);
  if (!src.trim()) return null;
  const lines = src.replace(/\n+$/, '').split('\n');
  return h('pre.diff', ...lines.map(l => h('span.dl.' + diffClass(l), l + '\n')));
}
function fmtWhen(ts){
  const d = new Date(ts);
  if (!ts || isNaN(d.getTime())) return String(ts || '');
  return d.toLocaleString(undefined, {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'});
}
function confirmAsk(title, body, label, run){
  const box = h('div.chg-confirm', h('h3', title), h('p.muted', body));
  const row = h('div.chg-confirm-row');
  const m = H.modal(box, {width:420});
  const cancel = h('button.btn.sm', {onclick:()=>m.close()}, 'Cancel');
  const go = h('button.btn.sm.danger', {onclick:()=>{ m.close(); run(); }}, label);
  row.append(h('span.grow'), cancel, go); box.append(row);
  return m;
}

function liveChanges(t){
  const w = h('div.ib.chg');
  const top = h('div.chg-top');
  const scopeRow = h('div.chg-scope');
  const list = h('div.chg-list');
  const actBox = h('div.chg-actbox');
  const cpBox = h('div.chg-cps');
  w.append(top, scopeRow, list, actBox, cpBox);
  top.hidden = true; scopeRow.hidden = true;

  const sid = t && t.id && t.id !== 'new' ? t.id : '';
  let cwd = '', scope = 'uncommitted', status = null, rows = [], base = null, upstream = false;
  let msg = '', busy = false, seq = 0;

  const note = (box, text, retry) => box.replaceChildren(h('div.chg-note', h('span', text), retry ? h('button.btn.sm', {onclick:retry}, 'Retry') : null));

  /* ---- git ---- */
  async function load(){
    const my = ++seq;
    top.hidden = true; scopeRow.hidden = true;
    actBox.replaceChildren();
    note(list, 'Loading this folder…');
    try {
      if (!cwd) cwd = await liveCwd(t);
      if (my !== seq) return;
      if (!cwd) { notRepo('This thread reports no working directory, so there is nothing to review or commit.'); return; }
      status = await H.api.get('/api/git/status?path=' + enc(cwd));
      if (my !== seq) return;
      if (!status) { notRepo('This folder is not a git repository, so there are no changes to review or commit.'); return; }
      const res = await H.api.get('/api/git/review/list?path=' + enc(cwd) + '&scope=' + enc(scope));
      if (my !== seq) return;
      rows = (res && res.files) || []; base = (res && res.base) || null;
      upstream = status.ahead > 0 || status.behind > 0;
      if (scope === 'uncommitted' && status.branch) {
        try {
          const br = await H.api.get('/api/git/branches?path=' + enc(cwd));
          /* No REST field says "upstream": a remote-tracking ref for this branch is the
             closest signal the status endpoints give (plus ahead/behind above). */
          const b = String(status.branch);
          if ((br && br.branches || []).some(r => r && r.isRemote && String(r.name || '').endsWith('/' + b))) upstream = true;
        } catch (e) { /* upstream is a hint only: fall back to ahead/behind */ }
        if (my !== seq) return;
      }
      drawGit();
    } catch (e) {
      if (my !== seq) return;
      top.hidden = true; scopeRow.hidden = true; actBox.replaceChildren();
      note(list, 'Couldn’t load changes: ' + e.message, load);
    }
  }

  function notRepo(text){
    top.replaceChildren();
    top.append(h('div.chg-sum', h('span.pill.warn', 'Not a git repository')));
    top.hidden = false;
    scopeRow.hidden = true; actBox.replaceChildren();
    list.replaceChildren(h('div.chg-empty', h('p', text), h('p.muted', cwd ? 'Checkpoints below still work: Hermes snapshots the folder itself, not git.' : '')));
    loadCheckpoints();
  }

  function drawGit(){
    top.replaceChildren();
    const tot = rows.reduce((a, f) => [a[0] + (f.added || 0), a[1] + (f.removed || 0)], [0, 0]);
    const staged = rows.filter(f => f.staged).length;
    const branchName = status.branch || (status.detached ? 'detached HEAD' : 'no branch');

    const bar = h('div.chg-bar',
      h('span.pill' + (status.detached ? '.warn' : ''), H.ic('branch', 'sm'), branchName),
      status.ahead ? h('span.pill.pos', '↑' + status.ahead) : null,
      status.behind ? h('span.pill.warn', '↓' + status.behind) : null,
      status.conflicted ? h('span.pill.neg', status.conflicted + ' conflicted') : null,
      h('span.grow'),
      h('button.btn.sm.ghost', {title:'Reload status and diffs', onclick:()=>load()}, H.ic('retry', 'sm'), 'Refresh'));
    const sum = h('div.chg-sum',
      h('b', rows.length + (rows.length === 1 ? ' file' : ' files')),
      h('span.add.num', '+' + tot[0]), h('span.del.num', '−' + tot[1]),
      staged ? h('span.muted', staged + ' staged') : null,
      scope === 'branch' && base ? h('span.muted', 'vs ' + base) : null,
      h('span.grow'),
      scope === 'uncommitted' && rows.length ? h('button.btn.sm', {onclick:revertAll}, 'Discard all') : null);
    top.append(bar, sum);
    top.hidden = false;

    scopeRow.replaceChildren(
      H.seg([{id:'uncommitted', label:'Uncommitted'}, {id:'branch', label:'vs ' + (status.defaultBranch || 'trunk')}], scope,
        id => { if (id === scope) return; scope = id; load(); }),
      h('span.grow'),
      scope === 'branch' ? h('span.muted.chg-hint', 'Committed work, read-only') : h('span.muted.chg-hint', cwd));
    scopeRow.hidden = false;

    list.replaceChildren();
    if (!rows.length) {
      list.append(h('div.chg-empty', h('p', scope === 'branch' ? 'No commits ahead of the trunk yet.' : 'No uncommitted changes.'),
        h('p.muted', scope === 'branch' ? 'Committed work on this branch appears here.' : 'Hermes has not touched files since the last commit.')));
    } else {
      rows.forEach(f => list.append(fileRow(f)));
    }
    drawActions(staged);
    loadCheckpoints();
  }

  function fileRow(f){
    const row = h('div.drow.chg-frow');
    const parts = String(f.path || '').split('/');
    const name = parts.pop();
    const chip = h('span.chg-st' + (f.status === '?' ? '.warn' : f.status === 'U' ? '.neg' : f.staged ? '.pos' : ''),
      {title: f.status === '?' ? 'untracked' : f.status === 'U' ? 'conflicted' : f.staged ? 'staged' : 'unstaged'}, f.status || 'M');
    const main = h('button.chg-fmain', {'aria-expanded':'false', title:f.path},
      H.ic('chev', 'sm c'),
      h('span.fn', name, parts.length ? h('span.muted', ' ' + parts.join('/')) : null),
      chip,
      h('span.add.num', '+' + (f.added || 0)),
      f.removed ? h('span.del.num', '−' + f.removed) : null);
    const body = h('div.dfile.chg-dfile'); body.hidden = true;
    const q = '/api/git/review/diff?path=' + enc(cwd) + '&file=' + enc(f.path) + '&scope=' + enc(scope) +
      '&staged=' + (f.staged ? 'true' : 'false') + (scope === 'branch' && base ? '&base=' + enc(base) : '');
    const fetchDiff = async () => {
      body.replaceChildren(h('div.chg-note', 'Loading diff…'));
      try {
        const res = await H.api.get(q);
        body.replaceChildren(liveDiff(res && res.diff) || h('div.chg-note', 'No textual diff for this file.'));
        return true;
      } catch (e) {
        body.replaceChildren(h('div.chg-note', h('span', 'Couldn’t load the diff: ' + e.message),
          h('button.btn.sm', {onclick:fetchDiff}, 'Retry')));
        return false;
      }
    };
    main.onclick = () => {
      body.hidden = !body.hidden;
      main.setAttribute('aria-expanded', String(!body.hidden));
      if (!body.hidden) fetchDiff();
    };
    row.append(main);
    if (scope === 'uncommitted') {
      const acts = h('span.chg-acts');
      if (f.staged) acts.append(h('button.btn.sm.ghost', {title:'Unstage ' + f.path, onclick:()=>mutate('/api/git/review/unstage', f)}, 'Unstage'));
      else acts.append(h('button.btn.sm.ghost', {title:'Stage ' + f.path, onclick:()=>mutate('/api/git/review/stage', f)}, 'Stage'));
      if (f.status !== '?') acts.append(h('button.btn.sm.ghost.danger', {title:'Discard changes in ' + f.path, onclick:()=>revertFile(f)}, 'Discard'));
      row.append(acts);
    }
    const wrap = h('div.chg-fwrap', row, body);
    return wrap;
  }

  async function mutate(path, f){
    if (busy) return;
    busy = true;
    try {
      await H.api.post(path, {path: cwd, file: f.path});
      await load();
    } catch (e) { H.toast('Couldn’t update the index: ' + e.message); }
    finally { busy = false; }
  }
  function revertFile(f){
    confirmAsk('Discard changes in this file?', f.path + ' goes back to the committed version. This cannot be undone.', 'Discard', async () => {
      try { await H.api.post('/api/git/review/revert', {path: cwd, file: f.path}); H.toast('Discarded ' + f.path); load(); }
      catch (e) { H.toast('Couldn’t discard: ' + e.message); }
    });
  }
  function revertAll(){
    confirmAsk('Discard all uncommitted changes?', 'Every tracked and untracked change in this folder is thrown away. This cannot be undone.', 'Discard all', async () => {
      try { await H.api.post('/api/git/review/revert', {path: cwd}); H.toast('Discarded all changes'); load(); }
      catch (e) { H.toast('Couldn’t discard: ' + e.message); }
    });
  }

  function drawActions(staged){
    actBox.replaceChildren();
    if (scope !== 'uncommitted') {
      actBox.append(h('div.chg-note', 'Stage, discard and commit act on uncommitted changes.'));
      return;
    }
    if (!rows.length) return;
    const area = h('textarea.textarea', {rows:2, placeholder:'Commit message', 'aria-label':'Commit message'});
    area.value = msg;
    area.oninput = () => { msg = area.value; sync(); };
    const commit = h('button.btn.primary', {onclick:doCommit}, 'Commit');
    const row = h('div.chg-actrow', commit,
      upstream ? h('button.btn.sm', {title:'Push this branch to its upstream', onclick:doPush}, H.ic('upload', 'sm'), 'Push') : null,
      h('span.grow'),
      h('span.muted.chg-hint', staged ? staged + ' staged' : 'Nothing staged yet'));
    if (upstream) row.setAttribute('data-upstream', 'yes');
    const box = h('div.chg-commit', area, row);
    actBox.append(box);
    function sync(){
      const ok = staged > 0 && msg.trim().length > 0;
      commit.toggleAttribute('disabled', !ok);
      commit.title = staged ? (msg.trim() ? 'Commit ' + staged + ' staged file' + (staged === 1 ? '' : 's') : 'Write a commit message first') : 'Stage a file first';
      row.querySelector('.chg-hint').textContent = staged ? staged + ' staged' : 'Nothing staged yet';
    }
    sync();
  }

  async function doCommit(){
    if (busy || !msg.trim()) return;
    busy = true;
    const btn = actBox.querySelector('.btn.primary');
    if (btn) btn.toggleAttribute('disabled', true);
    try {
      await H.api.post('/api/git/review/commit', {path: cwd, message: msg.trim(), push: false});
      H.toast('Committed');
      msg = '';
      await load();
    } catch (e) { H.toast('Commit failed: ' + e.message); }
    finally { busy = false; if (btn) btn.removeAttribute('disabled'); }
  }
  async function doPush(){
    if (busy) return;
    busy = true;
    try { await H.api.post('/api/git/review/push', {path: cwd}); H.toast('Pushed'); await load(); }
    catch (e) { H.toast('Push failed: ' + e.message); }
    finally { busy = false; }
  }

  /* ---- checkpoints (session gateway) ---- */
  async function loadCheckpoints(){
    cpBox.replaceChildren(h('div.isec', 'Checkpoints'));
    if (!sid) { cpBox.append(h('p.muted', 'Checkpoints belong to a saved thread. Send a message first.')); return; }
    cpBox.append(h('div.chg-note', 'Loading checkpoints…'));
    try {
      const res = await H.rpc.call('rollback.list', {session_id: sid});
      cpBox.replaceChildren(h('div.isec', 'Checkpoints'));
      const list2 = (res && res.checkpoints) || [];
      if (res && res.enabled === false) { cpBox.append(h('p.muted', 'Checkpoints are off for this session.')); return; }
      if (!list2.length) { cpBox.append(h('p.muted', 'No checkpoints yet. Hermes saves one before it edits files.')); return; }
      cpBox.append(h('p.muted', 'Snapshots of this folder, newest first. A restore rewinds files on disk.'));
      list2.forEach(c => cpBox.append(cpRow(c)));
    } catch (e) {
      cpBox.replaceChildren(h('div.isec', 'Checkpoints'),
        h('div.chg-note', h('span', 'Couldn’t load checkpoints: ' + e.message), h('button.btn.sm', {onclick:loadCheckpoints}, 'Retry')));
    }
  }

  function cpRow(c){
    const hash = String(c.hash || '');
    const row = h('div.chg-cp',
      h('span.chg-hash', {title:hash}, hash.slice(0, 8)),
      h('span.chg-msg', {title:String(c.message || '')}, String(c.message || 'checkpoint')),
      h('span.chg-when', fmtWhen(c.timestamp)));
    const diffBtn = h('button.btn.sm.ghost', {title:'Show what changed since this checkpoint'}, 'Diff');
    const restoreBtn = h('button.btn.sm', {title:'Restore this folder to this checkpoint'}, 'Restore');
    row.append(h('span.grow'), diffBtn, restoreBtn);
    const body = h('div.chg-cpdiff'); body.hidden = true;
    let loaded = false;
    diffBtn.onclick = async () => {
      body.hidden = !body.hidden;
      if (body.hidden || loaded) return;
      loaded = true;
      body.replaceChildren(h('div.chg-note', 'Loading diff…'));
      try {
        const res = await H.rpc.call('rollback.diff', {session_id: sid, hash});
        const pre = liveDiff(res && res.diff);
        body.replaceChildren(...[res && res.stat ? h('pre.chg-stat', String(res.stat).trim()) : null, pre || h('div.chg-note', 'No differences from this checkpoint.')].filter(Boolean));
      } catch (e) {
        loaded = false;
        body.replaceChildren(h('div.chg-note', 'Couldn’t load the checkpoint diff: ' + e.message));
      }
    };
    restoreBtn.onclick = () => confirmAsk('Restore this folder to the checkpoint?',
      'Files go back to the snapshot ' + hash.slice(0, 8) + '. This rewinds the folder on disk and cannot be undone.',
      'Restore', async () => {
        try {
          const res = await H.rpc.call('rollback.restore', {session_id: sid, hash});
          if (res && res.success === false) { H.toast('Restore failed: ' + (res.error || res.reason || 'unknown error')); return; }
          H.toast('Restored ' + hash.slice(0, 8) + (res && res.history_removed ? ' · rewound ' + res.history_removed + ' turn(s)' : ''));
          await load();
        } catch (e) { H.toast('Restore failed: ' + e.message); }
      });
    return h('div.chg-cpwrap', row, body);
  }

  load();
  return w;
}

/* The Details drawer: the whole inspector, tabs included, in the kit's drawer. */
H.details = function(t, S, o){
  o = o || {};
  const tabsFor = () => LIVE ? liveTabs() : TABS;
  let cur = o.tab || (LIVE ? 'context' : 'changes');
  const dr = H.drawer({title:'Details', width:'min(560px,100vw)', onClose:()=>{ o.onClose && o.onClose(); }});
  const tabs = h('div.tabs.dtabs', {role:'tablist', 'aria-label':'Thread details'});
  const pane = h('div.dpane');
  dr.body.append(h('div.dwrap', tabs, pane));
  /* Memoised per drawer: switching tabs keeps the draft message and open diffs.
     A fresh drawer (or Refresh) re-reads git. */
  let chgView = null;
  const bodies = LIVE ? {
    changes:()=>{ if (!chgView) chgView = liveChanges(t); return chgView; },
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
