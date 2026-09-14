import * as THREE from "three";
import { mesh, line } from "../core.js";
// Front is +Z. Rounded corners are independent of the model's thickness.
export function roundedShape(w, h, r) {
  const s = new THREE.Shape(),
    x = -w / 2,
    y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function extrudedGeometry(shape, depth, bevel) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(0.002, depth - bevel * 2),
    steps: 1,
    curveSegments: 20,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
  });
  geometry.translate(0, 0, -depth / 2 + bevel);
  return geometry;
}
export function solidShape(shape, depth, material, parent, bevel = 0.016) {
  return mesh(extrudedGeometry(shape, depth, bevel), material, parent);
}
const plateGeometries = new Map();
export function plate(
  w,
  h,
  depth,
  material,
  parent,
  x = 0,
  y = 0,
  z = 0,
  r = 0.05,
  bevel = 0.01,
) {
  bevel = Math.min(bevel, w / 4, h / 4, depth / 3);
  r = Math.min(r, w / 2, h / 2);
  const key = [w, h, depth, r, bevel].join(":");
  if (!plateGeometries.has(key))
    plateGeometries.set(
      key,
      extrudedGeometry(
        roundedShape(w - bevel * 2, h - bevel * 2, Math.max(0.0001, r - bevel)),
        depth,
        bevel,
      ),
    );
  // Shared geometry preserves independently editable meshes while avoiding a
  // duplicate vertex buffer for every keyboard key and repeated widget.
  const o = mesh(plateGeometries.get(key), material, parent);
  o.position.set(x, y, z);
  return o;
}
export function outline(w, h, r, z, color, opacity, parent, x = 0, y = 0) {
  return line(
    roundedShape(w, h, r)
      .getPoints(16)
      .map((p) => new THREE.Vector3(p.x + x, p.y + y, z)),
    color,
    opacity,
    parent,
  );
}
export function facePlane(w, h, map, parent, x = 0, y = 0, z = 0, opacity = 1) {
  const o = mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      opacity,
      depthWrite: false,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
    }),
    parent,
  );
  o.position.set(x, y, z);
  return o;
}
