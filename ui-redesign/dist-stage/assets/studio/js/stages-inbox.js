/* Inbox stage · one decision at a time.
   Own file: js/stages-inbox.js. Loads after js/views/inbox.js (the dense workbench)
   and before js/shell.js. The dense Inbox stays reachable behind the "Everything" handle. */
(function(){
const H = window.H, h = H.h;
if (!H || !H.views) return;

/* ---------- the dense view becomes the workbench, then we take its place ---------- */
if (H.views.inbox) H.work.inbox = H.views.inbox;

const LIVE = H.live;

/* state survives navigation across views */
H.inboxStage = H.inboxStage || {resolved:{}};
H.inboxStage.resolved = H.inboxStage.resolved || {};
if (LIVE && H.inbox && H.inbox.readResolved) H.inboxStage.resolved = H.inbox.readResolved();

const NEEDS = ['approval','clarify','secret','handoff','pairing','waiting','health'];
const ORDER = ['approval','clarify','secret','handoff','pairing','waiting','health','review','done','failed'];
const KIND_LABEL_STAGE = {approval:'Needs approval',clarify:'Question',secret:'Needs a secret',handoff:'Browser handoff',pairing:'Pairing request',waiting:'Waiting on you',health:'Needs attention',review:'Ready to review',done:'Finished',failed:'Failed'};
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

const ITEMS = LIVE ? [] : H.data.inbox.map(i => Object.assign({}, i));
if (!LIVE) ITEMS.forEach(it => Object.assign(it, EXTRA[it.id] || {}));

/* the two extra mock rows the dense view adds: secret and handoff (browser hand-over) */
if (!LIVE) ITEMS.push({
  id:'i6', kind:'secret', thread:'t-gw', agent:'hermes',
  title:'Needs the Telegram bot token', body:'TELEGRAM_BOT_TOKEN is unset in .env', age:'21m', unread:true,
  secretName:'TELEGRAM_BOT_TOKEN', varName:'TELEGRAM_BOT_TOKEN',
  why:'The gateway restarted cleanly but the Telegram channel stays disconnected until the bot token is present. Hermes will not read the value back, and it will not appear in the transcript.',
});
if (!LIVE) ITEMS.push({
  id:'i7', kind:'handoff', thread:'t-ui', agent:'hermes',
  title:'Paused on a GitHub login page', body:'Needs a signed-in session to read the token list', age:'6m', unread:true,
  page:'https://github.com/settings/tokens', waiting:'3m',
  why:'Hermes opened its own Chromium session to check whether the existing PAT still has repo scope. GitHub asked for a password, so the run is holding here instead of guessing.',
});

/* live: the queue is whatever the REST-derived inbox holds; nothing is sample data */
function liveItems(){ return (H.inbox && H.inbox.items) ? H.inbox.items() : []; }
function allItems(){ return LIVE ? liveItems() : ITEMS; }

const needsYou = () => LIVE
  ? (H.inbox && H.inbox.pending ? H.inbox.pending() : 0)
  : ITEMS.filter(it => NEEDS.indexOf(it.kind) !== -1 && !H.inboxStage.resolved[it.id]).length;
/* the rail badge reads this; in live mode js/views/inbox.js owns it */
if (!LIVE) H.inboxPending = needsYou;

/* ---------- small helpers ---------- */
const firstSentence = s => { const m = String(s || '').match(/^[\s\S]*?[.!?](?=\s|$)/); return (m ? m[0] : String(s || '')).trim(); };

function queue(){
  const resolved = id => !!(H.inboxStage.resolved[id] || (H.inbox && H.inbox.isResolved && H.inbox.isResolved(id)));
  return allItems().filter(it => !resolved(it.id))
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
}

function reviewCount(it){
  const files = it.files || [];
  const adds = files.reduce((n, f) => n + f.add, 0);
  const dels = files.reduce((n, f) => n + f.del, 0);
  return files.length + ' files, +' + adds + ' −' + dels;
}

function subOf(it){
  if (LIVE) return String(it.body || firstSentence(it.why) || (KIND_LABEL_STAGE[it.kind] || '')).trim();
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
    if (LIVE) H.inbox.load().then(() => fadeTo(paint));
    else fadeTo(paint);
  }

  /* live: run the item's real endpoint, then resolve it in the queue */
  function runAction(it, a){
    const btn = a.el;
    if (btn){ btn.disabled = true; btn.textContent = 'Working…'; }
    Promise.resolve()
      .then(() => a.run())
      .then(note => {
        if (LIVE && H.inbox && H.inbox.resolve){
          H.inboxStage.resolved[it.id] = a.label;
          H.inbox.resolve(it, a.label, a.danger ? 'neg' : 'pos', note || '');
        }
        toast(a.label + (note ? ' · ' + note : ''));
        if (LIVE) H.inbox.load().then(() => fadeTo(paint));
        else fadeTo(paint);
      })
      .catch(e => {
        if (btn){ btn.disabled = false; btn.textContent = a.label; }
        toast(a.label + ' failed · ' + ((e && e.message) || 'request failed'));
      });
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
    if (LIVE) return paintLiveItem(it);
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

    const total = allItems().length;
    const done = total - queue().length;
    foot.textContent = (done + 1) + ' of ' + total + ' waiting';
  }

  function paintLiveItem(it){
    lead.textContent = it.title;
    sub.textContent = subOf(it);
    actions.replaceChildren();
    actions.className = it.actions && it.actions.length > 2 ? 'stage-actions inbox-stack' : 'stage-actions';
    primaryBtn = null;
    cmdLink.hidden = true; more.hidden = true; more.replaceChildren();
    setGlyph(it.kind === 'done' ? 'clear' : 'inbox');

    /* a clarify with a single choice question is answerable right here */
    const single = it.kind === 'clarify' && it.questions && it.questions.length === 1 ? it.questions[0] : null;
    if (single && (single.choices || []).length){
      actions.className = 'stage-actions inbox-stack';
      const qid = single.qid || 'q0';
      single.choices.forEach((c, i) => {
        const b = h('button.btn.big.' + (i === 0 ? 'primary' : 'line'), {type:'button'}, String(c));
        b.onclick = () => {
          if (!H.rpc || typeof H.rpc.respond !== 'function'){ toast('The gateway socket is not open · open the thread instead'); return; }
          b.disabled = true;
          try {
            H.rpc.respond(it.rpcId, {answers: Object.assign({}, {[qid]: String(c)}), outcome:'submitted'});
            toast('Answered · ' + c);
            if (H.inbox && H.inbox.resolve) H.inbox.resolve(it, 'Answered', 'pos', String(c));
            if (LIVE) H.inbox.load().then(() => fadeTo(paint)); else fadeTo(paint);
          } catch (e){ b.disabled = false; toast('Answer failed · ' + ((e && e.message) || 'socket error')); }
        };
        actions.appendChild(b);
        if (i === 0) primaryBtn = b;
      });
    }

    (it.actions || []).forEach(a => {
      const cls = 'btn big ' + (a.primary ? 'primary' : 'line');
      const b = h('button.' + cls.split(' ').join('.'), {type:'button'}, a.label);
      b.onclick = () => runAction(it, Object.assign({el:b}, a));
      actions.appendChild(b);
      if (a.primary && !primaryBtn) primaryBtn = b;
    });

    /* free-text clarify: hand over to the workbench, which has the full form */
    if (it.kind === 'clarify' && !single && !(it.actions || []).length){
      const b = h('button.btn.big.primary', {type:'button', onclick:() => {
        const handle = el.querySelector('.stage-handle');
        if (handle) handle.click();
      }}, 'Answer in the inbox');
      actions.appendChild(b); primaryBtn = b;
    }

    if (it.cmd || (it.meta && it.meta.length) || it.error){
      cmdLink.hidden = false;
      cmdLink.setAttribute('aria-expanded', 'false');
      cmdLink.textContent = it.cmd ? 'Show the command' : 'Show the details';
      const bits = [];
      if (it.cmd) bits.push(h('pre.inbox-stage-pre', h('code', it.cmd)));
      if (it.error) bits.push(h('pre.inbox-stage-pre', h('code', it.error)));
      (it.meta || []).forEach(([k, v]) => bits.push(h('span.inbox-stage-meta', k + ' · ' + String(v))));
      more.replaceChildren.apply(more, bits);
    }

    if (!(it.actions || []).length && it.thread){
      const b = h('button.btn.big.primary', {type:'button', onclick: () => openThread(it.thread)}, 'Open thread');
      actions.appendChild(b); primaryBtn = b;
    }

    const total = allItems().length;
    const done = total - queue().length;
    foot.textContent = Math.min(done + 1, total) + ' of ' + total + ' waiting';
  }

  function paintClear(){
    if (LIVE){
      lead.textContent = 'All clear.';
      sub.textContent = 'Nothing is waiting on you. Cron, pairing and the gateway are quiet.';
      actions.replaceChildren();
      actions.className = 'stage-actions';
      primaryBtn = null;
      cmdLink.hidden = true; more.hidden = true; more.replaceChildren();
      foot.textContent = '';
      setGlyph('clear');
      return;
    }
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
    if (hc) hc.textContent = String(allItems().length);
    if (painted++) swap();
    if (!LIVE) H.inboxPending = needsYou;
  }

  const def = {
    name:'inbox', ch:'inbox', title:'Inbox', glyph:'inbox', seed:44,
    lead:first ? first.title : (LIVE ? 'Checking the inbox…' : 'All clear.'),
    sub:first ? subOf(first) : (LIVE ? 'Cron, pairing, sessions and the gateway…' : 'Hermes will tell you when something needs you.'),
    work:'inbox', handle:'Everything', handleCount: allItems().length, foot,
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
      H.inboxStage.paint = paint;     /* the socket can push an approval while the stage is up */
      if (LIVE){
        /* the stage paints "checking…" first, then the real queue */
        H.inboxStage.resolved = H.inbox.readResolved();
        H.inbox.load().then(() => { if (el && el.isConnected) paint(); }).catch(() => {});
      }
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
