import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { UI_SYSTEM, UI_COMPONENTS, COMPONENT_GROUPS } from "./system/ui-registry.js";
import { splitRules, scopeRules } from "./system/css-scope.js";
import { auditDesignSystem } from "./system/audit.js";

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, "..");

const esc = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
const attr = (value) => esc(value).replace(/\n/g, " ");
const slug = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Element-level rules every stage of a given kind needs before its own components.
// Kept explicit so the extraction stays predictable.
const STAGE_BASE = {
  docs: ["*", "html", "body", "a", "a:focus-visible", "button:focus-visible", "header", "nav", "footer"],
  home: ["*", "html", "body", "button", "a", "button:focus-visible", "a:focus-visible", ".viewport", ".scene"],
  studio: ["*", "html", "body", "button", "a", "input", "select", ":root", "[hidden]"],
};

// Which stylesheets define each surface. Element-level base rules (`body`, `a`, `button`)
// are only taken from a stage's own surface files: the homepage's `body` is #f4f5f8 and
// the documentation pages' is --wb-color-text, so borrowing one surface's base into
// another stage silently changes the colours that stage inherits.
const SURFACE_FILES = {
  docs: ["source/build-tokens.mjs", "source/build-motion.mjs", "source/build-catalog.mjs", "source/build-system.mjs"],
  home: ["source/shell.html"],
  studio: ["source/editor/studio.css", "source/shell.html"],
};

// @keyframes the motion previews need. Names are global; only these are copied in.
const KEYFRAMES = ["bob", "packet", "rise", "orbit"];

const cssCache = new Map();
async function loadSourceRules(file) {
  if (cssCache.has(file)) return cssCache.get(file);
  let text;
  try {
    text = await readFile(join(root, "..", file), "utf8");
  } catch {
    text = "";
  }
  const blocks = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((match) => match[1]);
  let rules = [];
  if (blocks.length) {
    // Base64 font bytes stay in place for the parser to skip as an @font-face rule;
    // stripping them with a regex would swallow the stylesheet that follows.
    rules = splitRules(blocks.join("\n"));
  } else if (file.endsWith(".css")) {
    rules = splitRules(text);
  }
  // A file with no stylesheet (a JS module, or an HTML shell whose styles are injected at
  // build time) contributes nothing. Parsing it as CSS would turn braces in source code
  // into a bogus rule that swallows the rest of the sheet.
  cssCache.set(file, rules);
  return rules;
}

export const previewClass = (component) => `ds-pv-${slug(component.id)}`;

/**
 * Collect the stylesheet one component's preview stage needs.
 *
 * Every stage is scoped to its own component class, not just to a shared `.ds-stage`.
 * Components that never co-exist on a real page can share selector names — `.swatch`
 * (Token audit) and `.preview>span` (Asset library) both describe a span inside a preview
 * box — and merging their rules into one scope lets the higher-specificity one win.
 *
 * The stage kind still matters: the homepage's `body` is #f4f5f8 and the documentation
 * pages' is --wb-color-text, so element-level base rules are only taken from the stage's
 * own surface files, named in SURFACE_FILES.
 */
async function buildCss(component) {
  const stage = component.stage;
  // `sources` is provenance for the reader; `cssSources` is what the extractor reads.
  // They differ when a component's markup is built in JS but styled elsewhere.
  const files = new Set(component.cssSources || component.sources);
  // build.mjs embeds the homepage stylesheet into studio.html, so editor components
  // really do inherit its element resets (button border, font, cursor). Without it the
  // preview would fall back to user-agent button chrome that the product never shows.
  if (stage === "studio") files.add("source/shell.html");
  const surface = new Set(SURFACE_FILES[stage] || []);
  const scope = `:where(.ds-stage--${stage}.${previewClass(component)})`;
  const chunks = [];
  for (const file of files) {
    const rules = await loadSourceRules(file);
    const needles = surface.has(file) ? [...new Set([...component.selectors, ...(STAGE_BASE[stage] || [])])] : component.selectors;
    const scoped = scopeRules(rules, needles, { scope, scopeClass: scope, keepKeyframes: KEYFRAMES });
    if (scoped.trim()) chunks.push(`/* ${component.id} · ${file} */\n${scoped}`);
  }
  return chunks.join("\n");
}

const PREVIEW_CSS = `
/* Preview chrome. This is the documentation page's own layout, not component design,
   so it lives here rather than in a shipping stylesheet. */
.ds-frame{position:relative;border:1px solid var(--wb-color-border);border-radius:var(--wb-radius-card);background:#0b1119;overflow:hidden;margin-top:18px}
.ds-frame--scene{aspect-ratio:1536/1024;padding:0;background:#070c12}
.ds-frame--scene .ds-stage{position:absolute;inset:0}
.ds-frame--scene .scene{transform:scale(var(--k,.33));transform-origin:top left}
.ds-stage{padding:26px;min-height:96px;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}
/* Type and colour are deliberately absent here: the extracted shipping rules set them,
   and a value written here would outrank the real one and hide a drift. */
.ds-stage--studio{display:block;padding:22px}
.ds-stage--docs{display:block}
.ds-stage--home{display:block;padding:0;min-height:0}
.ds-stage-note{margin:9px 0 0;font-size:11px;color:#7c93b3}
.ds-stage-note b{color:#a9c9f2;font-weight:500}
`;

// Documentation-page chrome. Every selector that could also name something inside a
// preview stage is scoped under `.ds-page`, otherwise the audit page's own layout would
// leak into the components it is supposed to be showing unmodified.
const PAGE_CSS = `
*{box-sizing:border-box}html{color-scheme:dark;scroll-behavior:smooth}
body{margin:0;background:var(--wb-color-canvas);color:var(--wb-color-text);font:var(--wb-type-body-size) -apple-system,BlinkMacSystemFont,"PingFang SC",Arial,sans-serif}
a{color:inherit;text-decoration:none}
a:focus-visible,button:focus-visible,input:focus-visible{outline:2px solid var(--wb-color-accent);outline-offset:3px}
.ds-page>header{height:74px;border-bottom:1px solid var(--wb-color-border);display:flex;align-items:center;justify-content:space-between;padding:0 4.5vw;background:#161f2b;position:sticky;top:0;z-index:20}
.ds-page>header strong{font-size:21px;letter-spacing:-.4px}
.ds-page>header strong span{font-size:12px;font-weight:400;letter-spacing:.5px;color:#8da4c4;padding-left:20px;margin-left:18px;border-left:1px solid #405372}
.ds-pagenav{display:flex;gap:22px;font-size:12px;color:#aabedb;flex-wrap:wrap}
.ds-page>main{width:91%;max-width:1536px;margin:auto}
.ds-page .hero{padding:64px 0 42px;border-bottom:1px solid #2e3b4c;display:grid;grid-template-columns:1fr auto;gap:30px;align-items:end}
.ds-page .eyebrow{font-size:10px;color:#90b3e4;letter-spacing:2px}
.ds-page .hero h1{font-size:38px;letter-spacing:-1px;font-weight:500;margin:17px 0 12px}
.ds-page .hero p{color:var(--wb-color-text-muted);line-height:1.8;font-size:13px;margin:0;max-width:760px}
.ds-page .hero code{background:#0f1926;border:1px solid #2d4058;border-radius:4px;padding:1px 5px;font-size:12px;color:#bcd8fa}
.ds-page .count{font-size:68px;font-weight:300;letter-spacing:-4px;color:#a9c9fa}
.ds-page .count small{display:block;font-size:10px;letter-spacing:1.5px;color:#728caa;text-align:right}
.ds-page .map{margin:26px 0 0;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;max-width:1000px}
.ds-page .map div{border:1px solid #39506f;background:#162232;border-radius:var(--wb-radius-card);padding:13px 14px;font-size:11px;color:#c9dcf5}
.ds-page .map b{display:block;font-size:12px;color:#ddebff;margin-bottom:5px}
.ds-page .map span{color:#7e97b8;font-size:10px}
.ds-page .strip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;padding:26px 0 4px}
.ds-page .stat{border:1px solid var(--wb-color-border);background:var(--wb-color-panel);border-radius:var(--wb-radius-card);padding:16px 17px}
.ds-page .stat b{display:block;font-size:31px;font-weight:300;color:#cfe2ff;letter-spacing:-1px}
.ds-page .stat span{display:block;font-size:11px;color:#8ba1bf;margin-top:5px;line-height:1.5}
.ds-page .stat.warn b{color:#e8c98a}
.ds-page .tools{padding:24px 0 14px;display:flex;gap:14px;justify-content:space-between;align-items:flex-start;position:sticky;top:74px;background:var(--wb-color-canvas);z-index:10;border-bottom:1px solid #24303f}
.ds-page .search{background:#162232;border:1px solid #3a4d67;color:#dbe9ff;padding:12px 14px;border-radius:6px;width:min(320px,100%);font:inherit}
.ds-page .filters{display:flex;gap:7px;flex-wrap:wrap}
.ds-page .filters button{border:1px solid #38506d;background:#162232;color:#91a9c9;border-radius:16px;padding:7px 11px;font-size:10px;cursor:pointer}
.ds-page .filters button.active{background:#315986;color:white;border-color:#77a8e6}
.ds-page .section-head{display:flex;justify-content:space-between;align-items:end;margin:44px 0 4px;padding-bottom:13px;border-bottom:1px solid #2e3b4c}
.ds-page .section-head h2{font-size:19px;font-weight:500;margin:0}
.ds-page .section-head span{font-size:11px;color:#7c93b3;max-width:52%}
.ds-component{border-top:1px solid #24303f;padding:36px 0 40px;scroll-margin-top:150px}
.ds-component:first-of-type{border-top:0}
.ds-head{display:grid;grid-template-columns:minmax(0,1fr);gap:6px}
.ds-kind{font-size:9px;letter-spacing:1.4px;color:#7fa6d9}
.ds-head h3{font-size:23px;font-weight:500;margin:0;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.ds-head h3 code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#8fb4e4;border:1px solid #395574;border-radius:4px;padding:3px 6px}
.ds-summary{margin:2px 0 0;color:#a9bfda;line-height:1.75;font-size:13px;max-width:900px}
.ds-meta{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}
.ds-meta span{font:9px ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid #395574;border-radius:4px;padding:4px 6px;color:#9dbde4}
.ds-meta span.gap{border-color:#6b5330;color:#d6b075}
.ds-body{display:grid;grid-template-columns:minmax(0,1fr);gap:26px;margin-top:26px}
.ds-block h4{font-size:11px;letter-spacing:1.4px;color:#7fa6d9;font-weight:500;margin:0 0 11px;text-transform:uppercase}
.ds-block p{margin:0;color:#a9bfda;line-height:1.8;font-size:13px}
.ds-body table{width:100%;border-collapse:collapse;font-size:12px}
.ds-body th,.ds-body td{text-align:left;padding:9px 11px;border-bottom:1px solid #26313f;vertical-align:top;line-height:1.6}
.ds-body th{font-size:10px;letter-spacing:.8px;color:#7e97b8;font-weight:500;background:#131c28}
.ds-body td code{font:11px ui-monospace,SFMono-Regular,Menlo,monospace;color:#bcd8fa;background:#0f1926;border:1px solid #2d4058;border-radius:4px;padding:2px 5px;overflow-wrap:anywhere}
.ds-body td:first-child{color:#dcebfd}
.ds-a11y{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.ds-a11y div{border:1px solid #2d4058;background:#141f2d;border-radius:var(--wb-radius-card);padding:13px 14px}
.ds-a11y b{display:block;font-size:9px;letter-spacing:1.2px;color:#6f8bb0;margin-bottom:7px}
.ds-a11y p{margin:0;font-size:12px;color:#b8cce6;line-height:1.7}
.guidance{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.guidance ul{margin:0;padding:0;list-style:none}
.guidance li{font-size:12px;line-height:1.7;color:#b8cce6;padding:8px 0 8px 22px;position:relative;border-bottom:1px solid #222d3b}
.guidance li:before{position:absolute;left:0;top:8px;font-size:12px}
.guidance .do li:before{content:"✅"}
.guidance .dont li:before{content:"❌"}
.guidance h5{margin:0 0 4px;font-size:11px;color:#8fb4e4;font-weight:500}
.ds-body pre{margin:0;background:#0d1521;border:1px solid #2d4058;border-radius:var(--wb-radius-card);padding:15px 17px;overflow-x:auto;font:12px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;color:#c3d9f5}
.ds-page .findings{margin-top:34px;border-top:1px solid #2e3b4c;padding-top:26px}
.ds-page .findings b{color:#e8c98a;font-weight:500}
.ds-page .radius-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:11px}
.ds-page .radius-list span{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid #395574;border-radius:4px;padding:5px 7px;color:#a8c8ee}
.ds-page .radius-list span.orphan{border-color:#6b5330;color:#d6b075}
.ds-page footer{margin-top:52px;border-top:1px solid #30415b;padding:25px 0 36px;color:#7089a8;font-size:11px;line-height:1.8;display:flex;justify-content:space-between;gap:25px;flex-wrap:wrap}
.ds-page footer a{color:#a5c3ec}
[hidden]{display:none!important}
@media(max-width:1100px){.ds-page .strip{grid-template-columns:repeat(2,minmax(0,1fr))}.ds-a11y{grid-template-columns:1fr}.ds-page .map{grid-template-columns:repeat(2,1fr)}}
@media(max-width:760px){.ds-page>header{height:auto;min-height:70px;padding:15px 22px;gap:12px}.ds-page>header strong span{display:none}.ds-pagenav{gap:12px}.ds-page .hero{grid-template-columns:1fr;padding:38px 0 28px}.ds-page .count{display:none}.guidance{grid-template-columns:1fr}.ds-page .tools{position:static;flex-direction:column}.ds-page footer{display:block}}
`;

// ------------------------------------------------------------------ rendering

const table = (headers, rows) =>
  `<table><thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;

function stageFrame(component, { forPreview = false } = {}) {
  const inner = forPreview
    ? component.markup.replace(/(src|href)="(previews|assets)\//g, '$1="../$2/')
    : component.markup;
  const classes = `ds-stage ds-stage--${component.stage} ${previewClass(component)}`;
  if (component.stage === "home") {
    return `<div class="ds-frame ds-frame--scene"><div class="${classes}"><div class="viewport"><main class="scene" aria-label="${attr(component.name)} 预览">${inner}</main></div></div></div>`;
  }
  return `<div class="ds-frame"><div class="${classes}">${inner}</div></div>`;
}

function componentDoc(component) {
  const search = attr(
    [component.id, component.name, component.group, component.summary, ...component.selectors, ...component.tokens, ...component.hardcoded]
      .join(" ")
      .toLowerCase(),
  );
  const groups = COMPONENT_GROUPS.find((group) => group.id === component.group);
  const tokenChips = component.tokens.length
    ? component.tokens.map((token) => `<span>${esc(token)}</span>`).join("")
    : `<span class="gap">未使用 Token</span>`;
  const literalChips = component.hardcoded.length
    ? component.hardcoded.map((value) => `<span class="gap">${esc(value)}</span>`).join("")
    : "";
  return `<article class="ds-component" id="c-${slug(component.id)}" data-search="${search}" data-group="${esc(component.group)}">
  <div class="ds-head">
    <span class="ds-kind">${esc((groups?.name || component.group).toUpperCase())} / UI COMPONENT</span>
    <h3>${esc(component.name)}<code>${esc(component.id)}</code></h3>
    <p class="ds-summary">${esc(component.summary)}</p>
    <div class="ds-meta">${component.sources.map((source) => `<span>${esc(source)}</span>`).join("")}${tokenChips}${literalChips}</div>
  </div>
  ${stageFrame(component)}
  <p class="ds-stage-note">舞台：<b>${esc(UI_SYSTEM.stages[component.stage].label)}</b> · ${esc(UI_SYSTEM.stages[component.stage].note)}</p>
  <div class="ds-body">
    <section class="ds-block"><h4>Description</h4><p>${esc(component.description)}</p></section>
    <section class="ds-block"><h4>Variants</h4>${table(["Variant", "Use When", "Selector"], component.variants.map((v) => [esc(v.name), esc(v.useWhen), `<code>${esc(v.selector)}</code>`]))}</section>
    <section class="ds-block"><h4>Props / Properties</h4>${table(["Property", "Type", "Default", "Description"], component.props.map((p) => [`<code>${esc(p.property)}</code>`, esc(p.type), `<code>${esc(p.default)}</code>`, esc(p.description)]))}</section>
    <section class="ds-block"><h4>States</h4>${table(["State", "Visual", "Behavior"], component.states.map((s) => [esc(s.state), esc(s.visual), esc(s.behavior)]))}</section>
    <section class="ds-block"><h4>Accessibility</h4><div class="ds-a11y">
      <div><b>ROLE</b><p>${esc(component.a11y.role)}</p></div>
      <div><b>KEYBOARD</b><p>${esc(component.a11y.keyboard)}</p></div>
      <div><b>SCREEN READER</b><p>${esc(component.a11y.screenReader)}</p></div>
    </div></section>
    <section class="ds-block"><h4>Do's and Don'ts</h4><div class="guidance">
      <div class="do"><h5>✅ Do</h5><ul>${component.dos.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
      <div class="dont"><h5>❌ Don't</h5><ul>${component.donts.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
    </div></section>
    <section class="ds-block"><h4>Code Example</h4><pre>${esc(component.example)}</pre></section>
  </div>
</article>`;
}

function groupSections() {
  return COMPONENT_GROUPS.map((group) => {
    const members = UI_COMPONENTS.filter((component) => component.group === group.id);
    if (!members.length) return "";
    return `<section class="ds-group">
  <div class="section-head"><h2 id="g-${slug(group.id)}">${esc(group.name)} <span style="font-size:12px;color:#7c93b3">${members.length}</span></h2><span>${esc(group.description)}</span></div>
  ${members.map(componentDoc).join("\n")}
</section>`;
  }).join("\n");
}

const NAV = `<nav class="ds-pagenav"><a href="tokens.html">Tokens</a><a href="motion.html">Motion</a><a href="catalog.html">Assets</a><a href="studio.html">Studio</a><a href="index.html">Home</a></nav>`;

const PREVIEW_RUNTIME = `<script>
(function(){
  function fit(){
    document.querySelectorAll('.ds-frame--scene').forEach(function(frame){
      var w = frame.clientWidth;
      if (w) frame.style.setProperty('--k', (w / 1536).toFixed(5));
    });
  }
  fit();
  addEventListener('resize', fit);
  var search = document.querySelector('#search');
  if (search) {
    var items = [].slice.call(document.querySelectorAll('.ds-component'));
    var active = '全部';
    var filterButtons = [].slice.call(document.querySelectorAll('[data-group-filter]'));
    var empty = document.querySelector('#empty');
    function render(){
      var q = search.value.trim().toLowerCase();
      var visible = 0;
      items.forEach(function(item){
        var okGroup = active === '全部' || item.dataset.group === active;
        var okSearch = !q || item.dataset.search.indexOf(q) !== -1;
        item.hidden = !(okGroup && okSearch);
        if (!item.hidden) visible++;
      });
      document.querySelectorAll('.ds-group').forEach(function(section){
        section.hidden = [].slice.call(section.querySelectorAll('.ds-component')).every(function(i){ return i.hidden; });
      });
      if (empty) empty.style.display = visible ? 'none' : 'block';
      fit();
    }
    search.addEventListener('input', render);
    filterButtons.forEach(function(button){
      button.addEventListener('click', function(){
        active = button.dataset.groupFilter;
        filterButtons.forEach(function(other){ other.classList.toggle('active', other === button); });
        render();
      });
    });
    document.querySelectorAll('.copy').forEach(function(button){
      button.addEventListener('click', function(){
        navigator.clipboard.writeText(button.dataset.copy).then(function(){ button.textContent = '已复制'; }, function(){ button.textContent = '手动复制'; });
        setTimeout(function(){ button.textContent = '复制'; }, 1200);
      });
    });
  }
})();
</script>`;

const CSP = `default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'`;

// ------------------------------------------------------------------ build

const audit = await auditDesignSystem(join(root, ".."));
const allCss = (await Promise.all(UI_COMPONENTS.map((c) => buildCss(c)))).join("\n");

const undocumentedTop = audit.tokens.undocumented.slice(0, 6).map((token) => esc(token.id));
const orphans = audit.coverage.radiusScale.filter((entry) => /^\d/.test(entry.value) && !["9px", "19px", "20px", "16px"].includes(entry.value));
const duplicated = audit.coverage.duplicatedLiterals.slice(0, 8);

const componentsHtml = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WinBrain — Design System Components</title>
<link rel="stylesheet" href="tokens.css">
<style>${PREVIEW_CSS}${PAGE_CSS}</style>
<style>${allCss}</style>
</head><body><div class="ds-page">
<header><a href="index.html"><strong>WinBrain<span>DESIGN SYSTEM · UI COMPONENTS</span></strong></a>${NAV}</header>
<main>
<section class="hero">
  <div>
    <span class="eyebrow">DESIGN SYSTEM / COMPONENT SOURCE OF TRUTH</span>
    <h1>界面层第一次被写下来：${UI_COMPONENTS.length} 个组件、变体、状态与无障碍约定。</h1>
    <p>系统有四层——<code>tokens</code> 管数值，<code>motion</code> 管运动，<code>UI</code> 管界面，<code>assets</code> 管 22 个三维资产。前三层此前都有页面，唯独界面层只有代码。这一页是界面层的组件设计真源：每个预览都用<b>出货中的真实样式表</b>现场渲染，不是另画一遍。</p>
    <div class="map">
      <div><b>Token 层</b><span>source/tokens/tokens.js → tokens.css</span></div>
      <div><b>Motion 层</b><span>source/motion/library.js → motion.html</span></div>
      <div><b>UI 层</b><span>source/system/ui-registry.js → components.html</span></div>
      <div><b>Asset 层</b><span>source/registry.js → catalog.html</span></div>
    </div>
  </div>
  <div class="count">${UI_COMPONENTS.length}<small>DOCUMENTED COMPONENTS</small></div>
</section>

<section class="strip">
  <div class="stat"><b>${audit.ui.fullyDocumented}/${audit.ui.components}</b><span>七项文档检查全部通过的组件（说明、变体、属性、状态、无障碍、约定、示例）</span></div>
  <div class="stat warn"><b>${audit.coverage.totalRawColorLiterals}</b><span>出货页面 &lt;style&gt; 里的硬编码色值；同期 Token 引用只有 ${audit.coverage.totalTokenUsages} 处</span></div>
  <div class="stat warn"><b>${audit.tokens.undocumentedCount}</b><span>已在 tokens.js 定义、但没有进入 TOKEN_CATALOG / tokens.css 的设计值</span></div>
  <div class="stat"><b>${audit.coverage.surfacesLinkingTokensCss}/${audit.coverage.auditedSurfaces}</b><span>链接 tokens.css 的出货页面（首页、编辑器、资产总览、原图对照都没有引用 Token 层）</span></div>
</section>

<section class="tools">
  <input id="search" class="search" type="search" placeholder="搜索组件、选择器、Token…" aria-label="搜索 UI 组件">
  <div class="filters" role="group" aria-label="组件分组">
    <button data-group-filter="全部" class="active">全部</button>
    ${COMPONENT_GROUPS.map((group) => `<button data-group-filter="${esc(group.id)}">${esc(group.name)}</button>`).join("")}
  </div>
</section>

<section class="findings">
  <div class="section-head"><h2>Audit · Token 覆盖</h2><span>全部数字由 <code>source/system/audit.js</code> 从出货文件实测，不是手写</span></div>
  <p style="color:#a9bfda;line-height:1.8;font-size:13px;max-width:920px;margin:14px 0 0">
    界面层与 Token 层目前是<b style="color:#e8c98a">并行的两套值</b>：Token 定义完整，但界面代码里绝大多数颜色、圆角和字号是直接写死的。
    下面三张表是实测结果，也是这个系统接下来该收敛的地方。
  </p>
  <div class="ds-body" style="grid-template-columns:repeat(2,minmax(0,1fr))">
    <section class="ds-block"><h4>每个页面的 Token 采用</h4>${table(
      ["页面", "链接 tokens.css", "var(--wb-*) 次数", "硬编码色值"],
      audit.coverage.surfaces.map((surface) => [
        `<code>${esc(surface.id)}</code><br><span style="color:#7c93b3;font-size:11px">${esc(surface.label)}</span>`,
        surface.linksTokensCss ? "✅" : "❌",
        String(surface.tokenUsages),
        String(surface.rawColorLiterals),
      ]),
    )}</section>
    <section class="ds-block"><h4>被手写复制最多的 Token 值</h4>${table(
      ["字面值", "等价 Token", "出现次数", "页面"],
      duplicated.map((entry) => [`<code>${esc(entry.literal)}</code>`, `<code>${esc(entry.token)}</code>`, String(entry.count), esc(entry.pages.join(", "))]),
    )}</section>
  </div>
  <section class="ds-block" style="margin-top:26px"><h4>圆角尺度：实际用了 ${audit.coverage.radiusScale.length} 种值，Token 只定义了 3 种</h4>
    <p style="font-size:12px;color:#8ba1bf">橙色是没有任何 Token 对应的孤值。<code>16px</code> 其实就是 tokens.js 里的 <code>radius.control</code>，只是没有导出。</p>
    <div class="radius-list">${audit.coverage.radiusScale
      .map((entry) => `<span class="${orphans.includes(entry) ? "orphan" : ""}">${esc(entry.value)} ×${entry.count}</span>`)
      .join("")}</div>
  </section>
  <div class="findings" style="border-top:0;padding-top:8px">
    <h4 style="font-size:11px;letter-spacing:1.4px;color:#7fa6d9;font-weight:500;margin:24px 0 11px">未导出到 tokens.css 的设计值（前 ${undocumentedTop.length} / ${audit.tokens.undocumentedCount}）</h4>
    <div class="radius-list">${undocumentedTop.map((id) => `<span class="orphan">${id}</span>`).join("")}</div>
  </div>
</section>

${groupSections()}
<div id="empty" style="display:none;color:#8198b8;padding:40px 0 70px;text-align:center">没有匹配的组件。</div>

<footer>
  <span>预览由出货样式表实时渲染（<code>source/system/css-scope.js</code> 提取并作用域到 <code>.ds-stage</code>），因此不会与产品漂移。组件结构真源：<code>source/system/ui-registry.js</code>。</span>
  <span><a href="manifest.json">Design System Manifest ↗</a>　<a href="DESIGN.md">DESIGN.md ↗</a>　<a href="tokens.html">Tokens ↗</a>　<a href="preview/index.html">独立预览 ↗</a></span>
</footer>
</main>
</div>
${PREVIEW_RUNTIME}
</body></html>`;

await writeFile(join(out, "components.html"), componentsHtml);

// ------------------------------------------------------------ isolated previews

const previewDir = join(out, "preview");
await mkdir(previewDir, { recursive: true });

const previewIndexCards = COMPONENT_GROUPS.map((group) => {
  const members = UI_COMPONENTS.filter((component) => component.group === group.id);
  return `<section><div class="section-head"><h2>${esc(group.name)}</h2><span>${esc(group.description)}</span></div><div class="grid">${members
    .map(
      (component) => `<a class="card" href="${slug(component.id)}.html">
    <span class="kind">${esc(component.group)}</span>
    <h3>${esc(component.name)}</h3>
    <code>${esc(component.id)}</code>
    <p>${esc(component.summary)}</p>
    <span class="stage">${esc(UI_SYSTEM.stages[component.stage].label)}</span>
  </a>`,
    )
    .join("")}</div></section>`;
}).join("\n");

const previewIndexCss = `${PREVIEW_CSS}${PAGE_CSS}
.section-head{margin:38px 0 17px}
.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:15px}
.card{display:block;border:1px solid var(--wb-color-border);background:var(--wb-color-panel);border-radius:var(--wb-radius-card);padding:17px;transition:border-color .15s,transform .15s}
.card:hover{border-color:#7197ca;transform:translateY(-2px)}
.card h3{font-size:15px;font-weight:500;margin:9px 0 7px}
.card code{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;color:#8fb4e4}
.card p{font-size:11.5px;color:#93a9c5;line-height:1.7;margin:11px 0 13px}
.card .kind{font-size:9px;letter-spacing:1.2px;color:#7fa6d9}
.card .stage{display:inline-block;font:9px ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid #395574;border-radius:4px;padding:3px 5px;color:#9dbde4}
@media(max-width:1100px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(max-width:620px){.grid{grid-template-columns:1fr}}
`;

await writeFile(
  join(previewDir, "index.html"),
  `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>WinBrain — Component Previews</title>
<link rel="stylesheet" href="../tokens.css">
<style>${previewIndexCss}</style>
</head><body><div class="ds-page">
<header><a href="../index.html"><strong>WinBrain<span>COMPONENT PREVIEWS</span></strong></a>${NAV}</header>
<main>
<section class="hero"><div>
  <span class="eyebrow">ISOLATED PREVIEWS / ONE COMPONENT PER PAGE</span>
  <h1>${UI_COMPONENTS.length} 个组件，一页一个。</h1>
  <p>每一页只加载该组件自己的样式，用来单独核对变体、状态与无障碍行为，不受同页其他组件干扰。完整文档（说明、属性、状态表、Do/Don't、代码）在 <a href="../components.html" style="color:#a5c3ec">components.html</a>。</p>
</div><div class="count">${UI_COMPONENTS.length}<small>ISOLATED PAGES</small></div></section>
${previewIndexCards}
<footer><span>这些页面只引用出货样式表，不引入新的设计值。</span><span><a href="../components.html">组件真源 ↗</a></span></footer>
</main>
</div>
</body></html>`,
);

for (const component of UI_COMPONENTS) {
  const css = await buildCss(component);
  const siblings = UI_COMPONENTS.filter((other) => other.group === component.group);
  const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${CSP}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(component.name)} — WinBrain Component Preview</title>
<link rel="stylesheet" href="../tokens.css">
<style>${PREVIEW_CSS}${PAGE_CSS}</style>
<style>${css}</style>
<style>
body{padding:0}
.wrap{width:91%;max-width:1536px;margin:auto;padding:34px 0 60px}
.crumb{font-size:11px;color:#7c93b3;margin-bottom:16px}
.crumb a{color:#a5c3ec}
.wrap h1{font-size:29px;font-weight:500;margin:0 0 8px}
.wrap h1 code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#8fb4e4;border:1px solid #395574;border-radius:4px;padding:3px 6px;vertical-align:middle;margin-left:10px}
.lede{color:#a9bfda;font-size:13px;line-height:1.8;max-width:860px;margin:0 0 6px}
.siblings{display:flex;gap:7px;flex-wrap:wrap;margin:22px 0 0}
.siblings a{font:10px ui-monospace,SFMono-Regular,Menlo,monospace;border:1px solid #395574;border-radius:4px;padding:5px 7px;color:#a8c8ee}
.siblings a[aria-current="page"]{background:#315986;border-color:#77a8e6;color:#fff}
</style>
</head><body><div class="ds-page">
<header><a href="../index.html"><strong>WinBrain<span>COMPONENT PREVIEW</span></strong></a>${NAV}</header>
<div class="wrap">
  <p class="crumb"><a href="index.html">独立预览</a> / ${esc(COMPONENT_GROUPS.find((g) => g.id === component.group)?.name || component.group)}</p>
  <h1>${esc(component.name)}<code>${esc(component.id)}</code></h1>
  <p class="lede">${esc(component.summary)}</p>
  <div class="siblings">${siblings
    .map(
      (other) =>
        `<a href="${slug(other.id)}.html"${other.id === component.id ? ' aria-current="page"' : ""}>${esc(other.name)}</a>`,
    )
    .join("")}</div>
  ${stageFrame(component, { forPreview: true })}
  <p class="ds-stage-note">舞台：<b>${esc(UI_SYSTEM.stages[component.stage].label)}</b> · ${esc(UI_SYSTEM.stages[component.stage].note)}</p>
  <div class="ds-body">
    <section class="ds-block"><h4>Description</h4><p>${esc(component.description)}</p></section>
    <section class="ds-block"><h4>Variants</h4>${table(["Variant", "Use When", "Selector"], component.variants.map((v) => [esc(v.name), esc(v.useWhen), `<code>${esc(v.selector)}</code>`]))}</section>
    <section class="ds-block"><h4>Props / Properties</h4>${table(["Property", "Type", "Default", "Description"], component.props.map((p) => [`<code>${esc(p.property)}</code>`, esc(p.type), `<code>${esc(p.default)}</code>`, esc(p.description)]))}</section>
    <section class="ds-block"><h4>States</h4>${table(["State", "Visual", "Behavior"], component.states.map((s) => [esc(s.state), esc(s.visual), esc(s.behavior)]))}</section>
    <section class="ds-block"><h4>Accessibility</h4><div class="ds-a11y">
      <div><b>ROLE</b><p>${esc(component.a11y.role)}</p></div>
      <div><b>KEYBOARD</b><p>${esc(component.a11y.keyboard)}</p></div>
      <div><b>SCREEN READER</b><p>${esc(component.a11y.screenReader)}</p></div>
    </div></section>
    <section class="ds-block"><h4>Do's and Don'ts</h4><div class="guidance">
      <div class="do"><h5>✅ Do</h5><ul>${component.dos.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
      <div class="dont"><h5>❌ Don't</h5><ul>${component.donts.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></div>
    </div></section>
    <section class="ds-block"><h4>Code Example</h4><pre>${esc(component.example)}</pre></section>
    <section class="ds-block"><h4>Source</h4>${table(
      ["来源", "选择器"],
      [[component.sources.map((s) => `<code>${esc(s)}</code>`).join("<br>"), component.selectors.map((s) => `<code>${esc(s)}</code>`).join(" ")]],
    )}</section>
  </div>
  <footer><span>本页只加载该组件的样式，来源与出货页面一致。</span><span><a href="../components.html">组件真源 ↗</a>　<a href="index.html">全部预览 ↗</a></span></footer>
</div>
</div>
${PREVIEW_RUNTIME}
</body></html>`;
  await writeFile(join(previewDir, `${slug(component.id)}.html`), page);
}

// ------------------------------------------------------------ manifest

const manifest = {
  schema: "winbrain.design-system/v1",
  name: "WinBrain Design System",
  version: UI_SYSTEM.version,
  updated: "auto-generated by source/build-system.mjs — do not edit by hand",
  layers: [
    { id: "token", name: "Token 层", truth: "source/tokens/tokens.js", artifact: "tokens.css", audience: "UI 与 3D 运行时共用的数值" },
    { id: "motion", name: "Motion 层", truth: "source/motion/library.js", artifact: "motion-manifest.json", audience: "可组合的 3D 运动规则" },
    { id: "ui", name: "UI 层", truth: "source/system/ui-registry.js", artifact: "components.html", audience: "界面组件、变体、状态与无障碍" },
    { id: "asset", name: "Asset 层", truth: "source/registry.js + assets/catalog.json", artifact: "catalog.html", audience: "22 个三维资产" },
  ],
  artifacts: [
    { path: "manifest.json", role: "包清单", source: "source/build-system.mjs", generated: true },
    { path: "DESIGN.md", role: "设计系统说明", source: "人工维护", generated: false },
    { path: "tokens.css", role: "设计数值真源（CSS Custom Properties）", source: "source/tokens/tokens.js", generated: true },
    { path: "components.html", role: "组件设计真源与可视化预览", source: "source/system/ui-registry.js", generated: true },
    { path: "preview/", role: "单组件独立预览页与索引", source: "source/system/ui-registry.js", generated: true },
    { path: "assets/", role: "资产来源、目录与品牌图标", source: "assets/catalog.json", generated: false },
    { path: "previews/", role: "22 个资产的 3D / Mock-3D PNG（与 preview/ 不同）", source: "编辑器导出", generated: false },
  ],
  counts: {
    designTokensDefined: audit.tokens.defined,
    designTokensExported: audit.tokens.exported,
    designTokensWithCss: audit.tokens.exportedWithCss,
    uiComponents: audit.ui.components,
    uiComponentGroups: audit.ui.groups,
    uiComponentsFullyDocumented: audit.ui.fullyDocumented,
    shippingSurfaces: audit.coverage.surfaces.length,
    isolatedPreviewPages: UI_COMPONENTS.length + 1,
  },
  audit: audit.coverage,
  gates: [
    "components.html 的预览必须由出货样式表渲染，不得手写副本",
    "新增 UI 组件时先在 source/system/ui-registry.js 登记，再运行 npm run build",
    "只有 tokens.css 是设计数值真源；页面不得引入与之冲突的第二套数值定义",
    "components.html 是组件设计真源；新建组件需同时补 variants / states / a11y / do-dont",
  ],
};

await writeFile(join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

console.log(
  `Built components.html (${UI_COMPONENTS.length} components), preview/ (${UI_COMPONENTS.length + 1} pages) and manifest.json. ` +
    `Token coverage: ${audit.coverage.totalTokenUsages} var() vs ${audit.coverage.totalRawColorLiterals} raw literals.`,
);
