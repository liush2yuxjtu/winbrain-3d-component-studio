import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { mat, mesh, softGlow } from "../core.js";

// Reference-driven External Data cloud.
// The original cloud() implementation remains in business-models.js as a fallback.
export function createExternalDataModelV2(parent) {
  const material = mat(0xb6d7f4, {
    metalness: 0.02,
    roughness: 0.14,
    transmission: 0.28,
    thickness: 0.22,
    ior: 1.34,
    transparent: true,
    opacity: 0.82,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    emissive: 0x5b8fbd,
    emissiveIntensity: 0.18,
  });

  const field = new MarchingCubes(48, material, false, false, 20000);
  field.isolation = 0;

  // Classic three-lobe cloud silhouette with a broad, softly rounded base.
  const lobes = [
    [-0.27, 0.25, 0.00, 0.23, 0.23, 0.16],
    [-0.02, 0.45, 0.00, 0.30, 0.32, 0.19],
    [0.25, 0.29, 0.00, 0.22, 0.22, 0.16],
    [0.00, 0.155, 0.00, 0.42, 0.135, 0.18],
  ];

  const smoothMin = (a, b, k) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  };

  for (let z = 0; z < 48; z++)
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < 48; x++) {
        const px = (x / 24 - 1) * 0.7;
        const py = (y / 24 - 1) * 0.6 + 0.35;
        const pz = (z / 24 - 1) * 0.4;
        let d = 10;
        for (const [cx, cy, cz, rx, ry, rz] of lobes) {
          const q = Math.sqrt(
            ((px - cx) / rx) ** 2 +
            ((py - cy) / ry) ** 2 +
            ((pz - cz) / rz) ** 2,
          ) - 1;
          d = smoothMin(d, q * Math.min(rx, ry, rz), 0.052);
        }
        field.setCell(x, y, z, -d);
      }

  field.update();

  const geometry = new THREE.BufferGeometry();
  for (const key of ["position", "normal"])
    geometry.setAttribute(
      key,
      new THREE.BufferAttribute(
        field.geometry.getAttribute(key).array.slice(0, field.count * 3),
        3,
      ),
    );

  geometry.scale(0.66, 0.54, 0.40);
  geometry.translate(0, 0.39, 0);
  geometry.computeBoundingSphere();
  field.geometry.dispose();

  const cloud = mesh(geometry, material, parent);
  cloud.name = "external-data-cloud-v2";
  cloud.rotation.y = -0.10;

  const rim = new THREE.MeshBasicMaterial({
    color: 0xe7f5ff,
    transparent: true,
    opacity: 0.18,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const halo = mesh(geometry.clone(), rim, parent);
  halo.name = "external-data-cloud-v2-rim";
  halo.rotation.copy(cloud.rotation);
  halo.scale.set(1.035, 1.035, 1.035);

  const glow = softGlow(
    parent,
    new THREE.Vector3(0, 0.46, -0.08),
    0.92,
    0xb9e3ff,
  );
  glow.material.opacity = 0.17;

  return cloud;
}
