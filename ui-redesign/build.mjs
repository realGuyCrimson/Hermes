// Copy prototype/ into dist/ for `hermes dashboard` (HERMES_WEB_DIST): index.html + assets/studio/{css,js}/*.
// No dependencies. Usage: node build.mjs [outDir]
import fs from 'node:fs'; import path from 'node:path';
const root = path.dirname(new URL(import.meta.url).pathname); const src = path.join(root, 'prototype'); const out = process.argv[2] || path.join(root, 'dist');
const html = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const css = [...html.matchAll(/<link rel="stylesheet" href="(css\/[^"]+)"/g)].map(m => m[1]);
const js = [...html.matchAll(/<script src="(js\/[^"]+)"/g)].map(m => m[1]);
const ver = Date.now().toString(36);
fs.mkdirSync(path.join(out, 'assets', 'studio'), {recursive: true});
for (const f of [...css, ...js]) { const to = path.join(out, 'assets', 'studio', f); fs.mkdirSync(path.dirname(to), {recursive: true}); fs.copyFileSync(path.join(src, f), to); }
if (fs.existsSync(path.join(src,'vendor'))) fs.cpSync(path.join(src,'vendor'), path.join(out,'assets','studio','vendor'), {recursive:true});
const fonts = html.match(/<link href="https:\/\/fonts\.googleapis\.com[^>]+>/)[0];
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hermes</title>
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' fill='%23060338'/%3E%3Crect x='9' y='9' width='6' height='6' fill='%23f8d674'/%3E%3C/svg%3E">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fonts}
${css.map(f => `<link rel="stylesheet" href="/assets/studio/${f}?v=${ver}">`).join("\n")}
</head>
<body>
<div id="app"></div>
<script>window.__consoleErrors=[];window.addEventListener("error",function(e){window.__consoleErrors.push(e.message+" @"+(e.filename||"").split("/").pop()+":"+e.lineno)});</script>
${js.map(f => `<script src="/assets/studio/${f}?v=${ver}"></script>`).join("\n")}
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), page);
console.log(`built ${out}: ${css.length} css, ${js.length} js (v=${ver})`);
