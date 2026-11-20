/* Channels · where Hermes meets people and other systems.
   Tabs: platforms · people · endpoints · peers.
   H.live === false: sample data lives in this file, exactly as before.
   H.live === true: real data from /api/messaging/platforms, /api/status, /api/pairing,
   /api/webhooks and /api/config; sample content is never painted in live mode. */
(function(){
const H = window.H;
const LIVE = H.live;

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

const SAMPLE_PLATFORMS = [
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

const SAMPLE_PEOPLE_PENDING = [
  {code:'K7M-4QX', platform:'Telegram', name:'Marta Nowak',   handle:'@marta_n',  at:'4m ago'},
  {code:'B3T-9WD', platform:'WhatsApp', name:'Unknown sender', handle:'+1 ••• ••• 4417', at:'19m ago'},
  {code:'Q2F-8HN', platform:'Discord',  name:'#build-alerts', handle:'channel · 6 members', at:'1h ago'}
];

const SAMPLE_PEOPLE = [
  {id:'p1', name:'Ana Ruiz',    handle:'@anaruiz',  platform:'Telegram', agent:'hermes', role:'Owner',  last:'2m ago'},
  {id:'p2', name:'Jonas Weber', handle:'@jwbr',     platform:'Slack',    agent:'ledger', role:'Member', last:'41m ago'},
  {id:'p3', name:'Priya Nair',  handle:'@priya',    platform:'WhatsApp', agent:'hermes', role:'Member', last:'3h ago'},
  {id:'p4', name:'Marco Silva', handle:'@marco:matrix.org', platform:'Matrix', agent:'scout', role:'Member', last:'Yesterday'},
  {id:'p5', name:'#ops-room',   handle:'channel',   platform:'Discord',  agent:'ledger', role:'Member', last:'18m ago'}
];

const SAMPLE_ENDPOINTS = [
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

const SAMPLE_PEERS = [
  {id:'yggdrasil', host:'yggdrasil.local:9119', agent:'Hermes', trust:'trusted', last:'2m ago',
   reply:'Confirmed from yggdrasil. Last backup finished 04:12 with exit 0; the mirror is 214 MB.'},
  {id:'studio', host:'studio-mini.lan:9119', agent:'Scout', trust:'trusted', last:'26m ago',
   reply:'Scout here. I have three cached sources on arm64 Chromium sandboxing · say the word and I’ll send the list.'},
  {id:'metal', host:'metal-02.lan:9119', agent:'Ledger', trust:'pending', last:'3h ago',
   reply:'Pairing is still pending on this side.'},
  {id:'nuc', host:'old-nuc.lan:9119', agent:'Hermes', trust:'revoked', last:'4d ago',
   reply:'Trust has been revoked.'}
];

/* Live mode starts empty: the loaders below fill these in place. The SAMPLE_* arrays
   above stay untouched and back the artifact preview (H.live === false). */
const PLATFORMS = LIVE ? [] : SAMPLE_PLATFORMS;
const PEOPLE_PENDING = LIVE ? [] : SAMPLE_PEOPLE_PENDING;
const PEOPLE = LIVE ? [] : SAMPLE_PEOPLE;
const ENDPOINTS = LIVE ? [] : SAMPLE_ENDPOINTS;
const PEERS = LIVE ? [] : SAMPLE_PEERS;

const AGENT_IDS = ['hermes','scout','ledger'];

const S = {
  root:null, ctx:null, tab:'platforms', q:'', filter:'all',
  openId:null, drawerEl:null, scrimEl:null, drawerTrigger:null,
  confirmRestart:false, restarting:false, uptime:'6d 4h',
  pending:PEOPLE_PENDING.map(x => Object.assign({}, x)),
  people:PEOPLE.map(x => Object.assign({}, x)),
  epSel:'api', apiProfile:'default', warnOpen:false, clearConfirm:false, liveDelRoute:null,
  apiKeys:[
    {id:'k1', name:'cli-laptop',    masked:'hrms_••••••7f2a', created:'Nov 12', last:'2h ago'},
    {id:'k2', name:'nightly-backup',masked:'hrms_••••••1c04', created:'Oct 28', last:'Yesterday'}
  ],
  peerId:'yggdrasil', peerTyping:null,
  chats:{ yggdrasil:[{from:'them', text:'Backup mirror is current (214 MB, 3,912 files). Nothing queued.'}] }
};
let timers = [];

/* =====================================================================
   LIVE LAYER
   Shapes from web/src/lib/api-messaging.ts, api-webhooks.ts and
   hermes_cli/web_routers/{messaging,ops,actions}.py. GETs only at load;
   every write goes through the same endpoint the old dashboard used.
   ===================================================================== */
const PLATFORM_ICON = {
  telegram:'send', discord:'chat', slack:'hash', whatsapp:'at', whatsapp_cloud:'at',
  signal:'radio', matrix:'hash', email:'inbox', sms:'radio', bluebubbles:'chat',
  mattermost:'chat', teams:'users', feishu:'layers', wecom:'users', wecom_callback:'users',
  weixin:'chat', qqbot:'chat', dingtalk:'chat', line:'at', irc:'hash',
  api_server:'plug', webhook:'webhook', a2a:'link', relay:'route',
  msgraph_webhook:'webhook', imessage:'chat'
};

const live = {
  platforms:{loaded:false, loading:false, error:null, gen:0},
  status:null, statusError:null, gatewayCmd:'',
  pairing:{loaded:false, loading:false, error:null, gen:0},
  hooks:{loaded:false, loading:false, error:null, gen:0, enabled:false, baseUrl:'', routes:[]},
  peers:{loaded:false, loading:false, error:null, gen:0, available:false}
};

function liveMsg(e){ return (e && e.message) || 'Request failed'; }

function parseTs(v){
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') { const ms = v > 1e12 ? v : v * 1000; return new Date(ms); }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}
function relTime(v){
  const d = parseTs(v);
  if (!d) return '–';
  const s = Math.max(0, Math.round((Date.now() - d.getTime()) / 1000));
  if (s < 60) return 'just now';
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  if (s < 604800) return Math.round(s / 86400) + 'd ago';
  return d.toLocaleDateString('en-GB', {day:'numeric', month:'short'});
}

function fromApiPlatform(raw){
  const env = Array.isArray(raw.env_vars) ? raw.env_vars : [];
  const required = env.filter(v => v.required);
  const token = required.find(v => v.is_password) || required[0] || env[0] || null;
  const home = raw.home_channel || null;
  return {
    id:raw.id, name:raw.name || raw.id,
    icon:PLATFORM_ICON[raw.id] || 'plug',
    _live:true, api:raw,
    apiState:String(raw.state || ''),
    enabled:!!raw.enabled, configured:!!raw.configured, gatewayRunning:!!raw.gateway_running,
    description:raw.description || '', docsUrl:raw.docs_url || '',
    error:raw.error_message || '', errorCode:raw.error_code || '',
    tokenEnv:token ? token.key : '', tokenLabel:token ? (token.prompt || token.key) : 'credential',
    envVars:env,
    setCount:env.filter(v => v.is_set).length, totalCount:env.length,
    home:home ? (home.name || home.chat_id || 'set') : 'not set',
    homeChannel:home,
    handle:home ? (home.name || home.chat_id || '') : '',
    ingressUrl:raw.ingress_url || '',
    relayFronted:!!raw.relay_fronted, relayExclusive:!!raw.relay_exclusive,
    disabledByRelay:!!raw.disabled_by_relay,
    updatedAt:raw.updated_at || null,
    allowed:[], activity:[], opts:{}, chats:0, unit:'chats', last:relTime(raw.updated_at)
  };
}

function fromApiPending(r){
  return {
    id:String(r.request_id || (r.platform + ':' + r.user_id)),
    requestId:String(r.request_id || ''),
    platform:String(r.platform || ''),
    name:r.user_name || r.user_id || 'Unknown sender',
    handle:r.user_id || '',
    at:typeof r.age_minutes === 'number' ? r.age_minutes + 'm ago' : '–'
  };
}
function fromApiApproved(r){
  return {
    id:String(r.platform || '') + ':' + String(r.user_id || ''),
    platform:String(r.platform || ''),
    userId:String(r.user_id || ''),
    name:r.user_name || r.user_id || 'Unknown user',
    handle:r.user_id || '',
    approvedAt:relTime(r.approved_at)
  };
}
function fromApiRoute(r){
  return {
    name:r.name, description:r.description || '', events:Array.isArray(r.events) ? r.events : [],
    deliver:r.deliver || 'log', deliverOnly:!!r.deliver_only, prompt:r.prompt || '',
    secretSet:!!r.secret_set, enabled:r.enabled !== false, url:r.url || '',
    signature:r.signature || null, createdAt:r.created_at || null
  };
}

function livePad(text, detail, retry){
  return H.h('div.empty.channels-livepad',
    H.h('div', text),
    detail ? H.h('div.muted', detail) : null,
    retry ? H.h('button.btn.sm', {onclick: retry}, 'Retry') : null
  );
}
function liveErr(title, e, retry){ return livePad(title, liveMsg(e), retry); }

/* GET /api/messaging/platforms (+ /api/status for the gateway strip and state). */
async function loadPlatforms(){
  if (!LIVE) return;
  const gen = ++live.platforms.gen;
  live.platforms.loading = true;
  live.platforms.error = null;
  try {
    const d = await H.api.get('/api/messaging/platforms');
    if (gen !== live.platforms.gen) return;
    let st = null;
    try { st = await H.api.get('/api/status'); } catch (e) { live.statusError = liveMsg(e); st = null; }
    if (gen !== live.platforms.gen) return;
    if (st) { live.status = st; live.statusError = null; }
    live.gatewayCmd = d.gateway_start_command || '';
    PLATFORMS.length = 0;
    (d.platforms || []).forEach(raw => PLATFORMS.push(fromApiPlatform(raw)));
    live.platforms.loaded = true;
    buildLiveEndpoints();
  } catch (e) {
    if (gen !== live.platforms.gen) return;
    live.platforms.error = liveMsg(e);
  } finally {
    if (gen === live.platforms.gen) { live.platforms.loading = false; repaintPage(); }
  }
}

/* GET /api/pairing -> pending + approved lists. */
async function loadPairing(){
  if (!LIVE) return;
  const gen = ++live.pairing.gen;
  live.pairing.loading = true;
  live.pairing.error = null;
  try {
    const d = await H.api.get('/api/pairing');
    if (gen !== live.pairing.gen) return;
    PEOPLE_PENDING.length = 0;
    (d.pending || []).forEach(r => PEOPLE_PENDING.push(fromApiPending(r)));
    PEOPLE.length = 0;
    (d.approved || []).forEach(r => PEOPLE.push(fromApiApproved(r)));
    live.pairing.loaded = true;
  } catch (e) {
    if (gen !== live.pairing.gen) return;
    live.pairing.error = liveMsg(e);
  } finally {
    if (gen === live.pairing.gen) { live.pairing.loading = false; repaintPage(); }
  }
}

/* GET /api/webhooks -> receiver flag, base URL and routes. */
async function loadWebhooks(){
  if (!LIVE) return;
  const gen = ++live.hooks.gen;
  live.hooks.loading = true;
  live.hooks.error = null;
  try {
    const d = await H.api.get('/api/webhooks');
    if (gen !== live.hooks.gen) return;
    live.hooks.enabled = !!d.enabled;
    live.hooks.baseUrl = d.base_url || '';
    live.hooks.routes = (d.subscriptions || []).map(fromApiRoute);
    live.hooks.loaded = true;
    buildLiveEndpoints();
  } catch (e) {
    if (gen !== live.hooks.gen) return;
    live.hooks.error = liveMsg(e);
  } finally {
    if (gen === live.hooks.gen) { live.hooks.loading = false; repaintPage(); }
  }
}

/* Peers have no REST surface; config.yaml's bot_peers is readable through /api/config. */
async function loadPeers(){
  if (!LIVE) return;
  live.peers.loading = true;
  live.peers.error = null;
  try {
    const cfg = await H.api.get('/api/config');
    const map = cfg && cfg.bot_peers;
    live.peers.available = !!map && typeof map === 'object' && !Array.isArray(map);
    PEERS.length = 0;
    Object.keys(map || {}).forEach(name => {
      const e = (map[name] && typeof map[name] === 'object') ? map[name] : {};
      PEERS.push({id:name, host:e.url || '(no URL)', agent:name, trust:'configured', note:e.note || '', last:'–', reply:''});
    });
    live.peers.loaded = true;
  } catch (e) {
    live.peers.error = liveMsg(e);
  } finally {
    live.peers.loading = false;
    repaintPage();
  }
}

/* Listener rows come from the platform catalog + /api/webhooks; nothing is invented. */
function buildLiveEndpoints(){
  if (!LIVE) return;
  const rows = [];
  const host = (typeof location !== 'undefined' && location.host) ? location.host : 'this browser';
  const origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
  rows.push({
    id:'dashboard', name:'Dashboard', bind:host, exposure:'This browser', exposureTone:'',
    auth:'Session token or sign-in cookie', enabled:true, url:origin + (H.api.base || ''),
    lead:'The dashboard you are using now.', liveKind:'dashboard'
  });
  [['api_server', 'Bearer key (API_SERVER_KEY)'], ['a2a', 'Bearer token'], ['webhook', 'HMAC signature per route']].forEach(([id, auth]) => {
    const p = PLATFORMS.find(x => x.id === id);
    if (!p) return;
    const url = id === 'webhook' ? (live.hooks.baseUrl || '') : (p.ingressUrl || '');
    rows.push({
      id:id, name:p.name, bind:url || 'set in .env', exposure:'Gateway platform', exposureTone:'',
      auth:auth, enabled: id === 'webhook' ? !!live.hooks.enabled : !!p.enabled, url:url,
      lead:p.description, platform:p, liveKind:'platform'
    });
  });
  ENDPOINTS.length = 0;
  rows.forEach(r => ENDPOINTS.push(r));
  if (!ENDPOINTS.some(e => e.id === S.epSel)) S.epSel = ENDPOINTS.length ? ENDPOINTS[0].id : '';
}

function ensureLiveData(tab){
  if (!LIVE) return;
  if (!live.platforms.loaded && !live.platforms.loading) loadPlatforms();
  if (tab === 'people' && !live.pairing.loaded && !live.pairing.loading) loadPairing();
  if (tab === 'endpoints' && !live.hooks.loaded && !live.hooks.loading) loadWebhooks();
  if (tab === 'peers' && !live.peers.loaded && !live.peers.loading) loadPeers();
}

/* Mutation calls, exactly the shapes web/src/lib/api.ts and the routers use.
   Kept together so the mocked-fetch test can exercise every write. */
const liveApi = {
  saveEnv: (id, key, value) => H.api.put('/api/messaging/platforms/' + encodeURIComponent(id), {env:{[key]:value}}),
  clearEnv: (id, key) => H.api.put('/api/messaging/platforms/' + encodeURIComponent(id), {clear_env:[key]}),
  setEnabled: (id, enabled) => H.api.put('/api/messaging/platforms/' + encodeURIComponent(id), {enabled:!!enabled}),
  testPlatform: (id) => H.api.post('/api/messaging/platforms/' + encodeURIComponent(id) + '/test'),
  approve: (platform, requestId) => H.api.post('/api/pairing/approve', {platform:platform, request_id:requestId}),
  revoke: (platform, userId) => H.api.post('/api/pairing/revoke', {platform:platform, user_id:userId}),
  clearPending: () => H.api.post('/api/pairing/clear-pending'),
  enableWebhooks: () => H.api.post('/api/webhooks/enable'),
  setWebhookEnabled: (name, enabled) => H.api.put('/api/webhooks/' + encodeURIComponent(name) + '/enabled', {enabled:!!enabled}),
  deleteWebhook: (name) => H.api.del('/api/webhooks/' + encodeURIComponent(name)),
  restartGateway: () => H.api.post('/api/gateway/restart')
};

/* Mutation wrappers: reload the real read after success, toast on either outcome. */
async function doPlatformWrite(what, fn, okMsg){
  try {
    const r = await fn();
    toast(okMsg || (what + ' saved'));
    await loadPlatforms();
    if (S.openId) rerenderDrawer();
    return r;
  } catch (e) {
    toast(what + ' failed · ' + liveMsg(e));
    repaintPage();
    if (S.openId) rerenderDrawer();
    return null;
  }
}

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
  if (LIVE && p._live) {
    const err = p.error ? ' · ' + p.error : '';
    const s = p.apiState;
    if (p.disabledByRelay) return {text:'Off · served by the relay', tone:'', dot:''};
    if (s === 'connected') return {text:'Connected', tone:'pos', dot:'pos'};
    if (s === 'disabled') return {text:'Off', tone:'', dot:''};
    if (s === 'not_configured') return {text:'Needs setup', tone:'warn', dot:'warn'};
    if (s === 'pending_restart') return {text:'Saved · restart the gateway to apply', tone:'warn', dot:'warn'};
    if (s === 'gateway_stopped') return {text:'Gateway stopped', tone:'', dot:''};
    if (s === 'startup_failed') return {text:'Start failed' + err, tone:'neg', dot:'neg'};
    if (s === 'disconnected') return {text:'Disconnected' + err, tone:'neg', dot:'neg'};
    return {text:(s || 'Unknown state') + err, tone:err ? 'neg' : '', dot:err ? 'neg' : ''};
  }
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
  ensureLiveData(S.tab);
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
  const sub = LIVE
    ? (live.platforms.loaded
        ? PLATFORMS.length + ' messaging platforms · ' + PLATFORMS.filter(p => p.apiState === 'connected').length + ' connected · pairing, listeners and peers from this Hermes.'
        : 'Messaging platforms, pairing, listeners and peers from this Hermes.')
    : 'Where Hermes meets people and other systems · 25+ messaging platforms, DM pairing, local listeners and peer gateways.';
  return H.h('div.page-head.channels-page-head',
    H.h('div',
      H.h('h1', 'Channels'),
      H.h('p', sub)
    ),
    H.h('div.grow'),
    H.h('button.btn.primary', {
      onclick: openConnectDialog,
      disabled: LIVE && !live.platforms.loaded,
      title: LIVE && !live.platforms.loaded ? 'Loading platforms…' : ''
    }, H.ic('plus','sm'), 'Connect a platform')
  );
}

function gatewayStrip(){
  if (LIVE) return gatewayStripLive();
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

function gatewayStripLive(){
  const wrap = H.h('div.channels-gw');
  if (S.restarting) {
    wrap.append(
      H.h('span.dot.warn'),
      H.h('strong', 'Restarting gateway…'),
      H.h('span.channels-gw-sep', '·'),
      H.h('span.muted', 'Live sessions resume on their own; this page reloads when it answers again.')
    );
    return wrap;
  }
  if (!live.platforms.loaded && !live.platforms.error) {
    wrap.append(H.h('span.dot'), H.h('span.muted', 'Loading gateway status…'));
    return wrap;
  }
  if (live.platforms.error) {
    wrap.append(
      H.h('span.dot.neg'),
      H.h('strong', 'Gateway status unavailable'),
      H.h('span.channels-gw-sep', '·'),
      H.h('span.muted', live.platforms.error),
      H.h('div.grow'),
      H.h('button.btn.ghost.sm', {onclick: loadPlatforms}, 'Retry')
    );
    return wrap;
  }
  const st = live.status || {};
  const running = !!st.gateway_running;
  const connected = PLATFORMS.filter(p => p.apiState === 'connected').length;
  const configured = PLATFORMS.filter(p => p.configured).length;
  wrap.append(
    H.h('div.channels-gw-main',
      H.h('span.dot' + (running ? '.pos' : '.warn')),
      H.h('strong', running ? 'Gateway running' : 'Gateway stopped'),
      H.h('span.channels-gw-sep', '·'),
      H.h('span.muted', (st.gateway_state || (running ? 'running' : 'stopped')) + (st.version ? ' · v' + st.version : '')),
      H.h('span.channels-gw-sep', '·'),
      H.h('span.muted', connected + ' connected · ' + configured + ' configured')
    ),
    H.h('div.grow'),
    H.h('button.btn.ghost.sm', {onclick: () => { S.confirmRestart = true; repaintPage(); }}, 'Restart gateway')
  );
  if (live.statusError) {
    wrap.appendChild(H.h('div.channels-gw-confirm',
      H.h('span.muted', 'Status request failed: ' + live.statusError)
    ));
  }
  if (S.confirmRestart) {
    wrap.appendChild(H.h('div.channels-gw-confirm',
      H.h('div.grow',
        H.h('div.channels-gw-ct', 'Restart the gateway now?'),
        H.h('div.channels-gw-cs', 'Live sessions pause for a moment and resume. Platform connections rebuild from .env.')
      ),
      H.h('button.btn.sm.danger', {onclick: async () => {
        S.confirmRestart = false; S.restarting = true; repaintPage();
        try {
          await liveApi.restartGateway();
          toast('Gateway restart requested');
        } catch (e) {
          toast('Restart failed · ' + liveMsg(e));
        }
        later(async () => { S.restarting = false; await loadPlatforms(); }, 3000);
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
  ensureLiveData(id);
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
  if (LIVE && live.platforms.error && !live.platforms.loaded) {
    return liveErr('Couldn’t load messaging platforms', live.platforms.error, loadPlatforms);
  }
  if (LIVE && !live.platforms.loaded) return livePad('Loading platforms…');
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
      const liveOn = LIVE ? p.apiState === 'connected' : (p.state === 'connected' && p.enabled);
      if (S.filter === 'connected' && !liveOn) return false;
      if (S.filter === 'off' && liveOn) return false;
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
  if (LIVE && p._live) return platformCardLive(p);
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

function platformCardLive(p){
  const st = statusOf(p);
  const card = H.h('div.channels-pcard', {role:'button', tabindex:'0', 'aria-label':p.name + ' · ' + st.text});
  card.append(
    H.h('div.channels-pcard-top',
      H.h('span.channels-picon', H.ic(p.icon, 'sm')),
      H.h('span.channels-pname.ellip', p.name),
      H.h('div.grow'),
      H.h('div.channels-switch-wrap', {onclick:e => e.stopPropagation()},
        H.sw(p.enabled, v => {
          doPlatformWrite('Enable ' + p.name, () => liveApi.setEnabled(p.id, v), p.name + (v ? ' enabled' : ' disabled'));
        }, 'Enable ' + p.name)
      )
    ),
    H.h('div.channels-pcard-state',
      H.h('span.dot' + (st.dot ? '.' + st.dot : ''), {style:{marginRight:'7px'}}),
      st.text
    ),
    H.h('div.channels-pcard-foot',
      H.h('span', p.totalCount ? p.setCount + ' of ' + p.totalCount + ' fields set' : 'No settings needed'),
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
  const open = PLATFORMS.filter(p => LIVE ? p.apiState !== 'connected' : p.state !== 'connected');
  const body = H.h('div.channels-picklist');
  body.appendChild(H.h('p.channels-dialog-note', open.length
    ? open.length + ' platforms are not connected yet. Pick one to open its setup guide.'
    : (LIVE ? 'No platforms are awaiting setup.' : 'Every platform is connected.')));
  if (open.length) {
    const list = H.h('div.channels-pick-rows');
    open.forEach(p => {
      const row = H.h('button.channels-pick', {type:'button'},
        H.h('span.channels-picon', H.ic(p.icon, 'sm')),
        H.h('span.grow',
          H.h('span.channels-pick-name', p.name),
          H.h('span.channels-pick-sub', LIVE
            ? (p.configured ? 'Saved · not connected yet' : 'Needs setup')
            : (p.state === 'token'
                ? 'Needs ' + article((p.tokenLabel || 'token').toLowerCase()) + ' ' + (p.tokenLabel || 'token').toLowerCase()
                : 'Off · set up to connect'))
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
  if (LIVE && p._live) return buildDrawerLive(p);
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

function buildDrawerLive(p){
  const st = statusOf(p);
  const body = H.h('div.channels-dr-body');

  if (p.error) {
    body.appendChild(H.h('div.channels-inline-warn',
      H.h('span.dot.neg'),
      H.h('span', p.error)
    ));
  }
  if (p.disabledByRelay) {
    body.appendChild(H.h('div.channels-dr-note',
      H.h('div.grow',
        H.h('div.channels-dr-note-t', 'Served by the Team Gateway relay'),
        H.h('div.channels-dr-note-s', 'The relay owns this platform, so a direct bot here would be switched off at every start.')
      )
    ));
  } else if (p.relayFronted) {
    body.appendChild(H.h('div.channels-dr-note',
      H.h('div.grow',
        H.h('div.channels-dr-note-t', 'Shared relay bot'),
        H.h('div.channels-dr-note-s', 'Links an account to the relay bot instead of running a direct bot for this platform.')
      )
    ));
  }

  body.appendChild(H.h('div.channels-dr-note',
    H.h('div.grow',
      H.h('div.channels-dr-note-t', p.enabled ? 'Enabled' : 'Off'),
      H.h('div.channels-dr-note-s', p.enabled
        ? (p.configured ? 'Hermes connects to this platform whenever the gateway runs.' : 'Saved, but required credentials are still missing.')
        : 'No messages are delivered while this platform is off.')
    ),
    H.sw(p.enabled, v => {
      doPlatformWrite('Enable ' + p.name, () => liveApi.setEnabled(p.id, v), p.name + (v ? ' enabled' : ' disabled'));
    }, 'Enable ' + p.name)
  ));

  /* credentials: real env_vars from the catalog; secrets show only the API mask */
  const creds = section('Credentials');
  creds.appendChild(H.h('div.channels-hint',
    'Values are written to ', H.h('code', '~/.hermes/.env'),
    '. A saved secret is shown only as the masked preview the API returns — this form never echoes it back.'
  ));
  const envList = H.h('div.channels-envlist');
  if (!p.envVars.length) envList.appendChild(H.h('div.channels-emptyline', 'This platform has no configurable settings.'));
  p.envVars.forEach(v => envList.appendChild(envRowLive(p, v)));
  creds.appendChild(envList);
  if (p.docsUrl) {
    creds.appendChild(H.h('div.channels-row-actions',
      H.h('a.btn.sm.ghost', {href:p.docsUrl, target:'_blank', rel:'noreferrer'}, H.ic('external','sm'), 'Setup docs')
    ));
  }
  body.appendChild(creds);

  /* home channel: read-only, there is no dashboard write endpoint */
  const home = section('Home channel');
  home.append(
    H.h('div.channels-secret',
      H.h('span.channels-masked', p.home),
      H.pill(p.homeChannel ? 'Set' : 'Missing', p.homeChannel ? 'pos' : 'warn')
    ),
    H.h('div.channels-hint', 'Where cron results and alerts land. It is set from the chat side; no dashboard endpoint writes it.')
  );
  body.appendChild(home);

  body.appendChild(testSectionLive(p));

  body.appendChild(section('People and chats',
    H.h('div.channels-hint', 'Allowlists are the *_ALLOWED_USERS settings above. Pairing requests are approved in the People tab.'),
    H.h('div.channels-row-actions',
      H.h('button.btn.sm.ghost', {onclick: () => {
        closeDrawer();
        S.tab = 'people';
        try { history.replaceState(null, '', '#/channels/people'); } catch (e) { /* file:// */ }
        paint();
        ensureLiveData('people');
      }}, 'Open People')
    )
  ));

  return H.h('aside.channels-drawer', {role:'dialog', 'aria-modal':'true', 'aria-label':p.name + ' settings'},
    H.h('div.channels-dr-head',
      H.h('div.grow',
        H.h('h2', p.name),
        H.h('div.channels-dr-sub',
          H.h('span.dot' + (st.dot ? '.' + st.dot : '')),
          H.h('span', st.text),
          H.h('span.channels-gw-sep', '·'),
          H.h('span', p.description || 'Messaging platform')
        )
      ),
      H.h('button.btn.icon.sm.ghost', {'data-close':'', 'aria-label':'Close ' + p.name + ' settings', onclick:closeDrawer}, H.ic('x','sm'))
    ),
    body
  );
}

/* One env var row: label, set/missing state, masked preview for secrets, inline editor. */
function envRowLive(p, v){
  const label = v.prompt || v.key;
  const row = H.h('div.channels-envrow');
  const line = H.h('div.channels-envrow-line',
    H.h('div.grow',
      H.h('div.channels-envrow-t', label, v.required ? H.h('span.channels-req', 'Required') : null),
      H.h('div.channels-envrow-s', v.description || v.key)
    )
  );
  row.appendChild(line);

  if (v.is_list) {
    const input = H.h('input.input', {value:v.value || '', placeholder:'comma-separated IDs', 'aria-label':label});
    const save = H.h('button.btn.sm', {onclick: async () => {
      const val = input.value.trim();
      if (!val) { input.focus(); return; }
      save.disabled = true;
      await doPlatformWrite('Save ' + label, () => liveApi.saveEnv(p.id, v.key, val), label + ' saved');
      save.disabled = false;
    }}, 'Save');
    const clear = H.h('button.btn.sm.ghost', {onclick: async () => {
      await doPlatformWrite('Clear ' + label, () => liveApi.clearEnv(p.id, v.key), label + ' cleared');
    }}, 'Clear');
    row.appendChild(H.h('div.channels-envrow-edit', input, save, clear));
  } else {
    const set = !!v.is_set;
    line.appendChild(H.pill(set ? 'Set' : (v.required ? 'Missing' : 'Not set'), set ? 'pos' : (v.required ? 'warn' : '')));
    if (set && v.is_password && v.redacted_value) {
      line.appendChild(H.h('span.mono.channels-masked', v.redacted_value));
    }
    const toggle = H.h('button.btn.sm', {onclick: () => {
      const f = row.querySelector('.channels-envform');
      if (f) { f.remove(); return; }
      row.appendChild(envFormLive(p, v, label));
    }}, set ? 'Replace…' : 'Add…');
    line.appendChild(toggle);
    if (set) {
      line.appendChild(H.h('button.btn.sm.ghost', {onclick: async () => {
        await doPlatformWrite('Clear ' + label, () => liveApi.clearEnv(p.id, v.key), label + ' cleared');
      }}, 'Clear'));
    }
  }
  return row;
}

function envFormLive(p, v, label){
  const form = H.h('div.channels-envform');
  const input = H.h('input.input', {
    type:v.is_password ? 'password' : 'text',
    placeholder:'Paste a new ' + label.toLowerCase(),
    autocomplete:'off', 'aria-label':'New ' + label
  });
  const save = H.h('button.btn.sm', {onclick: async () => {
    const val = input.value.trim();
    if (!val) { input.focus(); return; }
    save.disabled = true;
    await doPlatformWrite('Save ' + label, () => liveApi.saveEnv(p.id, v.key, val), label + ' saved');
    input.value = '';
    save.disabled = false;
  }}, 'Save');
  const cancel = H.h('button.btn.sm.ghost', {onclick: () => form.remove()}, 'Cancel');
  input.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); save.click(); } };
  form.append(input, H.h('div.channels-row-actions', save, cancel),
    H.h('div.channels-hint', 'Saved straight to .env. It is not displayed again.'));
  setTimeout(() => { try { input.focus(); } catch (e) {} }, 0);
  return form;
}

function testSectionLive(p){
  const s = section('Test connection');
  const out = H.h('div.channels-hint');
  const btn = H.h('button.btn.sm', {onclick: async () => {
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = 'Testing…';
    out.className = 'channels-hint';
    out.textContent = '';
    try {
      const r = await liveApi.testPlatform(p.id);
      out.textContent = r.message || (r.ok ? 'Connected.' : 'Not connected.');
      out.className = 'channels-hint ' + (r.ok ? 'channels-pos' : 'channels-neg');
    } catch (e) {
      out.textContent = liveMsg(e);
      out.className = 'channels-hint channels-neg';
    } finally {
      btn.disabled = false;
      btn.textContent = old;
    }
  }}, 'Test connection');
  s.append(
    H.h('div.channels-hint', 'Asks the gateway whether this platform is connected and authorised. It does not send a message.'),
    H.h('div.channels-row-actions',
      btn,
      H.h('button.btn.sm', {disabled:true, title:'Not available from the web yet · no dashboard endpoint sends a message'},
        H.ic('send','sm'), 'Send test message')
    ),
    out
  );
  return s;
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
function peoplePanelLive(){
  if (live.pairing.error && !live.pairing.loaded) {
    return liveErr('Couldn’t load pairing', live.pairing.error, loadPairing);
  }
  if (!live.pairing.loaded) return livePad('Loading pairing requests…');

  const wrap = H.h('div.channels-people');
  const inviteBtn = H.h('button.btn', {
    disabled:true,
    title:'Not available from the web yet · a pairing code is issued by the bot when someone DMs it'
  }, H.ic('key','sm'), 'Create invite code');

  let clearBits = null;
  if (PEOPLE_PENDING.length) {
    clearBits = S.clearConfirm
      ? H.h('div.channels-row-actions',
          H.h('span.channels-confirm-text', 'Clear all ' + PEOPLE_PENDING.length + ' pending?'),
          H.h('button.btn.sm.danger', {onclick: async () => {
            try {
              await liveApi.clearPending();
              toast('Pending pairing requests cleared');
              S.clearConfirm = false;
              await loadPairing();
            } catch (e) { toast('Clear failed · ' + liveMsg(e)); }
          }}, 'Clear all'),
          H.h('button.btn.sm.ghost', {onclick: () => { S.clearConfirm = false; repaintPage(); }}, 'Cancel')
        )
      : H.h('button.btn.sm.ghost', {onclick: () => { S.clearConfirm = true; repaintPage(); }}, 'Clear all pending');
  }

  wrap.appendChild(H.h('div.channels-sec-head',
    H.h('h2', 'Pairing requests'),
    PEOPLE_PENDING.length ? H.pill(PEOPLE_PENDING.length + ' waiting', 'warn') : null,
    H.h('div.grow'),
    clearBits,
    inviteBtn
  ));

  const pendCard = H.h('div.card.channels-pending');
  if (!PEOPLE_PENDING.length) {
    pendCard.appendChild(H.h('div.empty',
      H.h('div', 'No one is waiting to pair.'),
      H.h('div.muted', 'Requests appear here when someone DMs a connected bot.')
    ));
  } else {
    PEOPLE_PENDING.forEach(r => {
      const approveBtn = H.h('button.btn.sm', {
        disabled: !r.requestId,
        title: r.requestId ? '' : 'This legacy request has no request id; approve its code from the CLI'
      }, 'Approve');
      approveBtn.onclick = async () => {
        if (!r.requestId) return;
        approveBtn.disabled = true;
        try {
          await liveApi.approve(r.platform, r.requestId);
          toast(r.name + ' approved on ' + r.platform);
          await loadPairing();
        } catch (e) {
          toast('Approve failed · ' + liveMsg(e));
          approveBtn.disabled = false;
        }
      };
      pendCard.appendChild(H.h('div.channels-pend',
        H.h('span.channels-code-chip', r.platform || 'request'),
        H.h('div.grow',
          H.h('div.channels-pend-name', r.name),
          H.h('div.channels-pend-sub', r.platform + ' · ' + (r.handle || 'no user id') + ' · asked ' + r.at)
        ),
        H.h('div.channels-pend-actions', approveBtn)
      ));
    });
  }
  wrap.appendChild(pendCard);
  if (PEOPLE_PENDING.length) {
    wrap.appendChild(H.h('p.channels-section-note',
      'There is no per-request reject endpoint; clear all pending requests, or approve the ones you want and let the rest expire.'));
  }

  wrap.appendChild(H.h('div.channels-sec-head.channels-sec-head-gap',
    H.h('h2', 'People'),
    H.pill(PEOPLE.length + ' approved'),
    H.h('div.grow'),
    H.h('span.channels-hint', 'Approved users can DM the agent on the platform they paired from.')
  ));

  if (!PEOPLE.length) {
    wrap.appendChild(H.h('div.empty',
      H.h('div', 'No one approved yet.'),
      H.h('div.muted', 'Approve a pairing request to give someone access.')
    ));
    return wrap;
  }

  const tbody = H.h('tbody');
  PEOPLE.forEach(person => tbody.appendChild(peopleRowLive(person)));
  wrap.appendChild(H.h('div.card.channels-people-card',
    H.h('div.scroll-x', H.h('table.tbl.channels-people-tbl',
      H.h('thead', H.h('tr',
        H.h('th', 'Person'),
        H.h('th', 'Platform'),
        H.h('th', 'User ID'),
        H.h('th', 'Approved'),
        H.h('th.r', 'Access')
      )),
      tbody
    ))
  ));
  return wrap;
}

function peopleRowLive(person){
  const actionCell = H.h('td.r', H.h('div.channels-confirm-cell',
    H.h('button.btn.sm.ghost.danger', {onclick: () => {
      actionCell.innerHTML = '';
      actionCell.appendChild(H.h('div.channels-confirm-cell',
        H.h('span.channels-confirm-text', 'Revoke access?'),
        H.h('button.btn.sm.danger', {onclick: async () => {
          try {
            await liveApi.revoke(person.platform, person.userId);
            toast('Revoked ' + person.name + '’s access');
            await loadPairing();
          } catch (e) { toast('Revoke failed · ' + liveMsg(e)); }
        }}, 'Revoke'),
        H.h('button.btn.sm.ghost', {onclick: () => repaintPage()}, 'Cancel')
      ));
    }}, 'Revoke')
  ));
  return H.h('tr',
    H.h('td',
      H.h('div.channels-cell-t', person.name),
      H.h('div.channels-cell-s', person.handle || '—')
    ),
    H.h('td', H.h('span.channels-cell-s', person.platform)),
    H.h('td', H.h('span.mono.channels-cell-s', person.userId || '—')),
    H.h('td', H.h('span.channels-cell-s', person.approvedAt || '—')),
    actionCell
  );
}

function peoplePanel(){
  if (LIVE) return peoplePanelLive();
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
function endpointsPanelLive(){
  if (live.platforms.error && !live.platforms.loaded) {
    return liveErr('Couldn’t load listeners', live.platforms.error, loadPlatforms);
  }
  if (!live.platforms.loaded) return livePad('Loading listeners…');
  if (!live.hooks.loaded && !live.hooks.error) return livePad('Loading webhook routes…');
  if (live.hooks.error && !live.hooks.loaded) {
    return liveErr('Couldn’t load webhooks', live.hooks.error, loadWebhooks);
  }

  const wrap = H.h('div.channels-endpoints');
  wrap.appendChild(H.h('div.channels-sec-head',
    H.h('h2', 'Listeners'),
    H.pill(ENDPOINTS.filter(e => e.enabled).length + ' on'),
    H.h('div.grow'),
    H.h('span.channels-hint', 'From the messaging platform catalog and /api/webhooks. Nothing here is invented.')
  ));

  const tbody = H.h('tbody');
  ENDPOINTS.forEach(ep => {
    let swWrap;
    if (ep.id === 'webhook') {
      swWrap = H.h('div', {onclick:e => e.stopPropagation()},
        ep.enabled
          ? H.sw(true, () => {
              toast('Disabling the webhook receiver has no dashboard endpoint');
              repaintPage();
            }, 'Webhook receiver')
          : H.sw(false, v => { if (v) enableWebhooksLive(); }, 'Enable webhooks')
      );
    } else if (ep.liveKind === 'platform') {
      swWrap = H.h('div', {onclick:e => e.stopPropagation()},
        H.sw(ep.enabled, v => {
          doPlatformWrite('Enable ' + ep.name, () => liveApi.setEnabled(ep.platform.id, v), ep.name + (v ? ' enabled' : ' disabled'));
        }, 'Enable ' + ep.name)
      );
    } else {
      swWrap = H.h('div', {onclick:e => e.stopPropagation()},
        H.sw(true, () => { repaintPage(); toast('This dashboard is serving the page you are on'); }, 'Dashboard')
      );
    }
    const copyBtn = H.h('button.btn.sm.ghost.channels-copybtn', {
      'aria-label':'Copy URL for ' + ep.name,
      onclick:e => { e.stopPropagation(); if (ep.url) copyText(ep.url, ep.name + ' URL copied'); }
    }, H.ic('copy','sm'), 'Copy URL');
    if (!ep.url) copyBtn.disabled = true;

    const nameBtn = H.h('button.channels-epname', {
      type:'button',
      'aria-expanded': String(S.epSel === ep.id),
      onclick:e => { e.stopPropagation(); selectEndpoint(ep.id); }
    }, ep.name);

    const row = H.h('tr.channels-ep-row' + (S.epSel === ep.id ? '.is-sel' : ''),
      H.h('td', nameBtn),
      H.h('td', H.h('span.mono.channels-bind', ep.bind)),
      H.h('td', H.pill(ep.exposure, ep.exposureTone || '')),
      H.h('td', H.h('span.channels-cell-s', ep.auth)),
      H.h('td', swWrap),
      H.h('td.r', copyBtn)
    );
    row.onclick = () => selectEndpoint(ep.id);
    tbody.appendChild(row);
  });

  wrap.appendChild(H.h('div.card.channels-epcard', H.h('div.scroll-x',
    H.h('table.tbl.channels-eptbl',
      H.h('thead', H.h('tr',
        H.h('th', 'Listener'),
        H.h('th', 'Bind address'),
        H.h('th', 'Exposure'),
        H.h('th', 'Auth'),
        H.h('th', 'On'),
        H.h('th.r', 'URL')
      )),
      tbody
    )
  )));
  wrap.appendChild(endpointDetailLive(findEndpoint(S.epSel) || ENDPOINTS[0]));
  return wrap;
}

async function enableWebhooksLive(){
  try {
    const r = await liveApi.enableWebhooks();
    toast(r && r.restart_started
      ? 'Webhooks enabled · gateway restarting'
      : 'Webhooks enabled' + (r && r.needs_restart ? ' · restart the gateway to apply' : ''));
    await loadWebhooks();
    await loadPlatforms();
  } catch (e) {
    toast('Enable failed · ' + liveMsg(e));
  }
}

async function setRouteEnabledLive(name, enabled){
  try {
    await liveApi.setWebhookEnabled(name, enabled);
    toast('Route “' + name + '” ' + (enabled ? 'enabled' : 'disabled'));
    await loadWebhooks();
  } catch (e) {
    toast('Update failed · ' + liveMsg(e));
    repaintPage();
  }
}

async function deleteRouteLive(name){
  try {
    await liveApi.deleteWebhook(name);
    toast('Route “' + name + '” deleted');
    S.liveDelRoute = null;
    await loadWebhooks();
  } catch (e) {
    toast('Delete failed · ' + liveMsg(e));
  }
}

function endpointDetailLive(ep){
  const card = H.h('div.card.channels-ep-detail');
  card.appendChild(H.h('div.card-h',
    H.h('h2.channels-card-h', ep.name),
    H.pill(ep.enabled ? 'On' : 'Off', ep.enabled ? 'pos' : ''),
    H.h('div.grow'),
    ep.url ? H.h('span.mono.channels-detail-url', ep.url) : null,
    H.h('button.btn.sm.ghost', {disabled: !ep.url, onclick: () => ep.url && copyText(ep.url, ep.name + ' URL copied')}, H.ic('copy','sm'), 'Copy URL')
  ));

  const body = H.h('div.card-b.channels-ep-body');
  if (ep.liveKind === 'dashboard') {
    body.appendChild(H.h('p.channels-lead', 'The dashboard you are using now. Requests carry the session token (or the sign-in cookie) and are scoped to the selected profile.'));
    body.appendChild(H.h('div.channels-form-row',
      H.h('div.channels-form-note',
        H.h('div.channels-form-note-t', 'Address in this browser'),
        H.h('div.mono.channels-form-url', ep.bind)
      )
    ));
  } else if (ep.liveKind === 'platform') {
    body.appendChild(H.h('p.channels-lead', ep.lead || ''));
    const p = ep.platform;
    const envList = H.h('div.channels-envsummary');
    p.envVars.forEach(v => {
      envList.appendChild(H.h('div.channels-envsummary-row',
        H.h('span.mono.channels-envsummary-k', v.key),
        H.pill(v.is_set ? 'Set' : (v.required ? 'Missing' : 'Not set'), v.is_set ? 'pos' : (v.required ? 'warn' : ''))
      ));
    });
    if (p.envVars.length) envList.appendChild(H.h('div.channels-hint', 'Values are never shown here. Edit them in Platforms.'));
    body.appendChild(envList);
    body.appendChild(H.h('div.channels-row-actions',
      H.h('button.btn.sm', {onclick: () => {
        S.tab = 'platforms';
        try { history.replaceState(null, '', '#/channels/platforms'); } catch (e) { /* file:// */ }
        paint();
        openDrawer(p.id, null);
      }}, 'Open in Platforms'),
      p.docsUrl ? H.h('a.btn.sm.ghost', {href:p.docsUrl, target:'_blank', rel:'noreferrer'}, H.ic('external','sm'), 'Setup docs') : null
    ));
    if (ep.id === 'webhook') {
      body.appendChild(webhookRoutesLive());
    }
  }
  card.appendChild(body);
  return card;
}

function webhookRoutesLive(){
  const wrap = H.h('div.channels-whroutes');
  const h = live.hooks;
  wrap.appendChild(H.h('div.channels-keys-head',
    H.h('h3', 'Webhook routes'),
    H.pill((h.routes || []).length + ' routes'),
    H.h('div.grow'),
    !h.enabled ? H.h('button.btn.sm', {onclick: enableWebhooksLive}, 'Enable receiver') : null
  ));
  if (!h.enabled) {
    wrap.appendChild(H.h('div.channels-inline-warn',
      H.h('span.dot.warn'),
      H.h('span', 'The webhook receiver is off. Enable it, then restart the gateway if asked.')
    ));
  }
  if (!(h.routes || []).length) {
    wrap.appendChild(H.h('div.channels-emptyline', 'No routes yet.'));
  } else {
    h.routes.forEach(r => {
      const row = H.h('div.channels-key',
        H.h('div.grow',
          H.h('div.channels-key-name', r.name),
          H.h('div.channels-key-meta',
            (r.events.length ? r.events.join(', ') : 'any event') + ' · deliver ' + r.deliver +
            (r.deliverOnly ? ' only' : '') + (r.signature ? ' · ' + r.signature + ' signature' : '') +
            (r.secretSet ? ' · secret set' : ' · no secret')
          )
        )
      );
      row.appendChild(H.sw(r.enabled, v => setRouteEnabledLive(r.name, v), 'Enable route ' + r.name));
      if (S.liveDelRoute === r.name) {
        row.append(
          H.h('button.btn.sm.danger', {onclick: () => deleteRouteLive(r.name)}, 'Delete'),
          H.h('button.btn.sm.ghost', {onclick: () => { S.liveDelRoute = null; repaintPage(); }}, 'Cancel')
        );
      } else {
        row.appendChild(H.h('button.btn.sm.ghost.danger', {onclick: () => { S.liveDelRoute = r.name; repaintPage(); }}, 'Delete'));
      }
      wrap.appendChild(row);
    });
  }
  wrap.appendChild(H.h('div.channels-hint',
    'Create routes from the CLI: ', H.h('code', 'hermes webhook subscribe <name> --events <event> --prompt "<template>"'),
    '. The dashboard has no create-route form yet.'
  ));
  return wrap;
}

function endpointsPanel(){
  if (LIVE) return endpointsPanelLive();
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
function peersPanelLive(){
  if (live.peers.error) return liveErr('Couldn’t read peer configuration', live.peers.error, loadPeers);
  if (!live.peers.loaded) return livePad('Loading peer gateways…');

  const wrap = H.h('div.channels-peers-wrap');
  wrap.appendChild(H.h('div.channels-sec-head',
    H.h('h2', 'Peer gateways'),
    H.pill(PEERS.length + ' in config.yaml'),
    H.h('div.grow'),
    H.h('button.btn', {
      disabled:true,
      title:'Not available from the web yet · register peers with hermes peer add'
    }, H.ic('plus','sm'), 'Add peer')
  ));
  wrap.appendChild(H.h('p.channels-section-note',
    'Bot-to-bot DMs over the peer API. The dashboard reads the registered list from config.yaml but has no REST surface for pairing, adding or messaging a peer.'));

  if (!PEERS.length) {
    wrap.appendChild(H.h('div.empty',
      H.h('div', 'No peer gateways registered.'),
      H.h('div.muted', 'Peer names and URLs live in bot_peers in config.yaml.')
    ));
  } else {
    const list = H.h('div.list');
    PEERS.forEach(peer => {
      list.appendChild(H.h('div.row.channels-peer',
        H.h('div.grow',
          H.h('div.t.channels-peer-host', peer.id),
          H.h('div.s', peer.host + (peer.note ? ' · ' + peer.note : ''))
        ),
        H.pill('Configured', '')
      ));
    });
    wrap.appendChild(H.h('div.card.channels-peerlist', list));
  }

  wrap.appendChild(H.h('div.card.channels-cli-card',
    H.h('div.card-b.channels-cli-body',
      H.h('h3.channels-cli-h', 'Peer commands'),
      H.h('div.channels-hint', 'Run these on the host. Each peer key is stored as ', H.h('code', 'HERMES_PEER_<NAME>_KEY'), ' in ', H.h('code', '~/.hermes/.env'), ' and never shown here.'),
      H.h('pre.channels-code', H.h('code',
        'hermes peer add spark --url http://spark.lan:8377 --key <API_SERVER_KEY>\n' +
        'hermes peer list\n' +
        'hermes peer dm spark "Ask about disk usage"\n' +
        'hermes peer remove spark'
      ))
    )
  ));
  return wrap;
}

function peersPanel(){
  if (LIVE) return peersPanelLive();
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

H.views.channels = { title:'channels', render, _live: liveApi };
})();
