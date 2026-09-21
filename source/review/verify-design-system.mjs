// Real-runtime verification for the UI design system pages.
//
// This does not check that the pages "exist". It drives a real browser and checks the
// claim the design system makes: components.html renders the *shipping* styles, so a
// component's computed style there must equal the computed style on the page it ships on.
//
//   node source/review/verify-design-system.mjs [--port 8791]
//
// Requires a local static server on the port (see README) and playwright installed.

import { writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { chromium } from "playwright";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const argv = process.argv.slice(2);
const portIndex = argv.indexOf("--port");
const PORT = portIndex === -1 ? 8791 : Number(argv[portIndex + 1]);
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = join(root, "design-system-review");

// (anchor page, selector on the shipping page) -> (preview selector inside components.html)
const PARITY = [
  { name: "首页 · 视角控制按钮", page: "index.html", a: ".control-buttons button", component: "control-button", b: ".control-buttons button" },
  { name: "首页 · Explore 主按钮", page: "index.html", a: ".explore", component: "explore-button", b: ".explore" },
  { name: "首页 · 层卡标题", page: "index.html", a: '.layer[data-layer="2"] h2', component: "explore-layer-card", b: '.layer[data-layer="2"] h2' },
  { name: "首页 · 导航选中项", page: "index.html", a: ".nav .active", component: "nav-item", b: ".nav .active" },
  { name: "编辑器 · 视图切换选中", page: "studio.html", a: ".mode-switch button.active", component: "mode-switch", b: ".mode-switch button.active" },
  { name: "编辑器 · 主按钮", page: "studio.html", a: ".primary", component: "primary-button", b: ".primary" },
  { name: "编辑器 · 成对按钮", page: "studio.html", a: ".two-buttons button", component: "secondary-button", b: ".two-buttons button" },
  { name: "编辑器 · 组件列表选中行", page: "studio.html", a: ".component-item.active", component: "component-list-item", b: ".component-item.active" },
  { name: "编辑器 · 文件按钮", page: "studio.html", a: ".file-button", component: "file-button", b: ".file-button" },
  { name: "资产总览 · 卡片", page: "catalog.html", a: "article", component: "asset-card", b: "article" },
  { name: "Token 审计 · 分类胶囊选中", page: "tokens.html", a: ".filters button.active", component: "filter-chip", b: ".filters button.active" },
  { name: "Token 审计 · Token 卡片", page: "tokens.html", a: ".token-card", component: "token-card", b: ".token-card" },
  // The swatch paints whatever --swatch is injected, so both sides must point at the
  // same token: color.accent (#67CCFF) on the audit page and in the preview stage.
  { name: "Token 审计 · 色板", page: "tokens.html", a: "#token-color-accent .swatch", component: "swatch", b: ".swatch" },
  // The audit page's own swatch and the asset library's `.preview>span` both style a span
  // inside a preview box. Scoping each stage to its component is what keeps them apart.
  { name: "Token 审计 · 卡片内色板", page: "tokens.html", a: "#token-color-accent .swatch", component: "token-card", b: ".swatch" },
  { name: "Motion 库 · 行为卡", page: "motion.html", a: ".motion-card", component: "motion-card", b: ".motion-card" },
  { name: "Motion 库 · 小卡", page: "motion.html", a: ".small-card", component: "small-card", b: ".small-card" },
];

const PROPS = ["backgroundColor", "color", "borderTopColor", "borderTopWidth", "borderTopLeftRadius", "fontSize", "fontWeight", "paddingTop", "paddingLeft", "lineHeight"];

const results = [];
const errors = [];
const external = new Set();

function record(name, passed, detail) {
  results.push({ name, passed, detail });
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1 });
const page = await context.newPage();

page.on("console", (message) => {
  if (message.type() === "error") errors.push({ page: page.url(), text: message.text() });
});
page.on("pageerror", (error) => errors.push({ page: page.url(), text: String(error) }));
page.on("request", (request) => {
  const url = request.url();
  if (!url.startsWith(BASE) && !url.startsWith("data:") && !url.startsWith("blob:")) external.add(url);
});

async function goto(path) {
  const response = await page.goto(`${BASE}/${path}`, { waitUntil: "load" });
  await page.waitForTimeout(120);
  return response?.status() ?? 0;
}

async function computed(selector, index = 0) {
  return page.evaluate(
    ({ selector, index, props }) => {
      const el = document.querySelectorAll(selector)[index];
      if (!el) return null;
      const style = getComputedStyle(el);
      return Object.fromEntries(props.map((prop) => [prop, style[prop]]));
    },
    { selector, index, props: PROPS },
  );
}

await mkdir(SHOTS, { recursive: true });

// ---------------------------------------------------------------- 1. pages load
const pages = ["components.html", "preview/index.html", "manifest.json", "tokens.html", "motion.html", "catalog.html"];
for (const path of pages) {
  const status = await goto(path);
  record(`加载 ${path}`, status === 200, { status });
}

// ---------------------------------------------------------------- 2. all previews
await goto("preview/index.html");
const previewHrefs = await page.evaluate(() =>
  [...document.querySelectorAll("a.card")].map((a) => a.getAttribute("href")).filter(Boolean),
);
record("preview/index.html 卡片数 = 28", previewHrefs.length === 28, { count: previewHrefs.length });

const previewFailures = [];
for (const href of previewHrefs) {
  const status = await goto(`preview/${href}`);
  if (status !== 200) previewFailures.push({ href, status });
  const frame = await page.evaluate(() => {
    const el = document.querySelector(".ds-stage");
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { width: Math.round(rect.width), height: Math.round(rect.height) };
  });
  if (!frame || frame.width < 1 || frame.height < 1) previewFailures.push({ href, stage: frame });
}
record(`${previewHrefs.length} 个独立预览页可渲染`, previewFailures.length === 0, previewFailures);

// ---------------------------------------------------------------- 3. style parity
await goto("components.html");
const sceneScale = await page.evaluate(() =>
  [...document.querySelectorAll(".ds-frame--scene")].map((frame) => Number(getComputedStyle(frame).getPropertyValue("--k"))),
);
record("首页类舞台已按比例缩放", sceneScale.length > 0 && sceneScale.every((k) => k > 0.05 && k < 1), { sceneScale });

for (const item of PARITY) {
  await goto(item.page);
  const expected = await computed(item.a);
  if (!expected) {
    record(item.name, false, { reason: "出货页面选择器未命中", selector: item.a });
    continue;
  }
  // Both surfaces are checked: the full document and the standalone page a reader opens.
  for (const surface of ["components.html", `preview/${item.component}.html`]) {
    await goto(surface);
    const selector = surface === "components.html" ? `#c-${item.component} .ds-stage ${item.b}` : `.ds-stage ${item.b}`;
    const actual = await computed(selector);
    if (!actual) {
      record(`${item.name} · ${surface}`, false, { reason: "预览选择器未命中", selector });
      continue;
    }
    const diff = Object.fromEntries(Object.entries(expected).filter(([key, value]) => actual[key] !== value));
    record(`${item.name} · ${surface}`, Object.keys(diff).length === 0, { expected, actual, diff });
  }
}

// ---------------------------------------------------------------- 4. own-styles coverage
// A component's registry entry lists the selectors its stage is allowed to pull in. When a
// class used in its own markup is missing from that list, the stage renders that piece with
// no styles at all — the swatch inside a Token card was exactly this bug.
const CLASS_SKIP = new Set(["active", "show", "selected", "changed", "compact", "is-open"]);
const unstyled = [];
for (const href of previewHrefs) {
  await goto(`preview/${href}`);
  const missing = await page.evaluate((skip) => {
    const stage = document.querySelector(".ds-stage");
    if (!stage) return [];
    const selectors = [...document.styleSheets].flatMap((sheet) => {
      try {
        return [...sheet.cssRules].map((rule) => rule.selectorText || "");
      } catch {
        return [];
      }
    });
    const used = new Set();
    stage.querySelectorAll("*").forEach((el) => el.classList.forEach((name) => used.add(name)));
    return [...used].filter(
      (name) => !skip.includes(name) && !name.startsWith("ds-") && !selectors.some((selector) => selector.includes(`.${name}`)),
    );
  }, [...CLASS_SKIP]);
  if (missing.length) unstyled.push({ href, missing });
}
record(`${previewHrefs.length} 个组件的自身 class 都有对应样式`, unstyled.length === 0, unstyled);

// ---------------------------------------------------------------- 5. internal links
// The preview pages live one directory down, so a root-relative nav href 404s there
// without anything else noticing. Every internal link is requested for real.
const brokenLinks = [];
const checkedLinks = new Set();
for (const path of ["components.html", "preview/index.html", ...previewHrefs.map((href) => `preview/${href}`)]) {
  await goto(path);
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((href) => href && !href.startsWith("#") && !/^[a-z]+:/i.test(href)),
  );
  for (const href of new Set(hrefs)) {
    const url = new URL(href, `${BASE}/${path}`).href;
    checkedLinks.add(url);
    const response = await context.request.get(url, { failOnStatusCode: false });
    if (response.status() >= 400) brokenLinks.push({ page: path, href, status: response.status() });
  }
}
record(`新页面 ${checkedLinks.size} 条内部链接全部可达`, brokenLinks.length === 0, { checked: checkedLinks.size, broken: brokenLinks });

// ---------------------------------------------------------------- 6. runtime surface
await goto("components.html");
const summary = await page.evaluate(() => ({
  components: document.querySelectorAll(".ds-component").length,
  stages: document.querySelectorAll(".ds-frame").length,
  scopedRules: document.styleSheets.length,
}));
record("components.html 渲染 28 个组件块", summary.components === 28, summary);

// token adoption on the design-system page itself
const tokensCssApplied = await page.evaluate(() => {
  const probe = document.createElement("div");
  probe.style.color = "var(--wb-color-accent)";
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
});
record("components.html 已加载 tokens.css（--wb-color-accent 可解析）", tokensCssApplied === "rgb(103, 204, 255)", { tokensCssApplied });

// ---------------------------------------------------------------- screenshots
await goto("components.html");
// No full-page capture: 28 component blocks make it a ~10 MB PNG, too heavy to review.
await page.screenshot({ path: join(SHOTS, "components-hero.png") });
// One component block, captured on its own. The page's sticky header and filter bar are
// turned off for this shot only, otherwise they are painted over the preview stage.
await page.addStyleTag({ content: ".ds-page>header,.ds-page .tools{position:static!important}" });
await page.locator("#c-token-card").screenshot({ path: join(SHOTS, "components-anatomy.png") });

await goto("preview/index.html");
await page.screenshot({ path: join(SHOTS, "preview-index.png"), fullPage: true });

await goto("preview/token-card.html");
await page.screenshot({ path: join(SHOTS, "preview-token-card.png"), fullPage: true });

await page.setViewportSize({ width: 430, height: 900 });
await goto("preview/index.html");
await page.screenshot({ path: join(SHOTS, "preview-index-mobile.png"), fullPage: true });

await browser.close();

// ---------------------------------------------------------------- report
record("无 JavaScript 错误", errors.length === 0, errors);
record("无外部网络依赖", external.size === 0, [...external]);

const report = {
  schema: "winbrain.design-system-verification/v1",
  base: BASE,
  viewport: "1536x1024 (+430x900 mobile)",
  checks: results,
  errors,
  externalRequests: [...external],
  summary: {
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    javascriptErrors: errors.length,
    externalRequests: external.size,
    styleParityChecked: results.filter((r) => r.name.includes(" · ")).length,
    styleParityPassed: results.filter((r) => r.name.includes(" · ") && r.passed).length,
  },
  screenshots: [
    "design-system-review/components-hero.png",
    "design-system-review/components-anatomy.png",
    "design-system-review/preview-index.png",
    "design-system-review/preview-token-card.png",
    "design-system-review/preview-index-mobile.png",
  ],
};

await writeFile(join(root, "design-system-verification.json"), JSON.stringify(report, null, 2) + "\n");

for (const item of results) {
  console.log(`${item.passed ? "PASS" : "FAIL"}  ${item.name}`);
  if (!item.passed) console.log("      ", JSON.stringify(item.detail).slice(0, 700));
}
console.log(`\n${report.summary.passed} passed, ${report.summary.failed} failed. Parity ${report.summary.styleParityPassed}/${report.summary.styleParityChecked}.`);
process.exit(report.summary.failed === 0 ? 0 : 1);
