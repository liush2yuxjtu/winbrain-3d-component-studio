import * as THREE from "three";
import { MarchingCubes } from "three/addons/objects/MarchingCubes.js";
import {
  mat,
  mesh,
  box,
  sphere,
  cyl,
  beam,
  line,
  glowMat,
  pool,
  textureCanvas,
  softGlow,
} from "../core.js";
import { plate, solidShape, outline, facePlane } from "./exhibit-geometry.js";
import { tree } from "./city.js";
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const satin = mat(0xa7bddb, {
  metalness: 0.55,
  roughness: 0.28,
  clearcoat: 0.8,
});
const chrome = mat(0xe0ecff, { metalness: 0.72, roughness: 0.16 });
const porcelain = mat(0xd7e6f8, { metalness: 0.23, roughness: 0.26 });
const recess = mat(0x24394f, { metalness: 0.45, roughness: 0.35 });
const acrylic = mat(0x789bbf, { metalness: 0.3, roughness: 0.2, clearcoat: 1 });
const glass = mat(0x9bcaf7, {
  metalness: 0.18,
  roughness: 0.11,
  transparent: true,
  opacity: 0.24,
  depthWrite: false,
});
const led = glowMat(0x67c9ff, 1.6);
const polishedCapMap = textureCanvas(512, 512, (c, w, h) => {
  const metal = c.createLinearGradient(0, 0, w, h);
  [
    [0, "#e5f2ff"],
    [0.23, "#8da7c8"],
    [0.45, "#c8def6"],
    [0.55, "#f0f7ff"],
    [0.66, "#8ca6c7"],
    [1, "#d7eaff"],
  ].forEach(([p, v]) => metal.addColorStop(p, v));
  c.fillStyle = metal;
  c.fillRect(0, 0, w, h);
  const light = c.createRadialGradient(
    w * 0.29,
    h * 0.31,
    0,
    w * 0.29,
    h * 0.31,
    w * 0.4,
  );
  light.addColorStop(0, "#ffffff");
  light.addColorStop(0.15, "#f3faffcc");
  light.addColorStop(0.5, "#dfedff55");
  light.addColorStop(1, "#d9eaff00");
  c.fillStyle = light;
  c.fillRect(0, 0, w, h);
});
const polishedCap = mat(0xdfeeff, {
  map: polishedCapMap,
  metalness: 0.14,
  roughness: 0.21,
  emissive: 0x97b4db,
  emissiveMap: polishedCapMap,
  emissiveIntensity: 0.23,
  clearcoat: 1,
});
function rim(r, y, parent, material = chrome, t = 0.009) {
  const o = mesh(new THREE.TorusGeometry(r, t, 8, 80), material, parent);
  o.rotation.x = Math.PI / 2;
  o.position.y = y;
  return o;
}
function lathe(profile, material, parent, segments = 80) {
  return mesh(
    new THREE.LatheGeometry(
      profile.map((p) => new THREE.Vector2(...p)),
      segments,
    ),
    material,
    parent,
  );
}
function statusLight(parent, x, y, z, r = 0.016) {
  sphere(r, led, V(x, y, z), parent, 1, 0.7, 0.6);
}
function contact(parent, w = 0.7, d = 0.4) {
  const p = pool(parent, 0, 0.026, 0, w * 1.5, 0x577da1);
  p.material.opacity = 0.3;
  const m = mat(0x112033, {
    metalness: 0.05,
    roughness: 0.7,
    transparent: true,
    opacity: 0.5,
  });
  const o = cyl(w / 2, w / 2, 0.015, m, V(0, 0.018, 0), parent);
  o.scale.z = d / w;
}
function portrait(g) {
  const model = new THREE.Group();
  g.add(model);
  model.rotation.y = -0.19;
  plate(0.44, 0.64, 0.16, satin, model, 0, 0.35, 0, 0.075, 0.023);
  plate(0.375, 0.566, 0.028, acrylic, model, 0, 0.35, 0.091, 0.057, 0.009);
  outline(0.381, 0.572, 0.059, 0.108, 0xcde6ff, 0.52, model, 0, 0.35);
  sphere(0.091, porcelain, V(0, 0.465, 0.161), model, 1, 1.10, 0.73);
  const s = new THREE.Shape();
  s.moveTo(-0.15, 0.133);
  s.lineTo(-0.15, 0.205);
  s.bezierCurveTo(-0.153, 0.271, -0.096, 0.298, -0.06, 0.313);
  s.quadraticCurveTo(0, 0.271, 0.06, 0.313);
  s.bezierCurveTo(0.096, 0.298, 0.153, 0.271, 0.15, 0.205);
  s.lineTo(0.15, 0.133);
  s.closePath();
  const torso = solidShape(s, 0.09, porcelain, model, 0.014);
  torso.position.set(0, -0.018, 0.168);
  torso.scale.x = 1.13;
  beam(V(-0.143, 0.136, 0.1), V(0.143, 0.136, 0.1), 0.008, chrome, model);
  contact(g, 0.45, 0.25);
}
function document(g) {
  const model = new THREE.Group();
  g.add(model);
  model.rotation.y = -0.19;
  model.rotation.z = 0.018;
  const page = new THREE.Shape();
  page.moveTo(-0.245, 0.03);
  page.lineTo(0.245, 0.03);
  page.lineTo(0.245, 0.652);
  page.lineTo(0.055, 0.842);
  page.lineTo(-0.245, 0.842);
  page.closePath();
  const back = solidShape(page, 0.055, satin, model, 0.014);
  back.position.set(0.033, 0.017, -0.07);
  const main = solidShape(page, 0.128, porcelain, model, 0.019);
  main.position.z = 0.012;
  const fold = new THREE.Shape();
  fold.moveTo(0.064, 0.829);
  fold.lineTo(0.233, 0.658);
  fold.lineTo(0.063, 0.658);
  fold.closePath();
  const flap = solidShape(fold, 0.027, satin, model, 0.008);
  flap.position.z = 0.093;
  line(
    [V(0.062, 0.825, 0.11), V(0.062, 0.653, 0.11), V(0.235, 0.653, 0.11)],
    0xe6f4ff,
    0.75,
    model,
  );
  plate(0.067, 0.022, 0.014, recess, model, -0.151, 0.674, 0.096, 0.004, 0.002);
  plate(0.025, 0.022, 0.014, recess, model, -0.089, 0.674, 0.096, 0.003, 0.002);
  const lengths = [0.285, 0.29, 0.2, 0.27];
  for (let j = 0; j < 4; j++)
    plate(
      lengths[j],
      0.032,
      0.018,
      recess,
      model,
      -0.135 + lengths[j] / 2,
      0.55 - j * 0.117,
      0.094,
      0.007,
      0.003,
    );
  plate(
    0.03,
    0.68,
    0.02,
    mat(0xf1f5ff, { metalness: 0.5 }),
    model,
    -0.232,
    0.399,
    0.078,
    0.008,
    0.003,
  );
  contact(g, 0.57, 0.28);
}
function task(g) {
  const model = new THREE.Group();
  g.add(model);
  model.rotation.y = -0.23;
  plate(0.5, 0.64, 0.18, satin, model, 0, 0.36, 0, 0.065, 0.022);
  plate(0.416, 0.542, 0.025, acrylic, model, 0, 0.36, 0.104, 0.04, 0.008);
  outline(0.419, 0.545, 0.041, 0.12, 0xc4e4ff, 0.7, model, 0, 0.36);
  const tick = new THREE.Shape();
  tick.moveTo(-0.153, 0.379);
  tick.lineTo(-0.071, 0.29);
  tick.lineTo(0.149, 0.539);
  tick.lineTo(0.182, 0.504);
  tick.lineTo(-0.068, 0.224);
  tick.lineTo(-0.188, 0.346);
  tick.closePath();
  const relief = solidShape(tick, 0.043, porcelain, model, 0.009);
  relief.geometry.scale(0.82, 0.82, 0.8);
  relief.geometry.translate(0, 0.36 * 0.18, 0);
  relief.position.z = 0.146;
  contact(g, 0.52, 0.29);
}
function database(g) {
  const barrelMap = textureCanvas(1024, 128, (c, w, h) => {
    const bands = c.createLinearGradient(0, 0, w, 0);
    [
      [0, "#38495f"],
      [0.1, "#9aadc6"],
      [0.19, "#eaf3ff"],
      [0.28, "#536681"],
      [0.42, "#25374f"],
      [0.58, "#879dbb"],
      [0.7, "#eff6ff"],
      [0.79, "#4b6080"],
      [1, "#38495f"],
    ].forEach(([p, v]) => bands.addColorStop(p, v));
    c.fillStyle = bands;
    c.fillRect(0, 0, w, h);
    const shade = c.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, "#031b3d44");
    shade.addColorStop(0.45, "#06122408");
    shade.addColorStop(1, "#e7f4ff44");
    c.fillStyle = shade;
    c.fillRect(0, 0, w, h);
  });
  const barrelMaterial = mat(0xffffff, {
    map: barrelMap,
    metalness: 0.12,
    roughness: 0.22,
    clearcoat: 1,
  });
  for (let j = 0; j < 3; j++) {
    const y = 0.035 + j * 0.425;
    const profile = [
      [0, y],
      [0.548, y],
      [0.601, y + 0.012],
      [0.625, y + 0.046667],
      [0.625, y + 0.329333],
      [0.608, y + 0.364],
      [0.56, y + 0.376],
      [0, y + 0.376],
    ];
    const barrel = lathe(profile, barrelMaterial, g);
    barrel.name = `solid-database-volume-${j + 1}`;
    rim(0.623, y + 0.037333, g, glowMat(0xc8def9, 1.05), 0.009);
    rim(0.617, y + 0.358667, g, glowMat(0xdcecff, 1.10), 0.010);
    cyl(
      0.57,
      0.57,
      0.014,
      [chrome, polishedCap, chrome],
      V(0, y + 0.378667, 0),
      g,
    );
    // Shallow concentric machining grooves catch light across a solid top cap.
    rim(
      0.48,
      y + 0.392,
      g,
      mat(0x6e8baa, { metalness: 0.6, roughness: 0.35 }),
      0.003,
    );
    rim(
      0.615,
      y + 0.08,
      g,
      mat(0x416685, { metalness: 0.38, roughness: 0.25 }),
      0.004,
    );
    for (const a of [-0.56, 0.74, 2.3]) {
      const socket = sphere(
        0.028,
        recess,
        V(Math.sin(a) * 0.626, y + 0.213333, Math.cos(a) * 0.626),
        g,
        1,
        0.7,
        0.3,
      );
      socket.rotation.y = a;
      const light = sphere(
        0.026,
        led,
        V(Math.sin(a) * 0.638, y + 0.213333, Math.cos(a) * 0.638),
        g,
        1,
        0.55,
        0.35,
      );
      light.rotation.y = a;
      const flare = softGlow(g, V(Math.sin(a) * 0.65, y + 0.213333, Math.cos(a) * 0.65), 0.16, 0x55caff);
      flare.material.opacity = 0.6;
    }
  }
  const p = pool(g, 0, 0.015, 0, 1.9, 0x7ca9e5);
  p.material.opacity = 0.42;
}
function server(g) {
  const model = new THREE.Group();
  g.add(model);
  model.rotation.y = 0.16;
  box(0.57, 0.775, 0.37, recess, V(0, 0.407, -0.035), model, 0.035);
  for (let j = 0; j < 3; j++) {
    const y = 0.155 + j * 0.253;
    const drawer = box(0.594, 0.222, 0.417, satin, V(0, y, 0), model, 0.031);
    drawer.name = `server-drawer-${j + 1}`;
    plate(0.548, 0.18, 0.025, porcelain, model, 0, y, 0.218, 0.026, 0.008);
    plate(
      0.287,
      0.043,
      0.013,
      recess,
      model,
      -0.053,
      y + 0.025,
      0.239,
      0.012,
      0.003,
    );
    plate(
      0.26,
      0.009,
      0.01,
      mat(0x7790ab),
      model,
      -0.057,
      y + 0.021,
      0.248,
      0.003,
      0.002,
    );
    const port = mesh(
      new THREE.TorusGeometry(0.033, 0.006, 8, 32),
      chrome,
      model,
    );
    port.position.set(0.193, y, 0.245);
    sphere(0.028, recess, V(0.193, y, 0.239), model, 1, 1, 0.35);
    statusLight(model, 0.193, y, 0.249, 0.014);
    for (const x of [-0.242, 0.248])
      sphere(0.008, recess, V(x, y + 0.06, 0.243), model, 1, 1, 0.25);
    for (let k = 0; k < 4; k++)
      box(
        0.004,
        0.063,
        0.011,
        recess,
        V(0.299, y, -0.108 + k * 0.041),
        model,
        0.001,
      );
  }
  contact(g, 0.66, 0.43);
}
function laptop(g) {
  const model = new THREE.Group();
  g.add(model);
  model.rotation.y = 0.17;
  const base = plate(
    0.8,
    0.5,
    0.058,
    satin,
    model,
    0,
    0.072,
    0.08,
    0.053,
    0.01,
  );
  base.rotation.x = -Math.PI / 2;
  const deck = plate(
    0.74,
    0.455,
    0.014,
    porcelain,
    model,
    0,
    0.106,
    0.08,
    0.032,
    0.004,
  );
  deck.rotation.x = -Math.PI / 2;
  const kb = new THREE.Group();
  kb.position.set(0, 0.119, -0.015);
  kb.rotation.x = -Math.PI / 2;
  model.add(kb);
  plate(0.62, 0.19, 0.009, recess, kb, 0, 0, 0, 0.015, 0.003);
  for (let row = 0; row < 4; row++)
    for (let col = 0; col < 10; col++)
      plate(
        0.047,
        0.031,
        0.009,
        mat(0x91a8c2, { metalness: 0.4, roughness: 0.35 }),
        kb,
        -0.276 + col * 0.061,
        0.065 - row * 0.043,
        0.009,
        0.006,
        0.002,
      );
  const track = plate(
    0.19,
    0.1,
    0.004,
    satin,
    model,
    0,
    0.12,
    0.229,
    0.014,
    0.001,
  );
  track.rotation.x = -Math.PI / 2;
  beam(V(-0.31, 0.14, -0.16), V(0.31, 0.14, -0.16), 0.034, chrome, model);
  const lid = new THREE.Group();
  model.add(lid);
  lid.position.set(0, 0.14, -0.17);
  lid.rotation.x = -0.15;
  plate(0.746, 0.561, 0.073, satin, lid, 0, 0.282, 0, 0.043, 0.012);
  plate(0.674, 0.467, 0.011, recess, lid, 0, 0.293, 0.043, 0.023, 0.004);
  const screen = textureCanvas(512, 350, (c, w, h) => {
    const bg = c.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, "#17354b");
    bg.addColorStop(0.6, "#0b182b");
    bg.addColorStop(1, "#16354e");
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    const light = c.createRadialGradient(340, 95, 0, 340, 95, 165);
    light.addColorStop(0, "#41adff30");
    light.addColorStop(1, "#246cff00");
    c.fillStyle = light;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#55c0ff";
    c.lineWidth = 4;
    c.shadowColor = "#3bc8ff";
    c.shadowBlur = 16;
    c.beginPath();
    c.moveTo(60, 275);
    c.lineTo(165, 253);
    c.lineTo(236, 271);
    c.lineTo(320, 135);
    c.lineTo(376, 181);
    c.lineTo(438, 83);
    c.stroke();
    c.shadowBlur = 0;
    c.fillStyle = "#b6d6ee55";
    c.fillRect(23, 24, 112, 4);
    c.fillRect(23, 36, 67, 2);
  });
  facePlane(0.653, 0.446, screen, lid, 0, 0.294, 0.05);
  sphere(0.009, recess, V(0, 0.536, 0.044), lid, 1, 1, 0.5);
  plate(0.091, 0.007, 0.004, recess, lid, 0, 0.033, 0.048, 0.002, 0.001);
  contact(g, 0.82, 0.56);
}
function cloud(g) {
  const material = mat(0x98b8de, {
    metalness: 0.26,
    roughness: 0.28,
    clearcoat: 0.6,
    clearcoatRoughness: 0.24,
  });
  const field = new MarchingCubes(48, material, false, false, 20000);
  field.isolation = 0;
  const lobes = [
    [-0.27, 0.22, 0, 0.21, 0.21, 0.16],
    [-0.08, 0.41, 0, 0.26, 0.29, 0.2],
    [0.21, 0.3, 0, 0.2, 0.21, 0.15],
    [0, 0.145, 0, 0.385, 0.12, 0.17],
  ];
  const smoothMin = (a, b, k) => {
    const h = Math.max(k - Math.abs(a - b), 0) / k;
    return Math.min(a, b) - h * h * k * 0.25;
  };
  for (let z = 0; z < 48; z++)
    for (let y = 0; y < 48; y++)
      for (let x = 0; x < 48; x++) {
        const px = (x / 24 - 1) * 0.7,
          py = (y / 24 - 1) * 0.6 + 0.35,
          pz = (z / 24 - 1) * 0.4;
        let d = 10;
        for (const [cx, cy, cz, rx, ry, rz] of lobes) {
          const q =
            Math.sqrt(
              ((px - cx) / rx) ** 2 +
                ((py - cy) / ry) ** 2 +
                ((pz - cz) / rz) ** 2,
            ) - 1;
          d = smoothMin(d, q * Math.min(rx, ry, rz), 0.05);
        }
        field.setCell(x, y, z, -d);
      }
  field.update();
  // Bake the implicit surface once into an ordinary portable mesh.
  const geometry = new THREE.BufferGeometry();
  for (const key of ["position", "normal"])
    geometry.setAttribute(
      key,
      new THREE.BufferAttribute(
        field.geometry.getAttribute(key).array.slice(0, field.count * 3),
        3,
      ),
    );
  geometry.scale(0.7, 0.6, 0.4);
  geometry.translate(0, 0.35, 0);
  geometry.computeBoundingSphere();
  field.geometry.dispose();
  const cloud = mesh(geometry, material, g);
  cloud.name = "unified-sculpted-cloud";
  cloud.rotation.y = -0.12;
  contact(g, 0.92, 0.42);
}
export function createBusinessModel(type, parent) {
  ({
    people: portrait,
    doc: document,
    task,
    data: database,
    server,
    laptop,
    cloud,
  })[type](parent);
}

const pedestalMaterials = new Map();
export function createPedestal(n, parent) {
  if (!pedestalMaterials.has(n.type)) {
    const map = textureCanvas(768, 256, (c, w, h) => {
      if (n.type === "data") {
        const plinth = c.createLinearGradient(0, 0, 0, h);
        plinth.addColorStop(0, "#273751");
        plinth.addColorStop(0.22, "#101e32");
        plinth.addColorStop(1, "#0c1421");
        c.fillStyle = plinth; c.fillRect(0, 0, w, h);
        return;
      }
      const shade = c.createLinearGradient(0, 0, 0, h);
      shade.addColorStop(0, "#647181");
      shade.addColorStop(0.17, "#3b454f");
      shade.addColorStop(0.66, "#26313c");
      shade.addColorStop(1, "#34404a");
      c.fillStyle = shade;
      c.fillRect(0, 0, w, h);
      const reflection = c.createLinearGradient(0, 0, w, 0);
      [[0, "#06132520"], [0.22, "#c5dff033"], [0.43, "#06132544"],
       [0.72, "#b1cce222"], [1, "#06132520"]].forEach(([t, color]) => reflection.addColorStop(t, color));
      c.fillStyle = reflection;
      c.fillRect(0, 0, w, h);
      for (let floor = 1; floor < 5; floor++) {
        const y = Math.round(h * floor / 5);
        c.fillStyle = "#06121eaa";
        c.fillRect(0, y, w, 4);
        c.fillStyle = "#c4d9ed42";
        c.fillRect(0, y + 4, w, 1);
      }
      for (let i = 0; i < 24; i++) {
        const x = (i * w) / 24;
        c.fillStyle = i % 3 === 0 ? "#bdd8ff10" : "#020c1d14";
        c.fillRect(x, 0, w / 24 - 1, h);
        c.fillStyle = "#a7c5ea28";
        c.fillRect(x, 0, 1, h);
        for (let j = 0; j < 8; j++)
          if ((i * 11 + j * 17) % 7 < 3) {
            c.fillStyle = (i + j) % 3 === 0 ? "#669acb77" : "#94adc03a";
            c.fillRect(x + 9, 20 + j * 26, 7 + (j % 2) * 4, 3);
          }
      }
    });
    pedestalMaterials.set(
      n.type,
      mat(0xe1e3e7, {
        map,
        metalness: 0.24,
        roughness: 0.36,
        clearcoat: 0.65,
        envMapIntensity: 0.9,
      }),
    );
  }
  const r = n.r,
    h = n.h;
  const body = lathe(
    [
      [0, 0],
      [r * 0.94, 0],
      [r, 0.035],
      [r, h - 0.055],
      [r * 0.95, h],
      [0, h],
    ],
    pedestalMaterials.get(n.type),
    parent,
    48,
  );
  body.name = "architectural-exhibit-base";
  const lawn = mesh(
    new THREE.CircleGeometry(r * 1.2, 48),
    mat(0x3a5736, { roughness: 1, metalness: 0 }),
    parent,
  );
  lawn.name = "landscaped-exhibit-footprint";
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.012;
  lawn.scale.y = 1.12;
  for (let k = 0; k < 3; k++) {
    const a = [-1.1, 0.65, 2.2][k],
      distance = r * (1.08 + 0.07 * (k % 2));
    tree(
      parent,
      Math.sin(a) * distance,
      0.02,
      Math.cos(a) * distance,
      0.52 + k * 0.1,
    );
  }
  const cap = mat(n.type === "data" ? 0x35435b : 0x8493aa, { metalness: 0.3, roughness: 0.27, clearcoat: 1 });
  cyl(r * 1.04, r * 1.055, 0.052, cap, V(0, h + 0.006, 0), parent);
  cyl(
    r * 0.99,
    r * 1.025,
    0.026,
    [chrome, cap, chrome],
    V(0, h + 0.035, 0),
    parent,
  );
  cyl(r * 0.88, r * 0.92, 0.069, glass, V(0, h + 0.077, 0), parent);
  rim(
    r * 1.034,
    h + 0.035,
    parent,
    mat(0xa6d6ff, {
      metalness: 0.25,
      roughness: 0.25,
      emissive: 0x395a89,
      emissiveIntensity: 0.25,
    }),
    0.007,
  );
  rim(r * 0.91, h + 0.111, parent, chrome, 0.006);
  const p = pool(parent, 0, h + 0.121, 0, r * 2.5, 0x6591c2);
  p.material.opacity = 0.28;
  // Inset architectural uprights and floor bands add real facade depth.
  for (let floor = 1; n.type !== "data" && floor <= 3; floor++) {
    rim(r * 1.002, h * floor / 4, parent, mat(0x6d7b8d, { metalness: 0.3, roughness: 0.45 }), 0.005);
  }
  for (let k = 0; n.type !== "data" && k < 12; k++) {
    const a = (k * Math.PI) / 6;
    const rib = box(
      0.009,
      h * 0.86,
      0.013,
      mat(0x59718a, { metalness: 0.5, roughness: 0.3 }),
      V(Math.sin(a) * r, h * 0.47, Math.cos(a) * r),
      parent,
      0.002,
    );
    rib.rotation.y = a;
  }
  return body;
}
