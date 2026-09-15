import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { scene, world, camera, W, H } from "./core.js";

import { previewStorageScope } from './storage-scope.js';
const storageScope = previewStorageScope(location.pathname);
export const registry = new Map();
export const STORAGE_KEY = "winbrain-component-layout-v1" + storageScope;
const channel =
  typeof BroadcastChannel === "function"
    ? new BroadcastChannel(STORAGE_KEY)
    : null;
const unit = 14 / H;
camera.updateMatrixWorld(true);
const referenceCamera = camera.clone();
const screenRight = new THREE.Vector3(1, 0, 0).applyQuaternion(
  camera.quaternion,
);
const screenUp = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
const screenDepth = new THREE.Vector3(0, 0, 1).applyQuaternion(
  camera.quaternion,
);
const materialDefaults = new WeakMap();
export const defaultState = () => ({
  dx: 0,
  dy: 0,
  depth: 0,
  sx: 1,
  sy: 1,
  sz: 1,
  rx: 0,
  ry: 0,
  rz: 0,
  visible: true,
  tint: null,
  asset: null,
});

function ownMaterials(group) {
  group.traverse((o) => {
    if (!o.material) return;
    const clone = (m) => {
      const copy = m.clone();
      materialDefaults.set(copy, copy.color?.clone());
      return copy;
    };
    o.material = Array.isArray(o.material)
      ? o.material.map(clone)
      : clone(o.material);
  });
}

/** Wrap independent geometry at a stable pivot without decomposing a sheared slab. */
export function register(id, roots, metadata) {
  scene.updateMatrixWorld(true);
  const pivot = roots[0].getWorldPosition(new THREE.Vector3());
  const root = new THREE.Group();
  root.name = id;
  root.position.copy(pivot);
  world.add(root);
  root.updateMatrixWorld(true);
  const content = new THREE.Group();
  content.name = `${id}:procedural`;
  root.add(content);
  const inv = root.matrixWorld.clone().invert();
  for (const child of roots) {
    const matrix = new THREE.Matrix4().multiplyMatrices(inv, child.matrixWorld);
    content.add(child);
    child.matrix.copy(matrix);
    child.matrixAutoUpdate = false;
  }
  ownMaterials(content);
  root.traverse((o) => (o.userData.componentId = id));
  const entry = {
    id,
    ...metadata,
    root,
    original: content,
    active: content,
    pivot,
    state: defaultState(),
    upload: null,
  };
  registry.set(id, entry);
  return entry;
}

export function capture(id, metadata, build) {
  const previous = new Set([...world.children, ...scene.children]);
  build();
  const roots = [...world.children, ...scene.children].filter(
    (o) => !previous.has(o),
  );
  return register(id, roots, metadata);
}

function safeState(value = {}) {
  const state = defaultState();
  for (const key of ["dx", "dy", "depth", "sx", "sy", "sz", "rx", "ry", "rz"]) {
    if (Number.isFinite(+value[key]))
      state[key] = THREE.MathUtils.clamp(
        +value[key],
        key[0] === "s" ? 0.01 : -4096,
        key[0] === "s" ? 100 : 4096,
      );
  }
  state.visible = value.visible !== false;
  state.tint = /^#[\da-f]{6}$/i.test(value.tint || "") ? value.tint : null;
  state.asset = typeof value.asset === "string" ? value.asset : null;
  return state;
}

export function updateComponent(id, patch) {
  const entry = registry.get(id);
  if (!entry) throw new Error(`Unknown component: ${id}`);
  entry.state = safeState({ ...entry.state, ...patch });
  const v = entry.state;
  entry.root.position
    .copy(entry.pivot)
    .addScaledVector(screenRight, v.dx * unit)
    .addScaledVector(screenUp, -v.dy * unit)
    .addScaledVector(screenDepth, v.depth);
  entry.root.scale.set(v.sx, v.sy, v.sz);
  entry.root.rotation.set(...[v.rx, v.ry, v.rz].map(THREE.MathUtils.degToRad));
  entry.root.visible = v.visible;
  entry.active.traverse((o) => {
    for (const m of (Array.isArray(o.material)
      ? o.material
      : [o.material]
    ).filter(Boolean)) {
      if (!m.isMeshStandardMaterial || !m.color) continue;
      if (!materialDefaults.has(m)) materialDefaults.set(m, m.color.clone());
      if (v.tint) m.color.set(v.tint);
      else m.color.copy(materialDefaults.get(m));
    }
  });
  entry.root.updateMatrixWorld(true);
  return entry;
}

export function projectedPivot(id) {
  const p = registry
    .get(id)
    .root.getWorldPosition(new THREE.Vector3())
    .project(referenceCamera);
  return { x: ((p.x + 1) * W) / 2, y: ((1 - p.y) * H) / 2 };
}

export function cloneAsset(id) {
  const clone = registry.get(id).original.clone(true);
  clone.visible = true;
  clone.traverse((o) => {
    delete o.userData.componentId;
  });
  ownMaterials(clone);
  return clone;
}

function localBounds(content) {
  const copy = content.clone(true);
  copy.position.set(0, 0, 0);
  copy.quaternion.identity();
  copy.scale.set(1, 1, 1);
  copy.updateMatrixWorld(true);
  return new THREE.Box3().setFromObject(copy);
}

/** Keep the source asset's proportions; fit it into the original component's bounds. */
export function replaceComponent(id, asset, assetName, upload = null) {
  const entry = registry.get(id);
  if (entry.active !== entry.original) entry.active.removeFromParent();
  entry.original.visible = false;
  const fitted = new THREE.Group();
  fitted.name = `${id}:replacement`;
  const before = localBounds(entry.original);
  const after = localBounds(asset);
  const a = before.getSize(new THREE.Vector3()),
    b = after.getSize(new THREE.Vector3());
  const ratio = Math.min(
    ...["x", "y", "z"]
      .filter((k) => b[k] > 0.001 && a[k] > 0.001)
      .map((k) => a[k] / b[k]),
  );
  const scale = Number.isFinite(ratio) ? ratio : 1;
  asset.position.sub(after.getCenter(new THREE.Vector3()));
  fitted.add(asset);
  fitted.scale.setScalar(scale);
  fitted.position.copy(before.getCenter(new THREE.Vector3()));
  ownMaterials(fitted);
  fitted.traverse((o) => (o.userData.componentId = id));
  entry.root.add(fitted);
  entry.active = fitted;
  entry.upload = upload;
  updateComponent(id, { asset: assetName });
  return entry;
}

export function restoreAsset(id) {
  const entry = registry.get(id);
  if (entry.active !== entry.original) entry.active.removeFromParent();
  entry.active = entry.original;
  entry.original.visible = true;
  entry.upload = null;
  updateComponent(id, { asset: null });
}

export function resetComponent(id) {
  restoreAsset(id);
  return updateComponent(id, defaultState());
}

export async function parseGLB(buffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength < 12)
    throw new Error("请选择完整的 .glb 或 .wb3d.json 资产。");
  if (new DataView(buffer).getUint32(0, true) !== 0x46546c67) {
    const json = JSON.parse(new TextDecoder().decode(buffer));
    if (json.schema !== "winbrain.asset/v1")
      throw new Error("这不是 WinBrain 原生资产。");
    const object = await new THREE.ObjectLoader().parseAsync(json.object);
    return object;
  }
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    if (/^(blob:|data:)/.test(url)) return url;
    throw new Error("此模型引用了外部文件，请先打包为完整 GLB。");
  });
  const result = await new GLTFLoader(manager).parseAsync(buffer, "");
  return result.scene;
}

export function serializeConfig() {
  return {
    schema: "winbrain.components/v1",
    reference: {
      width: W,
      height: H,
      camera: "orthographic-45deg-0.17rad",
      unitPerPixel: unit,
    },
    components: Object.fromEntries(
      [...registry].map(([id, e]) => [id, { ...e.state }]),
    ),
  };
}

function database() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("winbrain-local-assets-v1" + storageScope, 1);
    req.onupgradeneeded = () => req.result.createObjectStore("assets");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function blobStore(action, id, value) {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(
        "assets",
        action === "get" ? "readonly" : "readwrite",
      );
      const store = tx.objectStore("assets");
      const req = action === "get" ? store.get(id) : store.put(value, id);
      let result;
      req.onsuccess = () => (result = req.result);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

export async function applyConfig(config, { storedAssets = true } = {}) {
  if (
    config?.schema !== "winbrain.components/v1" ||
    !config.components ||
    typeof config.components !== "object"
  )
    throw new Error("这不是 WinBrain 组件配置。");
  const missing = [];
  for (const [id, state] of Object.entries(config.components)) {
    if (!registry.has(id)) continue;
    restoreAsset(id);
    if (
      state.asset?.startsWith("builtin:") &&
      registry.has(state.asset.slice(8))
    )
      replaceComponent(id, cloneAsset(state.asset.slice(8)), state.asset);
    else if (state.asset?.startsWith("local:")) {
      const bytes = storedAssets ? await blobStore("get", state.asset) : null;
      if (bytes)
        replaceComponent(id, await parseGLB(bytes), state.asset, bytes);
      else missing.push(id);
    }
    updateComponent(id, {
      ...state,
      asset: missing.includes(id) ? null : state.asset,
    });
  }
  return missing;
}

export async function saveLayout() {
  for (const e of registry.values())
    if (e.upload) await blobStore("put", e.state.asset, e.upload);
  const config = serializeConfig();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  channel?.postMessage({ type: "saved" });
  return config;
}
export async function loadSaved() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? await applyConfig(JSON.parse(json)) : [];
  } catch (e) {
    console.warn("WinBrain local layout could not be loaded:", e.message);
    return ["storage"];
  }
}
export function listenForSaved(onUpdate) {
  let pending = Promise.resolve();
  const receive = () => {
    pending = pending.then(loadSaved).then(onUpdate);
  };
  addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) receive();
  });
  if (channel) channel.onmessage = receive;
}
