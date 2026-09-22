import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { TOKEN_CATALOG } from "./tokens/tokens.js";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..");
const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char],
  );
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-");
const groups = [...new Set(TOKEN_CATALOG.map((token) => token.group))];
const isAsset = (id) => /^(app|actor|data|platform|city|earth)\./.test(id);
const usageHref = (id) =>
  isAsset(id) ? `studio.html?component=${encodeURIComponent(id)}&view=asset` :
  id.startsWith("home") || id.startsWith("world") || id.startsWith("structure") ? "index.html" :
  id.startsWith("studio") ? "studio.html" :
  id.startsWith("catalog") ? "catalog.html" :
  id.startsWith("motion") ? "motion.html" :
  id.startsWith("components") ? "components.html" : "#";

const cssVars = TOKEN_CATALOG.filter((token) => token.css)
  .map((token) => `  ${token.css}: ${token.value};`)
  .join("\n");
const css = `/* WinBrain Design Tokens — generated from source/tokens/tokens.js. */\n:root {\n${cssVars}\n}\n`;
await writeFile(join(out, "tokens.css"), css);

const cards = TOKEN_CATALOG.map((token) => {
  const swatch = token.type === "color"
    ? `<span class="swatch" style="--swatch:${esc(token.value)}"></span>`
    : `<span class="metric-preview"><i style="width:${Math.max(8, Math.min(104, Number.parseFloat(token.value) * 18 || 28))}px"></i></span>`;
  const usages = token.usage
    .map((id) => `<a href="${usageHref(id)}" title="查看 ${esc(id)}">${esc(id)}</a>`)
    .join("");
  return `<article class="token-card" id="token-${slug(token.id)}" data-search="${esc([token.id, token.group, token.type, token.value, ...token.usage].join(" ").toLowerCase())}" data-group="${esc(token.group)}">
    <div class="preview">${swatch}</div>
    <div class="token-copy"><div class="token-meta"><span>${esc(token.group)}</span><code>${esc(token.type)}</code></div><h2>${esc(token.id)}</h2><div class="value-row"><code>${esc(token.value)}</code><button class="copy" data-copy="${esc(token.value)}" aria-label="复制 ${esc(token.id)} 的值">复制</button></div>${token.css ? `<p class="css-name">${esc(token.css)}</p>` : ""}<div class="usage"><strong>USED BY</strong>${usages}</div></div>
  </article>`;
}).join("\n");

const groupButtons = ["全部", ...groups]
  .map((group, index) => `<button data-group-filter="${esc(group)}"${index === 0 ? ' class="active" aria-pressed="true"' : ' aria-pressed="false"'}>${esc(group)}</button>`)
  .join("");

const data = JSON.stringify(TOKEN_CATALOG).replace(/</g, "\\u003c");
const html = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WinBrain — Design Token Audit</title>
<link rel="stylesheet" href="tokens.css">
<style>
*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;background:var(--wb-color-canvas);color:var(--wb-color-text);font:var(--wb-type-body-size) -apple-system,BlinkMacSystemFont,"PingFang SC",Arial,sans-serif}a{color:inherit;text-decoration:none}a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--wb-color-accent);outline-offset:3px}header{height:74px;border-bottom:1px solid var(--wb-color-border);display:flex;align-items:center;justify-content:space-between;padding:0 4.5vw;background:var(--wb-color-panel-elevated);position:sticky;top:0;z-index:5}header strong{font-size:21px;letter-spacing:-.4px}header strong span{font-size:12px;font-weight:400;letter-spacing:.5px;color:#8da4c4;padding-left:20px;margin-left:18px;border-left:1px solid #405372}nav{display:flex;gap:24px;font-size:12px;color:#aabedb;flex-wrap:wrap}main{width:91%;max-width:1536px;margin:auto}.intro{padding:64px 0 42px;border-bottom:1px solid #2e3b4c;display:grid;grid-template-columns:1fr auto;gap:30px;align-items:end}.eyebrow{font-size:10px;color:#90b3e4;letter-spacing:2px}.intro h1{font-size:38px;letter-spacing:-1px;font-weight:500;margin:17px 0 12px}.intro p{color:var(--wb-color-text-muted);line-height:1.8;font-size:13px;margin:0;max-width:760px}.count{font-size:68px;font-weight:300;letter-spacing:-4px;color:#a9c9fa}.count small{display:block;font-size:10px;letter-spacing:1.5px;color:#728caa;text-align:right}.system-map{margin:26px 0 0;display:grid;grid-template-columns:1fr 38px 1fr 38px 1fr;align-items:center;gap:8px}.map-node{border:1px solid #39506f;background:#162232;border-radius:var(--wb-radius-card);padding:14px 15px;font-size:11px}.map-node b{display:block;color:#ddebff;font-size:12px;margin-bottom:5px}.map-arrow{text-align:center;color:#6caeff}.tools{padding:25px 0 5px;display:flex;gap:14px;justify-content:space-between;align-items:flex-start}.search{background:#162232;border:1px solid #3a4d67;color:#dbe9ff;padding:12px 14px;border-radius:6px;width:min(320px,100%);font:inherit}.filters{display:flex;gap:7px;flex-wrap:wrap}.filters button{border:1px solid #38506d;background:#162232;color:#91a9c9;border-radius:var(--wb-radius-control);padding:7px 11px;font-size:10px;cursor:pointer}.filters button.active{background:#315986;color:white;border-color:#77a8e6}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:15px;padding:22px 0 50px}.token-card{min-width:0;border:1px solid var(--wb-color-border);border-radius:var(--wb-radius-card);background:var(--wb-color-panel);overflow:hidden;display:grid;grid-template-columns:108px 1fr}.preview{background:#0e1723;display:grid;place-items:center;min-height:174px;border-right:1px solid #2c405a}.swatch{width:62px;height:62px;border-radius:50%;background:var(--swatch);border:1px solid #ffffff4a;box-shadow:0 9px 30px #0007}.metric-preview{width:74px;height:74px;border:1px solid #344d6d;border-radius:10px;display:grid;place-items:center;background:#142133}.metric-preview i{display:block;max-width:88px;height:7px;border-radius:7px;background:linear-gradient(90deg,#5989cb,#8fd9ff);box-shadow:0 0 18px #68b7ff77}.token-copy{padding:16px;min-width:0}.token-meta{display:flex;justify-content:space-between;gap:8px;color:#7694ba;font-size:9px;letter-spacing:.5px}.token-meta code{color:#667f9f}.token-card h2{font:500 14px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace;color:#dce9fa;margin:9px 0 12px;overflow-wrap:anywhere}.value-row{display:flex;align-items:center;gap:7px}.value-row code{background:#0f1926;border:1px solid #2d4058;color:#bcd8fa;border-radius:5px;padding:6px 8px;font-size:11px;min-width:0;overflow-wrap:anywhere}.copy{border:0;background:none;color:#7698c4;font-size:9px;cursor:pointer}.css-name{font:9px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#627d9d;margin:9px 0 0;overflow-wrap:anywhere}.usage{border-top:1px solid #2d4058;margin-top:13px;padding-top:11px;display:flex;gap:6px;flex-wrap:wrap}.usage strong{width:100%;font-size:8px;letter-spacing:1px;color:#58718f}.usage a{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;color:#a8caf5;border:1px solid #395574;border-radius:4px;padding:4px 5px}.usage a:hover{background:#294869;color:#fff}.empty{display:none;color:#8198b8;padding:35px 0 70px;text-align:center}footer{border-top:1px solid #30415b;padding:25px 0 36px;color:#7089a8;font-size:11px;line-height:1.7;display:flex;justify-content:space-between;gap:25px}footer a{color:#a5c3ec}[hidden]{display:none!important}@media(max-width:1120px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){header{height:auto;min-height:70px;padding:15px 22px;gap:12px}header strong span{display:none}nav{gap:12px}.intro{padding:38px 0 28px;grid-template-columns:1fr}.count{display:none}.system-map{grid-template-columns:1fr}.map-arrow{transform:rotate(90deg)}.tools{flex-direction:column}.grid{grid-template-columns:1fr}.token-card{grid-template-columns:92px 1fr}.preview{min-height:155px}footer{display:block}}@media(max-width:430px){.token-card{grid-template-columns:1fr}.preview{min-height:105px;border-right:0;border-bottom:1px solid #2c405a}.swatch{width:52px;height:52px}}
</style>
</head><body>
<header><a href="index.html"><strong>WinBrain<span>DESIGN TOKEN AUDIT</span></strong></a><nav><a href="components.html">Components</a><a href="catalog.html">Assets</a><a href="studio.html">Studio</a><a href="comparison.html">OpenCV</a><a href="index.html">Home</a></nav></header>
<main><section class="intro"><div><span class="eyebrow">DESIGN SYSTEM / SHARED SOURCE OF TRUTH</span><h1>Tokens 把重复的设计规则变成统一旋钮。</h1><p><code>source/tokens/tokens.js</code> 是真源；3D 世界在构建前读取它。<code>tokens.css</code> 为网页和后续界面提供相同变量。这里负责审计：看值、找使用者、跳到对应 Asset。</p><div class="system-map"><div class="map-node"><b>tokens.js</b>唯一真源</div><div class="map-arrow">→</div><div class="map-node"><b>tokens.css</b>UI / 文档变量</div><div class="map-arrow">+</div><div class="map-node"><b>3D Runtime</b>相机 / 灯光 / 材质 / 层级</div></div></div><div class="count">${TOKEN_CATALOG.length}<small>AUDITABLE TOKENS</small></div></section>
<section class="tools"><input id="search" class="search" type="search" placeholder="搜索 token、值或使用组件…" aria-label="搜索设计 token"><div class="filters" role="group" aria-label="Token 分类">${groupButtons}</div></section>
<div id="grid" class="grid">${cards}</div><div id="empty" class="empty">没有匹配的 Token。</div>
<footer><span>原则：重复设计规则进入 Token；一次性模型顶点、人物姿态等仍留在组件内部。</span><span><a href="source/tokens/tokens.js">查看真源 ↗</a>　<a href="tokens.css">CSS Variables ↗</a></span></footer></main>
<script>const DATA=${data};let active='全部';const cards=[...document.querySelectorAll('.token-card')],search=document.querySelector('#search'),empty=document.querySelector('#empty');function render(){const q=search.value.trim().toLowerCase();let visible=0;for(const card of cards){const okGroup=active==='全部'||card.dataset.group===active;const okSearch=!q||card.dataset.search.includes(q);card.hidden=!(okGroup&&okSearch);if(!card.hidden)visible++;}empty.style.display=visible?'none':'block'}search.addEventListener('input',render);document.querySelectorAll('[data-group-filter]').forEach(button=>button.addEventListener('click',()=>{active=button.dataset.groupFilter;document.querySelectorAll('[data-group-filter]').forEach(x=>{x.classList.toggle('active',x===button);x.setAttribute('aria-pressed',String(x===button))});render()}));document.querySelectorAll('.copy').forEach(button=>button.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(button.dataset.copy);button.textContent='已复制'}catch{button.textContent='选择值复制'}setTimeout(()=>button.textContent='复制',1200)}));</script>
</body></html>`;
await writeFile(join(out, "tokens.html"), html);
console.log(`Built tokens.css and tokens.html with ${TOKEN_CATALOG.length} auditable tokens.`);
