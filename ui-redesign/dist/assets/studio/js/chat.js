/* Thread view: talk to the agent and watch it work. Everything secondary opens in the Details drawer (inspector.js). */
(function(){
const H = window.H, h = H.h, D = H.data;
const LIVE = H.live;
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
  const finish = (res, label, choice) => {
    c.classList.add('done');
    c.replaceChildren(h('div.receipt', H.ic(res==='deny'?'x':'check','sm'), h('span', (res==='deny'?'Denied':'Allowed')+' · '+label), h('span.muted','· just now'), h('code', b.cmd)));
    onDecide && onDecide(res, choice);
    H.toast(res==='deny' ? 'Denied' : 'Approved · Hermes continues');
  };
  const extra = h('div.omenu'); extra.hidden = true;
  const more = h('button.omore', {'aria-expanded':'false'}, 'More options');
  more.onclick = () => { extra.hidden = !extra.hidden; more.setAttribute('aria-expanded', String(!extra.hidden)); };
  extra.append(
    h('button', {onclick:()=>finish('allow','Allowed for this thread','session')}, 'Allow for this thread'),
    h('button', {onclick:()=>finish('allow','Added to allowlist','always')}, 'Always allow…'),
    h('button.danger', {onclick:()=>finish('deny','Denied','deny')}, 'Deny'));
  c.append(
    h('div.ahead', h('span.dot.warn'), h('b','Needs your approval'), h('span.risk', b.risk+' risk')),
    h('pre.cmd', b.cmd),
    h('p.awhy', b.why+' · runs in ', h('code', b.cwd)),
    h('div.aact', h('button.btn.primary.big', {onclick:()=>finish('allow','Allowed once','once')}, 'Allow once'), more),
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
  if (LIVE) { renderLiveThread(root, ctx); return; }
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

/* ---------- live thread: real gateway transcript, composer and stream ---------- */
const TOOL_KIND = [
  [/read|view|cat|open/i,'read'],[/search|grep|find|glob/i,'search'],[/edit|write|patch|apply/i,'edit'],
  [/terminal|shell|exec|bash|run/i,'run'],[/browser|fetch|web|http/i,'browse'],[/mcp|plugin/i,'mcp'],
  [/delegate|subagent|task/i,'users'],[/memory|remember/i,'brain'],[/skill/i,'sparkle'],[/think|reason/i,'brain']];
const toolKind = n => { const s = String(n||''); for (const [re,k] of TOOL_KIND) if (re.test(s)) return k; return 'file'; };
const argText = a => { if (a == null) return ''; if (typeof a === 'string') return a.length > 160 ? a.slice(0,160)+'…' : a; try { const s = JSON.stringify(a); return s.length > 160 ? s.slice(0,160)+'…' : s; } catch (e) { return ''; } };
const durText = ms => ms < 1000 ? Math.round(ms)+'ms' : (ms/1000).toFixed(ms<10000?1:0)+'s';

function liveAgent(t){
  const a = H.agent(t.agent) || H.agent('hermes') || {id:'hermes', name:'Hermes', hue:212, kind:0, state:'idle'};
  return a;
}
function reasonFold(text){
  const pre = h('pre.out', text || '');
  const b = h('button', H.ic('chev','sm c'), 'Reasoning');
  const w = h('div.reason', b, pre);
  const sync = () => { pre.hidden = !w.classList.contains('open'); b.setAttribute('aria-expanded', String(w.classList.contains('open'))); };
  b.onclick = () => { w.classList.toggle('open'); sync(); };
  sync(); return w;
}
function errorCard(msg, retry){
  return h('div.errline', h('span', msg), retry ? h('button.btn.sm', {onclick:retry}, 'Retry') : null);
}
function liveStep(s){
  return stepNode({k:s.k, l:s.l, d:s.d, out:s.out, dur:s.dur}, false);
}
/* render a stored REST transcript with the same blocks as the live stream */
function historyTurn(m, t){
  const a = H.avatar(liveAgent(t), 22, 'idle');
  const body = h('div.abody');
  const folded = m.blocks.filter(b => b.t==='reason');
  folded.forEach(b => body.append(reasonFold(b.text)));
  const work = m.blocks.find(b => b.t==='work');
  if (work) body.append(workGroup({label:worked(work.summary, work.steps.length), counts:work.counts, steps:work.steps}).el);
  m.blocks.filter(b=>b.t==='text'||b.t==='error').forEach(b => body.append(b.t==='text' ? md(b.text) : errorCard(b.text)));
  const foot = h('div.afoot', h('span.num', m.dur||''), h('span.dotsep'), h('span.num', m.tokens||''), m.cost!=null?h('span.dotsep'):null, h('span.num', m.cost!=null?H.fmt.usd(m.cost):''), h('span.grow'));
  return h('div.turn.agent', h('div.aav', a), body, foot);
}

function renderLiveThread(root, ctx){
  const raw = ctx.route[0];
  const found = raw && raw !== 'new' ? H.thread(raw) : null;
  const sid0 = found ? (found.fresh ? '' : found.id) : (raw && raw !== 'new' ? raw : '');
  const t = found || {id: sid0 || 'new', title: 'New thread', agent: 'hermes', model: '', state: 'idle', age: 'now', fresh: !sid0, source: 'gui'};
  if (!t.agent) t.agent = 'hermes';
  const agent = liveAgent(t);
  let sid = sid0, storedId = sid0, created = false;

  const S = {running:false, queue:[], effort:'Medium', perm:'', ctxUsed:0, ctxMax:0, model:t.model||'', tab:'context', tokens:0, cost:null, turns:0};
  H.liveThread = {id: sid||'new', title: t.title, todos: [], usage: null, cwd: '', model: S.model, context: {used:0, max:0}};
  let details = null, poster = null, cur = null, lastUser = '', subs = [], timers = [], historyRows = [];

  /* frame (same skeleton as sample mode) */
  const ghost = h('div.ghostw', {'aria-hidden':'true','data-w':agent.name});
  const title = h('h1.tt', {contenteditable:'plaintext-only', spellcheck:'false', role:'textbox', 'aria-label':'Thread title',
    onblur:e => { const v = e.target.textContent.trim(); if (!v || v===t.title) { e.target.textContent = t.title; return; } e.target.textContent = v; t.title = v;
      if (sid) H.rpc.call('session.title', {session_id: sid, title: v}).catch(()=>{}); H.refreshRail(); }}, t.title);
  const stateEl = h('span.tstate');
  const dbtn = h('button.btn.ghost.dbtn', {'aria-label':'Details', title:'Details', onclick:()=>openDetails()}, H.ic('panel'), h('span.dl','Details'));
  const head = h('header.thead', title, stateEl, h('span.grow'), dbtn);
  const col = h('div.col');
  const scroller = h('div.scroll', {tabindex:'-1'}, col);
  const cf = h('footer.cfoot');
  root.append(h('div.chat', ghost, head, scroller, cf));
  const api = {inspect, S, thread:t};
  function drawState(){
    const m = {working:['live','Working'], thinking:['live','Working'], waiting:['warn','Needs you'], done:['pos','Finished'], failed:['neg','Failed'], idle:['','Idle']}[t.state] || ['','Idle'];
    stateEl.replaceChildren(h('span.dot'+(m[0]?'.'+m[0]:''), {'aria-hidden':'true'}), m[1]);
  }
  function openDetails(tab){ if (tab) S.tab = tab; if (details){ details.show(S.tab); return; } details = H.details(t, S, {tab:S.tab, onClose:()=>{ details = null; }}); }
  function inspect(tab){ openDetails(tab); }
  live = {openTerminal:()=>openDetails('terminal')};
  const toBottom = () => { scroller.scrollTop = scroller.scrollHeight; };
  const later = (fn, ms) => { const id = setTimeout(() => { if (root.isConnected) fn(); }, ms); timers.push(id); return id; };
  function setState(s){ t.state = s; if (H.liveThread) H.liveThread.state = s; drawState(); H.refreshRail(); }

  /* transcript */
  function emptyCol(msg){
    col.replaceChildren(h('div.empty', msg));
  }
  function renderHistory(messages){
    col.replaceChildren();
    if (!messages.length) { emptyCol('No messages yet. Send the first one below.'); return; }
    let pending = [], pendingText = '';
    const flush = () => {
      if (!pending.length) return;
      const steps = pending.map(s => ({k:s.k, l:s.l, d:s.d, out:s.out, dur:s.dur}));
      const counts = steps.length + (steps.length===1?' step':' steps');
      col.append(historyTurn({role:'agent', blocks:[{t:'work', summary:'Worked', counts, steps}], dur:'', tokens:''}, t));
      pending = [];
    };
    messages.forEach(m => {
      if (m.role === 'user') { flush(); col.append(userMsg({text: String(m.content || '')})); lastUser = String(m.content || ''); return; }
      if (m.role === 'tool') {
        const s = pending.find(x => x.id && x.id === m.tool_call_id) || pending[pending.length-1];
        if (s) s.out = String(m.content || '').slice(0, 4000);
        return;
      }
      if (m.role !== 'assistant') return;
      (m.tool_calls || []).forEach(c => {
        const fn = c.function || {};
        pending.push({id: c.id, k: toolKind(fn.name), l: (fn.name||'tool') + (argText(fn.arguments) ? ' · ' + argText(fn.arguments) : ''), d: '', out: ''});
      });
      const text = String(m.content || '').trim();
      const reasoning = String(m.reasoning || m.reasoning_content || '').trim();
      if (!text && !reasoning) return;
      const blocks = [];
      if (pending.length) { const steps = pending; pending = []; blocks.push({t:'work', summary:'Worked', counts: steps.length+(steps.length===1?' step':' steps'), steps}); }
      if (reasoning) blocks.push({t:'reason', text: reasoning});
      if (text) blocks.push({t:'text', text});
      col.append(historyTurn({role:'agent', blocks, dur:'', tokens: m.token_count ? H.fmt.k(m.token_count)+' tokens' : ''}, t));
    });
    flush();
    S.turns = messages.filter(m=>m.role==='user').length;
    toBottom();
  }
  async function loadHistory(){
    const id = storedId || sid;
    if (!id) { emptyCol('No messages yet. Send the first one below.'); return; }
    emptyCol('Loading this thread…');
    try { const res = await H.api.get('/api/sessions/' + encodeURIComponent(id) + '/messages?limit=200&order=oldest'); historyRows = res.messages || []; renderHistory(historyRows); }
    catch (e) { emptyCol(''); col.append(errorCard('Couldn\'t load this thread: ' + e.message, loadHistory)); }
  }
  async function loadInfo(){
    if (!sid) return;
    try { const s = await H.api.get('/api/sessions/' + encodeURIComponent(sid)); if (s) { H.liveThread.cwd = s.cwd || ''; if (s.model) { S.model = s.model; t.model = s.model; } if (s.title) { t.title = s.title; title.textContent = s.title; } drawMeta(); } } catch (e) {}
    H.rpc.call('session.stats', {session_id: sid}).then(r => {
      const u = (r && (r.usage || r)) || {};
      if (typeof u.context_used === 'number') { S.ctxUsed = Math.round(u.context_used/1000); S.ctxMax = Math.round((u.context_max||0)/1000); }
      if (typeof u.total === 'number') S.tokens = u.total;
      if (typeof u.cost_usd === 'number') S.cost = u.cost_usd;
      syncLive(); drawMeta();
    }).catch(()=>{});
  }
  function syncLive(){
    if (!H.liveThread) return;
    H.liveThread.id = sid || 'new'; H.liveThread.title = t.title; H.liveThread.model = S.model;
    H.liveThread.usage = {tokens: S.tokens, cost: S.cost};
    H.liveThread.context = {used: S.ctxUsed, max: S.ctxMax};
  }

  /* composer */
  const ta = h('textarea.cta', {rows:1, placeholder: window.innerWidth<520 ? `Message ${agent.name}…` : `Message ${agent.name} · / commands`, 'aria-label':'Message'});
  const pop = h('div.cpop'); pop.hidden = true;
  const queueBox = h('div.cqueue');
  const meta = h('div.cmeta');
  const plusMenu = h('div.cmenu'); plusMenu.hidden = true;
  const plus = h('button.btn.ghost.icon', {'aria-label':'Add', title:'Attach, mention, commands', 'aria-haspopup':'menu'}, H.ic('plus'));
  const sendBtn = h('button.btn.primary.icon', {'aria-label':'Send'});
  const cbox = h('div.cbox', plus, plusMenu, pop, ta, sendBtn);
  const comp = h('div.comp', queueBox, cbox, meta);
  const autosize = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 220)+'px'; };
  plus.onclick = e => { e.stopPropagation(); plusMenu.hidden = !plusMenu.hidden; };
  const plusItem = (label, ic, run, dis) => h('button', {disabled:!!dis, title:dis||null, onclick:()=>{ if (dis) return; plusMenu.hidden = true; run(); }}, H.ic(ic,'sm'), label);
  plusMenu.append(
    plusItem('Attach file','paperclip', ()=>{}, 'Attachments are not available in this build yet'),
    plusItem('Mention','at', ()=>{ ta.value += '@'; ta.focus(); showPop(); }),
    plusItem('Commands','slash', ()=>{ ta.value = '/'; ta.focus(); showPop(); }),
    plusItem('Voice','mic', ()=>{}, 'Voice input is not available in the browser'));
  const closePlus = e => { if (!plusMenu.hidden && !cbox.contains(e.target)) plusMenu.hidden = true; };
  document.addEventListener('click', closePlus);

  const drawSend = () => {
    const stop = S.running && !ta.value.trim();
    sendBtn.replaceChildren(H.ic(stop ? 'stop':'send'));
    sendBtn.setAttribute('aria-label', stop ? 'Stop':'Send');
    sendBtn.classList.toggle('stopb', stop);
  };
  function drawMeta(){
    const label = S.model ? modelName(S.model) : 'Model';
    const seg = (txt, groups, cls) => { const w = h('span.cseg'); w.append(h('button'+(cls?'.'+cls:''), {'aria-haspopup':'menu', onclick:e=>{ e.stopPropagation(); meta.querySelectorAll('.menu').forEach(n=>n.remove()); liveMenu(w, groups); }}, txt)); return w; };
    meta.replaceChildren(
      seg(label, modelGroups),
      h('span.csep','·'),
      seg('Reasoning · '+S.effort, effortGroups),
      h('span.csep','·'),
      h('span.cseg', h('button', {title:'Context used', onclick:()=>openDetails('context')}, S.ctxUsed ? (S.ctxUsed+(S.ctxMax?'k of '+S.ctxMax+'k':'k')+' tokens') : 'Context')));
  }
  const effortGroups = () => [{label:'Reasoning effort', items:['Off','Low','Medium','High'].map(x => ({label:x, on:S.effort===x, run:()=>{ S.effort = x; drawMeta(); applyReasoning(x); }}))}];
  const modelGroups = () => {
    const w = h('div.menu', {role:'menu'});
    w.append(h('div.mlabel','Model'));
    const loading = h('div.mlabel','Loading models…'); w.append(loading);
    H.rpc.call('model.options', {}).then(res => {
      loading.remove();
      const provs = (res && res.providers) || [];
      provs.forEach(p => {
        if (p.authenticated === false) return;
        w.append(h('div.mlabel', p.name || p.slug));
        (p.models || []).slice(0, 40).forEach(mid => {
          const on = S.model === mid;
          w.append(h('button'+(on?'.on':''), {role:'menuitemradio','aria-checked':String(on), onclick:()=>{ w.remove(); applyModel(mid, p.slug); }}, h('span.grow', modelName(mid)), on?H.ic('check','sm'):null));
        });
      });
      if (!provs.length) w.append(h('div.mlabel','No authenticated providers'));
    }).catch(e => { loading.textContent = 'Couldn\'t load models: ' + e.message; });
    w._dynamic = true;
    return [{node:w}];
  };
  function applyModel(model, provider){
    if (!model) return;
    if (!sid) { S.model = model; t.model = model; drawMeta(); return; }
    H.rpc.call('config.set', {session_id: sid, key:'model', value: model + ' --provider ' + provider + ' --session'})
      .then(r => { S.model = model; t.model = model; drawMeta(); H.toast(r && r.deferred ? 'Model change queued for the next turn' : 'Model · '+modelName(model)); })
      .catch(e => H.toast('Couldn\'t switch model: ' + e.message));
  }
  function applyReasoning(level){
    if (!sid) return;
    H.rpc.call('config.set', {session_id: sid, key:'reasoning', value: level.toLowerCase(), scope:'session'})
      .then(()=>H.toast('Reasoning · '+level)).catch(e => H.toast('Couldn\'t set reasoning: ' + e.message));
  }
  /* the shared menu builder takes groups of items, not nodes */
  const liveMenu = (wrap, groups) => {
    wrap.querySelectorAll('.menu').forEach(n => n.remove());
    const m = h('div.menu', {role:'menu'});
    groups().forEach(g => { if (g.node){ m.append(g.node); return; } if (g.label) m.append(h('div.mlabel', g.label)); (g.items||[]).forEach(it => m.append(h('button'+(it.on?'.on':''), {role:'menuitemradio','aria-checked':String(!!it.on), onclick:()=>{ it.run(); m.remove(); }}, h('span.grow', it.label), it.on?H.ic('check','sm'):null))); });
    wrap.append(m);
    const off = e => { if (!m.contains(e.target)){ m.remove(); document.removeEventListener('click', off); } };
    setTimeout(()=>document.addEventListener('click', off), 0);
  };

  /* slash menu from the live catalog */
  let catalog = null;
  H.rpc.call('commands.catalog', {}).then(c => { catalog = (c && c.pairs) || []; }).catch(()=>{});
  const showPop = () => {
    const v = ta.value; const m = /(^|\s)([/@])([\w-]*)$/.exec(v); if (!m) { pop.hidden = true; return; }
    const q = m[3].toLowerCase();
    if (m[2] === '@') { pop.hidden = true; return; }
    const source = catalog || D.slash.map(([c,d]) => [c,d]);
    const items = source.filter(([c]) => c.slice(1).toLowerCase().startsWith(q)).slice(0,10).map(([c,d]) => ({k:c,d}));
    pop.replaceChildren(...items.map((it,i) => h('button'+(i===0?'.sel':''), {onclick:()=>{ ta.value = v.slice(0, v.length-m[0].length+m[1].length)+it.k+' '; pop.hidden = true; ta.focus(); autosize(); }}, h('span.mono', it.k), h('span.muted', it.d))));
    pop.hidden = !items.length;
  };
  ta.addEventListener('input', () => { autosize(); showPop(); drawSend(); });
  ta.addEventListener('keydown', e => {
    if (!pop.hidden && (e.key==='Tab' || (e.key==='Enter' && !e.metaKey && !e.ctrlKey))) { const first = pop.querySelector('button'); if (first){ e.preventDefault(); first.click(); return; } }
    if (e.key==='Escape') pop.hidden = true;
    if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); submit(e.metaKey||e.ctrlKey); }
  });
  sendBtn.onclick = () => { if (S.running && !ta.value.trim()) stopRun(); else submit(false); };

  let posterEl = null;
  function dockEmpty(){
    if (!t.fresh && sid) { cf.append(comp); return; }
    posterEl = emptyState(t, agent, txt => { ta.value = txt; ta.focus(); autosize(); });
    posterEl.querySelector('.pdock').append(comp);
    scroller.append(posterEl);
  }
  function unempty(){
    if (posterEl){ posterEl.remove(); posterEl = null; cf.append(comp); }
    col.hidden = false;
  }

  /* queue */
  function drawQueue(){ queueBox.replaceChildren(...S.queue.map((q,i) => h('div.qi', H.ic('clock','sm'), h('span.grow.ellip', q), h('button.btn.ghost.sm', {onclick:()=>{ S.queue.splice(i,1); drawQueue(); }}, 'Remove')))); }

  /* creating + sending */
  async function ensureSession(firstText){
    if (sid){
      if (!created){                     // a stored thread: reattach it before the first send
        try {
          const r = await H.rpc.call('session.resume', {session_id: sid});
          if (r){ sid = r.session_id || sid; storedId = r.stored_session_id || storedId; created = true; }
        } catch (e) { /* not resumable; prompt.submit reports the real error inline */ }
      }
      return sid;
    }
    setState('thinking');
    const res = await H.rpc.call('session.create', {source:'gui', title: (firstText||'New thread').slice(0,60), cwd: H.liveThread.cwd || undefined});
    const id = res && (res.session_id || res.id);
    if (!id) throw new Error('session.create returned no session id');
    sid = id; storedId = res.stored_session_id || (res.info && res.info.stored_session_id) || id; created = true;
    t.id = storedId; t.fresh = false; t.title = (res.info && res.info.title) || t.title; t.model = S.model || (res.info && res.info.model) || '';
    if (!H.thread(storedId)) H.data.threads.unshift(t);
    H.liveThread.id = sid;
    try { history.replaceState(null, '', '#/thread/' + storedId); } catch (e) { }
    H.refreshRail(); loadInfo();
    return sid;
  }
  function submit(steer){
    const v = ta.value.trim(); if (!v) return;
    ta.value = ''; autosize(); pop.hidden = true; drawSend();
    if (v.startsWith('/')) { slashCmd(v); return; }
    if (S.running && !steer) { S.queue.push(v); drawQueue(); H.toast('Queued · sends when this turn finishes'); return; }
    if (S.running && steer) { if (sid) H.rpc.call('session.steer', {session_id: sid, text: v}).then(()=>H.toast('Steering · Hermes sees this on its next step')).catch(e=>H.toast('Couldn\'t steer: '+e.message)); else H.toast('Send a first message before steering'); return; }
    sendPrompt(v);
  }
  async function sendPrompt(text){
    lastUser = text;
    unempty(); col.append(userMsg({text})); toBottom();
    beginTurn(); setState('thinking'); S.running = true; drawSend();
    try {
      await ensureSession(text);
      const res = await H.rpc.call('prompt.submit', {session_id: sid, text, surface:'gui'});
      if (res && res.status === 'queued') { H.toast('Queued behind the running turn'); }
    } catch (e) {
      S.running = false; drawSend(); setState('failed');
      if (cur && cur.think) cur.think.remove();
      col.append(errorCard('Couldn\'t send: ' + e.message, () => sendPrompt(text))); toBottom();
    }
  }
  function beginTurn(){
    const body = h('div.abody');
    const av = H.avatar(agent, 22, 'thinking');
    const think = h('div.think', h('span.dot.live'), 'Thinking…');
    const turn = h('div.turn.agent', h('div.aav', av), body);
    col.append(turn); body.append(think); cur = {turn, body, av, think, work:null, text:null, textBuf:'', reason:null, reasonBuf:'', steps:{}, counts:{run:0,read:0,search:0,other:0}, started:Date.now(), usage:null, done:false};
    liveEl = turn; toBottom();
  }
  let liveEl = null;
  function ensureWork(){
    if (!cur) beginTurn();
    if (cur.work) return cur.work;
    if (cur.think) cur.think.remove();
    const g = workGroup({label:'Working…', open:true});
    cur.work = g; cur.body.append(g.el); return g;
  }
  function ensureText(){
    if (!cur) beginTurn();
    if (cur.think) { cur.think.remove(); cur.think = null; }
    if (!cur.text) { cur.text = h('div.md'); cur.body.append(cur.text); }
    return cur.text;
  }
  function ensureReason(){
    if (!cur) beginTurn();
    if (cur.think) { cur.think.remove(); cur.think = null; }
    if (!cur.reason) { cur.reason = reasonFold(''); cur.reason.classList.add('open'); cur.body.append(cur.reason); }
    return cur.reason.querySelector('pre');
  }
  function finishTurn(payload){
    if (!cur || cur.done) return;
    cur.done = true;
    const p = payload || {};
    if (cur.think) { cur.think.remove(); cur.think = null; }
    if (p && p.text) { const node = cur.text || ensureText(); node.replaceChildren(...md(String(p.text)).childNodes); }
    else if (cur.text) { cur.text.replaceChildren(...md(cur.textBuf).childNodes); }
    if (!cur.text && cur.textBuf) { const node = ensureText(); node.replaceChildren(...md(cur.textBuf).childNodes); }
    if (p.status === 'error' || p.status === 'interrupted') {
      cur.body.append(errorCard(p.status === 'interrupted' ? 'Interrupted by you.' : (p.error || 'Hermes reported an error'), null));
    }
    if (cur.work) {
      const n = Object.values(cur.steps).length;
      cur.work.lab.textContent = worked('Worked for ' + Math.max(1, Math.round((Date.now()-cur.started)/1000)) + 's', n);
      const counts = [cur.counts.read ? 'read ' + cur.counts.read + (cur.counts.read===1?' file':' files') : '', cur.counts.run ? 'ran ' + cur.counts.run + (cur.counts.run===1?' command':' commands') : '', cur.counts.search ? 'searched ' + cur.counts.search + '×' : ''].filter(Boolean).join(' · ');
      cur.work.counts.textContent = counts || (n + (n===1?' step':' steps'));
      cur.work.close();
    }
    const usage = p.usage || cur.usage || {};
    const tokens = usage.total || usage.input + usage.output || 0;
    if (tokens) S.tokens = tokens;
    if (usage.cost_usd != null) S.cost = usage.cost_usd;
    if (usage.context_used != null) S.ctxUsed = Math.round(usage.context_used/1000);
    if (usage.context_max != null) S.ctxMax = Math.round(usage.context_max/1000);
    cur.turn.append(h('div.afoot',
      h('span.num', durText(Date.now()-cur.started)), h('span.dotsep'),
      h('span.num', tokens ? H.fmt.k(tokens)+' tokens' : ''), S.cost!=null?h('span.dotsep'):null,
      h('span.num', S.cost!=null?H.fmt.usd(S.cost):''), h('span.grow'), turnActions()));
    cur.av.setAttribute('data-state', p.status === 'error' ? 'blocked' : 'done');
    S.running = false; drawSend(); syncLive(); drawMeta(); toBottom();
    setState(p.status === 'error' ? 'failed' : 'done');
    if (S.queue.length) { const next = S.queue.shift(); drawQueue(); later(()=>sendPrompt(next), 400); }
    else later(()=>{ t.age = 'now'; H.refreshRail(); }, 0);
  }
  function stopRun(){
    if (sid) H.rpc.call('session.interrupt', {session_id: sid}).catch(e => H.toast('Couldn\'t interrupt: ' + e.message));
    else { S.running = false; drawSend(); setState('idle'); }
    if (cur && cur.think) { cur.think.remove(); cur.think = null; }
    if (cur) cur.body.append(h('div.note', H.ic('stop','sm'), 'Interrupted by you.'));
  }
  function rewindTurn(intent, turnsBack){
    const rows = (historyRows || []).filter(r => r.role === 'user' && r.id != null);
    const target = rows[rows.length - (turnsBack || 1)];
    const params = {session_id: storedId || sid, derived_target: true};
    if (target) params.target_message_id = target.id;
    return H.rpc.call('session.rewind', params).catch(e => {
      if (e.code === -32601 || /unknown method|not available/i.test(e.message)) return H.rpc.call('session.undo', {intent, session_id: storedId || sid});
      throw e;
    });
  }
  function turnActions(){
    const copy = () => { const text = cur && cur.text ? cur.text.textContent : ''; if (navigator.clipboard) navigator.clipboard.writeText(text).then(()=>H.toast('Copied')).catch(()=>H.toast('Couldn\'t copy')); };
    const undo = () => { if (!sid) return; rewindTurn('undo').then(()=>{ H.toast('Turn undone'); loadHistory(); }).catch(e=>H.toast('Couldn\'t undo: '+e.message)); };
    const retry = () => { if (!sid || !lastUser) return; rewindTurn('retry').catch(()=>{}).then(()=>sendPrompt(lastUser)); };
    const branch = () => { if (!sid) return; H.rpc.call('session.branch', {session_id: sid, name: (t.title||'Thread')+' · branch'}).then(r => { const id = r && (r.session_id || r.id); if (!id) return H.toast('Hermes did not return a branch id'); H.data.threads.unshift({id, title:(t.title||'Thread')+' · branch', agent:t.agent, model:t.model, state:'idle', source:'gui', age:'now'}); H.refreshRail(); location.hash = '#/thread/'+id; }).catch(e=>H.toast('Couldn\'t branch: '+e.message)); };
    return h('div.tact', ...[['copy','Copy',copy],['retry','Retry',retry],['fork','Branch from here',branch],['undo','Undo turn',undo]].map(([i,l,f]) => h('button.btn.ghost.icon.sm', {'aria-label':l,title:l,onclick:f}, H.ic(i,'sm'))));
  }

  /* slash commands: catalog → slash.exec / command.dispatch */
  async function slashCmd(v){
    const c = v.split(/\s+/)[0];
    if (c === '/new') { location.hash = '#/thread/new'; return; }
    if (c === '/usage') { openDetails('context'); return; }
    if (c === '/compress') { if (!sid) return H.toast('Send a message first'); H.rpc.call('session.compress', {session_id: sid}).then(r => { unempty(); col.append(h('div.note', H.ic('layers','sm'), 'Context compressed' + (r && r.before_tokens != null ? ' · ' + H.fmt.k(r.before_tokens) + ' → ' + H.fmt.k(r.after_tokens) + ' tokens' : ''))); toBottom(); }).catch(e=>H.toast('Couldn\'t compress: '+e.message)); return; }
    if (c === '/undo' || c === '/retry') { if (!sid) return H.toast('Send a message first'); rewindTurn(c==='/undo'?'undo':'retry').then(()=>{ H.toast(c==='/undo'?'Turn undone':'Retrying'); loadHistory(); }).catch(e=>H.toast('Couldn\'t '+c.slice(1)+': '+e.message)); return; }
    if (c === '/branch') { turnActions().querySelector('[aria-label="Branch from here"]').click(); return; }
    if (c === '/model' || c === '/reasoning') { H.toast('Use the model and reasoning options under the composer'); return; }
    if (!sid) { try { await ensureSession(v); } catch (e) { return H.toast('Couldn\'t start a session: ' + e.message); } }
    try {
      const r = await H.rpc.call('slash.exec', {session_id: sid, command: v});
      if (!r) return;
      if (r.type === 'send' && r.message) { sendPrompt(r.message); return; }
      if (r.type === 'prefill' && r.message) { ta.value = r.message; autosize(); ta.focus(); return; }
      const out = r.output || r.message || (typeof r === 'string' ? r : '');
      if (out) { unempty(); col.append(h('pre.cmd', String(out))); toBottom(); }
      else H.toast('Command sent');
      if (r.notice) H.toast(String(r.notice));
    } catch (e) { H.toast('Command failed: ' + e.message); }
  }

  /* gateway events for this session */
  const mine = id => !id || id === sid || id === storedId;
  function onEv(type, fn){ const off = H.rpc.on(type, ev => { if (!sid && !storedId) return; if (ev && !mine(ev.session_id)) return; fn(ev || {}); }); subs.push(off); }
  function onReq(method, fn){ const off = H.rpc.on(method, req => { const p = req.params || {}; if (!sid && !storedId) return; if (!mine(p.session_id || p.session_id_hint)) return; fn(req); }); subs.push(off); }

  function approvalUI(req){
    setState('waiting');
    const p = req.params || {};
    const cmd = String(p.command || p.description || 'Tool call needs approval');
    const card = approvalCard({cmd, cwd: (p.cwd || H.liveThread.cwd || ''), risk: p.risk || 'medium', why: String(p.description || 'Hermes needs permission to continue.')}, (res, choice) => {
      setState('working');
      const c = choice || (res === 'deny' ? 'deny' : 'once');
      const params = {session_id: sid || p.session_id || undefined, choice: c, ...(p.request_id ? {request_id: p.request_id} : {})};
      if (H.rpc.status().connected) req.respond({choice: c});
      else H.rpc.call('approval.respond', params).catch(err => H.toast('Couldn\'t answer: ' + err.message));
    });
    (cur && !cur.done ? cur.body : col).append(card); toBottom();
  }
  function clarifyUI(req){
    setState('waiting');
    const qs = (req.params && req.params.questions) || [];
    const q = qs[0] || {qid:'0', question:'Hermes needs an answer.', choices:[]};
    const card = h('div.appr.q', h('div.ahead', h('span.dot.warn'), h('b', q.question || 'Question')));
    const answers = {}; let resolved = false;
    const done = (val) => { if (resolved) return; resolved = true; answers[q.qid || '0'] = val; card.replaceChildren(h('div.receipt', H.ic('check','sm'), 'You answered: ' + (val || '(skipped)'))); try { req.respond({answers, outcome:'submitted'}); } catch (e) { H.rpc.call('clarify.respond', {session_id: sid, prompt_id: (req.params||{}).prompt_id, answer: val}).catch(err => H.toast('Couldn\'t answer: ' + err.message)); } setState('working'); };
    const row = h('div.aact');
    (q.choices || []).forEach(o => row.append(h('button.btn', {onclick:()=>done(typeof o === 'string' ? o : o.value || o.label)}, typeof o === 'string' ? o : (o.label || o.value))));
    const inp = h('input.input', {placeholder:'Type an answer…', 'aria-label':'Your answer'});
    const send = h('button.btn.primary', {onclick:()=>done(inp.value.trim())}, 'Send');
    inp.onkeydown = e => { if (e.key === 'Enter') done(inp.value.trim()); };
    card.append(row, h('div.irow', inp, send));
    (cur && !cur.done ? cur.body : col).append(card); toBottom();
  }
  function valueUI(req, title, placeholder, secret){
    setState('waiting');
    const card = h('div.appr.q', h('div.ahead', h('span.dot.warn'), h('b', title)));
    const inp = h('input.input', {type: secret ? 'password' : 'text', placeholder: placeholder || '', 'aria-label':title});
    const done = val => { card.replaceChildren(h('div.receipt', H.ic(val?'check':'x','sm'), val ? 'Sent' : 'Declined')); try { req.respond({value: val}); } catch (e) { H.toast('Couldn\'t answer the prompt'); } setState('working'); };
    inp.onkeydown = e => { if (e.key === 'Enter') done(inp.value); };
    card.append(h('div.irow', inp, h('button.btn.primary', {onclick:()=>done(inp.value)}, 'Send'), h('button.btn.ghost', {onclick:()=>done('')}, 'Decline')));
    (cur && !cur.done ? cur.body : col).append(card); toBottom();
  }

  function wire(){
    onEv('message.start', () => setState('working'));
    onEv('message.delta', ev => {
      const p = ev.payload || {};
      if (p.text == null) return;                  // segment boundary
      if (!cur || cur.done) beginTurn();
      const t2 = ensureText(); cur.textBuf += String(p.text);
      const pEl = t2.querySelector('p') || t2.appendChild(h('p'));
      pEl.textContent = cur.textBuf;
      toBottom();
    });
    onEv('message.interim', ev => { const p = ev.payload || {}; if (p.text && !p.already_streamed) { if (!cur || cur.done) beginTurn(); const t2 = ensureText(); const pEl = t2.querySelector('p') || t2.appendChild(h('p')); pEl.textContent = String(p.text); toBottom(); } });
    onEv('reasoning.delta', ev => { const p = ev.payload || {}; if (p.text == null) return; if (!cur || cur.done) beginTurn(); const pre = ensureReason(); cur.reasonBuf += String(p.text); pre.textContent = cur.reasonBuf; toBottom(); });
    onEv('thinking.delta', ev => { const p = ev.payload || {}; if (p.text == null) return; if (!cur || cur.done) beginTurn(); const pre = ensureReason(); cur.reasonBuf += String(p.text); pre.textContent = cur.reasonBuf; toBottom(); });
    onEv('tool.start', ev => {
      const p = ev.payload || {};
      const g = ensureWork();
      const id = p.tool_id || p.name + ':' + Object.keys(cur.steps).length;
      const l = p.preview || p.name || 'Tool';
      const row = stepNode({k: toolKind(p.name), l, d: p.args_text ? String(p.args_text).slice(0,140) : argText(p.args)}, true);
      cur.steps[id] = {row, name: p.name, start: Date.now()};
      g.add(row); g.open(); toBottom();
    });
    onEv('tool.progress', ev => {
      const p = ev.payload || {}; const s = cur && cur.steps[p.tool_id]; if (!s) return;
      if (p.message) s.row.querySelector('.sd') ? s.row.querySelector('.sd').textContent = String(p.message) : null;
      else if (typeof p.percent === 'number') { const sd = s.row.querySelector('.sd'); if (sd) sd.textContent = Math.round(p.percent) + '%'; }
      toBottom();
    });
    onEv('tool.complete', ev => {
      const p = ev.payload || {}; const s = cur && cur.steps[p.tool_id];
      const dur = p.duration_s != null ? Number(p.duration_s).toFixed(Number(p.duration_s)<10?1:0)+'s' : '';
      const out = p.result_text || p.summary || (typeof p.result === 'string' ? p.result : '');
      const done = stepNode({k: toolKind(p.name), l: (p.preview || p.name || 'Tool'), d: p.summary && p.summary !== out ? String(p.summary) : '', out: String(out || '').slice(0, 8000), dur}, false);
      if (s) { s.row.replaceWith(done); delete cur.steps[p.tool_id]; }
      else { ensureWork().add(done); }
      if (cur) { const name = String(p.name || ''); if (/read|view/i.test(name)) cur.counts.read++; else if (/search|grep|find/i.test(name)) cur.counts.search++; else if (/terminal|shell|exec|bash|run/i.test(name)) cur.counts.run++; }
      toBottom();
    });
    onEv('todo.updated', ev => { const todos = (ev.payload || {}).todos || []; if (H.liveThread) H.liveThread.todos = todos; if (details && details.tab()==='plan') details.show('plan'); });
    onEv('session.usage', ev => { const u = (ev.payload || {}).usage || {}; if (u.context_used != null) S.ctxUsed = Math.round(u.context_used/1000); if (u.context_max != null) S.ctxMax = Math.round(u.context_max/1000); if (u.total != null) S.tokens = u.total; if (u.cost_usd != null) S.cost = u.cost_usd; if (cur) cur.usage = u; syncLive(); drawMeta(); });
    onEv('session.info', ev => { const p = ev.payload || {}; if (p.model) { S.model = p.model; t.model = p.model; drawMeta(); } if (p.cwd) H.liveThread.cwd = p.cwd; if (p.running === false) {} });
    onEv('session.title', ev => { const p = ev.payload || {}; const v = p.title || p.text; if (v) { t.title = String(v); title.textContent = t.title; H.refreshRail(); } });
    onEv('message.complete', ev => finishTurn(ev.payload || {}));
    onEv('status.update', ev => { const p = ev.payload || {}; if (p.text && /compact|retry|provider/i.test(String(p.kind||'')+String(p.text))) { unempty(); col.append(h('div.note', H.ic('clock','sm'), String(p.text))); toBottom(); } });
    onEv('session.replay_gap', () => { loadHistory(); if (sid) H.rpc.syncRequests(sid).catch(()=>{}); });
    onEv('request.cancel', () => { /* the backend withdrew the request; its card stays as history */ });
    onReq('approval', approvalUI);
    onReq('clarify', clarifyUI);
    onReq('sudo', req => valueUI(req, 'Sudo password required', 'Enter the password Hermes needs', true));
    onReq('secret', req => valueUI(req, 'Secret needed' + ((req.params||{}).env_var ? ': ' + (req.params||{}).env_var : ''), 'Enter the value', true));
    onReq('vault.unlock_prompt', req => valueUI(req, 'Unlock ' + ((req.params||{}).display_name || 'the vault'), 'Master password', true));
    onReq('vault.code', req => valueUI(req, 'Verification code' + ((req.params||{}).site ? ' for ' + (req.params||{}).site : ''), 'Code', false));
  }

  /* mount */
  const onKey = e => { if (e.key==='`' && (e.metaKey||e.ctrlKey)){ e.preventDefault(); if (details && details.tab()==='terminal') details.close(); else openDetails('terminal'); } };
  const cleanup = () => {
    if (root.isConnected) return;
    document.removeEventListener('keydown', onKey); window.removeEventListener('hashchange', onNav);
    document.removeEventListener('click', closePlus); timers.forEach(clearTimeout);
    subs.forEach(off => { try { off(); } catch (e) {} }); subs = [];
    if (details){ details.close(); details = null; }
    if (H.liveThread && H.liveThread.id === (sid || 'new')) H.liveThread = null;
  };
  const onNav = () => setTimeout(cleanup, 260);
  document.addEventListener('keydown', onKey);
  window.addEventListener('hashchange', onNav);

  drawState(); drawMeta(); dockEmpty(); drawSend(); autosize();
  if (sid) { unempty(); col.hidden = false; loadHistory().then(()=>loadInfo()); }
  else { col.hidden = true; emptyCol(''); }
  H.rpc.connect().then(() => H.rpc.ready()).then(() => { wire(); if (storedId || sid) H.rpc.syncRequests(storedId || sid).catch(()=>{}); }).catch(e => {
    unempty(); col.append(errorCard('Couldn\'t connect to the Hermes gateway: ' + e.message, () => H.rpc.connect().then(()=>{ wire(); loadHistory(); })));
  });
  requestAnimationFrame(toBottom);
}

/* ---------- empty state: a poster, not a form ---------- */
function emptyState(t, agent, fill){
  const sug = [['Summarise what changed in my repos today','Review'],['Check gateway and MCP health, fix what is safe','Diagnose'],['Every weekday at 8: brief me on my calendar','Routine']];
  return h('div.poster',
    h('div.pcopy', h('h1.plead', `What should ${agent.name} take on?`), h('div.pdock'),
      h('div.psug', ...sug.map(([s,l]) => h('button.psg', {onclick:()=>fill(s), title:l}, h('span', s), H.ic('chev','sm'))))),
    h('div.par', H.mosaic({glyph:'home', seed:21, label:agent.name+' illustration'})));
}
})();
