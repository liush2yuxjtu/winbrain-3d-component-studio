// Keep preview edits, uploads and cross-tab messages separate from production.
export function previewStorageScope(pathname) {
  if (!pathname.includes('/pr-preview/')) return '';
  return ':' + pathname.slice(0, pathname.lastIndexOf('/') + 1);
}
