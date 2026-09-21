// Minimal CSS reader + scoper.
// The component preview is rendered from the *shipping* stylesheets, not from a copy,
// so the page can never drift from what the product really looks like.

const BLOCK_START = "{";
const BLOCK_END = "}";

/** Split a stylesheet into top-level rules. At-rules keep their block as `body`. */
export function splitRules(css) {
  const rules = [];
  let i = 0;
  let start = 0;
  while (i < css.length) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? css.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipString(css, i);
      continue;
    }
    if (ch === BLOCK_START) {
      const prelude = css.slice(start, i).trim();
      const end = matchBrace(css, i);
      rules.push({
        prelude,
        body: css.slice(i + 1, end),
        at: prelude.startsWith("@"),
      });
      i = end + 1;
      start = i;
      continue;
    }
    if (ch === BLOCK_END) start = i + 1;
    i += 1;
  }
  return rules;
}

function skipString(css, i) {
  const quote = css[i];
  i += 1;
  while (i < css.length && css[i] !== quote) {
    if (css[i] === "\\") i += 1;
    i += 1;
  }
  return i + 1;
}

function matchBrace(css, openIndex) {
  let depth = 1;
  let i = openIndex + 1;
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      i = end < 0 ? css.length : end + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipString(css, i);
      continue;
    }
    if (ch === BLOCK_START) depth += 1;
    else if (ch === BLOCK_END) depth -= 1;
    i += 1;
  }
  return i - 1;
}

/** Split a selector list on top-level commas, respecting :is()/:not() and attribute values. */
export function splitSelectors(prelude) {
  const parts = [];
  let depth = 0;
  let current = "";
  for (let i = 0; i < prelude.length; i += 1) {
    const ch = prelude[i];
    if (ch === "(" || ch === "[") depth += 1;
    else if (ch === ")" || ch === "]") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * True when a selector list mentions `needle` as a whole token,
 * so `.preview` does not match inside `.motion-preview`.
 */
function mentions(selector, needle) {
  let index = selector.indexOf(needle);
  while (index !== -1) {
    const after = selector[index + needle.length];
    if (after === undefined || !/[a-zA-Z0-9_-]/.test(after)) return true;
    index = selector.indexOf(needle, index + 1);
  }
  return false;
}

function ruleHits(prelude, needles) {
  return needles.some((needle) => mentions(prelude, needle));
}

function keptSelectors(prelude, needles) {
  const clean = prelude.replace(/\/\*[\s\S]*?\*\//g, " ");
  const parts = splitSelectors(clean).filter((part) => ruleHits(part, needles));
  return parts;
}

/**
 * Prefix every selector with `:where(scope)`.
 * `:where()` contributes zero specificity, so the original cascade order is preserved.
 */
function scopeSelector(selector, scope, scopeClass) {
  const trimmed = selector.trim();
  if (!trimmed) return trimmed;
  if (/^body\[data-mode=/.test(trimmed)) return scopeClass;
  if (/^(html|body|:root)$/.test(trimmed)) return scope;
  if (trimmed.startsWith("*")) {
    const rest = trimmed.slice(1).trim();
    return rest ? `${scope} ${trimmed}` : `${scope}, ${scope} *`;
  }
  return `${scope} ${trimmed}`;
}

/**
 * Extract and scope the CSS a set of components needs.
 *
 * @param {Array<{prelude: string, body: string, at: boolean}>} rules parsed stylesheet
 * @param {string[]} needles selector fragments the components own
 * @param {{scope?: string, scopeClass?: string}} options
 */
export function scopeRules(rules, needles, { scope = ":where(.ds-stage)", scopeClass = ".ds-stage--studio", keepKeyframes = [] } = {}) {
  const out = [];

  const walk = (list) => {
    for (const rule of list) {
      if (!rule.at) {
        // `body[data-mode="studio"]` belongs to the editor surface only. Mapping it onto a
        // different stage's scope class would give that one rule class-level specificity
        // and let the editor's type and colour override the stage it was copied into.
        const mode = rule.prelude.match(/^body\[data-mode="([^"]+)"\]$/);
        if (mode && !scopeClass.endsWith(`--${mode[1]}`)) continue;
        const keep = keptSelectors(rule.prelude, needles);
        if (!keep.length) continue;
        out.push(`${keep.map((s) => scopeSelector(s, scope, scopeClass)).join(", ")}{${rule.body}}`);
        continue;
      }
      const name = rule.prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
      // @font-face carries base64 font bytes and @import is a network dependency;
      // both are dropped so every preview page stays offline and small.
      if (name === "font-face" || name === "import" || name === "charset") continue;
      if (name.endsWith("keyframes")) {
        const keyframes = rule.prelude.replace(/^@[-\w]*keyframes\s+/i, "").trim();
        if (keepKeyframes.includes(keyframes)) out.push(`${rule.prelude}{${rule.body}}`);
        continue;
      }
      const inner = splitRules(rule.body);
      const before = out.length;
      walk(inner);
      if (out.length > before) {
        out.splice(before, 0, `${rule.prelude}{`);
        out.push("}");
      }
    }
  };

  walk(rules);
  return out.join("\n");
}
