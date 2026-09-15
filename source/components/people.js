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
    roughness: 0.42,
    metalness: 0.05,
    clearcoat: 0.32,
    emissive: color,
    emissiveIntensity: 0.09,
  });
  sphere(0.215, m, new THREE.Vector3(0, 0.9, 0), g, 1, 1.20, 0.98);
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
  torso.scale.z = 0.82;
  for (const s of [-1, 1]) {
    const arm = mesh(new THREE.CapsuleGeometry(0.070, 0.28, 7, 16), m, g);
    arm.position.set(s * 0.285, 0.235, 0.0);
    arm.rotation.z = -s * 0.08;
  }
  if (glasses) {
    g.scale.x *= 1.16;
    for (const x of [-0.105, 0.105]) {
      const t = mesh(
        new THREE.TorusGeometry(0.108, 0.014, 8, 40),
        glowMat(0xd8c7ff, 0.9),
        g,
      );
      t.position.set(x, 0.92, 0.175);
      t.scale.y = 0.82;
    }
    beam(
      new THREE.Vector3(-0.02, 0.92, 0.19),
      new THREE.Vector3(0.025, 0.92, 0.19),
      0.012,
      white,
      g,
    );
    beam(
      new THREE.Vector3(-0.19, 0.95, 0.1),
      new THREE.Vector3(-0.19, 0.92, 0.17),
      0.011,
      white,
      g,
    );
    beam(
      new THREE.Vector3(0.19, 0.95, 0.1),
      new THREE.Vector3(0.19, 0.92, 0.17),
      0.011,
      white,
      g,
    );
  }
  return g;
}
function characterBase(g, color, r = 0.82) {
  cyl(r, r * 0.97, 0.11, mat(color, { transparent: true, opacity: 0.35, depthWrite: false, metalness: 0.12, roughness: 0.22 }), new THREE.Vector3(0, 0.04, 0), g);
  cyl(
    r * 0.86,
    r * 0.89,
    0.045,
    mat(color, { transparent: true, opacity: 0.42, depthWrite: false }),
    new THREE.Vector3(0, 0.115, 0),
    g,
  );
  ring(r, 0.1, color, g);
  ring(r * 0.73, 0.135, color, g, 0.008);
  pool(g, 0, 0.15, 0, 2.7, color);
}

export { characterBase };
