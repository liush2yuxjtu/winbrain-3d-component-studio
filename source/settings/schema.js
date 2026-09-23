import { TOKENS } from '../tokens/tokens.js';

// Runtime preferences are a browser-local overlay. They never replace design sources.
export const SETTINGS_VERSION = 1;
export const SETTINGS = [
  { id: 'canvas', label: '页面背景', type: 'color', default: TOKENS.color.canvas, css: '--wb-color-canvas', group: 'ui' },
  { id: 'panel', label: '卡片底色', type: 'color', default: TOKENS.color.panel, css: '--wb-color-panel', group: 'ui' },
  { id: 'accent', label: '强调色', type: 'color', default: TOKENS.color.accent, css: '--wb-color-accent', group: 'ui' },
  { id: 'text', label: '正文颜色', type: 'color', default: TOKENS.color.text, css: '--wb-color-text', group: 'ui' },
  { id: 'cardRadius', label: '卡片圆角', type: 'range', min: 0, max: 32, step: 1, default: parseFloat(TOKENS.radius.card), unit: 'px', css: '--wb-radius-card', group: 'ui' },
  { id: 'controlRadius', label: '按钮圆角', type: 'range', min: 0, max: 32, step: 1, default: parseFloat(TOKENS.radius.control), unit: 'px', css: '--wb-radius-control', group: 'ui' },
  { id: 'bodySize', label: '正文字号', type: 'range', min: 12, max: 20, step: 1, default: parseFloat(TOKENS.typography.bodySize), unit: 'px', css: '--wb-type-body-size', group: 'ui' },
  { id: 'heroSize', label: '首页标题字号', type: 'range', min: 32, max: 52, step: 1, default: parseFloat(TOKENS.typography.heroSize), unit: 'px', css: '--wb-live-hero-size', group: 'home' },
  { id: 'labels', label: '显示平台标题', type: 'checkbox', default: true, group: 'home' },
  { id: 'animate', label: '播放光流与漂浮', type: 'checkbox', default: true, group: 'home' },
  { id: 'rotate', label: '自动旋转', type: 'checkbox', default: false, group: 'home' },
  { id: 'exposure', label: '画面亮度', type: 'range', min: 0.5, max: 1.8, step: 0.05, default: TOKENS.rendering.toneMappingExposure, group: 'scene' },
  { id: 'keyLight', label: '主灯强度', type: 'range', min: 0, max: 4, step: 0.1, default: TOKENS.lighting.key.intensity, group: 'scene' },
  { id: 'platformOpacity', label: '内置平台玻璃浓度', type: 'range', min: 10, max: 140, step: 5, default: 100, unit: '%', group: 'scene' },
  { id: 'bloom', label: '发光效果', type: 'checkbox', default: true, group: 'scene' },
];

export function defaults(reducedMotion = false) {
  return Object.fromEntries(SETTINGS.map(s => [s.id, s.id === 'animate' ? !reducedMotion : s.default]));
}

export function validateOverrides(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('设置必须是一个对象');
  const clean = {};
  for (const [id, input] of Object.entries(value)) {
    const s = SETTINGS.find(s => s.id === id);
    if (!s) throw new Error(`不支持的设置：${id}`);
    if (s.type === 'checkbox') {
      if (typeof input !== 'boolean') throw new Error(`${s.label}需要开关值`);
      clean[id] = input;
    } else if (s.type === 'color') {
      if (typeof input !== 'string' || !/^#[0-9a-f]{6}$/i.test(input)) throw new Error(`${s.label}需要六位颜色值`);
      clean[id] = input.toLowerCase();
    } else {
      if (typeof input !== 'number' || !Number.isFinite(input) || input < s.min || input > s.max) throw new Error(`${s.label}超出范围`);
      clean[id] = Number((s.min + Math.round((input - s.min) / s.step) * s.step).toFixed(4));
    }
  }
  return clean;
}

export function parseSettings(text) {
  if (text.length > 20000) throw new Error('设置文件过大');
  const data = JSON.parse(text);
  if (data?.format !== 'winbrain-design-settings' || data.version !== SETTINGS_VERSION) throw new Error('这不是受支持的 WinBrain 设置文件');
  return validateOverrides(data.overrides);
}

export function serializeSettings(overrides) {
  return JSON.stringify({ format: 'winbrain-design-settings', version: SETTINGS_VERSION, overrides: validateOverrides(overrides) }, null, 2);
}

// Components in preview/ share their deployment's settings. PR previews remain isolated.
export function settingsStorageKey(pathname) {
  const directory = pathname.slice(0, pathname.lastIndexOf('/') + 1).replace(/\/preview\/$/, '/');
  return `winbrain:design-settings:v1:${directory}`;
}
