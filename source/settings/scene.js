import { renderer, scene } from '../core.js';
import { bloom } from '../rendering.js';

export function attachSceneSettings({ motion, render } = {}) {
  const originalOpacity = new WeakMap();
  const key = scene.children.find(node => node.isDirectionalLight);
  function apply(event) {
    const values = event.detail.values;
    renderer.toneMappingExposure = values.exposure;
    if (key) key.intensity = values.keyLight;
    scene.traverse(object => {
      if (object.userData.name !== 'Glass platform') return;
      for (const [index, material] of [object.material].flat().entries()) {
        if (!material) continue;
        if (!originalOpacity.has(material)) originalOpacity.set(material, material.opacity);
        const authored = object.userData.designOpacity?.[index];
        const baseline = typeof authored === 'number' && Number.isFinite(authored) && authored >= 0 && authored <= 1 ? authored : originalOpacity.get(material);
        material.opacity = Math.min(1, baseline * values.platformOpacity / 100);
      }
    });
    bloom.enabled = values.bloom;
    if (motion) {
      motion.setPaused(!values.animate);
      motion.setAutoRotate(values.rotate);
      const pause = document.querySelector('#pause');
      const rotate = document.querySelector('#rotate');
      if (pause) { pause.setAttribute('aria-pressed', String(!values.animate)); pause.textContent = values.animate ? '暂停光流' : '继续光流'; }
      if (rotate) rotate.setAttribute('aria-pressed', String(values.rotate));
    }
    render?.();
  }
  window.addEventListener('winbrain:design-settings', apply);
  // Existing controls and dragging still work; keep both views of their state in sync.
  if (motion) {
    const sync = () => {
      const state = motion.inspect();
      window.dispatchEvent(new CustomEvent('winbrain:motion-settings', { detail: { animate: !state.paused, rotate: state.autoRotate } }));
    };
    for (const selector of ['#pause', '#rotate', '#reset', '[data-home]', '.brand']) {
      document.querySelector(selector)?.addEventListener('click', () => queueMicrotask(sync));
    }
    renderer.domElement.addEventListener('pointerdown', () => queueMicrotask(sync));
  }
  window.dispatchEvent(new Event('winbrain:design-settings-ready'));
}
