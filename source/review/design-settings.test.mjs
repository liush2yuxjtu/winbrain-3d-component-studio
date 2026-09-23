import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, validateOverrides, parseSettings, serializeSettings, settingsStorageKey } from '../settings/schema.js';

test('import cannot apply unknown keys, CSS payloads, non-finite or out-of-range numbers', () => {
  for (const input of [{ surprise: true }, { accent: 'url(https://example.com)' }, { exposure: Infinity }, { exposure: '1.2' }, { exposure: 4 }, { labels: 'false' }, []]) assert.throws(() => validateOverrides(input));
});
test('settings round-trip preserves false and zero, and normalizes controls', () => {
  const settings = { rotate: false, labels: false, cardRadius: 0, keyLight: 0, exposure: 1.299999, accent: '#ABCDEF' };
  assert.deepEqual(parseSettings(serializeSettings(settings)), { ...settings, exposure: 1.3, accent: '#abcdef' });
});
test('rejects layout JSON, future versions, null and oversized files before applying', () => {
  for (const file of ['null', '{}', '{"version":2,"format":"winbrain-design-settings","overrides":{}}', ' '.repeat(20001)]) assert.throws(() => parseSettings(file));
});
test('component previews share settings but projects and PR previews are isolated', () => {
  const key = settingsStorageKey('/winbrain/index.html');
  assert.equal(key, settingsStorageKey('/winbrain/preview/token-card.html'));
  assert.equal(key, settingsStorageKey('/winbrain/studio.html'));
  assert.notEqual(key, settingsStorageKey('/another-project/index.html'));
  assert.notEqual(key, settingsStorageKey('/winbrain/pr-preview/candidate/index.html'));
  assert.equal(settingsStorageKey('/winbrain/pr-preview/candidate/index.html'), settingsStorageKey('/winbrain/pr-preview/candidate/preview/token-card.html'));
});
test('default animation honors reduced motion, camera remains stationary', () => {
  assert.equal(defaults(true).animate, false);
  assert.equal(defaults(false).animate, true);
  assert.equal(defaults(false).rotate, false);
});
