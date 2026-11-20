/* Stage kit: one goal per screen.  H.stage(def, ctx) builds a flat colour field with a giant background title,
   a big pixel mosaic, one sentence, one primary action and a few doorways. Anything more opens in the drawer (workbench). */
(function(){
const H = window.H, h = H.h;
H.work = H.work || {};   // dense workbench modules, mounted inside the drawer: H.work.<name>.render(root, ctx)

/* ---------- drawer: expandable sidebar that slides in from the right ---------- */
H.drawer = function(o){
  const scrim = h('div.dscrim'); const body = h('div.dbody');
  const title = h('h2', o.title || '');
  const close = () => { if (dr._closing) return; dr._closing = true; scrim.classList.remove('on'); aside.classList.remove('on'); document.removeEventListener('keydown', esc); setTimeout(() => { scrim.remove(); aside.remove(); }, 380); o.onClose && o.onClose(); };
  const esc = e => { if (e.key === 'Escape') close(); };
  const aside = h('aside.drawer', {style:o.width?{width:o.width}:null, role:'dialog','aria-modal':'true','aria-label':o.title || 'Details', 'data-ch':o.ch || ''},
    h('header.dhead', title, h('span.grow'), o.actions || null, h('button.btn.ghost.icon', {'aria-label':'Close', onclick:close}, H.ic('x'))), body);
  scrim.onclick = close; document.addEventListener('keydown', esc);
  document.body.append(scrim, aside);
  requestAnimationFrame(() => requestAnimationFrame(() => { scrim.classList.add('on'); aside.classList.add('on'); }));
  const dr = {el:aside, body, close, setTitle:t => { title.textContent = t; }}; return dr;
};

/* ---------- fit the giant title to the stage width ---------- */
function fitTitle(stage, t){
  const fit = () => { const w = stage.clientWidth; if (!w) return; t.style.fontSize = '100px'; const tw = t.scrollWidth || 1; const size = Math.min(100 * (w * 0.94) / tw, stage.clientHeight * 0.52); t.style.fontSize = Math.max(64, size) + 'px'; };
  new ResizeObserver(fit).observe(stage); fit(); if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
}

/* ---------- the stage ---------- */
H.stage = function(def, ctx){
  const art = def.art === false ? null : H.mosaic(Object.assign({size:33, seed:def.seed || 7, glyph:def.glyph}, def.art || {}));
  const title = h('h1.stage-title', def.title);
  const lead = h('p.stage-lead', {'data-rise':1}, def.lead || '');
  const sub = def.sub ? h('p.stage-sub', {'data-rise':2}, def.sub) : null;
  const actions = h('div.stage-actions', {'data-rise':3});
  if (def.primary) actions.append(h('button.btn.primary.big', {onclick:def.primary.onclick}, def.primary.label, H.ic('chev','arrow')));
  if (def.secondary) actions.append(h('button.btn.big.line', {onclick:def.secondary.onclick}, def.secondary.label));
  const doors = (def.doors && def.doors.length) ? h('nav.stage-doors', {'data-rise':4, 'aria-label':def.title+' sections'}, ...def.doors.map(d => h('button.door', {onclick:()=>openWork(d.tab)}, h('span', d.label), d.count != null ? h('span.dn.num', String(d.count)) : null, H.ic('chev','sm arrow')))) : null;
  const copy = h('div.stage-copy', lead, sub, actions, doors, def.foot || null);
  const handle = def.work ? h('button.stage-handle', {'aria-label':def.handle || 'Open all', onclick:()=>openWork()}, h('span.hl', def.handle || 'Everything'), def.handleCount != null ? h('span.hc.num', String(def.handleCount)) : null, H.ic('chevu','sm')) : null;
  const el = h('section.stage', {'data-ch':def.ch || 'home'}, title, art ? h('div.stage-art', {'data-rise':0}, art) : null, copy, handle);
  let dr = null;
  function openWork(tab){
    if (!def.work) return;
    if (dr) { if (!tab) return; const d = dr; dr = null; d.close(); setTimeout(() => openWork(tab), 400); return; }
    dr = H.drawer({title:def.workTitle || def.title, ch:def.ch, onClose:() => { dr = null; if (location.hash.split('/').length > 2 || def.dropHashOnClose !== false) history.replaceState(null,'','#/'+def.name); }});
    const root = h('div.wb'); dr.body.append(root);
    const m = H.work[def.work]; const c = Object.assign({}, ctx, {route: tab ? [tab] : (ctx.route || [])});
    if (m) m.render(root, c); else root.append(h('div.empty', 'Workbench not loaded'));
    if (tab) history.replaceState(null, '', '#/'+def.name+'/'+tab);
  }
  requestAnimationFrame(() => { fitTitle(el, title); });
  const api = {el, openWork, update(args){ if (args && args[0] && def.work) openWork(args[0]); }, state(s){ art && art.setState && art.setState(s); }, art};
  if (ctx && ctx.route && ctx.route[0] && def.work) setTimeout(() => openWork(ctx.route[0]), 360);
  def.mount && def.mount(el, api, ctx);
  return api;
};
/* convenience: register a stage as a view */
H.defineStage = function(def){
  H.views[def.name] = { title:def.title, render(root, ctx){ const s = H.stage(def, ctx); root.append(s.el); return s; } };
};
})();
