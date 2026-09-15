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
  const m = mat(color, {
    roughness: 0.5,
    metalness: 0.03,
    clearcoat: 0.22,
    clearcoatRoughness: 0.36,
    emissive: color,
    emissiveIntensity: 0.055,
  });
  sphere(0.205, m, new THREE.Vector3(0, 0.89, 0), g, 1, 1.18, 0.96);
  cyl(0.09, 0.105, 0.065, m, new THREE.Vector3(0, 0.668, 0), g);
  const torso = mesh(
    new THREE.LatheGeometry(
      [
        [0, 0.008], [0.282, 0.008], [0.298, 0.024], [0.305, 0.09],
        [0.305, 0.20], [0.299, 0.31], [0.279, 0.42], [0.247, 0.505],
        [0.202, 0.568], [0.141, 0.612], [0.071, 0.631], [0, 0.635],
      ].map((p) => new THREE.Vector2(...p)),
      64,
    ),
    m,
    g,
  );
  torso.scale.z = 0.79;
  for (const s of [-1, 1]) {
    const arm = mesh(new THREE.CapsuleGeometry(0.066, 0.265, 7, 16), m, g);
    arm.position.set(s * 0.278, 0.232, 0.0);
    arm.rotation.z = -s * 0.07;
  }
  if (glasses) {
    // Reference expert is a compact bust; keep glasses readable without widening the whole head.
    g.scale.x *= 1.08;
    for (const x of [-0.097, 0.097]) {
      const t = mesh(
        new THREE.TorusGeometry(0.101, 0.012, 8, 40),
        glowMat(0xd8c7ff, 0.82),
        g,
      );
      t.position.set(x, 0.91, 0.169);
      t.scale.y = 0.8;
    }
    beam(
      new THREE.Vector3(-0.018, 0.91, 0.18),
      new THREE.Vector3(0.022, 0.91, 0.18),
      0.009,
      white,
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
