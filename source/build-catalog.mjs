import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  await readFile(join(root, "..", "assets", "catalog.json"), "utf8"),
);
const esc = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const categories = [
  "应用屏幕",
  "业务对象",
  "智能角色",
  "平台与结构",
  "世界环境",
];
const cards = categories
  .map(
    (category) =>
      `<section><div class="section-title"><h2>${category}</h2><span>${catalog.components.filter((e) => e.category === category).length} 个组件</span></div><div class="grid">${catalog.components
        .filter((e) => e.category === category)
        .map(
          (e) =>
            `<article data-search="${esc(e.id + " " + e.name + " " + e.category)}"><a class="preview" href="studio.html?component=${e.id}&view=asset"><img src="${e.preview}" alt="${esc(e.name)}的代码生成模型预览" loading="lazy"><span>3D · 可旋转</span></a><div class="card-body"><span class="component-id">${e.id}</span><h3>${esc(e.name)}${e.version > 1 ? `<b>V${e.version}</b>` : ""}</h3><div class="open-links"><a href="studio.html?component=${e.id}&view=mock">Mock-3D 对齐 ↗</a><a href="studio.html?component=${e.id}&view=asset">独立 3D ↗</a></div><div class="asset-links"><a href="${e.glb}" download>GLB 资产 ↓</a><a href="${e.native}" download>原生资产 ↓</a><a href="${e.preview}" download>3D PNG ↓</a><a href="${e.mockPreview}" download>对齐 PNG ↓</a></div></div></article>`,
        )
        .join("")}</div></section>`,
  )
  .join("");
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WinBrain — 3D Asset Library</title><style>
*{box-sizing:border-box}html{color-scheme:dark}body{margin:0;background:#101720;color:#dce7f6;font:14px -apple-system,BlinkMacSystemFont,"PingFang SC",Arial,sans-serif}a{color:inherit;text-decoration:none}a:focus-visible{outline:2px solid #acccff;outline-offset:4px}header{height:74px;border-bottom:1px solid #2c3a4c;display:flex;align-items:center;justify-content:space-between;padding:0 4.5vw;background:#161f2b}header strong{font-size:21px;letter-spacing:-.4px}header strong span{font-size:12px;font-weight:400;letter-spacing:.5px;color:#8da4c4;padding-left:20px;margin-left:18px;border-left:1px solid #405372}nav{display:flex;gap:28px;font-size:12px;color:#aabedb}.intro{padding:64px 0 44px;display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #2e3b4c}.eyebrow{font-size:10px;color:#90b3e4;letter-spacing:2px}.intro h1{font-size:36px;letter-spacing:-1px;font-weight:500;margin:18px 0 13px}.intro p{color:#93a9c5;line-height:1.8;font-size:13px;margin:0}.intro .count{font-size:68px;font-weight:300;letter-spacing:-4px;color:#a9c9fa}.intro .count span{display:block;font-size:11px;letter-spacing:1.5px;color:#728caa;margin-top:7px}main{width:91%;max-width:1536px;margin:auto}.tools{display:flex;justify-content:space-between;align-items:center;padding:27px 0 4px}.tools p{color:#6f89a9;font-size:11px;letter-spacing:.4px}.tools input{background:#162232;border:1px solid #3a4d67;color:#dbe9ff;padding:12px 14px;border-radius:6px;width:250px;font:inherit;font-size:12px}.section-title{display:flex;align-items:center;justify-content:space-between;margin:31px 0 17px}.section-title h2{font-size:16px;font-weight:500;margin:0}.section-title span{font-size:10px;color:#728aa9}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}article{border:1px solid #31445f;border-radius:9px;background:#182434;overflow:hidden;transition:border-color .15s,transform .15s}article:hover{border-color:#7197ca;transform:translateY(-2px)}.preview{height:192px;display:flex;justify-content:center;align-items:center;position:relative;background:#0e1723;overflow:hidden}.preview img{width:100%;height:100%;object-fit:contain;max-height:190px}.preview>span{position:absolute;bottom:10px;right:11px;background:#0a121fcc;font:9px monospace;color:#637e9e;padding:4px 6px;border-radius:3px}.card-body{padding:18px 17px 14px}.component-id{font:9px monospace;color:#7492b9}h3{font-size:15px;font-weight:500;margin:8px 0 18px;display:flex;align-items:center;justify-content:space-between}h3 b{font:9px monospace;border:1px solid #6081af;color:#a9ccfa;padding:2px 4px;border-radius:3px}.open-links{display:flex;gap:17px;font-size:10px;color:#b4cfee}.open-links a:hover{color:#fff}.asset-links{border-top:1px solid #2e425d;margin-top:18px;padding-top:13px;display:flex;gap:12px;font-size:9px;color:#7895b9}.asset-links a:hover{color:#c4ddff}footer{margin-top:55px;padding:26px 0 36px;border-top:1px solid #30415b;display:flex;justify-content:space-between;gap:30px;color:#6f89aa;font-size:11px;line-height:1.8}footer a{color:#a5c3ec}[hidden]{display:none!important}@media(min-width:1600px){.grid{grid-template-columns:repeat(5,minmax(0,1fr))}}@media(max-width:1050px){.grid{grid-template-columns:repeat(3,minmax(0,1fr))}.intro h1{font-size:29px}}@media(max-width:740px){header{padding:0 22px}header strong span{display:none}main{width:90%}.grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.intro{padding:38px 0 25px}.intro .count{display:none}.intro h1{font-size:25px}.intro p{font-size:12px}.tools{align-items:flex-start;gap:15px}.tools input{width:180px}.tools p{font-size:10px}.card-body{padding:14px 12px}.preview{height:153px}.asset-links{gap:10px}.open-links{gap:10px;font-size:9px}footer{display:block}}@media(max-width:450px){.grid{grid-template-columns:1fr}.preview{height:205px}.intro h1{font-size:24px}.tools{flex-direction:column}.tools input{width:100%}nav{gap:15px}}
</style></head><body><header><a href="index.html"><strong>WinBrain<span>3D ASSET LIBRARY</span></strong></a><nav><a href="comparison.html">原图差异对照 ↗</a><a href="index.html">查看首页 ↗</a><a href="studio.html">打开组件编辑器 ↗</a></nav></header><main><div class="intro"><div><span class="eyebrow">ORGANIZATIONAL DIGITAL TWIN / COMPONENT KIT</span><h1>一个世界，22 个独立组件。</h1><p>转动看清每个零件，再切换到原图视角精细对齐。<br>应用屏幕、图标块和业务模型，均有可编辑的立体结构。</p></div><div class="count">22<span>CODE-GENERATED ASSETS</span></div></div><div class="tools"><p>01 选择组件　→　02 叠图微调　→　03 保存到首页</p><input id="filter" type="search" placeholder="查找组件…" aria-label="搜索资产"></div>${cards}<footer><span>预览图来自实际三维渲染。应用图标采用官方素材，已内嵌离线使用。<br>地球的原生资产保留地形与大气程序；GLB 采用近似材质。</span><span><a href="README.md">使用说明 ↗</a>　<a href="assets/catalog.json">资产目录 ↗</a></span></footer></main><script>const normalize=s=>s.toLowerCase().replace(/[-_.]/g,' ');document.querySelector('#filter').oninput=e=>{document.querySelectorAll('article').forEach(c=>c.hidden=!normalize(c.dataset.search).includes(normalize(e.target.value)));document.querySelectorAll('main>section').forEach(s=>s.hidden=[...s.querySelectorAll('article')].every(c=>c.hidden));};</script></body></html>`;
await writeFile(join(root, "..", "catalog.html"), html);
console.log("Built catalog.html with all 22 asset previews and editor links.");
