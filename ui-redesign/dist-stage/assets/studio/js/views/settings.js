/* Settings · every Hermes configuration and admin surface, grouped for humans.
   Owns: this file + css/settings.css. Registers H.views.settings. */
(function(){
const H = window.H;
const LIVE = H.live;

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
  const b = H.h('button' + cls, {onclick:opts.onclick || null, type:'button', 'aria-label':opts.aria || null, title:opts.title || null},
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

/* ============================================================ live layer
   Real Hermes data (H.live === true). Every loader keeps its last payload in
   `live`; every writer uses the endpoint and body shape the old dashboard
   (web/src/pages/ConfigPage.tsx, ModelsPage.tsx, EnvPage.tsx, ProfilesPage.tsx,
   SystemPage.tsx) uses, and rolls nothing forward on failure. Sample builders
   above stay untouched for the file:// preview. */

const live = {
  config:null, schema:null, cfgErr:null,
  model:null, opts:null, aux:null, moa:null, modelErr:null,
  env:null, envErr:null,
  profiles:null, active:null, profErr:null,
  status:null, stats:null, update:null, sysErr:null,
  doctor:null, doctorRunning:false,
  backups:null, backupErr:null,
  yaml:null, yamlPath:null, yamlErr:null, yamlSaved:null,
  egress:null
};

/* Keys whose value is a credential: never read into a control, never rendered. */
const SENSITIVE_KEY = /(^|\.)(api_key|password|password_hash|secret|client_secret|access_token|private_key|auth_token)(\.|$)|_token$/;

const ACRONYM = {api:'API', url:'URL', id:'ID', ttl:'TTL', cwd:'Working directory', moa:'MoA', tts:'TTS', stt:'STT', ui:'UI', mcp:'MCP', ws:'WebSocket', ssh:'SSH', cli:'CLI', db:'database', pty:'PTY'};
function prettyKey(key){
  const last = key.split('.').pop();
  const words = last.split('_').map(w => ACRONYM[w] || w);
  const text = words.join(' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
/* The schema labels most leaf fields as "Section → Leaf"; a real sentence is used as the hint. */
function schemaHint(meta){
  const d = String((meta && meta.description) || '').trim();
  return (d && d.indexOf('→') < 0) ? d : '';
}
function getCfg(key){
  let v = live.config;
  for (const p of key.split('.')) { if (v == null || typeof v !== 'object') return undefined; v = v[p]; }
  return v;
}
function nestedCfg(key, value){
  const parts = key.split('.'); const root = {}; let o = root;
  parts.forEach((p, i) => { if (i === parts.length - 1) o[p] = value; else { o[p] = {}; o = o[p]; } });
  return root;
}
function fmtAgo(ts){
  if (!ts) return 'never';
  let t = typeof ts === 'number' ? ts : new Date(ts).getTime();
  if (t < 1e11) t = t * 1000;
  if (!isFinite(t)) return 'never';
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 90) return 'just now';
  if (s < 5400) return Math.round(s / 60) + 'm ago';
  if (s < 172800) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
}
function fmtBytes(n){
  if (n == null || !isFinite(n)) return '–';
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(n < 10240 ? 1 : 0) + ' KB';
  if (n < 1073741824) return (n / 1048576).toFixed(1) + ' MB';
  return (n / 1073741824).toFixed(1) + ' GB';
}
function liveLoading(text){ return H.h('div.empty.settings-livepad', text || 'Loading…'); }
function liveFail(err, retry, what){
  return H.h('div.settings-liveerr', {role:'alert'},
    H.h('div.settings-grow', 'Couldn’t load ' + (what || 'this tab') + ': ' + ((err && err.message) || 'unknown error')),
    retry ? btn('Retry', {sm:true, onclick:retry}) : null);
}
function liveEmpty(text){ return H.h('div.empty', text); }
function liveHint(text){ return H.h('div.settings-hintline', text); }
function disabledBtn(label, why, opts){
  const b = btn(label, Object.assign({}, opts || {}, {sm:true}));
  b.disabled = true;
  b.title = why;
  return b;
}

/* ---------- config: per-field control rendered from the schema ---------- */
let saveChain = Promise.resolve();
function fstate(el, tone, text){
  if (!el) return;
  el.className = 'settings-fstate' + (tone ? ' is-' + tone : '');
  el.textContent = text;
}
/* PUT /api/config deep-merges over disk, so a one-key diff body is safe (ConfigPage.tsx sends the whole form). */
function saveField(key, value, statusEl){
  fstate(statusEl, 'dirty', 'Unsaved');
  saveChain = saveChain.then(async () => {
    fstate(statusEl, 'dirty', 'Saving…');
    try {
      await H.api.put('/api/config', {config: nestedCfg(key, value)});
      if (live.config){
        const parts = key.split('.'); let o = live.config;
        for (let i = 0; i < parts.length - 1; i++){ if (!o[parts[i]] || typeof o[parts[i]] !== 'object') o[parts[i]] = {}; o = o[parts[i]]; }
        o[parts[parts.length - 1]] = value;
      }
      fstate(statusEl, 'ok', 'Saved');
      return true;
    } catch (e){
      fstate(statusEl, 'err', 'Not saved · ' + e.message);
      return false;
    }
  });
  return saveChain;
}
function cfgControl(key, meta, statusEl){
  const raw = getCfg(key);
  const label = prettyKey(key);
  if (meta.type === 'boolean'){
    return H.sw(!!raw, v => saveField(key, v, statusEl), label);
  }
  if (meta.type === 'select'){
    const list = (meta.options || []).map(o => ({value:o, label:o === '' ? '(none)' : String(o)}));
    const cur = raw == null ? '' : String(raw);
    if (cur && !list.some(o => String(o.value) === cur)) list.unshift({value:cur, label:cur + ' (current)'});
    if (!list.length) list.push({value:cur, label:cur || '(none)'});
    return select(list, cur, v => saveField(key, v, statusEl), label);
  }
  if (meta.type === 'list'){
    const inp = H.h('input.input', {type:'text', value:(Array.isArray(raw) ? raw.join(', ') : (raw == null ? '' : String(raw))), 'aria-label':label, spellcheck:'false'});
    inp.onchange = () => saveField(key, inp.value.split(',').map(s => s.trim()).filter(Boolean), statusEl);
    return inp;
  }
  if (meta.type === 'number'){
    const inp = H.h('input.input', {type:'number', value: raw == null ? '' : raw, 'aria-label':label});
    inp.onchange = () => {
      if (inp.value === ''){ saveField(key, null, statusEl); return; }
      const n = Number(inp.value);
      if (!isFinite(n)){ fstate(statusEl, 'err', 'Not a number'); return; }
      saveField(key, n, statusEl);
    };
    return inp;
  }
  const inp = input(raw == null ? '' : String(raw), {'aria-label':label, spellcheck:'false'});
  inp.onchange = () => saveField(key, inp.value, statusEl);
  return inp;
}
/* One schema-driven field: label, live control and its saved/dirty/error state. */
function cfgField(key, opts){
  opts = opts || {};
  if (SENSITIVE_KEY.test(key)){
    return H.h('div.settings-cfgfield',
      H.h('div.settings-cfgfield-top', H.h('span.settings-flabel', opts.label || prettyKey(key)), H.h('span.settings-fstate', 'Write-only')),
      H.h('div.settings-hintline', 'Credential values are never read into this page. Set them under Keys & secrets.'));
  }
  const meta = (live.schema && live.schema.fields && live.schema.fields[key]) || (opts.meta || {type:'string'});
  const st = H.h('span.settings-fstate');
  const hint = opts.hint != null ? opts.hint : schemaHint(meta);
  return H.h('div.settings-cfgfield',
    H.h('div.settings-cfgfield-top', H.h('span.settings-flabel', opts.label || prettyKey(key)), st),
    cfgControl(key, meta, st),
    hint ? H.h('span.hint', hint) : null,
    H.h('code.settings-code.settings-cfgkey', key));
}
function cfgGrid(keys, opts){
  const grid = H.h('div.settings-cfgfields' + (opts && opts.wide ? '.is-wide' : ''));
  keys.forEach(k => grid.appendChild(cfgField(k, opts && opts[k])));
  return grid;
}
function cfgCard(keys, opts){
  return card(null, bodyBox(cfgGrid(keys, opts), note('Changes save as you leave a field and apply to new turns. A running gateway picks them up on its next start or reload.', 'info', 'info')));
}
function ensureConfig(){
  if (!live.config) throw live.cfgErr || new Error('Config is not loaded');
  return live.config;
}

/* ---------- loaders ---------- */
async function loadConfig(){
  try {
    const cfg = await H.api.get('/api/config');
    const schema = await H.api.cached('/api/config/schema', 600000);
    live.config = cfg; live.schema = schema; live.cfgErr = null;
  } catch (e){ live.cfgErr = e; live.config = null; }
}
async function loadModels(){
  try {
    const opts = await H.api.get('/api/model/options');
    const info = await H.api.try(() => H.api.get('/api/model/info'), null);
    const aux = await H.api.try(() => H.api.get('/api/model/auxiliary'), null);
    const moa = await H.api.try(() => H.api.get('/api/model/moa'), null);
    live.opts = opts; live.model = info || {model: opts.model, provider: opts.provider};
    live.aux = aux; live.moa = moa; live.modelErr = null;
  } catch (e){ live.modelErr = e; live.opts = null; }
}
async function loadEnv(){
  try { live.env = await H.api.get('/api/env'); live.envErr = null; }
  catch (e){ live.envErr = e; live.env = null; }
}
async function loadProfiles(){
  try {
    const d = await H.api.get('/api/profiles');
    live.profiles = Array.isArray(d.profiles) ? d.profiles : [];
    live.active = await H.api.try(async () => (await H.api.get('/api/profiles/active')).active, null);
    live.profErr = null;
  } catch (e){ live.profErr = e; live.profiles = null; }
}
async function loadSystem(){
  try {
    live.status = await H.api.get('/api/status');
    live.stats = await H.api.try(() => H.api.get('/api/system/stats'), null);
    live.sysErr = null;
  } catch (e){ live.sysErr = e; live.status = null; }
  const check = H.api.try(() => H.api.get('/api/hermes/update/check'), null);
  live.update = await Promise.race([check, sleep(2500).then(() => null)]);
  if (!live.update){
    check.then(u => { if (u){ live.update = u; if (live.onUpdate) live.onUpdate(); } });
  }
}
async function loadBackups(){
  try {
    const d = await H.api.get('/api/fs/list?path=' + encodeURIComponent('~/.hermes/backups'));
    live.backups = (d.entries || []).filter(e => !e.isDirectory && /\.zip$/i.test(e.name || ''));
    live.backupErr = null;
  } catch (e){ live.backupErr = e; live.backups = null; }
}

/* background actions report through /api/actions/{name}/status (oplog the old System page tails) */
function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
async function pollAction(name, tries){
  if (!name) return null;
  for (let i = 0; i < (tries || 40); i++){
    await sleep(1200);
    let st;
    try { st = await H.api.get('/api/actions/' + encodeURIComponent(name) + '/status?lines=40'); }
    catch (e){ if (e.status === 404) return null; throw e; }
    if (!st || st.running === false) return st;
  }
  return null;
}
function lastActionLine(st){
  const lines = st && Array.isArray(st.lines) ? st.lines.filter(l => String(l || '').trim()) : [];
  return lines.length ? String(lines[lines.length - 1]).trim() : '';
}
/* Required by DELETE /api/env: the old EnvPage sends the key in the JSON body, and H.api.del cannot. */
async function deleteEnvKey(key){
  const headers = {'Accept':'application/json', 'Content-Type':'application/json'};
  const token = window.__HERMES_SESSION_TOKEN__;
  if (token) headers['X-Hermes-Session-Token'] = token;
  const q = H.api.profile ? '?profile=' + encodeURIComponent(H.api.profile) : '';
  const res = await fetch(H.api.base + '/api/env' + q, {method:'DELETE', headers, body:JSON.stringify({key}), credentials:'include', mode:'same-origin'});
  const text = await res.text();
  let data = null;
  if (text){ try { data = JSON.parse(text); } catch (e){ data = text; } }
  if (!res.ok){
    const msg = (data && (data.detail || data.error || data.message)) || res.statusText || ('HTTP ' + res.status);
    const err = new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    err.status = res.status;
    throw err;
  }
  return data;
}

/* ---------- 1. General ---------- */
function buildGeneral(env){
  if (LIVE) return buildGeneralLive(env);
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
  if (LIVE) return buildModelsLive(env);
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

/* ---------- shared live render ---------- */
function liveRender(mount, load, errOf, build, what){
  let busy = false;
  async function run(){
    if (busy) return;
    busy = true;
    mount.replaceChildren(liveLoading());
    await load();
    const err = errOf();
    if (err) mount.replaceChildren(liveFail(err, run, what));
    else {
      try { mount.replaceChildren(...[].concat(build())); }
      catch (e){ mount.replaceChildren(liveFail(e, run, what)); }
    }
    busy = false;
  }
  run();
  return mount;
}

/* ---------- live: 1. General ---------- */
function buildGeneralLive(){
  const rows = H.h('div.settings-rows');
  liveRender(rows, loadConfig, () => live.cfgErr, () => [
    srow('Appearance', 'How this dashboard looks. The CLI and TUI have their own skin.', 'dashboard.theme · display.compact',
      cfgCard(['dashboard.theme', 'display.compact', 'display.skin'])),
    srow('Language and interface', 'What `hermes` opens when no surface is named, and the language of its menus.', 'display.interface · display.language',
      cfgCard(['display.interface', 'display.language'])),
    srow('Transcript', 'What a turn shows while it runs and after it finishes.', 'display.*',
      cfgCard(['display.show_reasoning', 'display.streaming', 'display.timestamps', 'display.turn_summary', 'display.show_cost'])),
    srow('Diagnostics reporting', 'Crash reports and coarse tool counters.', 'privacy.diagnostics',
      H.h('div.card.settings-card',
        bodyBox(H.h('div.settings-locked',
          H.ic('lock','sm'),
          H.h('div.settings-grow', H.h('div.t','Diagnostics reporting'), H.h('div.s','No REST endpoint exposes this switch.')),
          disabledBtn('Not available from the web', 'Hermes has no dashboard endpoint for diagnostics reporting; set it in config.yaml.')))))
  ], 'settings');
  return rows;
}

/* ---------- live: 2. Models ---------- */
const AUX_LABEL = {vision:'Vision', compression:'Compression', approval:'Approval classifier', mcp:'MCP', title_generation:'Thread titles',
  review:'Review', voice_chat:'Voice chat', triage_specifier:'Triage', kanban_decomposer:'Board decomposition',
  profile_describer:'Profile descriptions', curator:'Curator'};

function pairSelect(provider, model, aria){
  const s = H.h('select.select.settings-select', {'aria-label':aria || 'Model'});
  (live.opts.providers || []).forEach(p => {
    const og = H.h('optgroup', {label:p.name + (p.is_current ? ' · current' : '')});
    (p.models || []).forEach(m => og.appendChild(H.h('option', {value:p.slug + '\u001f' + m}, m)));
    if (og.children.length) s.appendChild(og);
  });
  const want = provider + '\u001f' + model;
  if (![...s.options].some(o => o.value === want)){
    s.insertBefore(H.h('option', {value:want}, (model || 'auto') + ' · ' + (provider || 'auto') + ' (current)'), s.firstChild);
  }
  s.value = want;
  return s;
}

/* POST /api/model/set, with the old picker's expensive-model confirmation step. */
async function setModel(host, body, statusEl, done){
  fstate(statusEl, 'dirty', 'Saving…');
  try {
    const r = await H.api.post('/api/model/set', body);
    if (r && r.confirm_required){
      fstate(statusEl, 'dirty', 'Needs confirmation');
      host.replaceChildren(H.h('div.settings-confirm-inline',
        H.h('div.s', r.confirm_message || 'That model is expensive. Use it anyway?'),
        btn('Use it anyway', {sm:true, danger:true, onclick:async () => {
          host.replaceChildren();
          fstate(statusEl, 'dirty', 'Saving…');
          try { await H.api.post('/api/model/set', Object.assign({}, body, {confirm_expensive_model:true})); fstate(statusEl, 'ok', 'Saved'); done && done(); }
          catch (e){ fstate(statusEl, 'err', 'Not saved · ' + e.message); }
        }}),
        btn('Cancel', {sm:true, ghost:true, onclick:() => { host.replaceChildren(); fstate(statusEl, '', ''); }})));
      return;
    }
    fstate(statusEl, 'ok', 'Saved');
    done && done();
  } catch (e){ fstate(statusEl, 'err', 'Not saved · ' + e.message); }
}

function moaPayload(enabled){
  const m = live.moa || {};
  const presets = JSON.parse(JSON.stringify(m.presets || {}));
  const name = m.default_preset || 'default';
  if (!presets[name]){
    presets[name] = {reference_models: m.reference_models || [], aggregator: m.aggregator || {},
      reference_temperature:m.reference_temperature, aggregator_temperature:m.aggregator_temperature,
      reference_timeout:m.reference_timeout, degraded_reference_policy:m.degraded_reference_policy, fanout:m.fanout};
  }
  presets[name].enabled = !!enabled;
  return {default_preset:name, active_preset:m.active_preset || '', presets};
}

function buildModelsLive(){
  const rows = H.h('div.settings-rows');
  liveRender(rows, loadModels, () => live.modelErr, () => {
    const out = [];
    /* main model */
    const mainStatus = H.h('span.settings-fstate');
    const mainHost = H.h('div');
    const cur = live.model || {provider:'', model:''};
    const mainSel = pairSelect(cur.provider, cur.model, 'Default model');
    mainSel.onchange = () => {
      const [provider, ...rest] = mainSel.value.split('\u001f');
      const model = rest.join('\u001f');
      setModel(mainHost, {scope:'main', provider, model}, mainStatus);
    };
    out.push(srow('Default model', 'Used for new threads in this profile. Running threads keep their model until switched.', 'model',
      card(null, bodyBox(
        H.h('div.settings-cfgfield-top', H.h('span.settings-flabel','Model'), mainStatus),
        mainSel,
        H.h('div.settings-meta', (live.opts.provider || cur.provider) + ' · ' + (live.opts.model || cur.model)),
        mainHost))));

    /* provider readiness, read from the picker's authenticated list */
    const provBox = H.h('div.settings-providers');
    (live.opts.providers || []).forEach(p => {
      provBox.appendChild(H.h('div.settings-provider',
        H.h('div.settings-provider-top', H.h('span.t', p.name), p.is_current ? pill('In use','pos') : pill((p.models || []).length + ' models','')),
        H.h('div.s', p.slug + ((p.models || []).length ? ' · ' + p.models.slice(0, 2).join(', ') : ' · no models listed')),
        H.h('div.settings-provider-foot',
          btn('Use a model', {sm:true, ghost:true, disabled:!(p.models || []).length,
            title:(p.models || []).length ? null : 'This provider lists no models',
            onclick:() => {
              const m = (p.models || [])[0];
              if (!m) return;
              const host = H.h('div');
              setModel(host, {scope:'main', provider:p.slug, model:m}, H.h('span'), () => {
                live.model = {provider:p.slug, model:m};
                env.toast('Default model: ' + m);
              });
            }}))));
    });
    out.push(srow('Providers', 'Authenticated providers from the model picker. Credentials live under Keys & secrets.', 'providers',
      card(null, bodyBox(provBox, H.h('div.settings-hintline', 'A provider with no key is listed only after its credential exists.')))));

    /* fallback chain */
    out.push(srow('Fallback chain', 'Provider order used when the primary fails or a pool is exhausted.', 'fallback_providers',
      cfgCard(['fallback_providers', 'fallback.min_switch_reset_seconds'])));

    /* auxiliary tasks */
    const auxRows = [];
    const auxTasks = (live.aux && Array.isArray(live.aux.tasks)) ? live.aux.tasks : [];
    const auxHost = H.h('div');
    if (!auxTasks.length){
      out.push(srow('Auxiliary tasks', 'Side jobs with their own model.', 'auxiliary.*',
        card(null, bodyBox(liveEmpty('No auxiliary slots are reported for this profile.')))));
    } else {
      auxTasks.forEach(t => {
        const status = H.h('span.settings-fstate');
        const host = H.h('div');
        const label = AUX_LABEL[t.task] || prettyKey(t.task);
        const sel = pairSelect(t.provider || 'auto', t.model || '', label + ' model');
        sel.onchange = () => {
          const [provider, ...rest] = sel.value.split('\u001f');
          const model = rest.join('\u001f');
          setModel(host, {scope:'auxiliary', task:t.task, provider, model}, status, () => {
            t.provider = provider; t.model = model;
          });
        };
        auxRows.push([
          H.h('div', H.h('div.t', label), H.h('div.s.mono', t.task)),
          H.h('div.settings-auxsel', H.h('div.settings-cfgfield-top', status, H.h('span.settings-hintline', t.local_endpoint ? 'local endpoint' : '')), sel, host)
        ]);
      });
      out.push(srow('Auxiliary tasks', 'Side jobs with their own model. “auto” follows the main model; a blank model inherits it.', 'auxiliary.*',
        card(auxTasks.length + ' slots', H.h('div.scroll-x.settings-tablewrap',
          tbl([{label:'Task'},{label:'Model'}], auxRows)), H.h('span.settings-hintline','Saved with POST /api/model/set (scope auxiliary).'))));
    }

    /* MoA */
    const moa = live.moa;
    if (moa){
      const mStatus = H.h('span.settings-fstate');
      const def = (moa.presets && moa.presets[moa.default_preset || 'default']) || {};
      const refs = (def.reference_models || moa.reference_models || []).map(r => r.provider + '/' + r.model);
      const agg = def.aggregator || moa.aggregator || {};
      const sw = H.sw(!!(def.enabled != null ? def.enabled : moa.enabled), async v => {
        fstate(mStatus, 'dirty', 'Saving…');
        try {
          const r = await H.api.put('/api/model/moa', moaPayload(v));
          live.moa = r && r.presets ? r : Object.assign({}, moa, {enabled:v});
          fstate(mStatus, 'ok', 'Saved');
          env.toast('Mixture of Agents ' + (v ? 'enabled' : 'disabled'));
        } catch (e){ fstate(mStatus, 'err', 'Not saved · ' + e.message); sw.setAttribute('aria-checked', String(!v)); }
      }, 'Mixture of Agents');
      out.push(srow('Mixture of Agents', 'Several models answer in parallel; the aggregator writes the final reply.', 'moa',
        card(H.h('span.settings-grow','Preset ' + (moa.default_preset || 'default')),
          bodyBox(
            H.h('div.settings-cfgfield', H.h('div.settings-cfgfield-top', H.h('span.settings-flabel','Enabled'), mStatus), sw),
            H.h('div.settings-deflist',
              kv('Proposers', refs.length ? refs.join(', ') : 'none'),
              kv('Aggregator', agg.provider ? agg.provider + '/' + agg.model : 'none'),
              kv('Fanout', def.fanout || moa.fanout || '–')),
            note('Reference and aggregator slots are edited by PUT /api/model/moa; this page toggles the active preset only.', 'info', 'info')))));
    }
    return out;
  }, 'models');
  return rows;
}

/* ---------- live: 3. Agent ---------- */
function buildAgentLive(env){
  const rows = H.h('div.settings-rows');
  liveRender(rows, loadConfig, () => live.cfgErr, () => {
    const out = [];
    /* approvals: same values the CLI uses, written through config */
    const aStatus = H.h('span.settings-fstate');
    const modes = [
      ['manual','Ask every time','Every tool call that can run a command or write a file waits for you.'],
      ['smart','Ask for risky only','Read-only and previously approved patterns run; writes and new commands ask.'],
      ['off','Auto-approve','Everything runs. Use only inside a throwaway container.']
    ];
    const box = H.h('div.settings-choices');
    const current = getCfg('approvals.mode') || 'smart';
    modes.forEach(([id, title, sub]) => {
      const b = choice(title, sub, current === id, () => {
        [...box.children].forEach(x => x.setAttribute('aria-pressed','false'));
        b.setAttribute('aria-pressed','true');
        saveField('approvals.mode', id, aStatus).then(ok => { if (!ok) { b.setAttribute('aria-pressed','false'); paintMode(current); } });
      }, id === 'off' ? {danger:true, extra:H.h('div.settings-danger', H.ic('warn','sm'),
        H.h('span','Any command runs without asking, including a delete outside the worktree.'))} : null);
      box.appendChild(b);
    });
    function paintMode(){
      [...box.children].forEach((b, i) => b.setAttribute('aria-pressed', String(modes[i][0] === current)));
    }
    out.push(srow('Approvals', 'What Hermes may do without a human. Applies to shell commands, file writes and MCP tools.', 'approvals.mode',
      card(null, bodyBox(box, H.h('div.settings-cfgfield-top', H.h('span.settings-hintline','Saved to config.yaml'), aStatus),
        H.h('div.settings-hintline','Deny globs and the approval transport are under Security.')))));

    out.push(srow('Limits', 'How much work one turn may do before Hermes stops and writes a summary.', 'agent.*',
      cfgCard(['agent.max_turns', 'agent.gateway_timeout', 'agent.api_max_retries', 'agent.auto_recovery_cycles', 'agent.empty_response_guard.cost_threshold_usd'])));
    out.push(srow('Delegation', 'Subagents Hermes may spawn, and whether they need approval.', 'delegation.*',
      cfgCard(['delegation.max_spawn_depth', 'delegation.max_concurrent_children', 'delegation.subagent_auto_approve'])));
    out.push(srow('Memory and compression', 'Durable notes and the point where context is summarised.', 'memory.* · compression.*',
      cfgCard(['memory.memory_enabled', 'memory.write_approval', 'compression.enabled', 'compression.threshold'])));
    return out;
  }, 'agent');
  return rows;
}

/* ---------- 3. Agent ---------- */
function buildAgent(env){
  if (LIVE) return buildAgentLive(env);
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
  if (LIVE) return buildToolsLive(env);
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

/* ---------- live: 4. Tools & terminal ---------- */
function buildToolsLive(env){
  const rows = H.h('div.settings-rows');
  liveRender(rows, loadConfig, () => live.cfgErr, () => {
    const out = [];
    out.push(srow('Terminal backend', 'Where shell commands run. The browser and file tools follow the same sandbox.', 'terminal.backend',
      cfgCard(['terminal.backend', 'terminal.cwd', 'terminal.timeout', 'terminal.persistent_shell'])));
    out.push(srow('Execution environment', 'Names only cross the sandbox boundary; values stay in `.env`.', 'terminal.env_passthrough · terminal.shell_init_files',
      card(null, bodyBox(
        cfgGrid(['terminal.env_passthrough', 'terminal.shell_init_files', 'terminal.docker_image', 'terminal.container_memory']),
        note('Changing the backend starts a new shell. Running commands keep their original backend until they finish.', 'info', 'info')))));
    out.push(srow('Browser', 'CDP endpoint for the browser toolset. On this machine Chromium runs in Docker, so Hermes connects instead of installing one.', 'browser.cdp_url',
      card(null, bodyBox(
        cfgGrid(['browser.cdp_url', 'browser.headed', 'browser.engine', 'browser.use_real_profile']),
        H.h('div.settings-actions',
          disabledBtn('Test connection', 'No dashboard endpoint probes the CDP URL. Open a page with the browser tool to test it.'),
          disabledBtn('Open vault', 'The browser vault is Desktop-only; there is no web endpoint for it.')),
        H.h('div.settings-hintline', 'A connection is proven when the browser tool opens its first page.')))));
    out.push(srow('Web providers', 'Which search and extraction backends the web tools use.', 'web.*',
      cfgCard(['web.search_backend', 'web.extract_backend', 'web.keyless_fallback', 'web.extract_char_limit'])));
    return out;
  }, 'tools');
  return rows;
}

/* ---------- live: 5. Keys & secrets ---------- */
function envRows(){
  const all = live.env || {};
  const set = [];
  const missing = [];
  Object.keys(all).forEach(name => {
    const row = all[name] || {};
    if (row.channel_managed) return;
    if (row.is_set) set.push(Object.assign({name}, row));
    else if (row.provider_primary) missing.push(Object.assign({name}, row));
  });
  set.sort((a, b) => (b.category === 'custom') - (a.category === 'custom') || a.name.localeCompare(b.name));
  return {set, missing};
}

function keyDialog(onDone, existing, suggested){
  const name = existing ? null : input(suggested || '', {placeholder:'e.g. BRAVE_API_KEY', autocomplete:'off', 'aria-label':'Key name', spellcheck:'false'});
  const val = H.h('input.input', {type:'password', placeholder:'Paste the value', autocomplete:'off', 'aria-label':'Key value'});
  const err = H.h('div.settings-formerr');
  const save = btn(existing ? 'Replace key' : 'Add key', {primary:true, disabled:true, onclick:async () => {
    const key = existing ? existing : name.value.trim();
    if (!existing && !/^[A-Z][A-Z0-9_]*$/.test(key)){ err.textContent = 'Use UPPER_SNAKE_CASE, starting with a letter.'; return; }
    if (val.value.length < 8){ err.textContent = 'The value needs at least 8 characters.'; return; }
    save.disabled = true; save.textContent = 'Saving…'; err.textContent = '';
    try {
      await H.api.put('/api/env', {key, value:val.value});
      m.close();
      H.toast((existing ? 'Key replaced · ' : 'Key added · ') + key);
      onDone && onDone();
    } catch (e){
      err.textContent = 'Not saved · ' + e.message;
      save.disabled = false; save.textContent = existing ? 'Replace key' : 'Add key';
    }
  }});
  val.oninput = () => { save.disabled = val.value.length < 8 || (!existing && !/^[A-Z][A-Z0-9_]*$/.test(name.value.trim())); err.textContent = ''; };
  if (name) name.oninput = val.oninput;
  const closeBtn = iconBtn('x','Close',()=>{});
  const box = H.h('div.settings-dialog',
    H.h('div.settings-dialog-h', H.h('div.settings-grow',
      H.h('h2', existing ? 'Replace ' + existing : 'Add an environment key'),
      H.h('p','Secrets go to this profile’s `.env`. The value is write-only: it is never read back into the UI.')), closeBtn),
    H.h('div.settings-dialog-b',
      name ? field('Name', name, 'UPPER_SNAKE_CASE. Referenced from `config.yaml` as `${NAME}`.') : field('Key', code(existing), 'The old value is overwritten; `config.yaml` mirrors are reconciled.'),
      field('Value', val, 'Masked as you type. Never written to logs or returned by the API.'),
      err),
    H.h('div.settings-dialog-f', btn('Cancel', {ghost:true, onclick:()=>m.close()}), save));
  const m = H.modal(box, {width:540});
  closeBtn.onclick = () => m.close();
  setTimeout(() => (existing ? val : name).focus(), 30);
}

function buildSecretsLive(env){
  const rows = H.h('div.settings-rows');
  const keysHost = H.h('div');
  const keysHead = H.h('span.settings-grow', 'Environment keys');
  const managersHost = H.h('div');
  const egressHost = H.h('div');
  const reload = () => loadEnv().then(paintKeys);

  function paintKeys(){
    keysHost.replaceChildren();
    if (live.envErr){
      keysHost.appendChild(liveFail(live.envErr, reload, 'environment keys'));
      return;
    }
    if (!live.env){ keysHost.appendChild(liveLoading()); return; }
    const {set, missing} = envRows();
    keysHead.textContent = set.length + (set.length === 1 ? ' key set' : ' keys set');
    if (!set.length){
      keysHost.appendChild(liveEmpty('No keys are set in this profile’s .env.'));
    } else {
      const tableRows = set.map(k => {
        const actions = H.h('div.settings-actions');
        actions.appendChild(btn('Replace', {sm:true, onclick:()=>keyDialog(reload, k.name)}));
        if (state.confirmKey === k.name){
          const del = btn('Remove key', {sm:true, danger:true, onclick:async () => {
            del.disabled = true;
            try { await deleteEnvKey(k.name); state.confirmKey = null; H.toast(k.name + ' removed from .env'); reload(); }
            catch (e){ del.disabled = false; H.toast('Couldn’t remove ' + k.name + ': ' + e.message); }
          }});
          actions.appendChild(del);
          actions.appendChild(btn('Cancel', {sm:true, ghost:true, onclick:()=>{ state.confirmKey = null; paintKeys(); }}));
        } else {
          actions.appendChild(btn('Remove', {sm:true, danger:true, onclick:()=>{ state.confirmKey = k.name; paintKeys(); }}));
        }
        return [
          H.h('span.mono.settings-keyname', k.name),
          k.is_password === false ? pill('Set','pos') : H.h('span.mono.s', k.redacted_value || 'set'),
          H.h('span.s', k.category === 'custom' ? 'custom' : (k.provider_label || k.category || '')),
          actions
        ];
      });
      keysHost.appendChild(tbl([{label:'Key'},{label:'Value'},{label:'Group'},{label:'Actions',cls:'r'}], tableRows));
      if (state.confirmKey) keysHost.appendChild(H.h('div.settings-hintline', 'Removing a key also clears its config.yaml mirror and pooled credentials for that provider.'));
    }
    if (missing.length){
      const list = H.h('div.settings-suggest');
      missing.slice(0, 12).forEach(k => {
        list.appendChild(H.h('div.settings-suggest-row',
          H.h('div.settings-grow', H.h('div.mono.t', k.name), H.h('div.s', k.provider_label || k.description || 'provider key')),
          btn('Add', {sm:true, icon:'plus', onclick:()=>keyDialog(reload, null, k.name)})));
      });
      keysHost.appendChild(H.h('div.settings-subhead', 'Missing provider keys'));
      keysHost.appendChild(list);
      if (missing.length > 12) keysHost.appendChild(H.h('div.settings-hintline', '+' + (missing.length - 12) + ' more provider keys not set. Add any of them with “Add key”.'));
    }
  }

  liveRender(rows, loadConfig, () => live.cfgErr, () => {
    const out = [];
    out.push(srow('Environment keys', 'The profile’s `.env`. Values are write-only here: the API returns a masked preview only.', '.env',
      card(keysHead, keysHost, btn('Add key', {sm:true, icon:'plus', onclick:()=>keyDialog(reload)}))));
    reload();

    /* secret managers: the switches are real config; the tokens stay in .env */
    const mgrStatus = H.h('span.settings-fstate');
    const mgrBox = H.h('div.list');
    ['secrets.bitwarden.enabled','secrets.onepassword.enabled'].forEach(key => {
      const label = key.indexOf('bitwarden') >= 0 ? 'Bitwarden' : '1Password';
      const meta = (live.schema && live.schema.fields && live.schema.fields[key]) || {type:'boolean'};
      mgrBox.appendChild(H.h('div.settings-tog',
        H.h('div.settings-grow', H.h('div.t', label), H.h('div.s', 'Pull secrets at launch from this manager’s vault. The service token lives in .env.')),
        cfgControl(key, meta, mgrStatus)));
    });
    managersHost.append(mgrBox, H.h('div.settings-cfgfield-top', H.h('div.settings-hintline','Manager switches write config.yaml; tokens are set under Environment keys.'), mgrStatus),
      note('Sync now and Connect are not exposed over REST. `hermes secrets sync` runs the same pull from the CLI.', 'info', 'info'));
    out.push(srow('Secret managers', 'Pulled at launch; a manager can supply keys the local `.env` does not have.', 'secrets.*',
      card(null, bodyBox(managersHost))));

    /* egress firewall: readable, not controllable from the web */
    const egressBody = H.h('div.settings-proxy', liveLoading('Reading egress proxy status…'));
    out.push(srow('Egress firewall', 'Keeps real provider keys out of Docker and Modal sandboxes.', 'security.egress_proxy',
      card(null, bodyBox(egressBody,
        H.h('div.settings-actions',
          disabledBtn('Start', 'The egress proxy is started by the CLI (`hermes proxy start`); there is no REST endpoint.'),
          disabledBtn('Stop', 'The egress proxy is stopped by the CLI (`hermes proxy stop`); there is no REST endpoint.'))))));
    H.api.try(() => H.api.get('/api/egress/status'), null).then(d => {
      if (!d || !d.text){ egressBody.replaceChildren(note('Egress proxy status is unavailable from this dashboard.', 'info', 'info')); return; }
      egressBody.replaceChildren(H.h('div.settings-deflist',
        ...String(d.text).split('\n').filter(l => l.indexOf(':') > 0).map(l => {
          const i = l.indexOf(':');
          return kv(l.slice(0, i).trim(), l.slice(i + 1).trim() || '–');
        })));
    });
    return out;
  }, 'keys');
  return rows;
}

/* ---------- 5. Keys & secrets ---------- */
function buildSecrets(env){
  if (LIVE) return buildSecretsLive(env);
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
  if (LIVE) return buildSecurityLive(env);
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
  if (LIVE) return buildProfilesLive(env);
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
  if (LIVE) return buildSystemLive(env);
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
  if (LIVE) return buildAdvancedLive(env);
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

/* ---------- live: 6. Security ---------- */
function buildSecurityLive(env){
  const rows = H.h('div.settings-rows');
  liveRender(rows, async () => { await loadConfig(); await loadSystem(); }, () => live.cfgErr, () => {
    const out = [];
    /* approvals mode — the same key the Agent tab writes */
    const aStatus = H.h('span.settings-fstate');
    const modes = [
      ['manual','Ask every time','Every tool call that can run a command or write a file waits for you.'],
      ['smart','Ask for risky only','Read-only and previously approved patterns run; writes and new commands ask.'],
      ['off','Auto-approve','Everything runs. Use only inside a throwaway container.']
    ];
    const box = H.h('div.settings-choices');
    const current = getCfg('approvals.mode') || 'smart';
    modes.forEach(([id, title, sub]) => {
      const b = choice(title, sub, current === id, () => {
        [...box.children].forEach(x => x.setAttribute('aria-pressed','false'));
        saveField('approvals.mode', id, aStatus).then(ok => { if (!ok) [...box.children].forEach((x, i) => x.setAttribute('aria-pressed', String(modes[i][0] === current))); });
      }, id === 'off' ? {danger:true} : null);
      box.appendChild(b);
    });
    out.push(srow('Approvals mode', 'Applies to shell commands, file writes and MCP tools for this profile.', 'approvals.mode',
      card(null, bodyBox(box, H.h('div.settings-cfgfield-top', H.h('span.settings-hintline','Written to config.yaml; live sessions pick it up immediately'), aStatus)))));

    out.push(srow('Redaction', 'What is masked before a transcript or log leaves the machine.', 'security.redact_secrets',
      cfgCard(['security.redact_secrets', 'security.redact_phone_numbers', 'security.protected_instruction_files', 'security.allow_private_urls'])));

    out.push(srow('Command allowlist', 'Patterns that never prompt. Exact strings plus `*` globs; denials still win.', 'command_allowlist',
      cfgCard(['command_allowlist', 'approvals.deny'])));

    out.push(srow('Approval delivery', 'Where an approval prompt is sent when the turn has no interactive surface.', 'security.approval.*',
      cfgCard(['security.approval.transport', 'security.approval.transport_fallback', 'approvals.timeout'])));

    /* dashboard exposure: read from /api/status; credentials are never read into the UI */
    const st = live.status || {};
    const auth = Array.isArray(st.auth_providers) ? st.auth_providers : [];
    out.push(srow('Dashboard exposure', 'The web dashboard serves every profile from one port.', 'dashboard.*',
      card(null, bodyBox(
        H.h('div.settings-deflist',
          kv('Bind', st.auth_required ? 'network · sign-in required' : 'loopback · no sign-in required'),
          kv('Auth providers', auth.length ? auth.join(', ') : 'none'),
          kv('Hermes home', st.hermes_home || '–'),
          kv('Env file', st.env_path || '–')),
        cfgGrid(['dashboard.theme', 'dashboard.show_token_analytics', 'dashboard.turn_isolation']),
        H.h('div.settings-actions',
          disabledBtn('Set a password', 'Basic-auth credentials are write-only and not exposed by a dashboard endpoint; use `hermes dashboard --set-password`.'),
          disabledBtn('Require GitHub OAuth', 'OAuth is configured from the CLI (`hermes dashboard --oauth`); no REST endpoint exists.'))))));

    out.push(srow('Approval audit', 'The recent decisions recorded in `state.db`.', 'approvals.audit',
      H.h('div.card.settings-card', bodyBox(
        H.h('div.empty','The approval audit is not exposed as a dashboard endpoint.'),
        H.h('div.settings-hintline','Read it with `hermes approvals audit` or from the Approvals view in the workspace.')))));
    return out;
  }, 'security');
  return rows;
}

/* ---------- live: 7. Profiles ---------- */
function buildProfilesLive(env){
  const rows = H.h('div.settings-rows');
  const grid = H.h('div.settings-profiles');
  const head = H.h('span.settings-grow','Profiles');

  function newProfileDialog(){
    const name = input('', {placeholder:'e.g. lab', autocomplete:'off', 'aria-label':'Profile name', spellcheck:'false'});
    const desc = input('', {placeholder:'What this profile is for (optional)', 'aria-label':'Description'});
    const err = H.h('div.settings-formerr');
    const cloneSel = select([{value:'', label:'Nothing · start empty'}]
      .concat((live.profiles || []).map(p => ({value:p.name, label:'Clone ' + p.name + ' (config, skills, SOUL.md)'}))), '', ()=>{}, 'Clone from');
    const create = btn('Create profile', {primary:true, disabled:true, onclick:async () => {
      const n = name.value.trim();
      if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(n)){ err.textContent = 'Lowercase letters, digits, dashes and underscores; up to 64 characters.'; return; }
      create.disabled = true; create.textContent = 'Creating…';
      try {
        const body = {name:n, description:desc.value.trim() || null};
        if (cloneSel.value) body.clone_from = cloneSel.value;
        await H.api.post('/api/profiles', body);
        m.close(); H.toast('Profile ' + n + ' created · run hermes -p ' + n);
        refresh();
      } catch (e){ err.textContent = 'Couldn’t create the profile · ' + e.message; create.disabled = false; create.textContent = 'Create profile'; }
    }});
    name.oninput = () => { create.disabled = !/^[a-z0-9][a-z0-9_-]{0,63}$/.test(name.value.trim()); err.textContent = ''; };
    const closeBtn = iconBtn('x','Close',()=>{});
    const box = H.h('div.settings-dialog',
      H.h('div.settings-dialog-h', H.h('div.settings-grow', H.h('h2','New profile'), H.h('p','An isolated home: config, `.env`, sessions, memories and cron.')), closeBtn),
      H.h('div.settings-dialog-b',
        field('Name', name, 'Used as `hermes -p <name>`; becomes `~/.hermes/profiles/<name>`.'),
        field('Description', desc, 'Shown in the roster and used for routing.'),
        field('Clone from', cloneSel, 'Copies config, skills and SOUL.md. Sessions and `state.db` stay behind.'),
        err),
      H.h('div.settings-dialog-f', btn('Cancel', {ghost:true, onclick:()=>m.close()}), create));
    const m = H.modal(box, {width:560});
    closeBtn.onclick = () => m.close();
    setTimeout(() => name.focus(), 30);
  }

  function paint(){
    grid.replaceChildren();
    if (live.profErr){ grid.appendChild(liveFail(live.profErr, refresh, 'profiles')); return; }
    if (!live.profiles){ grid.appendChild(liveLoading()); return; }
    head.textContent = live.profiles.length + (live.profiles.length === 1 ? ' profile' : ' profiles') + ' on this host';
    if (!live.profiles.length){ grid.appendChild(liveEmpty('No profiles found.')); return; }
    live.profiles.forEach((p, idx) => {
      const active = p.name === (live.active || 'default');
      const actions = H.h('div.settings-profile-actions');
      const sw = btn(active ? 'Active' : 'Switch', {sm:true, disabled:active, onclick:async () => {
        sw.disabled = true;
        try { await H.api.post('/api/profiles/active', {name:p.name}); live.active = p.name; H.toast('Active profile: ' + p.name); refresh(); }
        catch (e){ sw.disabled = false; H.toast('Couldn’t switch: ' + e.message); }
      }});
      actions.appendChild(sw);
      const del = btn('Delete', {sm:true, danger:true, disabled:!!p.is_default, title:p.is_default ? 'The default profile cannot be deleted' : null,
        onclick:()=>{ state.deleteName = state.deleteName === p.name ? null : p.name; paint(); }});
      actions.appendChild(del);
      const cardEl = H.h('div.settings-profile' + (active ? '.is-active' : ''),
        H.h('div.settings-profile-top',
          H.avatar({name:p.name, hue:p.hue != null ? p.hue : (212 + idx * 46) % 360, kind:idx}, 36),
          H.h('div.settings-grow',
            H.h('div.t', p.name + (p.has_alias ? ' · alias' : '')),
            H.h('div.s', (p.provider ? p.provider + ' / ' : '') + (p.model || 'no model set'))),
          active ? pill('Active','pos') : null,
          p.gateway_running ? pill('Gateway running','live') : null),
        H.h('div.settings-profile-meta',
          kv('Home', H.h('span.mono', p.path || '–')),
          kv('Skills', String(p.skill_count != null ? p.skill_count : '–')),
          kv('Keys', p.has_env ? 'set' : 'none')),
        p.description ? H.h('div.settings-profile-desc', p.description) : null,
        actions);
      if (state.deleteName === p.name){
        const confirmInput = input('', {placeholder:p.name, 'aria-label':'Type ' + p.name + ' to confirm deletion'});
        const go = btn('Delete profile', {sm:true, danger:true, disabled:true, onclick:async () => {
          go.disabled = true; go.textContent = 'Deleting…';
          try {
            const r = await H.api.del('/api/profiles/' + encodeURIComponent(p.name));
            state.deleteName = null;
            H.toast(r && r.settlement_pending ? p.name + ' deleted · identity settlement pending' : p.name + ' deleted');
            refresh();
          } catch (e){ go.disabled = false; go.textContent = 'Delete profile'; H.toast('Couldn’t delete: ' + e.message); }
        }});
        confirmInput.oninput = () => { go.disabled = confirmInput.value !== p.name; };
        cardEl.appendChild(H.h('div.settings-confirm',
          H.h('div.s','This removes `' + (p.path || p.name) + '`: config, `.env`, sessions and memories. It cannot be undone.'),
          H.h('div.settings-confirm-row', confirmInput, btn('Cancel', {sm:true, ghost:true, onclick:()=>{ state.deleteName = null; paint(); }}), go)));
      }
      grid.appendChild(cardEl);
    });
  }

  async function refresh(){ await loadProfiles(); paint(); }

  rows.classList.add('settings-rows');
  rows.replaceChildren(liveLoading());
  loadConfig();
  refresh();
  rows.replaceChildren(srow('Profiles', 'Separate homes on one host. Each has its own config, `.env`, sessions and memories; `auth.json` is shared unless isolated.', 'profiles',
    card(head, bodyBox(grid, note('Commands for a named profile always run with -p <name>. Without it Hermes silently targets the default profile.', 'warn')),
      btn('New profile', {sm:true, icon:'plus', onclick:newProfileDialog}))));
  return rows;
}

/* ---------- live: 8. System ---------- */
function actionRun(host, name, label, onDone){
  const status = H.h('span.settings-fstate');
  const out = H.h('div.settings-actionlog');
  const b = btn(label, {sm:true, onclick:async () => {
    b.disabled = true;
    fstate(status, 'dirty', 'Starting…');
    try {
      const r = await H.api.post('/api/ops/' + name, {});
      fstate(status, 'dirty', 'Running · ' + (r && r.name ? r.name : name));
      const st = await pollAction(r && r.name, 120);
      const failed = st && st.exit_code != null && st.exit_code !== 0;
      fstate(status, failed ? 'err' : 'ok', st ? (failed ? 'Exited ' + st.exit_code : 'Finished') : 'Started (still running)');
      const lines = (st && Array.isArray(st.lines)) ? st.lines.filter(l => String(l || '').trim()).slice(-12) : [];
      out.replaceChildren(...lines.map(l => H.h('div.settings-actionline', String(l))));
      b.disabled = false;
      onDone && onDone(st);
    } catch (e){
      fstate(status, 'err', 'Failed · ' + e.message);
      b.disabled = false;
    }
  }});
  host.append(H.h('div.settings-actions', b, status), out);
  return b;
}

function buildSystemLive(env){
  const rows = H.h('div.settings-rows');
  const main = H.h('div');
  live.onUpdate = () => { try { paint(); } catch (e){} };

  function paint(){
    if (main.parentNode !== rows) rows.replaceChildren(main);
    main.replaceChildren();
    if (live.sysErr){ main.appendChild(liveFail(live.sysErr, refresh, 'system status')); return; }
    if (!live.status){ main.appendChild(liveLoading()); return; }
    const st = live.status, stats = live.stats || {};
    const out = [];

    /* health from /api/status */
    const healthBox = H.h('div.settings-health');
    [['overall','Overall', st.overall, ''],
     ['gateway','Gateway', st.gateway_state || (st.gateway_running ? 'running' : 'stopped'), st.gateway_pid ? 'pid ' + st.gateway_pid : ''],
     ['dashboard','Dashboard', st.components && st.components.dashboard ? st.components.dashboard.status : '–', ''],
     ['storage','Storage', st.components && st.components.storage ? st.components.storage.status : '–', ''],
     ['platforms','Platforms', st.components && st.components.platforms ? st.components.platforms.status : '–',
       st.components && st.components.platforms ? (st.components.platforms.connected || 0) + ' of ' + (st.components.platforms.configured || 0) + ' connected' : ''],
     ['memory','Memory', st.memory ? st.memory.pressure : '–', st.memory ? st.memory.gateway_rss_mb + ' MB gateway RSS' : ''],
     ['disk','Disk', st.disk ? st.disk.pressure : '–', st.disk ? st.disk.free_mb + ' MB free' : '']].forEach(([id, label, value, detail]) => {
      const tone = value === 'ok' || value === 'running' ? 'pos' : value === 'warn' ? 'warn' : value === 'fail' || value === 'stopped' ? 'neg' : '';
      healthBox.appendChild(H.h('div.settings-health-row' + (tone === 'neg' ? '.is-fail' : ''),
        pill(value === 'ok' || value === 'running' ? 'OK' : (value === 'warn' ? 'Warn' : String(value || '–').slice(0, 1).toUpperCase() + String(value || '').slice(1)), tone),
        H.h('div.settings-grow', H.h('div.t', label), H.h('div.s', detail || value || '–'))));
    });
    const doctorHost = H.h('div');
    out.push(srow('Health check', 'Read from /api/status. The doctor runs `hermes doctor` and reports its log.', 'hermes doctor',
      card(H.h('span.settings-grow','Live status'), bodyBox(healthBox, H.h('div.sep'), doctorHost), null)));
    actionRun(doctorHost, 'doctor', 'Run doctor');

    /* version + update */
    const upd = live.update;
    const vBody = H.h('div.settings-version');
    const vPill = H.h('span.pill' + (upd && upd.update_available === false ? '.pos' : ''), upd ? (upd.update_available ? 'Update available' : 'Up to date') : 'Unknown');
    const updStatus = H.h('span.settings-fstate');
    const updConfirm = H.h('div');
    vBody.append(H.h('div.settings-version-top',
      H.h('div.settings-grow',
        H.h('div.settings-vnum', (upd && upd.current_version) || st.version || '–'),
        H.h('div.s', [upd && upd.install_method, stats.python_version ? 'Python ' + stats.python_version : null, stats.hostname].filter(Boolean).join(' · '))),
      vPill));
    const applyBtn = btn('Apply update', {sm:true, danger:true, onclick:()=>{
      updConfirm.replaceChildren(H.h('div.settings-confirm-inline',
        H.h('div.s', '`hermes update` stops the gateway, replaces the install and starts it again. This page reconnects when it is back.'),
        btn('Update now', {sm:true, danger:true, onclick:async () => {
          updConfirm.replaceChildren();
          fstate(updStatus, 'dirty', 'Starting update…');
          try {
            const r = await H.api.post('/api/hermes/update', {});
            if (r && r.ok === false){ fstate(updStatus, 'err', r.message || r.error || 'Update refused'); return; }
            fstate(updStatus, 'dirty', 'Updating · ' + (r && r.pid ? 'pid ' + r.pid : 'running'));
            const a = await pollAction('hermes-update', 300);
            fstate(updStatus, a && a.exit_code ? 'err' : 'ok', a && a.exit_code ? 'Update exited ' + a.exit_code : 'Update finished');
            setTimeout(refresh, 2000);
          } catch (e){ fstate(updStatus, 'err', 'Update failed · ' + e.message); }
        }}),
        btn('Cancel', {sm:true, ghost:true, onclick:()=>updConfirm.replaceChildren()})));
    }});
    if (upd && upd.can_apply === false){
      applyBtn.disabled = true;
      applyBtn.title = upd.message || 'This install cannot update in place; use its package manager.';
    }
    vBody.append(H.h('div.settings-inline-field',
      btn('Check for updates', {sm:true, onclick:async () => {
        try { live.update = await H.api.get('/api/hermes/update/check?force=true'); paint(); H.toast(live.update.message || 'Update check finished'); }
        catch (e){ H.toast('Couldn’t check: ' + e.message); }
      }}),
      applyBtn));
    vBody.append(updConfirm);
    vBody.append(H.h('div.settings-hintline', (upd && upd.message) || '`hermes update` uses the same check.'));
    out.push(srow('Version', 'Installed build and update channel.', 'updates',
      card(H.h('span.settings-grow','Update channel'), bodyBox(vBody, updStatus))));

    /* gateway */
    const gw = st.gateway_state || (st.gateway_running ? 'running' : 'stopped');
    const running = gw === 'running';
    const gwHost = H.h('div');
    const gwStatus = H.h('span.settings-fstate');
    const confirmBox = H.h('div');
    const gwBody = H.h('div.settings-gateway',
      H.h('div.settings-gateway-top',
        H.h('div.settings-grow',
          H.h('div.settings-gateway-status', H.h('span.dot' + (running ? '.live' : '')),
            H.h('span.t','hermes-gateway'),
            running ? pill('Running','pos') : pill(gw,'')),
          H.h('div.s', 'pid ' + (st.gateway_pid || '–') + ' · mode ' + (st.gateway_mode || 'single') + ' · shared with ' + ((st.gateway_shared_with || []).join(', ') || 'this profile'))),
        H.h('div.settings-actions', H.h('div.settings-cfgfield-top', gwStatus))),
      confirmBox);
    const restart = btn('Restart', {sm:true, onclick:()=>{
      confirmBox.replaceChildren(H.h('div.settings-confirm-inline',
        H.h('div.s','Restarting stops the gateway for a few seconds. Live sessions are interrupted.'),
        btn('Restart now', {sm:true, danger:true, onclick:async () => {
          confirmBox.replaceChildren();
          fstate(gwStatus, 'dirty', 'Restarting…');
          try { await H.api.post('/api/gateway/restart'); H.toast('Gateway restarting'); const a = await pollAction('gateway-restart', 60);
            fstate(gwStatus, a && a.exit_code ? 'err' : 'ok', a && a.exit_code ? 'Restart exited ' + a.exit_code : 'Restart issued');
            setTimeout(refresh, 1500);
          } catch (e){ fstate(gwStatus, 'err', 'Failed · ' + e.message); }
        }}),
        btn('Cancel', {sm:true, ghost:true, onclick:()=>confirmBox.replaceChildren()})));
    }});
    gwBody.querySelector('.settings-actions').appendChild(restart);
    gwBody.querySelector('.settings-actions').appendChild(btn(running ? 'Stop' : 'Start', {sm:true, onclick:async () => {
      try {
        await H.api.post(running ? '/api/gateway/stop' : '/api/gateway/start');
        H.toast(running ? 'Gateway stopping' : 'Gateway starting');
        setTimeout(refresh, 1200);
      } catch (e){ H.toast('Couldn’t ' + (running ? 'stop' : 'start') + ': ' + e.message); }
    }}));
    out.push(srow('Gateway service', 'The canonical writer of `state.db`. Restart applies config changes.', 'gateway',
      card(null, bodyBox(gwBody))));

    /* backups */
    const bHead = H.h('span.settings-grow','Backups');
    const bBox = H.h('div.settings-backups');
    const bStatus = H.h('span.settings-fstate');
    out.push(srow('Backups', '`hermes backup` writes one zip with the database image, config and profile home.', 'backup',
      card(bHead, bodyBox(bBox, H.h('div.settings-actions',
        btn('Back up now', {sm:true, icon:'archive', onclick:async () => {
          fstate(bStatus, 'dirty', 'Backing up…');
          try {
            const r = await H.api.post('/api/ops/backup', {});
            fstate(bStatus, 'dirty', 'Backup running · ' + ((r && r.archive) || ''));
            const a = await pollAction('backup', 240);
            fstate(bStatus, a && a.exit_code ? 'err' : 'ok', a && a.exit_code ? 'Backup exited ' + a.exit_code : 'Backup finished');
            loadBackups().then(paintBackups);
          } catch (e){ fstate(bStatus, 'err', 'Backup failed · ' + e.message); }
        }}),
        disabledBtn('Download', 'A download link cannot carry the session token, so the archive is opened from the host instead.'),
        bStatus)))));
    function paintBackups(){
      bBox.replaceChildren();
      if (live.backupErr){ bBox.appendChild(liveFail(live.backupErr, ()=>loadBackups().then(paintBackups), 'backups')); return; }
      if (!live.backups){ bBox.appendChild(liveLoading()); return; }
      bHead.textContent = live.backups.length + ' archives in ~/.hermes/backups';
      if (!live.backups.length){ bBox.appendChild(liveEmpty('No backup archives yet.')); return; }
      live.backups.slice().sort((a, b) => String(b.name).localeCompare(String(a.name))).forEach(f => {
        const confirming = state.restoreId === f.name;
        const actions = H.h('div.settings-actions');
        if (confirming){
          actions.appendChild(btn('Restore', {sm:true, danger:true, onclick:async () => {
            fstate(bStatus, 'dirty', 'Restoring…');
            try {
              await H.api.post('/api/ops/import', {archive:f.path, force:true});
              state.restoreId = null;
              fstate(bStatus, 'dirty', 'Import running · this replaces state.db');
              const a = await pollAction('import', 240);
              fstate(bStatus, a && a.exit_code ? 'err' : 'ok', a && a.exit_code ? 'Import exited ' + a.exit_code : 'Import finished');
              refresh();
            } catch (e){ fstate(bStatus, 'err', 'Restore failed · ' + e.message); }
          }}));
          actions.appendChild(btn('Cancel', {sm:true, ghost:true, onclick:()=>{ state.restoreId = null; paintBackups(); }}));
        } else {
          actions.appendChild(btn('Restore', {sm:true, onclick:()=>{ state.restoreId = f.name; paintBackups(); }}));
        }
        bBox.appendChild(H.h('div.settings-backup',
          H.h('div.settings-grow', H.h('div.mono.t', f.name), H.h('div.s', fmtBytes(f.size) + (f.mtime ? ' · ' + fmtAgo(f.mtime) : '')),
            confirming ? H.h('div.settings-health-explain','Restores replace state.db, -wal and -shm together. Stop the gateway first.') : null),
          pill('Archive','pos'), actions));
      });
    }
    loadBackups().then(paintBackups);

    /* state database + host */
    out.push(srow('State database', 'One SQLite image: `state.db`, `-wal` and `-shm`. Never copy the database file on its own.', 'database',
      card('state.db', bodyBox(
        H.h('div.settings-deflist',
          kv('Config schema', (st.config_version != null ? 'v' + st.config_version : '–') + (st.latest_config_version != null ? ' · latest v' + st.latest_config_version : '')),
          kv('Hermes home', H.h('span.mono', st.hermes_home || '–')),
          kv('Config', H.h('span.mono', st.config_path || '–')),
          kv('Env', H.h('span.mono', st.env_path || '–'))),
        H.h('div.settings-actions',
          disabledBtn('Optimize', 'Optimize and repair require every Hermes process stopped; run `hermes sessions optimize` after `hermes gateway stop`.'),
          disabledBtn('Repair', 'Repair is a CLI-only operation (`hermes sessions repair`) and must run with zero database holders.')),
        note('Repair and optimize are refused while the gateway, dashboard or Desktop hold the database. Quiesce first.', 'warn')))));

    out.push(srow('Host', 'Read from /api/system/stats.', 'system.stats',
      card(null, bodyBox(H.h('div.settings-deflist',
        kv('OS', (stats.os || '–') + ' · ' + (stats.arch || '–')),
        kv('Hostname', stats.hostname || '–'),
        kv('CPU', stats.cpu_count != null ? stats.cpu_count + ' cores · ' + (stats.load_avg ? stats.load_avg.map(n => n.toFixed(2)).join(' ') : '–') : '–'),
        kv('Memory', stats.memory ? fmtBytes(stats.memory.used) + ' of ' + fmtBytes(stats.memory.total) + ' (' + stats.memory.percent + '%)' : '–'),
        kv('Disk', stats.disk ? fmtBytes(stats.disk.free) + ' free of ' + fmtBytes(stats.disk.total) : '–'),
        kv('Uptime', stats.uptime_seconds != null ? Math.round(stats.uptime_seconds / 3600) + 'h' : '–')),
        H.h('div.settings-actions',
          disabledBtn('Pause all agents', 'No dashboard endpoint pauses every agent; stop the gateway or use the Approvals view instead.'))))));

    out.push(srow('Terminal', 'The terminal is a tab in the workspace, never the default surface. It opens on the active thread.', 'display.terminal',
      card(null, bodyBox(H.h('div.settings-terminal-row',
        H.h('div.settings-grow', H.h('div.t','Open a terminal tab'), H.h('div.s','Same profile, same worktree, same environment as the thread.')),
        btn('Open the terminal', {ghost:true, icon:'terminal', onclick:()=>{ env.ctx.go('#/thread/t-ui'); env.toast('Terminal tab opened'); }}))))));

    main.replaceChildren(...out);
  }

  async function refresh(){ await loadSystem(); paint(); }
  rows.replaceChildren(liveLoading());
  refresh();
  return rows;
}

/* ---------- live: 9. Advanced ---------- */
function buildAdvancedLive(env){
  const rows = H.h('div.settings-rows');
  const host = H.h('div');

  function paint(){
    host.replaceChildren();
    if (live.yamlErr){ host.appendChild(liveFail(live.yamlErr, load, 'config.yaml')); return; }
    if (live.yaml == null){ host.appendChild(liveLoading('Reading config.yaml…')); return; }
    const ta = H.h('textarea.textarea.settings-yaml', {spellcheck:'false', 'aria-label':'config.yaml contents', rows:'26'});
    ta.value = live.yaml;
    const saved = live.yaml;
    const result = H.h('div.settings-result');
    const confirmHost = H.h('div');
    let validating = false;

    function setResult(tone, label, text){
      result.replaceChildren(tone ? pill(label, tone) : H.h('span.pill', label), H.h('span.settings-result-txt', text));
    }
    setResult(null, 'Not validated', 'Saving replaces the whole file. The server parses it first and rejects invalid YAML.');
    ta.oninput = () => { setResult(null, 'Unsaved', 'Saving replaces the whole file.'); };
    function currentText(){ return ta.value; }

    const save = btn('Save config.yaml', {sm:true, primary:true, onclick:()=>{
      confirmHost.replaceChildren(H.h('div.settings-confirm-inline',
        H.h('div.s', 'This replaces the whole config.yaml for this profile. A malformed file cannot be saved; a valid one applies immediately and the gateway reloads it.'),
        btn('Save anyway', {sm:true, danger:true, onclick:doSave}),
        btn('Cancel', {sm:true, ghost:true, onclick:()=>confirmHost.replaceChildren()})));
    }});
    async function doSave(){
      confirmHost.replaceChildren();
      if (validating) return;
      validating = true;
      save.disabled = true; save.textContent = 'Saving…';
      try {
        await H.api.put('/api/config/raw', {yaml_text:currentText()});
        live.yaml = currentText(); live.yamlSaved = live.yaml;
        setResult('pos', 'Saved', 'config.yaml written · the gateway reloads it on the next turn.');
        H.toast('config.yaml saved');
        save.disabled = false; save.textContent = 'Save config.yaml';
      } catch (e){
        setResult('neg', 'Not saved', e.message);
        H.toast('config.yaml not saved: ' + e.message);
        save.disabled = false; save.textContent = 'Save config.yaml';
      } finally { validating = false; }
    }

    const search = H.h('input.input.settings-search', {type:'search', placeholder:'Find a key or value', 'aria-label':'Find in config.yaml'});
    const count = H.h('span.settings-searchcount', (live.yaml || '').split('\n').length + ' lines');
    search.oninput = () => {
      const q = search.value.trim().toLowerCase();
      if (!q) { count.textContent = ta.value.split('\n').length + ' lines'; return; }
      const lines = ta.value.split('\n');
      const idx = lines.findIndex(l => l.toLowerCase().indexOf(q) >= 0);
      if (idx < 0){ count.textContent = 'No matches'; return; }
      const off = lines.slice(0, idx).join('\n').length + (idx ? 1 : 0);
      ta.focus(); ta.setSelectionRange(off, off + lines[idx].length);
      ta.scrollTop = Math.max(0, idx * 20 - 60);
      count.textContent = 'Line ' + (idx + 1) + ' · ' + lines.length + ' total';
    };
    search.onkeydown = e => { if (e.key === 'Escape'){ search.value = ''; search.oninput(); } };

    const editor = card(
      H.h('span.settings-grow', H.h('span','config.yaml'), H.h('span.settings-editor-path',' · ' + (live.yamlPath || '–'))),
      H.h('div.settings-editorwrap',
        H.h('div.settings-editorbar', H.h('span.settings-searchwrap', H.ic('search','sm'), search), count,
          btn('Reload from disk', {sm:true, ghost:true, onclick:()=>load().then(paint)})),
        H.h('div.settings-liveeditor', ta),
        H.h('div.settings-editorfoot', H.h('span.s','UTF-8 · LF · full-document replacement'), result)),
      null);
    host.append(editor, confirmHost, H.h('div.settings-actions', H.h('div.grow'),
      btn('Discard changes', {sm:true, ghost:true, onclick:()=>{ ta.value = live.yaml; setResult(null,'Not validated','Nothing is written until you save.'); }}),
      save));
    host.append(note('Prefer `hermes config set` for single keys. Edit YAML by hand only for literals and structure the form cannot express; the whole file is replaced on save.', 'info', 'info'));
  }

  async function load(){
    try {
      const d = await H.api.get('/api/config/raw');
      live.yaml = typeof d.yaml === 'string' ? d.yaml : '';
      live.yamlPath = d.path || null;
      live.yamlErr = null;
    } catch (e){ live.yamlErr = e; live.yaml = null; }
  }

  rows.replaceChildren(host);
  load().then(paint);
  rows.appendChild(srow('Managed pins', 'Leaf keys pinned by a sysadmin override the profile in every mode.', '/etc/hermes/*',
    card(H.h('span.settings-grow','Managed scope'), bodyBox(
      H.h('div.empty','Overrides under /etc/hermes are not exposed by the dashboard API.'),
      note('If this host is managed, pinned leaves win over config.yaml. Check with `hermes config check` before editing a key that does not stick.', 'info', 'info')))));
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
      if (LIVE){ profilePill.replaceChildren(H.h('span.dot.pos'), (live.active || H.api.profile || 'default') + ' profile'); return; }
      profilePill.replaceChildren(H.h('span.dot.pos'), state.activeProfile + ' profile');
    }
    paintProfilePill();
    const machine = H.h('div.settings-machine', LIVE ? 'Reading host status…' : 'Ubuntu 24.04 · arm64 · gateway :9119 · Python 3.14.2');
    if (LIVE){
      managedBtn.hidden = true;
      H.api.try(() => H.api.get('/api/profiles/active'), null).then(d => {
        if (d && d.active){ live.active = d.active; paintProfilePill(); }
      });
      H.api.try(async () => {
        const [st, stats] = await Promise.all([H.api.get('/api/status'), H.api.get('/api/system/stats')]);
        return {st, stats};
      }, null).then(d => {
        if (!d) { machine.textContent = 'Host status unavailable'; return; }
        const s = d.stats || {}, st = d.st; 
        machine.textContent = [s.os ? s.os + ' ' + String(s.os_release || '').split('-')[0] : null, s.arch,
          st.gateway_running ? 'gateway running' : 'gateway stopped',
          s.python_version ? 'Python ' + s.python_version : null,
          st.version ? 'Hermes ' + st.version : null].filter(Boolean).join(' · ');
      });
    }

    const head = H.h('div.page-head.settings-head',
      H.h('div.settings-headtxt',
        H.h('h1','Settings'),
        H.h('p', LIVE ? 'Every knob for this profile. The gateway, Desktop and CLI read the same config.yaml.'
          : 'Every knob for the default profile. The gateway, Desktop and CLI read the same config.yaml.'),
        machine),
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
