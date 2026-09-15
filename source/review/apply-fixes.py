from pathlib import Path
import re
p = Path(__file__).resolve().parents[1] / 'components'
if (p / 'data-layout.js').exists():
    raise SystemExit('Corrections already applied; refusing to apply twice.')
f=p/'data-objects.js'; s=f.read_text(); start=s.index('const dataNodes = ['); end=s.index('export function createDataObjects')
layout=s[start:end].replace('const dataNodes', 'export const dataNodes')
(p/'data-layout.js').write_text('// Canonical exhibit positions in screen-aligned world coordinates.\n// Shared by the model factory and the city exclusion zones.\n'+layout)
s=s[:start]+'import { dataNodes } from "./data-layout.js";\n'+s[end:]
s=s.replace('version: 4','version: 5')
s=s.replace('createBusinessModel(n.type, icon);','''createBusinessModel(n.type, icon);
        // Silhouette corrections preserve the established exhibit anchors.
        const sculptureScale = {
          people: [0.96, 1.02, 1], doc: [0.90, 1, 1],
          task: [0.96, 1.10, 1], data: [1, 1, 1],
          server: [0.96, 0.95, 1], laptop: [1, 1.08, 1],
          cloud: [0.94, 1, 1],
        }[n.type];
        icon.scale.set(...sculptureScale);''')
f.write_text(s)
f=p/'business-models.js'; s=f.read_text(); a=s.index('function database('); b=s.index('function server(')
chunk=s[a:b].replace('j < 4','j < 3').replace('0.035 + j * 0.319','0.035 + j * 0.425')
chunk=re.sub(r'y \+ (0\.\d+)',lambda m:'y + '+format(float(m[1])*1.333333,'.6f').rstrip('0').rstrip('.'),chunk)
s=s[:a]+chunk+s[b:]
needle='      for (let i = 0; i < 24; i++) {'
insert='''      const reflection = c.createLinearGradient(0, 0, w, 0);
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
'''
s=s.replace(needle,insert+needle).replace('lawn.scale.z = 1.12;', 'lawn.scale.y = 1.12;')
f.write_text(s)
f=p/'city.js'; s=f.read_text(); s=s.replace('import { mergeGeometries }', 'import { dataNodes } from "./data-layout.js";\nimport { mergeGeometries }')
a=s.index('  for (let i = 0; i < 174; i++) {'); b=s.index('  for (let i = 0; i < 9; i++) {',a)
s=s[:a]+'''  // Compatibility reservation: V4's city consumed 1053 values of the shared
  // seed-321 stream. Keep Earth and atmosphere unchanged while the city moves
  // to its own stream. Remove with a separately reviewed environment migration.
  for (let i = 0; i < 1053; i++) random();
  const cityRandom = rnd(321);
  const occupied = [];
  const clearOfExhibits = (x, z, radius) => {
    const point = new THREE.Vector3(x, 0, z);
    const lateral = point.dot(right), depth = point.dot(near);
    return dataNodes.every((n) =>
      Math.hypot(lateral - n.x, depth - n.d) > n.r * 1.22 + radius + 0.09);
  };
  // Staggered blocks retain a dense miniature skyline, with real streets and
  // reserved exhibit footprints. Rebuilding any other component cannot move it.
  for (let row = 0; row < 13; row++) {
    for (let col = 0; col < 13; col++) {
      const x = -3.95 + col * 0.65 + (cityRandom() - 0.5) * 0.14;
      const z = -3.9 + row * 0.64 + (cityRandom() - 0.5) * 0.14;
      const w = 0.20 + cityRandom() * 0.23;
      const d = 0.20 + cityRandom() * 0.25;
      const depth = new THREE.Vector3(x, 0, z).dot(near);
      const lateral = new THREE.Vector3(x, 0, z).dot(right);
      const heightNoise = cityRandom();
      if (depth > 1.2 && Math.abs(lateral) < 4.7) continue;
      if (!clearOfExhibits(x, z, Math.hypot(w, d) / 2)) continue;
      const heightEnvelope = depth < -1.2 ? 0.83 : 0.56;
      const h = 0.17 + Math.pow(heightNoise, 1.4) * heightEnvelope;
      building(city, x, z, w, d, h, row * 13 + col);
      occupied.push({ x, z, w, d });
    }
  }
  let planted = 0;
  for (let attempt = 0; attempt < 500 && planted < 100; attempt++) {
    const x = (cityRandom() - 0.5) * 8.9;
    const z = (cityRandom() - 0.5) * 8.7;
    const scale = 0.48 + cityRandom() * 0.40;
    const canopy = 0.15 * scale;
    if (!clearOfExhibits(x, z, canopy)) continue;
    if (occupied.some((b) => Math.abs(x - b.x) < b.w / 2 + canopy &&
      Math.abs(z - b.z) < b.d / 2 + canopy)) continue;
    tree(city, x, 0, z, scale);
    planted++;
  }
  city.userData.layout = { seed: 321, buildings: occupied.length, trees: planted };
'''+s[b:]
s=s.replace('source: "components/city.js",','source: "components/city.js",\n    version: 5,')
f.write_text(s)
f=p/'robot.js';s=f.read_text();s=s.replace('import { register, capture }','import { plate, outline } from "./exhibit-geometry.js";\nimport { register, capture }')
a=s.index('  const head = box(');b=s.index('  for (const sx',a)
s=s[:a]+'''  const ceramic = mat(0xe1eafa, { roughness: 0.34, metalness: 0.06, clearcoat: 0.45 });
  const head = plate(0.78, 0.66, 0.56, ceramic, robot, 0, 0.88, 0, 0.22, 0.025);
  head.name = "rounded-ceramic-head";
  const face = plate(0.61, 0.43, 0.095, black, robot, 0, 0.88, 0.284, 0.17, 0.012);
  face.name = "rounded-inset-visor";
'''+s[b:]
a=s.index('  const visorRim =');b=s.index('  animated.push',a)
s=s[:a]+'''  outline(0.612, 0.432, 0.17, 0.338, 0x7192c1, 0.52, robot, 0, 0.88);
'''+s[b:];f.write_text(s)
f=p/'people.js';s=f.read_text();s=s.replace('roughness: 0.36,\n    metalness: 0.15,','roughness: 0.48,\n    metalness: 0.05,\n    clearcoat: 0.32,').replace('emissiveIntensity: 0.17','emissiveIntensity: 0.12')
s=s.replace('[0.3, 0.08],\n        [0.3, 0.27],\n        [0.29, 0.38],\n        [0.26, 0.46],\n        [0.2, 0.53],','[0.275, 0.08],\n        [0.29, 0.27],\n        [0.315, 0.38],\n        [0.285, 0.46],\n        [0.21, 0.53],')
s=s.replace('new THREE.CapsuleGeometry(0.085, 0.31','new THREE.CapsuleGeometry(0.077, 0.29').replace('s * 0.29, 0.29','s * 0.285, 0.29');f.write_text(s)
f=p/'actors.js';f.write_text(f.read_text().replace('version: 4','version: 5'))
f=p/'applications.js';s=f.read_text().replace('version: 4','version: 5')
s=s.replace('const darkWidget = mat(0x17233d, { metalness: 0.3, roughness: 0.25 });','const darkWidget = mat(0x25344d, { metalness: 0.18, roughness: 0.34 });')
s=s.replace('gradient.addColorStop(0.36, "#3d4a6355");','gradient.addColorStop(0.36, "#61739255");').replace('gradient.addColorStop(0.8, "#1e294110");','gradient.addColorStop(0.8, "#35476822");').replace('reflection.addColorStop(1, "#aabbff14");','reflection.addColorStop(1, "#aabbff28");')
f.write_text(s)
f=p/'platforms.js';s=f.read_text();needle='  const contour = shape.getPoints(32);'
s=s.replace(needle,'''  if (level === 3) {
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
'''+needle)
s=s.replace('version: 4','version: level === 3 ? 5 : 4');f.write_text(s)
print('Updated model factories and shared layout.')
