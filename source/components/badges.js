import * as THREE from "three";
import { mesh, glowMat, sphere, line } from "../core.js";

/** Small, real geometry emblems. No image textures are used. */
export function createRoleEmblem(parent, role, color) {
  const material = glowMat(color, 1.2);
  const loop = (radius, thickness, x = 0, y = 0, angle = 0) => {
    const shape = mesh(
      new THREE.TorusGeometry(radius, thickness, 8, 32),
      material,
      parent,
    );
    shape.position.set(x, y, 0.058);
    shape.rotation.z = angle;
    return shape;
  };
  if (role === "Projects") {
    for (const x of [-1, 1])
      for (const y of [-1, 1]) {
        const shape = loop(0.054, 0.019, x * 0.059, y * 0.046, x * y * 0.65);
        shape.scale.set(1, 0.72, 1);
      }
    sphere(0.027, material, new THREE.Vector3(0, 0, 0.075), parent);
  } else if (role === "Experts") {
    for (const angle of [0, Math.PI / 3, -Math.PI / 3]) {
      const shape = loop(0.106, 0.012, 0, 0, angle);
      shape.scale.x = 0.45;
    }
    sphere(0.028, material, new THREE.Vector3(0, 0, 0.085), parent);
  } else if (role === "AI Agents") {
    loop(0.102, 0.027);
    loop(0.052, 0.015, 0, 0, 0.2).rotation.y = 0.8;
    sphere(
      0.025,
      glowMat(0xc6bcff, 1.1),
      new THREE.Vector3(0, 0, 0.083),
      parent,
    );
  } else {
    for (const angle of [-0.47, 0.47]) {
      const shape = loop(0.111, 0.019, 0, 0, angle);
      shape.scale.x = 0.42;
    }
    line(
      [new THREE.Vector3(0, -0.09, 0.085), new THREE.Vector3(0, 0.09, 0.085)],
      color,
      0.9,
      parent,
    );
  }
}
