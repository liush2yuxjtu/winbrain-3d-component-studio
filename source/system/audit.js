// WinBrain design system audit.
// Reads the shipping files and reports what the UI layer actually does.
// Every number here is measured from source; nothing is typed by hand.

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { TOKENS, TOKEN_CATALOG } from "../tokens/tokens.js";
import { UI_COMPONENTS } from "./ui-registry.js";

// Pages that the design system is responsible for. `css` is the file the page's
// styles really live in; `id` is the built artifact a reader opens.
// `instrument: true` marks the audit's own page: it embeds a copy of the shipping
// stylesheets to render live previews, so counting its literals would double-count.
const SURFACES = [
  { id: "index.html", label: "三维首页", css: "source/shell.html", layer: "场景" },
  { id: "studio.html", label: "组件编辑器", css: "source/editor/studio.css", layer: "工具", extraCss: "source/shell.html" },
  { id: "catalog.html", label: "资产总览", css: "source/build-catalog.mjs", layer: "文档" },
  { id: "tokens.html", label: "Token 审计", css: "source/build-tokens.mjs", layer: "文档" },
  { id: "motion.html", label: "Motion 库", css: "source/build-motion.mjs", layer: "文档" },
  { id: "comparison.html", label: "原图差异对照", css: "comparison.html", layer: "文档", handwritten: true },
  { id: "global.html", label: "全局预览", css: "global.html", layer: "文档", handwritten: true },
  { id: "components.html", label: "组件预览（本页）", css: "source/build-system.mjs", layer: "文档", instrument: true },
];

const HEX = /#[0-9a-fA-F]{3,8}\b/g;
const RADIUS = /border-radius:\s*([^;}]+)/g;
const VAR = /var\(--wb-[a-z0-9-]+/g;
const FONT_FACE = /@font-face\s*\{[^}]*\}/g;
const DATA_URI = /url\(\s*data:[^)]*\)/g;

/** Pull the CSS a page actually ships, with embedded font/image bytes removed. */
async function pageCss(root, surface) {
  const blocks = [];
  for (const file of [surface.css, surface.extraCss].filter(Boolean)) {
    let text;
    try {
      text = await readFile(join(root, file), "utf8");
    } catch {
      continue;
    }
    const styleBlocks = [...text.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]);
    const candidate = styleBlocks.length ? styleBlocks.join("\n") : text;
    // build-*.mjs wraps CSS inside a JS template string; drop the scaffolding.
    blocks.push(
      candidate
        .replace(FONT_FACE, "")
        .replace(DATA_URI, "url(data:)")
        .replace(/\\n/g, "\n"),
    );
  }
  return blocks.join("\n");
}

/** Flatten TOKENS into leaf values so coverage can be measured value by value. */
function flattenTokens(node, path = "", out = []) {
  for (const [key, value] of Object.entries(node)) {
    const id = path ? `${path}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) flattenTokens(value, id, out);
    else out.push({ id, value });
  }
  return out;
}

const toKebab = (id) => id.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

// A leaf counts as reachable when the catalogue names it, or when the catalogue already
// exports the same value from the same part of the system under another id
// (e.g. typography.heroSize -> type.hero.size). Requiring the namespace to line up stops
// `radius.control: 16px` from being excused by `space.16: 16px`, which is a different
// decision that happens to share a number.
const NAMESPACE = {
  spacing: ["space"],
  typography: ["type"],
  rendering: ["render", "light"],
  lighting: ["light"],
  layers: ["layer"],
};
const namespaceOf = (id) => {
  const head = id.split(".")[0];
  return new Set([head, ...(NAMESPACE[head] || [])]);
};
const sharesNamespace = (a, b) => {
  const left = namespaceOf(a);
  return [...namespaceOf(b)].some((name) => left.has(name));
};

/** Color values the token layer defines, so hand-copied literals can be detected. */
function tokenValueIndex() {
  const index = new Map();
  for (const token of TOKEN_CATALOG) {
    const raw = String(token.value).trim().toLowerCase();
    if (!raw) continue;
    if (token.type === "color" || /^#/.test(raw)) {
      if (!index.has(raw)) index.set(raw, []);
      index.get(raw).push(token.id);
    }
  }
  return index;
}

/**
 * Radius values, so a hand-written `border-radius: 16px` counts as a duplicate too.
 *
 * Restricting this to the Radius group matters. A value-only lookup credits `16px` to
 * whichever token is listed first, and that is `space.16` — a spacing decision owning a
 * border-radius literal. Same class of mistake the namespace rule above exists to stop.
 *
 * Deliberately not extended to every dimension: `padding: 16px` equals `space.16` but is
 * not a copy of a spacing decision, and flagging those would drown the real ones.
 */
function radiusValueIndex() {
  const index = new Map();
  for (const token of TOKEN_CATALOG) {
    if (token.group !== "Radius") continue;
    const raw = String(token.value).trim().toLowerCase();
    if (raw) index.set(raw, token.id);
  }
  return index;
}

export async function auditDesignSystem(root) {
  const leaves = flattenTokens(TOKENS);
  const catalogIds = new Set(TOKEN_CATALOG.map((token) => token.id));
  const catalogValues = new Map();
  for (const token of TOKEN_CATALOG) {
    const value = String(token.value).trim().toLowerCase();
    if (!catalogValues.has(value)) catalogValues.set(value, []);
    catalogValues.get(value).push(token.id);
  }
  const undocumented = leaves
    .filter((leaf) => {
      if (catalogIds.has(leaf.id) || catalogIds.has(toKebab(leaf.id))) return false;
      if (Array.isArray(leaf.value)) return true;
      const owners = catalogValues.get(String(leaf.value).trim().toLowerCase()) || [];
      return !owners.some((owner) => sharesNamespace(leaf.id, owner));
    })
    .map((leaf) => ({ id: leaf.id, value: Array.isArray(leaf.value) ? leaf.value.join(", ") : String(leaf.value) }));

  const valueIndex = tokenValueIndex();
  const radiusIndex = radiusValueIndex();
  const surfaces = [];
  const radiusUse = new Map();
  const duplicates = new Map();

  for (const surface of SURFACES) {
    const css = await pageCss(root, surface);
    let html = "";
    try {
      html = await readFile(join(root, surface.id), "utf8");
    } catch {
      html = "";
    }
    const hexes = css.match(HEX) || [];
    const vars = css.match(VAR) || [];
    // The instrument page embeds a copy of every shipping stylesheet to render its
    // previews, so its radii and literals are duplicates. Counting them would double
    // every scale — and would inflate token adoption with the audit's own usage.
    if (!surface.instrument) {
      for (const match of css.matchAll(RADIUS)) {
        const value = match[1].trim();
        if (!radiusUse.has(value)) radiusUse.set(value, []);
        radiusUse.get(value).push(surface.id);
        // The same ratchet as the colours, one property over: a radius literal that equals
        // a radius token is a copy of that decision, whether or not anyone noticed.
        const owner = radiusIndex.get(value.toLowerCase());
        if (!owner) continue;
        const key = `${value.toLowerCase()}|${owner}`;
        if (!duplicates.has(key)) duplicates.set(key, { literal: value.toLowerCase(), token: owner, pages: new Set(), count: 0 });
        const entry = duplicates.get(key);
        entry.pages.add(surface.id);
        entry.count += 1;
      }
      for (const hex of hexes) {
        const owners = valueIndex.get(hex.toLowerCase());
        if (!owners) continue;
        const key = `${hex.toLowerCase()}|${owners[0]}`;
        if (!duplicates.has(key)) duplicates.set(key, { literal: hex.toLowerCase(), token: owners[0], pages: new Set(), count: 0 });
        const entry = duplicates.get(key);
        entry.pages.add(surface.id);
        entry.count += 1;
      }
    }
    surfaces.push({
      ...surface,
      linksTokensCss: /tokens\.css/.test(html),
      tokenUsages: vars.length,
      rawColorLiterals: hexes.length,
      documented: /components\.html/.test(html),
    });
  }

  const audited = surfaces.filter((surface) => !surface.instrument);
  const totalLiterals = audited.reduce((sum, s) => sum + s.rawColorLiterals, 0);
  const totalVars = audited.reduce((sum, s) => sum + s.tokenUsages, 0);

  // Component coverage: how complete is each component's documentation record.
  const componentScores = UI_COMPONENTS.map((component) => {
    const checks = [
      ["description", component.description.length > 40],
      ["variants", component.variants.length > 0],
      ["props", component.props.length > 0],
      // Non-interactive components (pure labels) legitimately have a single state.
      ["states", component.states.length >= 2 || component.static === true],
      ["accessibility", Boolean(component.a11y?.role && component.a11y?.keyboard && component.a11y?.screenReader)],
      ["guidance", component.dos.length > 0 && component.donts.length > 0],
      ["code", Boolean(component.example)],
    ];
    const passed = checks.filter(([, ok]) => ok);
    return {
      id: component.id,
      name: component.name,
      group: component.group,
      score: passed.length,
      outOf: checks.length,
      missing: checks.filter(([, ok]) => !ok).map(([name]) => name),
      tokenized: component.tokens.filter((t) => !t.includes("未导出") && !t.includes("被展示") && !t.includes("对应三维")).length,
      hardcoded: component.hardcoded.length,
    };
  });

  const radiusScale = [...radiusUse.entries()]
    .map(([value, pages]) => ({ value, count: pages.length, pages: [...new Set(pages)] }))
    .sort((a, b) => parseFloat(b.value) - parseFloat(a.value) || String(b.value).localeCompare(String(a.value)));

  return {
    generatedFor: "winbrain-3d-component-studio",
    tokens: {
      defined: leaves.length,
      exported: TOKEN_CATALOG.length,
      exportedWithCss: TOKEN_CATALOG.filter((t) => t.css).length,
      undocumentedCount: undocumented.length,
      undocumented,
    },
    ui: {
      components: UI_COMPONENTS.length,
      groups: [...new Set(UI_COMPONENTS.map((c) => c.group))].length,
      fullyDocumented: componentScores.filter((c) => c.missing.length === 0).length,
      scores: componentScores,
    },
    coverage: {
      surfaces,
      auditedSurfaces: audited.length,
      totalRawColorLiterals: totalLiterals,
      totalTokenUsages: totalVars,
      surfacesLinkingTokensCss: audited.filter((s) => s.linksTokensCss).length,
      duplicatedLiterals: [...duplicates.values()].map((d) => ({ ...d, pages: [...d.pages] })).sort((a, b) => b.count - a.count),
      radiusScale,
      radiusTokenUsages: radiusUse.get("var(--wb-radius-card)")?.length || 0,
    },
  };
}
