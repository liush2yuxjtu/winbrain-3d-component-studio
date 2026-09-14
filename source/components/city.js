import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  W,
  H,
  TAU,
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
} from "../core.js";
import { register, capture } from "../registry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
// A miniature business city. Building facades are generated windows, not photos.
function facade(seed) {
  const r = rnd(seed);
  return textureCanvas(128, 256, (c) => {
    c.fillStyle = "#27384f";
    c.fillRect(0, 0, 128, 256);
    for (let y = 10; y < 252; y += 22)
      for (let x = 8; x < 125; x += 23) {
        const v = r();
        c.fillStyle =
          v > 0.9
            ? "#bed3ea"
            : v > 0.72
              ? "#638bab"
              : v > 0.4
                ? "#3b5879"
                : "#1b2d43";
        c.fillRect(x, y, 8 + r() * 6, 5 + r() * 4);
      }
    for (let x = 0; x < 128; x += 31) {
      c.fillStyle = "#7895b026";
      c.fillRect(x, 0, 1, 256);
    }
    c.fillStyle = "#a5bed943";
    c.fillRect(0, 0, 128, 3);
  });
}
const facadeMats = Array.from({ length: 8 }, (_, i) =>
  mat(0x93abc6, {
    map: facade(750 + i),
    metalness: 0.4,
    roughness: 0.53,
    emissive: 0x2f526a,
    emissiveIntensity: 0.22,
  }),
);
const roofMat = mat(0x8293ac, { metalness: 0.55, roughness: 0.5 });
function building(parent, x, z, w, d, h, idx) {
  const m = facadeMats[idx % 8];
  const b = mesh(
    new THREE.BoxGeometry(w, h, d),
    [m, m, roofMat, m, m, m],
    parent,
  );
  b.position.set(x, h / 2, z);
  if (h > 0.55) {
    box(
      w * 0.5,
      0.055,
      d * 0.5,
      roofMat,
      new THREE.Vector3(x, h + 0.03, z),
      parent,
      0.006,
    );
    if (idx % 4 === 0)
      beam(
        new THREE.Vector3(x, h, z),
        new THREE.Vector3(x, h + 0.2, z),
        0.009,
        silver,
        parent,
      );
  }
  return b;
}
const terrainMat = mat(0x3e633d, { metalness: 0, roughness: 1 });
const trunkMat = mat(0x4a4438, { roughness: 1, metalness: 0 });
const leafMat = mat(0x234836, { roughness: 0.95, metalness: 0 });
function tree(parent, x, y, z, s = 1) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(s);
  parent.add(g);
  cyl(0.022, 0.03, 0.17, trunkMat, new THREE.Vector3(0, 0.075, 0), g);
  sphere(0.117, leafMat, new THREE.Vector3(0, 0.235, 0), g, 1, 1.3, 0.9);
  sphere(
    0.097,
    leafMat,
    new THREE.Vector3(0.012, 0.348, -0.005),
    g,
    0.85,
    1.35,
    0.87,
  );
  return g;
}

export function createCity() {
  const city = new THREE.Group();
  city.position.y = levels[1] + 0.15;
  world.add(city);
  for (let i = 0; i < 174; i++) {
    const x = (random() - 0.5) * 8.5,
      z = (random() - 0.5) * 8.3;
    const screenX = new THREE.Vector3(x, 0, z).dot(right),
      screenD = new THREE.Vector3(x, 0, z).dot(near);
    if (screenD > 1.2 && Math.abs(screenX) < 4.7) continue;
    const h = 0.17 + Math.pow(random(), 1.4) * 1.12;
    building(city, x, z, 0.15 + random() * 0.31, 0.18 + random() * 0.33, h, i);
  }
  for (let i = 0; i < 110; i++) {
    const x = (random() - 0.5) * 8.9,
      z = (random() - 0.5) * 8.7;
    tree(city, x, 0.0, z, 0.6 + random() * 0.7);
  }
  for (let i = 0; i < 9; i++) {
    const q = -4 + i;
    line(
      [new THREE.Vector3(q, 0.02, -4.4), new THREE.Vector3(q, 0.02, 4.4)],
      0xa9cee1,
      0.17,
      city,
    );
    line(
      [new THREE.Vector3(-4.5, 0.02, q), new THREE.Vector3(4.5, 0.02, q)],
      0xa9cee1,
      0.17,
      city,
    );
  }
  const assetSource = city.clone(true);
  assetSource.position.set(0, 0, 0);
  // Merge static city greenery and roofs by material, retaining every visible triangle.
  city.updateMatrixWorld(true);
  const batch = new Map(),
    toRemove = [];
  const invCity = city.matrixWorld.clone().invert();
  city.traverse((o) => {
    if (o.isMesh && !Array.isArray(o.material)) {
      const key = o.material.uuid;
      let geo = o.geometry.index
        ? o.geometry.toNonIndexed()
        : o.geometry.clone();
      geo.applyMatrix4(
        new THREE.Matrix4().multiplyMatrices(invCity, o.matrixWorld),
      );
      if (!batch.has(key))
        batch.set(key, { material: o.material, geometries: [] });
      batch.get(key).geometries.push(geo);
      toRemove.push(o);
    }
  });
  for (const o of toRemove) o.removeFromParent();
  for (const { material, geometries } of batch.values()) {
    const merged = mergeGeometries(geometries, false);
    if (merged) mesh(merged, material, city);
    for (const geo of geometries) geo.dispose();
  }

  const entry = register("city.business", [city], {
    name: "企业微缩城市",
    category: "业务对象",
    source: "components/city.js",
    rect: [307, 605, 911, 215],
  });
  // Export instanced primitive geometry; render the efficient merged geometry on the homepage.
  entry.nativeContent = assetSource;
  return city;
}
export { facadeMats, roofMat, tree };
