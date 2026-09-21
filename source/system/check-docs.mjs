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

if (failures.length) {
  console.error(`\nDESIGN.md 与实测不一致（${failures.length} 项）：`);
  for (const failure of failures) console.error(`  ${failure.label} — 期望出现：${failure.expected}`);
  process.exit(1);
}
console.log("\nDESIGN.md 的每个数字都与实测一致。");
