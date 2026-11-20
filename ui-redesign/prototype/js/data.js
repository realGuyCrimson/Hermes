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

/* Live mode: never show sample content as if it were real. Loaders in js/live*.js fill these arrays in place. */
if (H.live) { ['agents','projects','threads','inbox'].forEach(k => { H.data[k].length = 0; }); H.data.gateway = {state:'unknown', sessions:0, platforms:[]}; }
