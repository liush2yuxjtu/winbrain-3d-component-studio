import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import { mat, mesh, softGlow } from "../core.js";

export function createReferenceCloud(parent) {
  const material = mat(0x9fc4e6, {
    metalness: 0.025,
    roughness: 0.17,
    transmission: 0.20,
    thickness: 0.20,
    ior: 1.34,
    transparent: true,
    opacity: 0.86,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: 0x315d85,
    emissiveIntensity: 0.17,
  });
  const field = new MarchingCubes(48, material, false, false, 20000);
  field.isolation = 0;
  const lobes = [
    [-0.28, 0.27, 0, 0.24, 0.23, 0.16],
    [-0.02, 0.46, 0, 0.30, 0.33, 0.19],
    [0.25, 0.31, 0, 0.22, 0.21, 0.15],
    [0.00, 0.17, 0, 0.44, 0.13, 0.17],
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
  geometry.scale(0.64, 0.52, 0.40);
  geometry.translate(0, 0.39, 0);
  geometry.computeBoundingSphere();
  field.geometry.dispose();

  const cloud = mesh(geometry, material, parent);
  cloud.name = "reference-unified-cloud";
  cloud.rotation.y = -0.10;

  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0xe3f4ff,
    transparent: true,
    opacity: 0.16,
    side: THREE.BackSide,
    depthWrite: false,
    toneMapped: false,
  });
  const halo = mesh(geometry.clone(), haloMaterial, parent);
  halo.name = "reference-cloud-rim";
  halo.rotation.copy(cloud.rotation);
  halo.scale.set(1.035, 1.035, 1.035);

  const glow = softGlow(parent, new THREE.Vector3(0, 0.48, -0.08), 0.88, 0xaedcff);
  glow.material.opacity = 0.14;
}
