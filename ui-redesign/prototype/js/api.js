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
    const t = await req('POST', '/api/auth/ws-ticket'); /* same request as the old dashboard: no body; an unnamed ticket opens /api/ws and /api/pty */
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
