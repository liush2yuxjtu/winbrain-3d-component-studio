from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'source/components'
def edit(file,old,new):
    f=p/file;s=f.read_text();assert old in s, (file,old[:50]);f.write_text(s.replace(old,new))
# Smoked, neutral screens keep the depth-writing occluder from the flicker fix.
edit('applications.js','color: 0x29354d,','color: 0x202332,')
edit('applications.js','const darkWidget = mat(0x25344d, { metalness: 0.18, roughness: 0.34 });','const darkWidget = mat(0x293047, { metalness: 0.12, roughness: 0.38 });')
for old,new in [('#8b9bbb66','#70778950'),('#61739255','#3d435a38'),('#35476822','#1b213710'),('#8496ca55','#7583b84a'),('#aabbff28','#aabbff14')]: edit('applications.js',old,new)
edit('applications.js','mat(0x546783, {','mat(0x3c475e, {')
edit('applications.js','opacity: 0.36,','opacity: 0.30,')
edit('applications.js','solidShape(frame, 0.155, edge, g, 0.007)','solidShape(frame, 0.105, edge, g, 0.005)')
# Soft, continuous shoulders and short neck replace blocky stacked primitives.
f=p/'people.js';s=f.read_text();a=s.index('      [\n',s.index('new THREE.LatheGeometry'));b=s.index('      ].map',a)
s=s[:a]+'''      [
        [0, 0.008], [0.29, 0.008], [0.305, 0.024], [0.313, 0.09],
        [0.313, 0.20], [0.306, 0.31], [0.286, 0.42], [0.253, 0.51],
        [0.207, 0.575], [0.145, 0.621], [0.072, 0.641], [0, 0.644],
'''+s[b:]
s=s.replace('sphere(0.2, m, new THREE.Vector3(0, 0.9, 0), g, 1, 1.13, 0.98);','sphere(0.215, m, new THREE.Vector3(0, 0.9, 0), g, 1, 1.20, 0.98);')
s=s.replace('cyl(0.125, 0.14, 0.14, m, new THREE.Vector3(0, 0.67, 0), g);','cyl(0.095, 0.11, 0.075, m, new THREE.Vector3(0, 0.667, 0), g);')
s=s.replace('roughness: 0.48','roughness: 0.42').replace('emissiveIntensity: 0.12','emissiveIntensity: 0.09')
s=s.replace('new THREE.CapsuleGeometry(0.077, 0.29','new THREE.CapsuleGeometry(0.070, 0.28').replace('s * 0.285, 0.29','s * 0.285, 0.235')
s=s.replace('cyl(r, r * 0.97, 0.11, tubeGlass, new THREE.Vector3(0, 0.04, 0), g);','cyl(r, r * 0.97, 0.11, mat(color, { transparent: true, opacity: 0.35, depthWrite: false, metalness: 0.12, roughness: 0.22 }), new THREE.Vector3(0, 0.04, 0), g);')
f.write_text(s)
for old,new in [('0x269ef6','0x2868f2'),('0x9874f2','0x7764df'),('0x48c7c0','0x32a89e')]:edit('actors.js',old,new)
# Keep three closed database tiers, with view-independent generated reflection bands.
f=p/'business-models.js';s=f.read_text();a=s.index('function database(');b=s.index('function server(',a);c=s[a:b]
for old,new in [('#657fa2','#38495f'),('#a4bdda','#9aadc6'),('#edf5ff','#eaf3ff'),('#8aaaca','#536681'),('#587798','#25374f'),('#a7c7e5','#879dbb'),('#e8f4ff','#eff6ff'),('#748caf','#4b6080')]: c=c.replace(old,new)
c=c.replace('mat(0xc5d8ee, {','mat(0xffffff, {').replace('metalness: 0.38,\n    roughness: 0.25,','metalness: 0.12,\n    roughness: 0.22,')
c=c.replace('rim(0.611, y + 0.037333, g, chrome, 0.009);','rim(0.623, y + 0.037333, g, glowMat(0xc8def9, 1.05), 0.009);').replace('rim(0.611, y + 0.358667, g, chrome, 0.01);','rim(0.617, y + 0.358667, g, glowMat(0xdcecff, 1.10), 0.010);')
c=c.replace('light.rotation.y = a;','''light.rotation.y = a;
      const flare = softGlow(g, V(Math.sin(a) * 0.65, y + 0.213333, Math.cos(a) * 0.65), 0.16, 0x55caff);
      flare.material.opacity = 0.6;''')
s=s[:a]+c+s[b:];s=s.replace('  textureCanvas,','  textureCanvas,\n  softGlow,')
# Portrait relief projects beyond the card rather than reading as a flat icon.
s=s.replace('sphere(0.086, porcelain, V(0, 0.457, 0.14), model, 1, 1.08, 0.65);','sphere(0.091, porcelain, V(0, 0.465, 0.161), model, 1, 1.10, 0.73);')
s=s.replace('torso.position.z = 0.141;', 'torso.position.set(0, -0.018, 0.168);\n  torso.scale.x = 1.13;')
# Pedestal sides are architectural floors, not bright-topped blue barrels.
s=s.replace('shade.addColorStop(0, "#597087");','shade.addColorStop(0, "#647181");').replace('shade.addColorStop(0.17, "#324257");','shade.addColorStop(0.17, "#3b454f");').replace('shade.addColorStop(0.66, "#1e2e41");','shade.addColorStop(0.66, "#26313c");').replace('shade.addColorStop(1, "#283e4b");','shade.addColorStop(1, "#34404a");')
s=s.replace('i % 3 === 0 ? "#bdd8ff10" : "#020c1d2a"','i % 3 === 0 ? "#bdd8ff10" : "#020c1d14"')
s=s.replace('mat(0xd6e2f0, {','mat(0xe1e3e7, {')
s=s.replace('// Four inset architectural uprights add actual depth to the facade.','// Inset architectural uprights and floor bands add real facade depth.\n  for (let floor = 1; floor <= 3; floor++) {\n    rim(r * 1.002, h * floor / 4, parent, mat(0x6d7b8d, { metalness: 0.3, roughness: 0.45 }), 0.005);\n  }')
s=s.replace('  cyl(r * 1.04, r * 1.055, 0.052, satin,','  const cap = mat(n.type === "data" ? 0x35435b : 0x8493aa, { metalness: 0.3, roughness: 0.27, clearcoat: 1 });\n  cyl(r * 1.04, r * 1.055, 0.052, cap,')
s=s.replace('[chrome, polishedCap, chrome],\n    V(0, h + 0.035, 0)', '[chrome, cap, chrome],\n    V(0, h + 0.035, 0)')
f.write_text(s)
edit('data-objects.js','people: [0.96, 1.02, 1], doc: [0.90, 1, 1],','people: [1, 1.02, 1], doc: [0.96, 0.94, 1],')
# The platform's added laminate is retained, but reduce its cool blue cast.
edit('platforms.js','mat(0xaabbd8, { transparent: true, opacity: 0.10','mat(0xb9bdca, { transparent: true, opacity: 0.07')
# Make evidence discoverable from the asset card; no synthetic quality scores.
f=root/'source/build-catalog.mjs';s=f.read_text();s=s.replace('${motionLinks(e.id)}</div>','${motionLinks(e.id)}${e.version === 5 ? `<a href="asset-review/index.html#${e.id}">修复前后对照 ↗</a>` : ""}</div>');f.write_text(s)
f=root/'source/review/capture.mjs';s=f.read_text();s=s.replace("import assert from 'node:assert/strict';", "import assert from 'node:assert/strict';\nimport { execFileSync } from 'node:child_process';")
s=s.replace('  await page.close();\n  const catalog', "  await page.close();\n  execFileSync(process.execPath, ['source/build-catalog.mjs'], { cwd: root });\n  const catalog");f.write_text(s)
print('Refined smoke glass, continuous bust silhouettes, portrait relief, database reflection and architectural bases.')
