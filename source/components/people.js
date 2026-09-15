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
// People are rounded, independent meshes: torso, head, shoulders, arms, glasses.
export function person(parent, x, z, color, scale = 1, glasses = false) {
  const g = new THREE.Group();
  g.position.set(x, 0.17, z);
  g.scale.setScalar(scale);
  parent.add(g);
  const m = mat(color, glasses
    ? {
        roughness: 0.36,
        metalness: 0.025,
        clearcoat: 0.48,
        clearcoatRoughness: 0.22,
        emissive: color,
        emissiveIntensity: 0.10,
      }
    : {
        roughness: 0.42,
        metalness: 0.05,
        clearcoat: 0.32,
        emissive: color,
        emissiveIntensity: 0.09,
      });
  sphere(0.215, m, new THREE.Vector3(0, 0.9, 0), g, glasses ? 1.14 : 1, 1.20, 0.98);
  cyl(0.095, 0.11, 0.075, m, new THREE.Vector3(0, 0.667, 0), g);
  const torso = mesh(
    new THREE.LatheGeometry(
      [
        [0, 0.008], [0.29, 0.008], [0.305, 0.024], [0.313, 0.09],
        [0.313, 0.20], [0.306, 0.31], [0.286, 0.42], [0.253, 0.51],
        [0.207, 0.575], [0.145, 0.621], [0.072, 0.641], [0, 0.644],
      ].map((p) => new THREE.Vector2(...p)),
      64,
    ),
    m,
    g,
  );
  torso.scale.set(glasses ? 1.06 : 1, 1, 0.82);
  if (!glasses) {
    for (const s of [-1, 1]) {
      const arm = mesh(new THREE.CapsuleGeometry(0.070, 0.28, 7, 16), m, g);
      arm.position.set(s * 0.285, 0.235, 0.0);
      arm.rotation.z = -s * 0.08;
    }
  }
  if (glasses) {
    // The reference expert is a smooth bust with unmistakable bright glasses.
    g.scale.x *= 1.08;
    const glassesMat = glowMat(0xe9f2ff, 1.18);
    for (const x of [-0.105, 0.105]) {
      const t = mesh(
        new THREE.TorusGeometry(0.108, 0.015, 8, 48),
        glassesMat,
        g,
      );
      t.position.set(x, 0.915, 0.232);
      t.scale.y = 0.78;
    }
    beam(
      new THREE.Vector3(-0.022, 0.915, 0.238),
      new THREE.Vector3(0.022, 0.915, 0.238),
      0.011,
      glassesMat,
      g,
    );
    for (const side of [-1, 1])
      beam(
        new THREE.Vector3(side * 0.194, 0.918, 0.221),
        new THREE.Vector3(side * 0.245, 0.927, 0.126),
        0.008,
        glassesMat,
        g,
      );
  }
  return g;
}
function characterBase(g, color, r = 0.82, frosted = false) {
  const outer = frosted
    ? mat(color, {
        metalness: 0.04,
        roughness: 0.42,
        transmission: 0.38,
        thickness: 0.24,
        ior: 1.34,
        transparent: true,
        opacity: 0.38,
        depthWrite: false,
        clearcoat: 0.42,
        clearcoatRoughness: 0.42,
        side: THREE.DoubleSide,
      })
    : mat(color, { transparent: true, opacity: 0.35, depthWrite: false, metalness: 0.12, roughness: 0.22 });
  const inner = frosted
    ? mat(0xbfd7f4, {
        metalness: 0.02,
        roughness: 0.5,
        transmission: 0.3,
        thickness: 0.16,
        transparent: true,
        opacity: 0.27,
        depthWrite: false,
        clearcoat: 0.3,
        clearcoatRoughness: 0.5,
      })
    : mat(color, { transparent: true, opacity: 0.42, depthWrite: false });
  const base = cyl(r, r * 0.97, 0.11, outer, new THREE.Vector3(0, 0.04, 0), g);
  if (frosted) base.name = "frosted-character-base";
  const inset = cyl(r * 0.86, r * 0.89, 0.045, inner, new THREE.Vector3(0, 0.115, 0), g);
  if (frosted) inset.name = "frosted-character-inset";
  ring(r, 0.1, color, g);
  ring(r * 0.73, 0.135, color, g, 0.008);
  const lightPool = pool(g, 0, 0.15, 0, 2.55, color);
  if (frosted) lightPool.material.opacity = 0.55;
}

export { characterBase };
