import { SETTINGS, defaults, validateOverrides, parseSettings, serializeSettings, settingsStorageKey } from './schema.js';

const root = document.documentElement;
const key = settingsStorageKey(location.pathname);
const isStudio = document.body.dataset.mode === 'studio';
const isHome = Boolean(document.querySelector('#world')) && !isStudio;
const hasScene = isHome || isStudio;
// Only these surfaces consume the shared body-size variable in their stylesheet.
const supportsBodySize = Boolean(document.querySelector('.ds-page')) || /\/tokens\.html$/.test(location.pathname);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let overrides = {};
let persisted = true;
let initialMessage = '';
try {
  const saved = localStorage.getItem(key);
  if (saved) overrides = parseSettings(saved);
} catch {
  initialMessage = '已忽略不可读取的设置；可继续调节。';
}
const valueOf = () => ({ ...defaults(reduced.matches), ...overrides });
const launcher = document.createElement('button');
launcher.id = 'wb-settings-launcher';
launcher.type = 'button';
launcher.innerHTML = '<span aria-hidden="true">☷</span><span>设计系统 · 实时设置</span>';
launcher.setAttribute('aria-controls', 'wb-settings-panel');
launcher.setAttribute('aria-expanded', 'false');
const panel = document.createElement('aside');
panel.id = 'wb-settings-panel';
panel.hidden = true;
panel.setAttribute('aria-label', '设计系统实时设置');
const prefix = /\/preview\/[^/]*$/.test(location.pathname) ? '../' : '';
panel.innerHTML = `<div class="wb-settings-head"><span class="wb-settings-kicker">WINBRAIN / DESIGN SYSTEM</span><h2>调到你喜欢的样子</h2><p>即时预览 · 仅保存在此浏览器 · 无 AI 调用</p><button type="button" class="wb-settings-close" aria-label="关闭实时设置">×</button><div class="wb-settings-links"><a href="${prefix}components.html">组件库 ↗</a><a href="${prefix}tokens.html">设计规则 ↗</a><a href="${prefix}motion.html">动效 ↗</a><a href="${prefix}index.html">3D 首页 ↗</a></div></div><div class="wb-settings-scroll"></div><div class="wb-settings-foot"><div class="wb-settings-actions"><button type="button" data-action="reset">恢复默认</button><button type="button" data-action="export">导出设置</button><button type="button" data-action="import">导入设置</button></div><input type="file" accept=".json,application/json" hidden aria-label="导入设计设置文件"><p class="wb-settings-status" role="status" aria-live="polite"></p><p>只改变你的预览，不会修改公开站点的默认设计。</p></div>`;
const status = panel.querySelector('[role=status]');
const controls = new Map();
const groups = [
  ['scene', '3D 画面', '首页和编辑器同步使用；无需重新生成模型。', hasScene],
  ['home', '首页显示与动效', '只影响 3D 首页；拖动画面会停止自动旋转。', isHome],
  ['ui', '界面样式', '作用于使用这些规则的组件库、设计规则和资产页；首页 3D 材质保持独立。原始规则数值仍显示默认值。', true],
];
for (const [group, title, hint, visible] of groups) {
  if (!visible) continue;
  const fieldset = document.createElement('fieldset');
  fieldset.innerHTML = `<legend>${title}</legend><p class="wb-settings-hint">${hint}</p>`;
  for (const s of SETTINGS.filter(s => s.group === group)) {
    if (s.id === 'bodySize' && !supportsBodySize) continue;
    const row = document.createElement('label');
    row.className = 'wb-settings-row';
    row.htmlFor = `wb-setting-${s.id}`;
    const title = document.createElement('span');
    title.textContent = s.label;
    row.append(title);
    const input = document.createElement('input');
    input.type = s.type;
    input.id = `wb-setting-${s.id}`;
    input.dataset.setting = s.id;
    if (s.type === 'range') {
      input.min = s.min; input.max = s.max; input.step = s.step;
      const output = document.createElement('output');
      output.htmlFor = input.id;
      row.append(output);
    }
    row.append(input);
    input.addEventListener('input', () => {
      const value = s.type === 'checkbox' ? input.checked : s.type === 'range' ? Number(input.value) : input.value;
      overrides = { ...overrides, ...validateOverrides({ [s.id]: value }) };
      apply();
      save();
    });
    controls.set(s.id, { input, output: row.querySelector('output'), setting: s });
    fieldset.append(row);
  }
  panel.querySelector('.wb-settings-scroll').append(fieldset);
}
function refreshControls(values) {
  for (const [id, { input, output, setting }] of controls) {
    if (setting.type === 'checkbox') input.checked = values[id];
    else input.value = values[id];
    if (output) output.value = `${values[id]}${setting.unit || ''}`;
  }
}
function announce(text) { status.textContent = text; }
function apply() {
  exportSection.hidden = true;
  const values = valueOf();
  for (const s of SETTINGS.filter(s => s.css)) {
    if (Object.hasOwn(overrides, s.id)) root.style.setProperty(s.css, `${values[s.id]}${s.unit || ''}`);
    else root.style.removeProperty(s.css);
  }
  root.toggleAttribute('data-wb-hero-size', Object.hasOwn(overrides, 'heroSize'));
  root.toggleAttribute('data-wb-control-radius', Object.hasOwn(overrides, 'controlRadius'));
  root.toggleAttribute('data-wb-hide-labels', !values.labels);
  refreshControls(values);
  window.dispatchEvent(new CustomEvent('winbrain:design-settings', { detail: { values } }));
}
function save() {
  try {
    if (Object.keys(overrides).length) localStorage.setItem(key, serializeSettings(overrides));
    else localStorage.removeItem(key);
    persisted = true;
    announce(Object.keys(overrides).length ? '已记住设置，同站点的其他标签页会同步。' : '已恢复默认设计。');
  } catch {
    persisted = false;
    announce('预览已生效，但浏览器未能保存；请导出设置。');
  }
}
function setOpen(open) {
  panel.hidden = !open;
  launcher.hidden = open;
  launcher.setAttribute('aria-expanded', String(open));
  if (open) panel.querySelector('.wb-settings-close').focus();
  else launcher.focus();
}
launcher.addEventListener('click', () => setOpen(true));
panel.querySelector('.wb-settings-close').addEventListener('click', () => setOpen(false));
document.addEventListener('keydown', event => {
  if (panel.hidden) return;
  if (event.key === 'Escape') {
    event.preventDefault(); event.stopPropagation(); setOpen(false);
    return;
  }
  // Keep keyboard navigation within the drawer, including dynamically shown export controls.
  // Pointer users can still interact with the scene while previewing their settings.
  if (event.key !== 'Tab' || !panel.contains(document.activeElement)) return;
  const focusable = [...panel.querySelectorAll('button,a[href],input,textarea')]
    .filter(element => !element.disabled && element.getClientRects().length);
  const first = focusable[0];
  const last = focusable.at(-1);
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault(); last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus();
  }
}, true);
panel.querySelector('[data-action=reset]').addEventListener('click', () => { overrides = {}; apply(); save(); });
const exportSection = document.createElement('section');
exportSection.className = 'wb-settings-export';
exportSection.hidden = true;
exportSection.innerHTML = '<p>复制下方内容保存为 JSON，或点击下载。</p><textarea readonly aria-label="导出的设计设置" rows="7"></textarea><a class="wb-settings-action" download="winbrain-design-settings.json">下载 JSON</a>';
panel.querySelector('.wb-settings-scroll').append(exportSection);
let exportUrl;
panel.querySelector('[data-action=export]').addEventListener('click', () => {
  const json = serializeSettings(overrides);
  if (exportUrl) URL.revokeObjectURL(exportUrl);
  exportUrl = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
  exportSection.querySelector('a').href = exportUrl;
  const text = exportSection.querySelector('textarea');
  text.value = json;
  exportSection.hidden = false;
  text.focus(); text.select();
  announce('设置已生成，可直接复制或下载 JSON。');
});
const file = panel.querySelector('input[type=file]');
panel.querySelector('[data-action=import]').addEventListener('click', () => file.click());
file.addEventListener('change', async () => {
  const selected = file.files[0];
  try {
    if (!selected) return;
    if (selected.size > 20000) throw new Error('设置文件过大');
    const next = parseSettings(await selected.text());
    overrides = next; apply(); save();
  } catch {
    announce('无法导入：请选择有效的 WinBrain 设计设置文件，当前设置未改变。');
  } finally { file.value = ''; }
});
window.addEventListener('storage', event => {
  if (event.key !== key || event.storageArea !== localStorage) return;
  try {
    overrides = event.newValue ? parseSettings(event.newValue) : {};
    apply(); announce('已同步另一个标签页的设置。');
  } catch { announce('另一个标签页的设置无效；当前预览保留。'); }
});
window.addEventListener('winbrain:design-settings-ready', apply);
window.addEventListener('winbrain:motion-settings', event => {
  overrides = { ...overrides, ...validateOverrides(event.detail) };
  refreshControls(valueOf()); save();
});
reduced.addEventListener('change', apply);
document.body.append(launcher, panel);
apply();
announce(initialMessage || (Object.keys(overrides).length ? '已加载此浏览器保存的设置。' : '默认设计 · 修改后自动记住。'));
// Read-only diagnostics for integration checks; user actions go through real controls.
window.winbrainDesignSettings = { inspect: () => ({ values: valueOf(), overrides: { ...overrides }, key, persisted }) };
