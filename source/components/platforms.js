import * as THREE from "three";
import {
  world,
  levels,
  yaw0,
  right,
  mat,
  mesh,
  line,
  glowMat,
  textureCanvas,
  rr,
  pool,
  clickable,
  rnd,
} from "../core.js";
import { register } from "../registry.js";
import { roundedShape } from "./exhibit-geometry.js";
const levelGroups = {};
function platform(level, scale) {
  const g = new THREE.Group();
  g.position.y = levels[level] + { 1: -0.068, 2: -0.027, 3: 0.014 }[level];
  g.position.addScaledVector(right, { 1: -0.14, 2: -0.055, 3: 0.055 }[level]);
  g.quaternion.setFromAxisAngle(
    new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2),
    { 1: -0.021, 2: -0.018, 3: -0.009 }[level],
  );
  world.add(g);
  levelGroups[level] = g;
  const padding = { 1: 0.345, 2: 0.32, 3: 0.295 }[level],
    w = 9.4 * scale + padding,
    d = 9.2 * scale + padding,
    r = 0.9,
    thickness = 0.38;
  const shape = roundedShape(w, d, r),
    geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness - 0.032,
      bevelEnabled: true,
      bevelSize: 0.018,
      bevelThickness: 0.016,
      bevelSegments: 3,
      curveSegments: 18,
      steps: 1,
    });
  geometry.translate(0, 0, -thickness / 2 + 0.016);
  const positions = geometry.attributes.position,
    uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++)
    uv.setXY(i, positions.getX(i) / w + 0.5, positions.getY(i) / d + 0.5);
  const surfaceMap = textureCanvas(512, 512, (c, W, H) => {
    const grad = c.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#99bde5");
    grad.addColorStop(0.36, "#7191c0");
    grad.addColorStop(0.62, "#657ea8");
    grad.addColorStop(1, "#abc9f0");
    c.fillStyle = grad;
    c.fillRect(0, 0, W, H);
    const rand = rnd(510 + level);
    for (let i = 0; i < 13; i++) {
      const x = rand() * W,
        y = rand() * H,
        s = 28 + rand() * 55;
      const v = c.createRadialGradient(x, y, 0, x, y, s);
      v.addColorStop(0, "#c9e9ff90");
      v.addColorStop(0.23, "#95c5ff44");
      v.addColorStop(1, "#668aff00");
      c.fillStyle = v;
      c.fillRect(x - s, y - s, s * 2, s * 2);
    }
  });
  const surface = mat(0xb7c7e1, {
    map: surfaceMap,
    metalness: 0.25,
    roughness: 0.23,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    clearcoat: 1,
  });
  const edgeMap = textureCanvas(512, 128, (c, W, H) => {
    const g = c.createLinearGradient(0, 0, 0, H);
    [
      [0, "#cbdcff"],
      [0.15, "#93accb"],
      [0.4, "#587099"],
      [0.72, "#2b3f68"],
      [0.91, "#4f6487"],
      [1, "#a2bada"],
    ].forEach(([p, v]) => g.addColorStop(p, v));
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
    for (const x of [6, 59, 167, 327, 451, 506]) {
      const light = c.createLinearGradient(x - 14, 0, x + 14, 0);
      light.addColorStop(0, "#d1e9ff00");
      light.addColorStop(0.5, "#dbedff88");
      light.addColorStop(1, "#d1e9ff00");
      c.fillStyle = light;
      c.fillRect(x - 14, 0, 28, H);
    }
  });
  for (const group of geometry.groups)
    if (group.materialIndex === 1)
      for (let i = group.start; i < group.start + group.count; i++)
        uv.setXY(
          i,
          positions.getX(i) / w + 0.5,
          (positions.getZ(i) + thickness / 2) / thickness,
        );
  const edge = mat(0xc0d4ee, {
    map: edgeMap,
    metalness: 0.25,
    roughness: 0.19,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    clearcoat: 1,
  });
  const slab = mesh(geometry, [surface, edge], g);
  slab.rotation.x = -Math.PI / 2;
  slab.userData = { layer: level, name: "Glass platform", designOpacity: [surface.opacity, edge.opacity] };
  clickable.push(slab);
  if (level === 3) {
    const laminate = mesh(
      new THREE.ShapeGeometry(roundedShape(w - 0.18, d - 0.18, r - 0.06), 24),
      mat(0xaabbd8, { transparent: true, opacity: 0.10, depthWrite: false,
        metalness: 0.08, roughness: 0.35, side: THREE.DoubleSide }), g);
    laminate.name = "application-inner-glass-laminate";
    laminate.rotation.x = -Math.PI / 2;
    laminate.position.y = -thickness * 0.16;
    const innerRim = roundedShape(w - 0.18, d - 0.18, r - 0.06).getPoints(28)
      .map((p) => new THREE.Vector3(p.x, -thickness * 0.16, -p.y));
    line(innerRim, 0xa6bce2, 0.22, g);
  }
  const contour = shape.getPoints(32);
  for (const y of [thickness / 2, -thickness / 2]) {
    const points = contour.map((p) => new THREE.Vector3(p.x, y, -p.y));
    line(points, 0xc5dcff, 0.64, g);
    mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points, true),
        192,
        0.008,
        6,
        true,
      ),
      glowMat(0xadcaff, 1.02),
      g,
    );
  }
  const inset = roundedShape(w - 0.44, d - 0.44, r - 0.13)
    .getPoints(28)
    .map((p) => new THREE.Vector3(p.x, 0.192, -p.y));
  line(inset, 0xa8c9fa, 0.08, g);
  const rand = rnd(602 + level);
  for (let i = 0; i < 6; i++) {
    const light = pool(
      g,
      (rand() - 0.5) * (w - 1),
      0.205,
      (rand() - 0.5) * (d - 1),
      2.3,
      0x96b5eb,
    );
    light.material.opacity = 0.38;
  }
  const spots = {
    3: [
      [389, 256, 1.7, 0.8],
      [458, 256, 1.5, 0.7],
      [579, 271, 1.6, 0.38],
      [896, 273, 2, 0.6],
      [951, 284, 1.7, 0.6],
      [1071, 263, 1.8, 0.65],
      [1168, 270, 1.1, 0.55],
    ],
    2: [
      [350, 510, 1.6, 0.5],
      [440, 511, 1.6, 0.42],
      [559, 482, 1.6, 0.6],
      [658, 514, 1.7, 0.32],
      [876, 532, 1.8, 0.3],
      [973, 492, 1.5, 0.6],
      [1061, 535, 1.6, 0.42],
      [1187, 531, 1.1, 0.5],
    ],
    1: [
      [315, 732, 1.5, 0.4],
      [445, 756, 1.5, 0.3],
      [673, 790, 2, 0.2],
      [985, 792, 1.6, 0.24],
      [1137, 775, 1.8, 0.32],
    ],
  }[level];
  const S = 1024 / 14,
    baseY = 512 - (levels[level] + 0.213 - 4.3) * Math.cos(0.17) * S;
  for (const [x, y, size, opacity] of spots) {
    const lateral = (x - 768) / S,
      depth = (y - baseY) / (Math.sin(0.17) * S);
    const local = new THREE.Vector3()
      .addScaledVector(right, lateral)
      .addScaledVector(
        new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2),
        depth / (level === 1 ? 1.5 : 1),
      );
    const spot = pool(g, local.x, 0.218, local.z, size, 0xc8e0ff);
    spot.material.opacity = opacity;
  }
  // The reference uses a shallower rear half. Shape the actual mesh in the
  // canonical horizontal plane, while preserving the measured front corners.
  g.updateMatrixWorld(true);
  const inverseGroup = g.matrixWorld.clone().invert(),
    nearAxis = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2),
    rearScale = { 1: 0.75, 2: 0.62, 3: 1 }[level];
  g.traverse((o) => {
    if (!o.geometry?.attributes.position) return;
    const toGroup = inverseGroup.clone().multiply(o.matrixWorld),
      toLocal = toGroup.clone().invert(),
      p = new THREE.Vector3(),
      a = o.geometry.attributes.position;
    for (let i = 0; i < a.count; i++) {
      p.fromBufferAttribute(a, i).applyMatrix4(toGroup);
      const depth = p.dot(nearAxis);
      if (depth < 0) p.addScaledVector(nearAxis, depth * (rearScale - 1));
      p.applyMatrix4(toLocal);
      a.setXYZ(i, p.x, p.y, p.z);
    }
    a.needsUpdate = true;
    if (o.isMesh) o.geometry.computeVertexNormals();
    o.geometry.computeBoundingSphere();
  });
  return g;
}
export function createPlatforms() {
  platform(1, 1);
  platform(2, 0.94);
  platform(3, 0.92);
  const floorMatrix = new THREE.Matrix4()
    .makeTranslation(
      levelGroups[1].position.x,
      levelGroups[1].position.y,
      levelGroups[1].position.z,
    )
    .multiply(
      new THREE.Matrix4().makeRotationFromQuaternion(levelGroups[1].quaternion),
    )
    .multiply(new THREE.Matrix4().makeRotationY(yaw0))
    .multiply(new THREE.Matrix4().makeScale(1, 1, 1.5))
    .multiply(new THREE.Matrix4().makeRotationY(-yaw0));
  levelGroups[1].matrix.copy(floorMatrix);
  levelGroups[1].matrixAutoUpdate = false;
  for (const level of [1, 2, 3])
    register(
      "platform." + { 1: "data", 2: "intelligence", 3: "application" }[level],
      [levelGroups[level]],
      {
        name: { 1: "数据层平台", 2: "智能层平台", 3: "应用层平台" }[level],
        category: "平台与结构",
        source: "components/platforms.js",
        version: level === 3 ? 5 : 4,
        rect: {
          1: [278, 612, 963, 278],
          2: [309, 447, 911, 185],
          3: [332, 192, 888, 176],
        }[level],
      },
    );
  return levelGroups;
}
