from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'source/review/capture.mjs'
s=p.read_text().replace(", '--use-angle=swiftshader'",'')
s=s.replace("const page = await context.newPage();", "const page = await context.newPage();\n    page.setDefaultTimeout(180000);")
s=s.replace("    await page.screenshot({ path: path.join(out, `${label}.png`) });", '''    // Freeze actual GPU pixels into a same-sized 2D canvas. This avoids a
    // headless WebGL compositor capture stall; no reference pixels are used.
    await page.evaluate(() => {
      const live = winbrain.renderer.domElement;
      const frozen = document.createElement('canvas');
      for (const attribute of live.attributes) frozen.setAttribute(attribute.name, attribute.value);
      frozen.width = live.width; frozen.height = live.height;
      frozen.getContext('2d').drawImage(live, 0, 0);
      live.replaceWith(frozen);
    });
    await page.screenshot({ path: path.join(out, `${label}.png`), timeout: 180000, animations: 'disabled' });''')
s=s.replace("      await page.evaluate(() => winbrain.renderOnce());\n      await page.screenshot({ path: path.join(out, `${label}-frozen-${frame}.png`) });", '''      const pixels = await page.evaluate(() => {
        winbrain.renderOnce();
        return winbrain.renderer.domElement.toDataURL('image/png');
      });
      await fs.writeFile(path.join(out, `${label}-frozen-${frame}.png`), Buffer.from(pixels.split(',')[1], 'base64'));''')
s=s.replace("browser: browser.version() }, null, 2)", "browser: browser.version(), capture: 'Actual WebGL backbuffer copied 1:1 into same-size 2D canvas for DOM capture; frozen test uses native backbuffers' }, null, 2)")
p.write_text(s)
p=root/'source/storage-scope.js'
p.write_text('''// Keep preview edits, uploads and cross-tab messages separate from production.
export function previewStorageScope(pathname) {
  if (!pathname.includes('/pr-preview/')) return '';
  return ':' + pathname.slice(0, pathname.lastIndexOf('/') + 1);
}
''')
p=root/'source/registry.js'; s=p.read_text()
s=s.replace('export const registry = new Map();', '''import { previewStorageScope } from './storage-scope.js';
const storageScope = previewStorageScope(location.pathname);
export const registry = new Map();''')
s=s.replace('export const STORAGE_KEY = "winbrain-component-layout-v1";', 'export const STORAGE_KEY = "winbrain-component-layout-v1" + storageScope;')
s=s.replace('indexedDB.open("winbrain-local-assets-v1", 1)', 'indexedDB.open("winbrain-local-assets-v1" + storageScope, 1)')
p.write_text(s)
(root/'source/review/storage-scope.test.mjs').write_text('''import test from 'node:test';
import assert from 'node:assert/strict';
import { previewStorageScope as scope } from '../storage-scope.js';
test('existing production storage keys remain unchanged', () => {
  assert.equal(scope('/winbrain-3d-component-studio/index.html'), '');
  assert.equal(scope('/winbrain-3d-component-studio/studio.html'), '');
});
test('homepage and editor share only their own preview scope', () => {
  const base = '/winbrain-3d-component-studio/pr-preview/p0-p1-assets/';
  assert.equal(scope(base + 'index.html'), scope(base + 'studio.html'));
  assert.equal(scope(base), scope(base + 'index.html'));
  assert.notEqual(scope(base), '');
  assert.notEqual(scope(base), scope('/winbrain-3d-component-studio/pr-preview/other/index.html'));
});
''')
(root/'source/review/README.md').write_text('''# P0/P1 visual review

The review covers 16 corrected assets. Both builds use the same Chromium,
1536 x 1024 viewport, DPR 1, reduced motion, clean storage and original camera.
Actual GPU backbuffer pixels are copied 1:1 into an identically sized 2D canvas
before the DOM screenshot to avoid a headless WebGL compositor stall. Frozen
stability uses the native GPU backbuffers directly. No reference-image pixels
are inserted into the candidate render; no registration or warping is applied.

Run the candidate on port 8765 and baseline commit
`bc2a884927706d66fe107d8c0c2c2b7af81ba853` on port 8766 after building both.
With Playwright 1.63.0, its Chromium browser, numpy 2.2.6 and OpenCV 4.12.0.88:

```sh
node --test source/review/storage-scope.test.mjs
node source/review/capture.mjs
python3 source/review/compare.py
(cd source && node build-catalog.mjs)
```

All 22 GLBs are parsed again after export. Native files and both preview modes
are regenerated, and their hashes are recorded. Per-asset metrics measure the
full-scene reference rectangle, including neighbors and background. They are
not isolated-model scores or approval percentages. Mixed results stay visible.

A documented 1053-draw compatibility reservation keeps the previous Earth and
atmosphere sequence while the city adopts its own seeded layout. A separate
migration should replace the remaining shared environment stream.

Preview paths have independent layout, upload and BroadcastChannel storage.
Frozen-frame stability is not a complete interactive animation/flicker audit.
''')
print('Prepared preview isolation and GPU-backbuffer capture.')
