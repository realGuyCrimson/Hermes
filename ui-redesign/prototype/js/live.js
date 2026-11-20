/* Live mode bootstrap: H.boot() fills H.data from the real Hermes REST API before the first route,
   H.homeHash() picks the start route, and H.liveRefresh() polls status + the top of the session list.
   Sample mode (file:// preview): H.boot is a no-op and the sample arrays stay untouched. */
(function(){
const H = window.H, D = H.data;

if (!H.live) {
  H.boot = async function(){};
  H.homeHash = () => '#/thread/t-ui';
  return;
}

/* ---------- small stable helpers ---------- */
function hashOf(s){
  let h = 2166136261; s = String(s || '');
  for (let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return Math.abs(h | 0);
}
const hueOf = id => 20 + (hashOf('h:' + id) % 320);   /* stable hue per agent id */
const kindOf = id => hashOf('k:' + id) % 4;           /* stable illustration variant */
const titleCase = s => String(s || '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();

/* session sources: the dashboard's own taxonomy (web/src/pages/SessionsPage_sources.tsx) */
const SOURCE_NAMES = {
  cli:'CLI', tui:'CLI', gui:'Desktop', telegram:'Telegram', discord:'Discord', slack:'Slack', whatsapp:'WhatsApp',
  whatsapp_cloud:'WhatsApp Cloud', signal:'Signal', matrix:'Matrix', email:'Email', sms:'SMS',
  cron:'Cron', tool:'Tools', oneshot:'One-shots', api_server:'API', acp:'ACP',
  hermes_flow:'Flows', vulcan_delegate:'Delegates', webhook:'Webhooks', local:'Local'
};
const sourceKey = src => String(src || 'local').split(':')[0];
const sourceName = src => SOURCE_NAMES[sourceKey(src)] || titleCase(sourceKey(src));

/* seconds/ms epoch -> now | 4m | 2h | Yesterday | Tue | 12 Nov */
function ago(ts){
  if (!ts) return '';
  const ms = ts > 1e12 ? ts : ts * 1000;
  const s = Math.max(0, (Date.now() - ms) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return Math.floor(s / 60) + 'm';
  if (s < 86400) return Math.floor(s / 3600) + 'h';
  const d = new Date(ms), today = new Date();
  const days = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (days <= 1) return 'Yesterday';
  if (days < 7) return d.toLocaleDateString('en-US', {weekday:'short'});
  return d.toLocaleDateString('en-US', {day:'numeric', month:'short'});
}

function sessionState(s){
  if (s.is_active) return 'working';
  if (/error|fail|crash|timeout|abort|killed/i.test(String(s.end_reason || ''))) return 'failed';
  return s.ended_at ? 'done' : 'idle';
}

/* ---------- adapters: API shapes -> the shapes the prototype renders ---------- */
function agentFromProfile(p, sessions){
  const id = p.name;
  const busy = sessions.some(s => s.is_active && (s.profile || 'default') === id);
  const description = String(p.description || '').trim();
  return {
    id,
    name: p.is_default ? 'Hermes' : titleCase(p.display_name || p.name),
    role: description || (p.is_default ? 'Primary agent · default profile' : 'Profile · ' + p.name),
    hue: hueOf(id), kind: kindOf(id),
    state: busy ? 'working' : 'idle',
    model: p.model || '',
    blurb: description
  };
}

function threadFromSession(s, projectId){
  const preview = String(s.preview || '').trim();
  return {
    id: s.id,
    project: projectId,
    agent: s.profile || 'default',
    title: (s.title && String(s.title).trim()) || (preview ? preview.slice(0, 60) : 'Untitled thread'),
    state: sessionState(s),
    age: ago(s.last_active || s.started_at),
    model: s.model || '',
    mode: 'local',
    branch: s.git_branch || null,
    adds: 0, dels: 0,
    unread: !!s.unread,
    source: s.source || 'local'
  };
}

/* ---------- project grouping: real projects where the API has them, else one group per source ---------- */
function buildProjects(tree, sessions){
  const projects = [], bySession = new Map();
  ((tree && tree.projects) || []).forEach(p => {
    projects.push({id: p.id, name: p.label || p.name || 'Project', path: p.path || '', branch: null, dirty: 0});
    (p.sessionIds || []).forEach(id => bySession.set(id, p.id));
  });
  const srcGroups = new Map();
  sessions.forEach(s => {
    if (bySession.has(s.id)) return;
    const key = sourceName(s.source);                 /* tui and cli are the same group */
    const id = 'src:' + key.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (!srcGroups.has(id)) srcGroups.set(id, {id, name: key, path: '', branch: null, dirty: 0});
    bySession.set(s.id, id);
  });
  srcGroups.forEach(p => projects.push(p));
  return {projects, bySession};
}

/* replace an array's contents but keep the existing objects for ids that are still present */
function mergeById(arr, next){
  const old = new Map(arr.map(x => [x.id, x]));
  const out = next.map(n => { const prev = old.get(n.id); if (prev){ Object.assign(prev, n); old.delete(n.id); return prev; } return n; });
  old.forEach(prev => out.push(prev));           /* rows that scrolled off the 60-session window stay */
  arr.splice(0, arr.length, ...out);
}

/* a refresh can drop a project from the tree while its older threads are still listed: keep a group for it */
function keepOrphanProjects(oldNames){
  const ids = new Set(D.projects.map(p => p.id));
  D.threads.forEach(t => {
    if (!t.project || ids.has(t.project)) return;
    D.projects.push({id: t.project, name: oldNames.get(t.project) || 'Older threads', path: '', branch: null, dirty: 0});
    ids.add(t.project);
  });
}

/* ---------- boot ---------- */
function connectedPlatforms(status){
  const map = (status && status.gateway_platforms) || {};
  return Object.keys(map).filter(k => { const p = map[k]; return !p || p.state === 'connected'; });
}

let booting = false;
async function load(){
  const [statusR, profilesR, sessionsR, treeR] = await Promise.allSettled([
    H.api.cached('/api/status', 3000),
    H.api.get('/api/profiles'),
    H.api.get('/api/sessions?limit=60&order=recent'),
    H.api.cached('/api/profiles/projects/tree?preview_limit=1&session_limit=200', 10000)
  ]);

  const status = statusR.status === 'fulfilled' ? statusR.value : null;
  const sessions = sessionsR.status === 'fulfilled' && sessionsR.value && Array.isArray(sessionsR.value.sessions) ? sessionsR.value.sessions : null;
  const profiles = profilesR.status === 'fulfilled' && profilesR.value && Array.isArray(profilesR.value.profiles) ? profilesR.value.profiles : null;
  const tree = treeR.status === 'fulfilled' ? treeR.value : null;

  if (sessions){
    const built = buildProjects(tree, sessions);
    const oldNames = new Map(D.projects.map(p => [p.id, p.name]));
    D.projects.splice(0, D.projects.length, ...built.projects);
    const threads = sessions.map(s => threadFromSession(s, built.bySession.get(s.id)));
    mergeById(D.threads, threads);
    keepOrphanProjects(oldNames);
  }

  if (profiles){
    const agents = profiles.map(p => agentFromProfile(p, sessions || []));
    D.agents.splice(0, D.agents.length, ...agents);
  }

  if (status){
    const platforms = connectedPlatforms(status);
    D.gateway = {
      state: status.gateway_running ? 'healthy' : 'stopped',
      sessions: Number(status.active_sessions || 0),
      platforms,
      pid: status.gateway_pid || null,
      version: status.version || '',
      uptime: '',
      dashboard: 0, api: 0, cpu: '', ram: ''
    };
  } else if (!D.gateway || D.gateway.state === 'unknown'){
    D.gateway = {state:'unreachable', sessions:0, platforms:[]};
  }
}

H.boot = async function(){
  if (booting) return;
  booting = true;
  try { await load(); }
  catch (e) { D.gateway = {state:'unreachable', sessions:(D.gateway && D.gateway.sessions) || 0, platforms:[]}; }  /* never throw into the UI */
  finally { booting = false; }
};

H.homeHash = function(){
  const t = D.threads[0];
  return t ? '#/thread/' + t.id : '#/thread/new';
};

/* ---------- live refresh: status + top of the session list, only while the tab is visible ---------- */
let refreshing = false;
async function refresh(){
  if (refreshing || document.visibilityState !== 'visible') return;
  refreshing = true;
  try {
    const [statusR, sessionsR, treeR] = await Promise.allSettled([
      H.api.get('/api/status'),
      H.api.get('/api/sessions?limit=60&order=recent'),
      H.api.get('/api/profiles/projects/tree?preview_limit=1&session_limit=200')
    ]);
    if (statusR.status === 'fulfilled' && statusR.value){
      const st = statusR.value;
      D.gateway = Object.assign({}, D.gateway, {
        state: st.gateway_running ? 'healthy' : 'stopped',
        sessions: Number(st.active_sessions || 0),
        platforms: connectedPlatforms(st),
        pid: st.gateway_pid || null,
        version: st.version || ''
      });
    } else {
      D.gateway = Object.assign({}, D.gateway, {state:'unreachable'});
    }
    if (sessionsR.status === 'fulfilled' && sessionsR.value && Array.isArray(sessionsR.value.sessions)){
      const sessions = sessionsR.value.sessions;
      const oldNames = new Map(D.projects.map(p => [p.id, p.name]));
      if (treeR.status === 'fulfilled' && treeR.value){
        const built = buildProjects(treeR.value, sessions);
        D.projects.splice(0, D.projects.length, ...built.projects);
        mergeById(D.threads, sessions.map(s => threadFromSession(s, built.bySession.get(s.id))));
      } else {
        mergeById(D.threads, sessions.map(s => threadFromSession(s, D.threads[0] ? D.threads[0].project : '')));
      }
      keepOrphanProjects(oldNames);
      if (D.agents.length){    /* presence follows the active sessions */
        const busy = new Set(sessions.filter(s => s.is_active).map(s => s.profile || 'default'));
        D.agents.forEach(a => { a.state = busy.has(a.id) ? 'working' : 'idle'; });
      }
    }
  } catch (e) { /* keep the old data */ }
  finally {
    refreshing = false;
    if (H.refreshRail) H.refreshRail();
  }
}
H.liveRefresh = refresh;

setInterval(refresh, 15000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
})();
