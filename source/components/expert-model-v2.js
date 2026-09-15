import * as THREE from "three";

// The public V2 factory remains compatible; modelRevision identifies refinements.
// Lens apertures are actual holes, not transparent boxes covering an opaque slab.
function roundedLoop(path, width, height, radius) {
  const x = -width / 2, y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);
  path.closePath();
  return path;
}
function addMesh(parent, name, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}
function tube(parent, name, points, radius, material) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
  return addMesh(parent, name, new THREE.TubeGeometry(curve, 24, radius, 8, false), material);
}
export function createExpertModelV2(parent, color = 0x7764df) {
  const expert = new THREE.Group();
  expert.name = "expert-model-v2";
  expert.userData.modelRevision = 3;
  expert.position.set(0, 0.17, 0.085);
  expert.scale.setScalar(0.94);
  parent.add(expert);

  // An opaque satin body lets the transmissive lenses see the purple face rather
  // than sample only the background behind other transmissive surfaces.
  const body = new THREE.MeshPhysicalMaterial({
    color, metalness: 0.02, roughness: 0.34,
    clearcoat: 0.7, clearcoatRoughness: 0.28,
    transmission: 0, opacity: 1, depthWrite: true,
    emissive: color, emissiveIntensity: 0.085,
  });
  const head = addMesh(expert, "expert-v3-head", new THREE.SphereGeometry(0.218, 64, 48), body, 0, 0.91, 0);
  head.scale.set(1, 1.18, 0.98);
  addMesh(expert, "expert-v3-neck", new THREE.CylinderGeometry(0.09, 0.11, 0.085, 48), body, 0, 0.673, 0);

  const profile = new THREE.SplineCurve([
    [0.29, 0.025], [0.308, 0.055], [0.31, 0.20], [0.292, 0.38],
    [0.253, 0.50], [0.194, 0.578], [0.125, 0.619], [0.075, 0.635],
  ].map(p => new THREE.Vector2(...p))).getPoints(48);
  const torsoGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, 0.025), ...profile, new THREE.Vector2(0, 0.64),
  ], 80);
  const torso = addMesh(expert, "expert-v3-bust", torsoGeometry, body);
  torso.scale.z = 0.76;
  // Sleeve tops overlap inside the shoulder volume; do not leave detached ellipsoids.
  for (const side of [-1, 1]) {
    const arm = addMesh(expert, `expert-v3-sleeve-${side}`, new THREE.SphereGeometry(1, 40, 32), body, side * 0.255, 0.282, 0);
    arm.scale.set(0.085, 0.255, 0.133);
    arm.rotation.z = -side * 0.23;
  }

  const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xe8edff, metalness: 0.03, roughness: 0.2,
    clearcoat: 1, clearcoatRoughness: 0.12,
    emissive: 0xb9bbff, emissiveIntensity: 0.24,
  });
  const lensMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xc5b6f5, metalness: 0, roughness: 0.12,
    transmission: 0.90, thickness: 0.012, ior: 1.12,
    opacity: 1, depthWrite: false, clearcoat: 0.35,
  });
  for (const side of [-1, 1]) {
    const shape = roundedLoop(new THREE.Shape(), 0.211, 0.153, 0.064);
    shape.holes.push(roundedLoop(new THREE.Path(), 0.183, 0.125, 0.051));
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.013, steps: 1, curveSegments: 16,
      bevelEnabled: true, bevelSize: 0.0025, bevelThickness: 0.003, bevelSegments: 3,
    });
    const name = side < 0 ? "left" : "right";
    const frame = addMesh(expert, `expert-v3-glasses-frame-${name}`, geometry, frameMaterial, side * 0.11, 0.928, 0.224);
    frame.userData.aperture = [0.183, 0.125];
    const lensShape = roundedLoop(new THREE.Shape(), 0.181, 0.123, 0.051);
    const lensGeometry = new THREE.ExtrudeGeometry(lensShape, {
      depth: 0.009, steps: 1, curveSegments: 16, bevelEnabled: false,
    });
    addMesh(expert, `expert-v3-glasses-lens-${name}`, lensGeometry, lensMaterial, side * 0.11, 0.928, 0.226);
    tube(expert, `expert-v3-glasses-temple-${name}`, [
      [side * 0.210, 0.957, 0.231], [side * 0.232, 0.947, 0.18], [side * 0.229, 0.935, 0.08],
    ], 0.008, frameMaterial);
  }
  tube(expert, "expert-v3-glasses-bridge", [
    [-0.025, 0.933, 0.236], [0, 0.951, 0.241], [0.025, 0.933, 0.236],
  ], 0.009, frameMaterial);
  return expert;
}
