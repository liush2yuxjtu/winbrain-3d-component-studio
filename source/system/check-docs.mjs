// Keep DESIGN.md's published numbers honest.
//
// DESIGN.md is hand-written prose that quotes measured values. That is exactly the way
// documentation rots: the audit changes, the sentence does not, and a stale number is
// worse than no number. This re-measures and asserts the claims.
//
//   node source/system/check-docs.mjs

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { auditDesignSystem } from "./audit.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const design = await readFile(join(root, "DESIGN.md"), "utf8");
const audit = await auditDesignSystem(root);
const manifest = JSON.parse(await readFile(join(root, "manifest.json"), "utf8"));
const coverage = audit.coverage;

const claims = [
  ["UI 组件数量", `${audit.ui.components} 个 UI 组件的说明`],
  ["七项检查全通过", `**${audit.ui.fullyDocumented} / ${audit.ui.components} 全部通过**`],
  ["硬编码色值合计", `**${coverage.totalRawColorLiterals}**`],
  ["Token 引用合计", `**${coverage.totalTokenUsages}**`],
  ["链接 tokens.css 的页数", `**${coverage.surfacesLinkingTokensCss} / ${coverage.auditedSurfaces}**`],
  ["出货页面数量", `${coverage.auditedSurfaces} 个出货页面`],
  ["圆角值种数", `**${coverage.radiusScale.length} 种**`],
  ["圆角 Token 引用次数", `被引用 **${coverage.radiusTokenUsages} 次**`],
  ["没有出口的设计值数量", `**${audit.tokens.undocumentedCount} 个**`],
  ["token 叶子值总数", `里 ${audit.tokens.defined} 个叶子值`],
  // 去重后的色值种类与只出现一次的种数：DESIGN.md 用它支撑「490 不是 490 个待办」，
  // 所以这两个数必须和审计一起动。它们此前是手抄的，没人复核。
  ["去重后的色值种类", `**${coverage.distinctColorLiterals} 种色值**`],
  ["只出现一次的色值", `其中 ${coverage.singletonColorLiterals} 种`],
  ["只出现一次的占比", `（${((coverage.singletonColorLiterals / coverage.distinctColorLiterals) * 100).toFixed(1)}%）`],
  ["TOKEN_CATALOG 条数", `\`TOKEN_CATALOG\` 收录 ${audit.tokens.exported} 条`],
  ["CSS 变量条数", `其中 ${audit.tokens.exportedWithCss} 条带 CSS 变量`],
  ["manifest 计数的 UI 组件数", null, () => manifest.counts.uiComponents === audit.ui.components],
];

const failures = [];
for (const [label, needle, predicate] of claims) {
  const ok = predicate ? predicate() : design.includes(needle);
  if (!ok) failures.push({ label, expected: needle ?? "manifest 计数" });
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}`);
}

// The per-surface table has one row per audited surface, plus the instrument row.
const beforeRows = failures.length;
for (const surface of coverage.surfaces) {
  const row = `| \`${surface.id}\``;
  if (!design.includes(row)) failures.push({ label: `页面表格缺行 ${surface.id}`, expected: row });
}
console.log(`${failures.length > beforeRows ? "FAIL" : "ok  "}  ${coverage.surfaces.length} 个页面的表格行`);

// A ratchet, not another description. The checks above only prove DESIGN.md still matches
// the audit; they pass just as happily if the count they compare against has grown. These
// fail when the exact thing the audit complains about quietly comes back.
//
// `color`, `typography`, `spacing` and `radius` are the groups the UI draws from, so a leaf
// in one of them that reaches neither TOKEN_CATALOG nor a same-namespace entry is a UI
// decision with no route out of tokens.js. The remaining groups (material, rendering,
// lighting, camera, layers) are 3D-only by design — see DESIGN.md §5.4 — and are not budgeted.
const UI_GROUPS = new Set(["color", "typography", "spacing", "radius"]);
const duplicated = coverage.duplicatedLiterals;
// Count occurrences, not entries. Comparing "4 distinct literals" against a ceiling of 11
// occurrences would silently permit a literal to be copied any number of times, which is
// the opposite of a ratchet.
const occurrences = (entries) => entries.reduce((total, entry) => total + entry.count, 0);
const colorDuplicates = duplicated.filter((entry) => entry.literal.startsWith("#"));
const radiusDuplicates = duplicated.filter((entry) => !entry.literal.startsWith("#"));
const budgets = [
  ["手写复制的颜色字面值（应被 var() 取代）", occurrences(colorDuplicates), 0],
  // Held at 9, not 0, and the reason is measured rather than assumed — see DESIGN.md §5.2.
  // Eight of the nine are the four literals in source/shell.html, counted once for each page
  // that embeds it: index.html, which refuses the tokens.css <link> because its CSP is
  // `style-src 'unsafe-inline'` with no `'self'` (Chromium blocks the stylesheet and
  // `var(--wb-color-accent)` resolves to an inherited value), and studio.html, which does
  // load it. One edit to that shared file reaches both pages, and one of them cannot resolve
  // the var(), so the file cannot move until the homepage can. The ninth is in
  // comparison.html, which is unlinked rather than blocked; that page's membership in the
  // token layer is DESIGN.md §5.7 item 6's decision, so the ceiling carries it meanwhile.
  // The ceiling is deliberately not a promise that the remaining work is hard: two of the
  // originals were in pages that already load tokens.css and were fixed outright.
  ["手写复制的圆角字面值", occurrences(radiusDuplicates), 9],
  ["没有出口的 UI 设计值", audit.tokens.undocumented.filter((leaf) => UI_GROUPS.has(leaf.id.split(".")[0])).length, 0],
];
const beforeBudgets = failures.length;
for (const [label, actual, allowed] of budgets) {
  const ok = actual <= allowed;
  if (!ok) failures.push({ label, expected: `不超过 ${allowed}，实际 ${actual}` });
  console.log(`${ok ? "ok  " : "FAIL"}  ${label}：${actual} / 上限 ${allowed}`);
}
if (failures.length > beforeBudgets) {
  console.error("     这是棘轮：新值要么改用 var()/补 TOKEN_CATALOG 出口，要么把这个上限连同理由一起调高。");
}

if (failures.length) {
  console.error(`\nDESIGN.md 与实测不一致（${failures.length} 项）：`);
  for (const failure of failures) console.error(`  ${failure.label} — 期望出现：${failure.expected}`);
  process.exit(1);
}
console.log("\nDESIGN.md 的每个数字都与实测一致。");
