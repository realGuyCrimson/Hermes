/* Shared helpers. Global namespace: window.H  (views register in H.views) */
(function(){
const H = window.H = window.H || {};
H.views = {};

/* ---- DOM helper: h('div.card#id', {onclick, class, 'data-x'}, ...children) ---- */
H.h = function h(sel, attrs, ...kids){
  if (typeof attrs !== 'object' || attrs === null || attrs instanceof Node || Array.isArray(attrs)) { if (attrs!==undefined && attrs!==null) kids.unshift(attrs); attrs = {}; }
  const m = /^([a-z0-9-]*)((?:[.#][\w-]+)*)/i.exec(sel);
  const e = document.createElement(m[1] || 'div');
  (m[2].match(/[.#][\w-]+/g) || []).forEach(t => t[0]==='.' ? e.classList.add(t.slice(1)) : e.id = t.slice(1));
  for (const [k,v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') v.split(' ').filter(Boolean).forEach(c => e.classList.add(c));
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  const add = c => { if (c == null || c === false) return; if (Array.isArray(c)) c.forEach(add); else if (c instanceof Node) e.appendChild(c); else e.appendChild(document.createTextNode(String(c))); };
  kids.forEach(add);
  return e;
};
H.html = (s) => { const t = document.createElement('template'); t.innerHTML = s.trim(); return t.content.firstElementChild; };
H.esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---- Icons (24px grid, stroke) ---- */
const P = {
  plus:'M12 5v14M5 12h14', search:'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4', inbox:'M3 13l3-8h12l3 8v6H3v-6zM3 13h5l1 3h6l1-3h5',
  chat:'M4 5h16v11H9l-5 4V5z', folder:'M3 6h6l2 2h10v11H3V6z', clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  book:'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4zM5 17a3 3 0 0 1 3-3h10', plug:'M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v4',
  chart:'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3', gear:'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z',
  send:'M5 12l14-7-5 14-3-6-6-1z', stop:'M7 7h10v10H7z', check:'M5 12.5l4.5 4.5L19 7', x:'M6 6l12 12M18 6L6 18', chev:'M9 6l6 6-6 6', chevd:'M6 9l6 6 6-6', chevu:'M6 15l6-6 6 6',
  terminal:'M4 5h16v14H4V5zM8 10l3 2-3 2M13 15h4', file:'M6 3h8l4 4v14H6V3zM14 3v4h4', edit:'M4 20h4L19 9l-4-4L4 16v4zM13 7l4 4', globe:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18',
  brain:'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 5 1V4a3 3 0 0 0-2 0zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-5 1V4', bolt:'M13 3L5 14h6l-1 7 8-11h-6l1-7z',
  shield:'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4', key:'M14 10a4 4 0 1 0-3.5 4L14 17.5V20h2.5v-2.5H19V15h-2.5L14 12.5', link:'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  branch:'M7 4v12M7 16a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM17 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 8c0 5-10 3-10 8', diff:'M12 5v8M8 9h8M8 19h8', 
  paperclip:'M20 11l-8 8a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8', mic:'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM6 11a6 6 0 0 0 12 0M12 17v4', 
  more:'M5 12h.01M12 12h.01M19 12h.01', copy:'M8 8h11v12H8V8zM5 16V4h11', retry:'M4 12a8 8 0 0 1 14-5l2-2v6h-6l2.5-2.5A5 5 0 0 0 7 12M20 12a8 8 0 0 1-14 5l-2 2v-6h6l-2.5 2.5A5 5 0 0 0 17 12',
  undo:'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3', fork:'M6 3v6a4 4 0 0 0 4 4h4a4 4 0 0 1 4 4v4M6 3a2 2 0 1 0 0 .01M18 21a2 2 0 1 0 0-.01', pause:'M8 5v14M16 5v14', play:'M7 4l13 8-13 8V4z',
  sidebar:'M3 5h18v14H3V5zM9 5v14', panel:'M3 5h18v14H3V5zM15 5v14', sun:'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',
  moon:'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z', cpu:'M7 7h10v10H7V7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4', db:'M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3zM5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3',
  users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 4 6', cmd:'M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6z',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', warn:'M12 3l10 18H2L12 3zM12 10v5M12 18h.01', info:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5M12 8h.01',
  webhook:'M9 18a4 4 0 1 1 3-6.6M12 6a3 3 0 1 1 5.2 2L15 12M17 18a3 3 0 1 0 1-5.8H11', radio:'M12 13a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 16a6 6 0 0 1 0-8M16 8a6 6 0 0 1 0 8M5 19a10 10 0 0 1 0-14M19 5a10 10 0 0 1 0 14',
  board:'M4 4h5v16H4V4zM10 4h5v10h-5V4zM16 4h4v13h-4V4z', sparkle:'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2z',
  flask:'M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3', pin:'M12 17v5M8 3h8l-1 6 3 4H6l3-4-1-6z', trash:'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  archive:'M3 4h18v4H3V4zM5 8v12h14V8M10 12h4', download:'M12 4v11M7 11l5 5 5-5M5 20h14', upload:'M12 16V5M7 9l5-5 5 5M5 20h14', external:'M14 4h6v6M20 4l-9 9M18 14v6H4V6h6',
  image:'M3 5h18v14H3V5zM3 16l5-5 4 4 3-3 6 5M8.5 9.5h.01', at:'M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1', hash:'M5 9h15M4 15h15M10 3L8 21M16 3l-2 18', slash:'M16 3L8 21',
  moa:'M12 12m-2 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8',
  graph:'M6 7a2 2 0 1 0 0-.01M18 5a2 2 0 1 0 0-.01M12 18a2 2 0 1 0 0-.01M7.7 8.3l3 7.4M16.5 6.8l-3.5 9', layers:'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17.5L12 22l9-4.5', maximize:'M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5',
  lock:'M6 11h12v9H6v-9zM8 11V8a4 4 0 0 1 8 0v3', heart:'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z', route:'M6 19a2 2 0 1 0 0-.01M18 5a2 2 0 1 0 0-.01M8 19h6a4 4 0 0 0 0-8h-4a4 4 0 0 1 0-8h6',
};
H.icon = (n, cls='') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]||P.info}"/></svg>`;
H.ic = (n, cls='') => H.html(H.icon(n, cls));
H.iconNames = Object.keys(P);

/* ---- Agent avatar (presence). state: idle|thinking|working|waiting|blocked|done ---- */
H.avatar = function(agent, size=30, state){
  const st = state || agent.state || 'idle';
  const kind = agent.kind || 0;
  const acc = [
    '<path class="acc" d="M5 7.5C7 6 9 6 10.5 7M19 7.5C17 6 15 6 13.5 7"/>',            /* wings (hermes) */
    '<path class="acc" d="M8 5.5h8"/>',                                                      /* brim */
    '<path class="acc" d="M12 4.2v2.6M9.5 5.3l5 0"/>',                                       /* antenna */
    '<path class="acc" d="M7 6.5l2.5 1.2M17 6.5l-2.5 1.2"/>',                                /* ears */
  ][kind % 4];
  const mouth = st==='waiting' ? '<path class="acc" d="M10 16.5h4"/>' : st==='blocked' ? '<path class="acc" d="M9.8 17c1.4-1.2 3-1.2 4.4 0"/>' : '<path class="acc" d="M9.8 15.8c1.4 1.4 3 1.4 4.4 0"/>';
  const el = H.html(`<span class="av" style="--s:${size}px;--h:${agent.hue}" data-state="${st}" title="${H.esc(agent.name)}"><span class="ring"></span>
    <svg viewBox="0 0 24 24" aria-hidden="true">${acc}<circle class="eye" cx="9.2" cy="11.2" r="1.25"/><circle class="eye" cx="14.8" cy="11.2" r="1.25"/>${mouth}</svg></span>`);
  return el;
};
H.mark = (size=22) => H.html(`<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" aria-label="Hermes"><path d="M3 14c5 0 9-3 12-9"/><path d="M6 18c5 0 10-4 13-10"/><path d="M10 21c4.5 0 9-4 11-9"/></svg>`);

/* ---- small utilities ---- */
H.toast = (msg) => {
  let box = document.querySelector('.toasts'); if (!box) { box = H.h('div.toasts', {role:'status','aria-live':'polite'}); document.body.appendChild(box); }
  const t = H.h('div.toast', msg); box.appendChild(t); setTimeout(() => t.remove(), 2600);
};
H.fmt = { n: v => Number(v).toLocaleString('en-US'), k: v => v>=1e6 ? (v/1e6).toFixed(1)+'M' : v>=1e3 ? (v/1e3).toFixed(v>=1e4?0:1)+'k' : String(v), usd: v => '$'+Number(v).toFixed(v<1?3:2) };
H.pill = (text, tone='') => H.h('span.pill'+(tone?'.'+tone:''), text);
H.sw = (on, onChange, label) => { const b = H.h('button.switch', {role:'switch','aria-checked':String(!!on),'aria-label':label||'toggle'}); b.onclick = () => { const v = b.getAttribute('aria-checked')!=='true'; b.setAttribute('aria-checked',String(v)); onChange && onChange(v); }; return b; };
H.tabs = (items, active, onPick) => {
  const root = H.h('div.tabs', {role:'tablist'});
  items.forEach(it => { const b = H.h('button', {role:'tab','aria-selected':String(it.id===active),onclick:()=>{ root.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected','false')); b.setAttribute('aria-selected','true'); onPick(it.id); }}, it.icon?H.ic(it.icon,'sm'):null, it.label, it.count!=null?H.h('span.count',it.count):null); root.appendChild(b); });
  return root;
};
H.seg = (items, active, onPick) => {
  const root = H.h('div.seg', {role:'group'});
  items.forEach(it => { const b = H.h('button', {'aria-pressed':String(it.id===active),onclick:()=>{ root.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false')); b.setAttribute('aria-pressed','true'); onPick(it.id); }}, it.label); root.appendChild(b); });
  return root;
};
H.modal = (content, {width=560, onClose}={}) => {
  const scrim = H.h('div.scrim'); const wrap = H.h('div', {style:{position:'fixed',inset:0,zIndex:71,display:'grid',placeItems:'start center',paddingTop:'12vh',overflow:'auto'}});
  const box = H.h('div.float', {style:{width:`min(${width}px,calc(100vw - 24px))`}}, content);
  wrap.appendChild(box);
  const close = () => { scrim.remove(); wrap.remove(); document.removeEventListener('keydown', esc); onClose && onClose(); };
  const esc = e => { if (e.key==='Escape') close(); };
  scrim.onclick = close; wrap.onclick = e => { if (e.target===wrap) close(); };
  document.addEventListener('keydown', esc); document.body.append(scrim, wrap);
  return {close, box};
};
})();
