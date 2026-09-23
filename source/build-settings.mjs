import { build } from 'esbuild';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TOKEN_CATALOG, TOKENS } from './tokens/tokens.js';

const root = dirname(fileURLToPath(import.meta.url));
const out = join(root, '..');
const bundle = await build({ entryPoints: [join(root, 'settings/panel.js')], bundle: true, format: 'iife', target: 'es2022', minify: true, write: false });
const script = bundle.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const css = await readFile(join(root, 'settings/panel.css'), 'utf8');
const variables = TOKEN_CATALOG.filter(t => t.css).map(t => `${t.css}:${t.value}`).join(';');
// Settings chrome keeps the canonical palette so a page's chosen colors cannot hide controls.
const chrome = { text: TOKENS.color.text, panel: TOKENS.color.panel, border: TOKENS.color.border, muted: TOKENS.color.textMuted, accent: TOKENS.color.accent };
const chromeVariables = Object.entries(chrome).map(([k, v]) => `--wb-settings-${k}:${v}`).join(';');
const styleBlock = `<!-- WB_SETTINGS_STYLE --><style>:root{${variables};${chromeVariables}}\n${css}</style><!-- /WB_SETTINGS_STYLE -->`;
const scriptBlock = `<!-- WB_SETTINGS_SCRIPT --><script>${script}</script><!-- /WB_SETTINGS_SCRIPT -->`;
const pages = ['index.html', 'studio.html', 'tokens.html', 'components.html', 'catalog.html', 'motion.html', ...(await readdir(join(out, 'preview'))).filter(name => name.endsWith('.html')).map(name => `preview/${name}`)];
for (const page of pages) {
  const path = join(out, page);
  let html = await readFile(path, 'utf8');
  html = html.replace(/<!-- WB_SETTINGS_STYLE -->[\s\S]*?<!-- \/WB_SETTINGS_STYLE -->/g, '').replace(/<!-- WB_SETTINGS_SCRIPT -->[\s\S]*?<!-- \/WB_SETTINGS_SCRIPT -->/g, '');
  html = html.replace('</head>', `${styleBlock}</head>`).replace('</body>', `${scriptBlock}</body>`);
  await writeFile(path, html);
}
console.log(`Built local-only live design settings into ${pages.length} pages.`);
