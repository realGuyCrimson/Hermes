/* Gateway JSON-RPC client for the thread screen.
   Mirrors apps/shared/src/json-rpc-gateway.ts + json-rpc-channel.ts: one socket to
   `/api/ws`, `gateway.ready`, `client.capabilities`, request/response by id,
   event fan-out, server->client requests, `gateway.ping` keepalive and reconnect
   with `session.events.since` replay.

   Note on the subprotocol: the native Desktop ticket rides
   `hermes-gateway-ticket.<ticket>`, but a browser tab authenticates with `?token=`
   (or `?ticket=`) and the loopback dashboard accepts WITHOUT echoing a protocol
   (web/src/lib/gatewayClient.ts dials a bare WebSocket for exactly this reason).
   Offering `hermes-gateway-v1` makes the handshake fail ("Server did not respond
   with sent protocols") on this backend, so we dial bare here. */
(function(){
const H = window.H;
const PING_MS = 15000;
const LIVENESS_MS = 45000;
const REQ_TIMEOUT_MS = 120000;
const APPROVAL_TIMEOUT_MS = 330000;
const CONNECT_TIMEOUT_MS = 15000;
const MAX_BACKOFF_MS = 30000;
const REPLAY_TIMEOUT_MS = 10000;

let socket = null, state = 'idle', nextId = 1, pending = new Map();
let handlers = new Map();            // name -> Set(fn); '*' wildcard, method names for requests
let lastSeq = new Map();             // session_id -> last seen seq
let epoch = null, epochBySession = new Map();
let openRequests = new Map();        // server request id -> {method, params}
let attempts = 0, reconnectTimer = null, pingTimer = null, lastInbound = 0;
let connectPromise = null, closing = false;
let readyResolve = null, readyPromise = new Promise(r => { readyResolve = r; });

function emit(name, arg){
  const set = handlers.get(name);
  if (set) for (const fn of [...set]) { try { fn(arg); } catch (e) { console.error('[rpc]', name, e); } }
  if (name !== '*') { const all = handlers.get('*'); if (all) for (const fn of [...all]) { try { fn(name, arg); } catch (e) { console.error('[rpc]', e); } } }
}
function send(frame){ if (socket && socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(frame)); }

function settle(id, ok, value){
  const p = pending.get(id); if (!p) return;
  pending.delete(id); clearTimeout(p.timer);
  ok ? p.resolve(value) : p.reject(value);
}
function call(method, params, timeoutMs){
  return new Promise((resolve, reject) => {
    if (!socket || socket.readyState !== WebSocket.OPEN) { reject(new Error('Hermes gateway is not connected')); return; }
    const id = 'w' + (nextId++);
    const timer = setTimeout(() => { settle(id, false, new Error('request timed out: ' + method)); }, timeoutMs || (method === 'approval.respond' ? APPROVAL_TIMEOUT_MS : REQ_TIMEOUT_MS));
    pending.set(id, {resolve, reject, timer, method});
    try { send({jsonrpc: '2.0', id, method, params: params || {}}); }
    catch (e) { settle(id, false, e); }
  });
}

function deliver(id, method, params, replayed){
  if (!openRequests.has(id)) openRequests.set(id, {method, params});
  let answered = false;
  const req = {
    id, method, params: params || {}, replayed: !!replayed,
    respond(result){
      if (answered) return; answered = true;
      send({jsonrpc: '2.0', id, result: result || {}});
      openRequests.delete(id);
      emit('request.done', {id, method});
    },
    fail(code, message){
      if (answered) return; answered = true;
      send({jsonrpc: '2.0', id, error: {code: code || -32603, message: message || 'client error'}});
      openRequests.delete(id);
    },
  };
  const own = handlers.get(method);
  emit(method, req);
  if (!own || !own.size) emit('request', req);   // generic listener fallback
}

function recordSeq(sid, s){
  if (!sid || typeof s !== 'number' || !Number.isFinite(s)) return;
  if (s > (lastSeq.get(sid) || 0)) lastSeq.set(sid, s);
}
function dispatch(ev){
  recordSeq(ev.session_id, ev.seq);
  emit(ev.type, ev);
}
function dispatchIfNewer(ev){
  const sid = ev.session_id, s = ev.seq;
  if (sid && typeof s === 'number' && Number.isFinite(s) && s <= (lastSeq.get(sid) || 0) && ev.replayed) return;
  dispatch(ev);
}

function handleFrame(text){
  let f; try { f = JSON.parse(text); } catch (e) { return; }
  if (!f || typeof f !== 'object') return;
  lastInbound = Date.now();
  if (typeof f.id === 'string' && typeof f.method === 'string' && f.method !== 'event') { deliver(f.id, f.method, f.params, false); return; }
  if (f.id !== undefined && f.id !== null) {
    if (f.error) settle(f.id, false, Object.assign(new Error(f.error.message || 'Hermes RPC failed'), {code: f.error.code, data: f.error.data}));
    else settle(f.id, true, f.result);
    return;
  }
  if (f.method === 'event' && f.params && typeof f.params.type === 'string') {
    const ev = f.params;
    if (ev.type === 'gateway.ready') {
      const p = ev.payload || {};
      if (p.replay_epoch && epoch && p.replay_epoch !== epoch) {
        for (const sid of [...lastSeq.keys()]) { lastSeq.delete(sid); epochBySession.delete(sid); dispatch({type: 'session.replay_gap', session_id: sid, payload: {reason: 'epoch_changed'}}); }
      }
      if (p.replay_epoch) epoch = p.replay_epoch;
      call('client.capabilities', {server_requests: true}).catch(() => {});
      if (p.heartbeat === true) startPing();
      if (readyResolve) { const r = readyResolve; readyResolve = null; r(); }
      replay().catch(() => {});
    }
    if (ev.replay_epoch && ev.session_id) epochBySession.set(ev.session_id, ev.replay_epoch);
    dispatch(ev);
  }
}

async function replay(){
  if (!lastSeq.size) return;
  for (const [sid, seen] of [...lastSeq]) {
    try {
      const q = {session_id: sid, last_seen: seen};
      const ep = epochBySession.get(sid); if (ep) q.replay_epoch = ep;
      const res = await call('session.events.since', q, REPLAY_TIMEOUT_MS);
      if (!res) continue;
      if (res.snapshot_required === true || res.truncated === true) {
        lastSeq.delete(sid);
        dispatch({type: 'session.replay_gap', session_id: sid, payload: {reason: res.snapshot_required ? 'snapshot_required' : 'truncated'}});
        continue;
      }
      (res.open_requests || []).forEach(r => { if (r && r.id && r.method) deliver(r.id, r.method, r.params, true); });
      (res.events || []).forEach(ev => { if (ev && ev.type) dispatchIfNewer(Object.assign({}, ev, {replayed: true})); });
    } catch (e) { /* replay is best effort; next reconnect retries */ }
  }
}

function startPing(){
  stopPing();
  lastInbound = Date.now();
  pingTimer = setInterval(() => {
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    if (Date.now() - lastInbound > LIVENESS_MS) { try { socket.close(); } catch (e) {} return; }
    call('gateway.ping', {}, 5000).catch(() => {});
  }, PING_MS);
}
function stopPing(){ if (pingTimer) clearInterval(pingTimer); pingTimer = null; }

function scheduleReconnect(){
  if (closing) return;
  if (reconnectTimer) return;
  const base = Math.min(MAX_BACKOFF_MS, 500 * Math.pow(2, Math.min(attempts, 6)));
  const delay = base + Math.floor(Math.random() * 400);
  attempts++;
  reconnectTimer = setTimeout(() => { reconnectTimer = null; connect().catch(() => scheduleReconnect()); }, delay);
}

async function connect(){
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
  if (connectPromise) return connectPromise;
  closing = false;
  state = 'connecting'; emit('state', statusSnapshot());
  connectPromise = (async () => {
    const url = await H.api.wsUrl('/api/ws');
    const ws = new WebSocket(url);
    socket = ws;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { try { ws.close(); } catch (e) {} reject(new Error('no WebSocket open within ' + CONNECT_TIMEOUT_MS + ' ms')); }, CONNECT_TIMEOUT_MS);
      ws.onopen = () => { clearTimeout(timer); resolve(); };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('Hermes gateway connection failed')); };
      ws.onclose = () => { clearTimeout(timer); reject(new Error('Hermes gateway closed during handshake')); };
    });
    ws.onmessage = ev => { if (typeof ev.data === 'string') handleFrame(ev.data); };
    ws.onclose = () => {
      if (socket !== ws) return;
      socket = null; stopPing();
      for (const [id, p] of [...pending]) { clearTimeout(p.timer); p.reject(new Error('Hermes gateway disconnected')); pending.delete(id); }
      state = 'closed'; emit('state', statusSnapshot());
      scheduleReconnect();
    };
    ws.onerror = () => {};
    attempts = 0; state = 'open'; lastInbound = Date.now(); emit('state', statusSnapshot());
  })();
  try { await connectPromise; } finally { connectPromise = null; }
}

/* Re-render the cards the backend still has open for `sid` (reconnect / late mount). */
async function syncRequests(sid){
  try {
    const q = {session_id: sid, last_seen: lastSeq.get(sid) || 0};
    const ep = epochBySession.get(sid); if (ep) q.replay_epoch = ep;
    const res = await call('session.events.since', q, REPLAY_TIMEOUT_MS);
    (res && res.open_requests || []).forEach(r => { if (r && r.id && r.method) deliver(r.id, r.method, r.params, true); });
    return res;
  } catch (e) { return null; }
}

function statusSnapshot(){ return {state, attempts, epoch, connected: !!socket && socket.readyState === WebSocket.OPEN, openRequests: [...openRequests.entries()].map(([id, r]) => ({id, method: r.method})), sessions: Object.fromEntries(lastSeq)}; }

function on(name, fn){
  let set = handlers.get(name);
  if (!set) { set = new Set(); handlers.set(name, set); }
  set.add(fn);
  return () => set.delete(fn);
}

H.rpc = {
  connect, call, on, syncRequests,
  respond(id, result){
    send({jsonrpc: '2.0', id, result: result || {}});
    openRequests.delete(id);
    emit('request.done', {id});
  },
  fail(id, code, message){ send({jsonrpc: '2.0', id, error: {code: code || -32603, message: message || 'client error'}}); openRequests.delete(id); },
  status: statusSnapshot,
  onState(fn){ return on('state', fn); },
  replay,
  ready: () => readyPromise,
  /* test/debug hook: inject a frame through the same dispatch path as a live one */
  _emit(type, arg){ emit(type, arg); },
};
})();
