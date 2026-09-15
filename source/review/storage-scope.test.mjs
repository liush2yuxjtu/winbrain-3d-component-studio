import test from 'node:test';
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
