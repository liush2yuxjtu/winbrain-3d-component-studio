import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve(import.meta.dirname, '../..');
const out = path.join(root, 'asset-review');
await fs.mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
const checks = [];
const check = (name, value, detail = null) => {
  checks.push({ name, passed: Boolean(value), detail });
  assert.ok(value, name + (detail ? ': ' + JSON.stringify(detail) : ''));
};
const contextOptions = { viewport: { width: 1536, height: 1024 }, deviceScaleFactor: 1, reducedMotion: 'reduce' };
const errors = [];
try {
  for (const [label, port] of [['before', 8766], ['after', 8765]]) {
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    page.on('pageerror', e => errors.push({ page: label, message: e.message }));
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load' });
    await page.waitForFunction(() => window.winbrain && document.body.dataset.ready, null, { timeout: 120000 });
    const state = await page.evaluate(() => {
      winbrain.setRenderingEnabled(false); winbrain.setPaused(true); winbrain.reset(); winbrain.renderOnce();
      return { view: winbrain.view, stats: winbrain.stats(), count: winbrain.registry.size };
    });
    check(`${label}: 22 registered components`, state.count === 22);
    await page.screenshot({ path: path.join(out, `${label}.png`) });
    for (let frame = 0; frame < 3; frame++) {
      await page.evaluate(() => winbrain.renderOnce());
      await page.screenshot({ path: path.join(out, `${label}-frozen-${frame}.png`) });
    }
    await fs.writeFile(path.join(out, `${label}-capture.json`), JSON.stringify({ ...state, viewport: [1536, 1024], dpr: 1, browser: browser.version() }, null, 2));
    await context.close();
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.on('pageerror', e => errors.push({ page: 'studio', message: e.message }));
  await page.goto('http://127.0.0.1:8765/studio.html');
  await page.waitForFunction(() => window.studio && document.body.dataset.ready, null, { timeout: 120000 });
  const manifest = await page.evaluate(() => studio.assetManifest());
  const geometry = await page.evaluate(() => {
    const bad = [], counts = {};
    for (const e of studio.registry.values()) {
      counts[e.id] = { meshes: 0, databaseTiers: 0 };
      e.root.traverse(o => {
        if (o.name?.startsWith('solid-database-volume-')) counts[e.id].databaseTiers++;
        if (!o.geometry) return;
        counts[e.id].meshes++;
        const values = o.geometry.attributes.position?.array;
        if (values && !values.every(Number.isFinite)) bad.push(e.id + ': positions');
      });
    }
    return { bad, counts };
  });
  check('finite vertex coordinates', geometry.bad.length === 0, geometry.bad);
  check('database has exactly three solid tiers', geometry.counts['data.business-data'].databaseTiers === 3);
  check('rounded robot visor exists', await page.evaluate(() => Boolean(studio.registry.get('actor.ai-agents').root.getObjectByName('rounded-inset-visor'))));
  check('application laminate exists', await page.evaluate(() => Boolean(studio.registry.get('platform.application').root.getObjectByName('application-inner-glass-laminate'))));
  for (const asset of manifest.components) {
    console.log('Exporting', asset.id);
    const result = await page.evaluate(async id => {
      studio.select(id); studio.setReference(false);
      document.querySelector('#show-context').checked = false;
      studio.setMode('asset'); studio.render();
      const preview = studio.snapshot();
      studio.setMode('mock'); studio.render();
      const mock = studio.snapshot();
      const native = studio.exportNative(id);
      const buffer = await studio.exportGLB(id);
      const parsed = await studio.parseGLB(buffer);
      let meshCount = 0;
      parsed.traverse(o => { if (o.isMesh) meshCount++; });
      const bytes = new Uint8Array(buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { preview, mock, native, glb: btoa(binary), meshCount };
    }, asset.id);
    check(`${asset.id}: GLB round trip`, result.meshCount > 0);
    await fs.writeFile(path.join(root, asset.glb), Buffer.from(result.glb, 'base64'));
    await fs.writeFile(path.join(root, asset.native), result.native);
    await fs.writeFile(path.join(root, asset.preview), Buffer.from(result.preview.split(',')[1], 'base64'));
    await fs.writeFile(path.join(root, asset.mockPreview), Buffer.from(result.mock.split(',')[1], 'base64'));
  }
  await fs.writeFile(path.join(root, 'assets/catalog.json'), JSON.stringify(manifest, null, 2));
  await page.close();
  const catalog = await context.newPage();
  catalog.on('pageerror', e => errors.push({ page: 'catalog', message: e.message }));
  await catalog.goto('http://127.0.0.1:8765/catalog.html');
  await catalog.screenshot({ path: path.join(out, 'catalog-desktop.png'), fullPage: true });
  await catalog.setViewportSize({ width: 390, height: 844 });
  await catalog.screenshot({ path: path.join(out, 'catalog-mobile.png'), fullPage: true });
  check('catalog mobile: no horizontal overflow', await catalog.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  check('no browser page errors', errors.length === 0, errors);
  await context.close();
} finally {
  await fs.writeFile(path.join(out, 'verification.json'), JSON.stringify({ checks, errors, browser: browser.version() }, null, 2));
  await browser.close();
}
