"""Studio restyle for Hermes' server-rendered /login (and its sibling pages).

Loaded by a 6-line hook appended to hermes_cli/dashboard_auth/login_page.py (see install-login.sh).
It never replaces the page: it post-processes the HTML Hermes already rendered, so the form, the
fetch/redirect script, the OAuth anchors, the proxy-prefix rewrite and every provider keep working
exactly as shipped. Any exception falls back to the stock page.
"""
from __future__ import annotations

import pathlib
import re

_HERE = pathlib.Path(__file__).resolve().parent
try:
    _MOSAIC = (_HERE / "mosaic.dataurl").read_text().strip()
except Exception:  # noqa: BLE001 - art is decoration only
    _MOSAIC = ""

_FONTS = (
    '<link rel="preconnect" href="https://fonts.googleapis.com">'
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
    '<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">'
)

_MARK = ('<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" '
         'stroke-linecap="square" aria-hidden="true"><path d="M3 14c5 0 9-3 12-9"/><path d="M6 18c5 0 10-4 13-10"/>'
         '<path d="M10 21c4.5 0 9-4 11-9"/></svg>')

_CSS = """
:root{
  --s-navy:#060338; --s-navy2:#0d0a4c; --s-gold:#f2c14e; --s-cream:#f6efd8; --s-paper:#f3f1ea; --s-surface:#fcfbf7;
  --s-border:#dcd8c7; --s-ink:#0a0640; --s-muted:#4a4680; --s-err:#c4452a;
  --s-ease:cubic-bezier(.16,1,.3,1);
  --s-font:"Plus Jakarta Sans",Inter,system-ui,-apple-system,"Segoe UI",sans-serif;
  --ps:var(--s-paper); --pt:var(--s-ink); --pm:var(--s-muted); --pf:var(--s-surface); --pb:var(--s-border); --pa:var(--s-ink); --pai:var(--s-paper);
}
@media (prefers-color-scheme:dark){
  :root{--ps:#0d0a4c; --pt:#f6efd8; --pm:#b9b4e0; --pf:#171264; --pb:#26207a; --pa:#f2c14e; --pai:#060338; --s-err:#ff8060}
}
html,body{min-height:100%;background:var(--ps)!important;background-image:none!important;color:var(--pt);font-family:var(--s-font)}
body{display:grid!important;grid-template-columns:minmax(0,1.15fr) minmax(380px,.85fr);place-items:stretch!important;padding:0!important;min-height:100vh}
.s-art{position:relative;overflow:hidden;background:var(--s-navy);color:var(--s-cream);display:grid;place-items:center;min-height:100vh}
.s-ghost{position:absolute;left:-.04em;bottom:-.2em;font-weight:800;font-size:clamp(140px,26vw,420px);line-height:1;letter-spacing:-.04em;color:rgba(246,239,216,.075);user-select:none;pointer-events:none;white-space:nowrap}
.s-mosaic{position:relative;width:min(46vh,34vw,460px);aspect-ratio:1;image-rendering:pixelated;animation:s-rise .9s var(--s-ease) both}
.s-mosaic img{display:block;width:100%;height:100%;image-rendering:pixelated}
.s-art p{position:absolute;left:clamp(24px,4vw,56px);top:clamp(24px,5vh,48px);margin:0;font-size:13px;letter-spacing:.02em;color:rgba(246,239,216,.7);max-width:26ch;animation:s-fade .9s .15s var(--s-ease) both}
main{max-width:26rem!important;width:100%;margin:auto!important;padding:clamp(24px,6vh,72px) clamp(20px,4vw,40px);animation:s-up .7s .08s var(--s-ease) both!important}
.brand{display:flex!important;align-items:center;gap:10px;text-align:left!important;margin:0 0 clamp(28px,7vh,64px)!important;font-family:var(--s-font)!important;font-weight:800!important;font-size:18px!important;letter-spacing:-.01em!important;text-transform:none!important;color:var(--pt)!important}
.card{background:transparent!important;border:0!important;box-shadow:none!important;padding:0!important}
h1{font-family:var(--s-font)!important;font-weight:800!important;font-size:clamp(34px,5vw,46px)!important;letter-spacing:-.03em!important;text-transform:none!important;color:var(--pt)!important;margin:0 0 .5rem!important;line-height:1.05}
.subtitle{color:var(--pm)!important;font-size:15px!important;margin:0 0 1.75rem!important}
.form-title{display:none!important}
.provider-list{gap:.9rem!important}
.provider-form{gap:1rem!important}
.field-label{font-family:var(--s-font)!important;font-size:12.5px!important;font-weight:600;letter-spacing:.01em!important;text-transform:none!important;color:var(--pm)!important}
.field-input{font-family:var(--s-font)!important;font-size:15px!important;padding:.8rem .9rem!important;background:var(--pf)!important;color:var(--pt)!important;border:1px solid var(--pb)!important;border-radius:3px!important;box-shadow:none;transition:border-color .16s var(--s-ease),box-shadow .42s var(--s-ease)}
.field-input:hover{border-color:var(--pm)!important}
.field-input:focus-visible{border-color:var(--pa)!important;box-shadow:0 0 0 3px color-mix(in srgb,var(--pa) 22%,transparent)!important}
.provider-btn{font-family:var(--s-font)!important;font-weight:700!important;font-size:14px!important;letter-spacing:0!important;text-transform:none!important;padding:.9rem 1rem!important;background:var(--pa)!important;color:var(--pai)!important;border-radius:3px!important;box-shadow:none!important;transition:transform .16s var(--s-ease),filter .42s var(--s-ease)!important}
.provider-btn:hover{filter:brightness(1.12)!important;transform:translateY(-1px)}
.provider-btn:active{filter:none!important;transform:translateY(1px) scale(.99);transition-duration:.08s!important}
.provider-btn:focus-visible{outline:2px solid var(--pa)!important;outline-offset:3px!important}
.provider-btn[disabled]{opacity:.6;cursor:progress}
.form-error{color:var(--s-err)!important;font-size:13px!important}
footer{color:var(--pm)!important;font-family:var(--s-font)!important;font-size:12.5px!important;letter-spacing:0!important;text-transform:none!important;margin-top:2.5rem!important;text-align:left!important}
footer .sep{display:none!important}
code{font-family:"Geist Mono",ui-monospace,monospace}
@keyframes s-rise{from{opacity:0;transform:translateY(14px) scale(.96)}to{opacity:1;transform:none}}
@keyframes s-fade{from{opacity:0}to{opacity:1}}
@keyframes s-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (max-width:880px){
  body{grid-template-columns:minmax(0,1fr);grid-template-rows:auto 1fr}
  .s-art{min-height:0;height:clamp(150px,26vh,220px);place-items:center end;padding-right:clamp(20px,6vw,40px)}
  .s-mosaic{width:clamp(110px,22vh,170px)}
  .s-ghost{font-size:clamp(110px,34vw,200px);bottom:-.28em}
  .s-art p{display:none}
  main{margin:0 auto!important;padding-top:clamp(24px,5vh,40px)}
  .brand{margin-bottom:28px!important}
}
@media (prefers-reduced-motion:reduce){main,.s-mosaic,.s-art p{animation:none!important}.provider-btn,.field-input{transition:none!important}}
"""


def _art() -> str:
    img = f'<img src="{_MOSAIC}" alt="" width="528" height="528">' if _MOSAIC else ""
    return ('<div class="s-art" aria-hidden="true"><div class="s-ghost">Hermes</div>'
            f'<div class="s-mosaic">{img}</div>'
            '<p>Your agent, its threads and everything it can reach, in one calm place.</p></div>')


def restyle(page: str) -> str:
    try:
        out = page.replace("</head>", _FONTS + "<style>" + _CSS + "</style></head>", 1)
        out = re.sub(r'<div class="brand">.*?</div>', '<div class="brand">' + _MARK + 'Hermes</div>', out, count=1, flags=re.S)
        out = out.replace("<body>", "<body>" + _art(), 1)
        return out
    except Exception:  # noqa: BLE001 - never break sign-in over styling
        return page
