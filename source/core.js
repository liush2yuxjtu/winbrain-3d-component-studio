import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
// WinBrain geometry, lighting and world textures are generated with code.
// Four application brand marks use embedded official artwork; see BRAND-ASSETS.md.
// The reference image is only used by the alignment editor.
const W = 1536,
  H = 1024,
  TAU = Math.PI * 2;
const host = document.querySelector("#world");
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true,
});
renderer.setPixelRatio(
  document.body.dataset.mode === "studio"
    ? 1
    : Math.min(Math.max(devicePixelRatio, 1.5), 2),
);
renderer.setSize(W, H);
renderer.setClearColor(0x07101b, 0);
renderer.info.autoReset = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
host.append(renderer.domElement);
renderer.domElement.setAttribute(
  "aria-label",
  "可旋转的 WinBrain 三维组织世界",
);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x141b25);
const camera = new THREE.OrthographicCamera(-10.5, 10.5, 7, -7, 0.1, 160);
const target = new THREE.Vector3(0, 4.3, 0);
const view = { yaw: Math.PI / 4, pitch: 0.17, zoom: 1 };
const initialView = { ...view };
function updateCamera() {
  camera.position
    .set(
      Math.sin(view.yaw) * Math.cos(view.pitch),
      Math.sin(view.pitch),
      Math.cos(view.yaw) * Math.cos(view.pitch),
    )
    .multiplyScalar(48)
    .add(target);
  camera.lookAt(target);
  camera.zoom = view.zoom;
  camera.updateProjectionMatrix();
  // DOM labels project world anchors before the WebGL render pass. Keep the
  // camera world/inverse matrices current here so labels never project with the
  // previous frame's camera during pointer-drag rotation.
  camera.updateMatrixWorld(true);
}
updateCamera();
const pmrem = new THREE.PMREMGenerator(renderer);
const room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room, 0.06).texture;
room.dispose();
pmrem.dispose();
scene.environmentIntensity = 0.4;
scene.add(new THREE.HemisphereLight(0xb8d8ff, 0x071020, 0.9));
const key = new THREE.DirectionalLight(0xd5e9ff, 2.2);
key.position.set(-6, 12, 10);
scene.add(key);
const rim = new THREE.DirectionalLight(0x658cff, 1.7);
rim.position.set(6, 8, -7);
scene.add(rim);
const front = new THREE.DirectionalLight(0xffffff, 0.65);
front.position.set(4, 6, 15);
scene.add(front);
const world = new THREE.Group();
scene.add(world);
const yaw0 = Math.PI / 4;
const right = new THREE.Vector3(Math.cos(yaw0), 0, -Math.sin(yaw0)),
  near = new THREE.Vector3(Math.sin(yaw0), 0, Math.cos(yaw0));
function pos(x, y, d = 0) {
  return new THREE.Vector3()
    .addScaledVector(right, x)
    .addScaledVector(near, d)
    .add(new THREE.Vector3(0, y, 0));
}
function rnd(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rnd(321);
const mat = (color, opts = {}) =>
  new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.25,
    metalness: 0.22,
    clearcoat: 0.8,
    clearcoatRoughness: 0.16,
    ...opts,
  });
const glowMat = (color, intensity = 2) =>
  new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(intensity),
    toneMapped: false,
  });
const silver = mat(0xc6d5ed, { metalness: 0.62, roughness: 0.21 });
const white = mat(0xe8f3ff, { metalness: 0.3, roughness: 0.2 });
const black = new THREE.MeshBasicMaterial({ color: 0x061126 });
const glass = mat(0x365a95, {
  metalness: 0.15,
  roughness: 0.1,
  transmission: 0.55,
  thickness: 0.4,
  ior: 1.38,
  transparent: true,
  opacity: 0.27,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const tubeGlass = mat(0xaccdf9, {
  metalness: 0.1,
  roughness: 0.07,
  transparent: true,
  opacity: 0.16,
  depthWrite: false,
});
const cyan = glowMat(0x67ccff, 1.5),
  blue = glowMat(0x668aff, 1.8),
  violet = glowMat(0x9f81ff, 1.8);
const clickable = [],
  animated = [],
  labels = [];
function mesh(geo, material, parent = world) {
  const m = new THREE.Mesh(geo, material);
  parent.add(m);
  return m;
}
function box(w, h, d, m, p, parent = world, r = 0.05) {
  const o = mesh(
    new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 3, h / 3, d / 3)),
    m,
    parent,
  );
  if (p) o.position.copy(p);
  return o;
}
const primitiveGeometries = new Map();
function cachedGeometry(key, create) {
  if (!primitiveGeometries.has(key)) primitiveGeometries.set(key, create());
  return primitiveGeometries.get(key);
}
function sphere(r, m, p, parent = world, sx = 1, sy = 1, sz = 1) {
  const o = mesh(
    cachedGeometry(`sphere:${r}`, () => new THREE.SphereGeometry(r, 24, 16)),
    m,
    parent,
  );
  if (p) o.position.copy(p);
  o.scale.set(sx, sy, sz);
  return o;
}
function cyl(rt, rb, h, m, p, parent = world) {
  const o = mesh(
    cachedGeometry(
      `cylinder:${rt}:${rb}:${h}`,
      () => new THREE.CylinderGeometry(rt, rb, h, 48),
    ),
    m,
    parent,
  );
  if (p) o.position.copy(p);
  return o;
}
function line(points, color = 0x96c3ff, opacity = 1, parent = world) {
  const g = new THREE.BufferGeometry().setFromPoints(points);
  const l = new THREE.Line(
    g,
    new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
      toneMapped: false,
    }),
  );
  parent.add(l);
  return l;
}
function beam(a, b, r, m, parent = world) {
  const direction = new THREE.Vector3().subVectors(b, a);
  const o = cyl(
    r,
    r,
    direction.length(),
    m,
    new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5),
    parent,
  );
  o.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize(),
  );
  return o;
}
function ring(r, y, color, parent = world, thickness = 0.012) {
  const o = mesh(
    new THREE.TorusGeometry(r, thickness, 8, 80),
    glowMat(color, 1.6),
    parent,
  );
  o.rotation.x = Math.PI / 2;
  o.position.y = y;
  return o;
}
function textureCanvas(w, h, paint) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function rr(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}
const poolMap = textureCanvas(256, 256, (c) => {
  const g = c.createRadialGradient(128, 128, 0, 128, 128, 126);
  g.addColorStop(0, "rgba(170,220,255,.8)");
  g.addColorStop(0.2, "rgba(90,180,255,.35)");
  g.addColorStop(0.55, "rgba(50,100,250,.13)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, 256, 256);
});
function pool(parent, x, y, z, size, color = 0x80bcff) {
  const m = new THREE.MeshBasicMaterial({
    map: poolMap,
    color,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const o = mesh(new THREE.PlaneGeometry(size, size), m, parent);
  o.rotation.x = -Math.PI / 2;
  o.position.set(x, y, z);
  return o;
}
function softGlow(parent, p, size, color = 0.0) {
  const m = new THREE.SpriteMaterial({
    map: poolMap,
    color: color || 0x77b4ff,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const o = new THREE.Sprite(m);
  o.position.copy(p);
  o.scale.set(size, size, 1);
  parent.add(o);
  return o;
}
function textSprite(
  text,
  width,
  height,
  {
    font = 34,
    color = "#f3f6ff",
    weight = 400,
    align = "center",
    background = null,
  } = {},
) {
  const c = document.createElement("canvas"),
    ctx = c.getContext("2d");
  ctx.font = `${weight} 76px Roboto, Arial`;
  c.width = Math.ceil(ctx.measureText(text).width + 36);
  c.height = 118;
  ctx.font = `${weight} 76px Roboto, Arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = color;
  if (background) rr(ctx, 0, 0, c.width, c.height, 20, background);
  ctx.fillText(text, c.width / 2, 59);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    }),
  );
  s.scale.set((height * c.width) / c.height, height, 1);
  return s;
}
function label(parent, text, x, y, d, width = 1.8, height = 0.34, opt = {}) {
  const s = textSprite(text, width, height, opt);
  s.position.set(x, y, d);
  s.userData.annotation = true;
  parent.add(s);
  return s;
}
function groupAt(x, y, d, parent = world) {
  const g = new THREE.Group();
  g.position.copy(pos(x, y, d));
  g.rotation.y = yaw0;
  parent.add(g);
  return g;
}
// Code-painted sky uses a restrained cool gradient, rather than a flat black clear color.
const sceneBackdrop = textureCanvas(1024, 768, (ctx, w, h) => {
  const image = ctx.createImageData(w, h),
    noise = rnd(958);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = x / w,
        v = y / h,
        low = Math.pow(v, 1.6),
        edge = Math.abs(u - 0.46) * 1.5;
      const mist =
        Math.exp(-(((u - 0.18) / 0.28) ** 2 + ((v - 0.8) / 0.23) ** 2)) * 4;
      const n = (noise() - 0.5) * 1.2,
        i = (y * w + x) * 4;
      image.data.set(
        [
          23 + u * 4 + low * 8 + mist + n,
          27 + u * 5 + low * 10 + mist + n,
          33 + u * 7 + low * 16 + mist * 1.5 + n,
          255,
        ],
        i,
      );
    }
  ctx.putImageData(image, 0, 0);
});
scene.background = sceneBackdrop;
const levels = { 3: 7.6, 2: 4.1, 1: 1.05 };

export {
  W,
  H,
  TAU,
  sceneBackdrop,
  host,
  renderer,
  scene,
  camera,
  target,
  view,
  initialView,
  updateCamera,
  world,
  yaw0,
  right,
  near,
  pos,
  rnd,
  random,
  mat,
  glowMat,
  silver,
  white,
  black,
  glass,
  tubeGlass,
  cyan,
  blue,
  violet,
  clickable,
  animated,
  labels,
  mesh,
  box,
  sphere,
  cyl,
  line,
  beam,
  ring,
  textureCanvas,
  rr,
  pool,
  softGlow,
  textSprite,
  label,
  groupAt,
  levels,
};
