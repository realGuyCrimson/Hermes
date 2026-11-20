/* Pixel mosaic engine: the tile from the palette image, generated per space.
   H.mosaic({size, seed, glyph, state, reveal}) -> element; H.avatar(agent,size,state) -> small static tile with a state ring. */
(function(){
const H = window.H;
const PAL = {n:'#060338',w:'#ffffff',c:'#f6efd8',C:'#e9d9a8',g:'#e4b43a',G:'#f8d674',a:'#c8821e',b:'#8d4b13',t:'#2e8d8f',e:'#4ec28b',q:'#79e0d8',m:'#c43cb4',p:'#f2b4ef',v:'#6a2aa8',i:'#3b2fbf',l:'#a9d4ee',u:'#3f6fd0',d:'#4b3f72',o:'#c9792a',r:'#d4562a',k:'#12104f'};
H.PAL = PAL;
const CORE = ['#ffffff','#fdf6e0','#f6efd8'];
const GOLD = ['#f8d674','#f2c14e','#e4b43a','#d49f2f','#f3cf5c','#e4b43a'];
const AMBER = ['#c8821e','#b8651a','#a9621c','#8d4b13','#e9d9a8','#c9792a'];
const NOISE = ['#060338','#060338','#060338','#e4b43a','#c8821e','#2e8d8f','#4ec28b','#c9792a','#f6efd8','#4b3f72','#5ccf9a','#e9d9a8','#d9a22f','#2e8d8f'];
const FRAME = ['#f2b4ef','#c43cb4','#7b2fb0','#3b2fbf','#4cb7a8','#a9d4ee','#3f6fd0','#8fe8ea','#a9d4ee','#3b2fbf','#c43cb4','#f2b4ef'];
function rng(seed){ let a = seed|0; return () => { a = (a + 0x6D2B79F5)|0; let t = Math.imul(a ^ (a>>>15), 1|a); t = (t + Math.imul(t ^ (t>>>7), 61|t)) ^ t; return ((t ^ (t>>>14))>>>0)/4294967296; }; }
const pick = (r, arr) => arr[Math.floor(r()*arr.length)];

function frameColor(x, y, N, t, phase, r){
  /* perimeter position clockwise from top-left, 0..1 */
  const m = N-1; let p;
  const side = Math.min(x, y, m-x, m-y);
  if (y === side) p = x/(4*m); else if (m-x === side) p = (m + y)/(4*m); else if (m-y === side) p = (3*m - x)/(4*m); else p = (4*m - y)/(4*m);
  let k = (p*FRAME.length + phase) % FRAME.length;
  let idx = Math.floor(k); if (r() < 0.22) idx = (idx + (r() < .5 ? 1 : FRAME.length-1)) % FRAME.length;
  return FRAME[idx];
}
function build(N, seed, o){
  o = o || {}; const r = rng(seed); const t = o.frame != null ? o.frame : (N >= 20 ? 3 : 1); const c = (N-1)/2; const cells = []; const grid = [];
  const R = c - t + 0.5;
  for (let y=0; y<N; y++){ grid[y] = []; for (let x=0; x<N; x++){
    let col, z, d = 0;
    const edge = Math.min(x, y, N-1-x, N-1-y);
    if (edge < t){
      const corner = (Math.min(x, N-1-x) < t-1 && Math.min(y, N-1-y) < t-1) || (N >= 20 && edge === 0 && ((x===0||x===N-1) && (y<2||y>N-3) || (y===0||y===N-1) && (x<2||x>N-3)));
      col = corner ? null : frameColor(x, y, N, t, o.phase||0, r); z = 'f';
    } else {
      const dx = Math.abs(x-c), dy = Math.abs(y-c);
      d = (Math.max(dx,dy)*0.55 + Math.hypot(dx,dy)*0.45) / R; z = 'i';
      const cross = (dx < 0.6 || dy < 0.6); const diag = Math.abs(dx-dy) < 0.6;
      const left = grid[y][x-1], up = grid[y-1] && grid[y-1][x];
      if (d < 0.14) col = pick(r, CORE);
      else if (cross && d < 0.9 && r() > d*0.55) col = d < 0.34 ? pick(r, CORE) : pick(r, ['#f6efd8','#e9d9a8','#efe3c4']);
      else if (diag && d < 0.46 && r() > d*0.9) col = pick(r, ['#ffffff','#fdf6e0']);
      else {
        const n = d + (r()-0.5)*0.34;
        col = n < 0.36 ? pick(r, GOLD) : n < 0.62 ? pick(r, AMBER) : pick(r, NOISE);
        if (left && left.z==='i' && r() < 0.42 && left.d > 0.2 && d > 0.2) col = left.col; else if (up && up.z==='i' && r() < 0.22 && d > 0.3) col = up.col;
      }
    }
    const cell = {x, y, col, z, d}; grid[y][x] = cell; cells.push(cell);
  }}
  return {N, cells, grid, t, c};
}
function stamp(m, glyph){
  if (!glyph || !glyph.length) return;
  const gh = glyph.length, gw = Math.max.apply(null, glyph.map(s=>s.length)); const ox = Math.round(m.c - (gw-1)/2), oy = Math.round(m.c - (gh-1)/2);
  const mask = {};
  glyph.forEach((row, j) => [...row].forEach((ch, i) => { if (ch !== '.' && ch !== ' ' && PAL[ch]) mask[(oy+j)+','+(ox+i)] = ch; }));
  Object.keys(mask).forEach(k => { const [y,x] = k.split(',').map(Number); for (let dy=-1; dy<=1; dy++) for (let dx=-1; dx<=1; dx++){ const yy=y+dy, xx=x+dx; const cell = m.grid[yy] && m.grid[yy][xx]; if (cell && cell.z==='i' && !mask[yy+','+xx]) { cell.col = PAL.n; cell.halo = true; } } });
  Object.keys(mask).forEach(k => { const [y,x] = k.split(',').map(Number); const cell = m.grid[y] && m.grid[y][x]; if (cell && cell.z==='i') { cell.col = PAL[mask[k]]; cell.glyph = true; } });
}

/* ---------- big tile ---------- */
H.mosaic = function(o){
  o = o || {}; const N = o.size || 33, seed = o.seed || 7, m = build(N, seed, {phase:o.phase||0});
  const g = typeof o.glyph === 'string' ? (H.glyphs && H.glyphs[o.glyph]) : o.glyph; stamp(m, g);
  const wrap = H.h('div.mosaic', {role:'img', 'aria-label': o.label || 'Pixel illustration'}); const cv = H.h('canvas'); wrap.append(cv); const ctx = cv.getContext('2d');
  const order = m.cells.filter(c => c.col).sort((a,b) => (a.d + (a.z==='f'?1.4:0)) - (b.d + (b.z==='f'?1.4:0)) + (Math.sin(a.x*12.9898+a.y*78.233)*0.04));
  let K = 16, phase = o.phase||0, state = o.state||'idle', shown = 0, tStart = 0, raf = 0, last = 0, tw = 0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fit = () => { const w = wrap.clientWidth || 300; K = Math.max(4, Math.round(w*(devicePixelRatio||1)/N)); cv.width = cv.height = N*K; draw(); };
  const drawCell = c => { if (!c.col) return; ctx.fillStyle = c.col; ctx.fillRect(c.x*K, c.y*K, K, K); };
  function draw(){ ctx.clearRect(0,0,cv.width,cv.height); const lim = Math.floor(shown); for (let i=0;i<lim && i<order.length;i++) drawCell(order[i]); }
  const ease = x => 1 - Math.pow(1-x, 4);
  function frameStep(){ m.cells.forEach(c => { if (c.z==='f' && c.col){ const r = rng(c.x*31+c.y*57+seed); c.col = frameColor(c.x,c.y,N,m.t,phase,r); } }); }
  function tick(ts){
    if (!wrap.isConnected) return; raf = requestAnimationFrame(tick);
    if (!tStart) tStart = ts; const T = 900; const p = Math.min(1, (ts-tStart)/T); const want = ease(p)*order.length;
    let dirty = false; if (shown < order.length && (o.reveal !== false) && !reduce){ shown = want; dirty = true; } else if (shown < order.length){ shown = order.length; dirty = true; }
    if (!reduce && ts - last > (state==='working' ? 90 : 160) && shown >= order.length){
      last = ts; dirty = true;
      for (let i=0;i<5;i++){ const c = order[Math.floor(Math.random()*order.length)]; if (c.z==='i' && c.d > 0.5 && !c.glyph && !c.halo) c.col = pick(Math.random, NOISE); }
      if (state==='working'){ phase += 0.12; frameStep(); }
      tw++; order.forEach(c => { if (c.z==='i' && !c.glyph && !c.halo && c.d < 0.14) c.col = CORE[(tw + c.x + c.y) % 3]; });
    }
    if (dirty) draw();
  }
  const ro = new ResizeObserver(fit); ro.observe(wrap);
  requestAnimationFrame(() => { fit(); raf = requestAnimationFrame(tick); });
  wrap.setState = s => { state = s; };
  wrap.replay = () => { tStart = 0; shown = 0; };
  return wrap;
};

/* ---------- avatar: tiny static tile + state ring ---------- */
const cache = {};
function tile(agent){
  const key = agent.id; if (cache[key]) return cache[key];
  const seeds = {hermes:11, scout:23, ledger:37}; const seed = seeds[agent.id] || (agent.hue|0)+3;
  const m = build(9, seed, {frame:1, phase:(agent.hue||0)/30}); const cv = document.createElement('canvas'); const K = 8; cv.width = cv.height = 9*K; const x = cv.getContext('2d');
  m.cells.forEach(c => { if (c.col){ x.fillStyle = c.col; x.fillRect(c.x*K, c.y*K, K, K); } });
  return cache[key] = cv.toDataURL();
}
H.avatar = function(agent, size, state){
  size = size || 30; const st = state || agent.state || 'idle';
  return H.html(`<span class="av" data-state="${st}" title="${H.esc(agent.name)}" style="--s:${size}px;background-image:url(${tile(agent)})"><span class="ring"></span></span>`);
};
H.mark = (size=22) => H.html(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-label="Hermes"><path d="M3 14c5 0 9-3 12-9"/><path d="M6 18c5 0 10-4 13-10"/><path d="M10 21c4.5 0 9-4 11-9"/></svg>`);
})();
