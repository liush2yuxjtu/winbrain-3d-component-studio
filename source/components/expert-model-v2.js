import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  mat,
  glowMat,
  mesh,
  sphere,
  cyl,
  beam,
  softGlow,
} from "../core.js";

// Reference-driven Expert model.
// The legacy human generator stays in people.js for comparison / rollback.
export function createExpertModelV2(parent, color = 0x7764df) {
  const expert = new THREE.Group();
  expert.name = "expert-model-v2";
  expert.position.set(0, 0.17, 0.085);
  expert.scale.setScalar(0.94);
  parent.add(expert);

  const body = mat(color, {
    metalness: 0.03,
    roughness: 0.18,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    transmission: 0.08,
    transparent: true,
    opacity: 0.94,
    emissive: color,
    emissiveIntensity: 0.07,
  });

  const head = sphere(
    0.218,
    body,
    new THREE.Vector3(0, 0.91, 0),
    expert,
    1,
    1.18,
    0.98,
  );
  head.name = "expert-v2-head";

  const neck = cyl(
    0.09,
    0.105,
    0.075,
    body,
    new THREE.Vector3(0, 0.675, 0),
    expert,
  );
  neck.name = "expert-v2-neck";

  // One continuous bust instead of torso + detached arm capsules.
  const torso = mesh(
    new THREE.LatheGeometry(
      [
        [0.0, 0.015],
        [0.30, 0.015],
        [0.33, 0.045],
        [0.34, 0.13],
        [0.335, 0.25],
        [0.31, 0.39],
        [0.27, 0.50],
        [0.21, 0.58],
        [0.145, 0.625],
        [0.07, 0.646],
        [0.0, 0.65],
      ].map(([x, y]) => new THREE.Vector2(x, y)),
      64,
    ),
    body,
    expert,
  );
  torso.name = "expert-v2-continuous-bust";
  torso.scale.z = 0.80;

  const frame = mat(0xf3f7ff, {
    metalness: 0.04,
    roughness: 0.10,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    emissive: 0xcbd9ff,
    emissiveIntensity: 0.32,
  });
  const lens = mat(0xa88cf8, {
    metalness: 0.01,
    roughness: 0.06,
    transmission: 0.36,
    thickness: 0.03,
    ior: 1.38,
    transparent: true,
    opacity: 0.30,
    depthWrite: false,
    clearcoat: 1,
    clearcoatRoughness: 0.04,
  });

  for (const side of [-1, 1]) {
    const x = side * 0.105;
    const outer = mesh(
      new RoundedBoxGeometry(0.235, 0.165, 0.035, 4, 0.052),
      frame,
      expert,
    );
    outer.name = `expert-v2-glasses-frame-${side < 0 ? "left" : "right"}`;
    outer.position.set(x, 0.925, 0.205);

    // A slightly larger forward lens visually cuts the solid frame into a bright rim.
    const inner = mesh(
      new RoundedBoxGeometry(0.195, 0.125, 0.038, 4, 0.042),
      lens,
      expert,
    );
    inner.name = `expert-v2-glasses-lens-${side < 0 ? "left" : "right"}`;
    inner.position.set(x, 0.925, 0.225);
  }

  beam(
    new THREE.Vector3(-0.018, 0.925, 0.226),
    new THREE.Vector3(0.018, 0.925, 0.226),
    0.012,
    frame,
    expert,
  ).name = "expert-v2-glasses-bridge";

  for (const side of [-1, 1]) {
    beam(
      new THREE.Vector3(side * 0.205, 0.938, 0.205),
      new THREE.Vector3(side * 0.245, 0.925, 0.08),
      0.009,
      frame,
      expert,
    ).name = `expert-v2-glasses-temple-${side < 0 ? "left" : "right"}`;
  }

  const glow = softGlow(
    expert,
    new THREE.Vector3(0, 0.72, -0.05),
    1.15,
    color,
  );
  glow.material.opacity = 0.18;

  return expert;
}
