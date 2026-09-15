from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'source/components'
f=p/'business-models.js';s=f.read_text();a=s.index('    plate(\n      0.287,',s.index('function server('));b=s.index('    for (const x of [-0.242, 0.248])',a)
s=s[:a]+'''    // Upper units have a left power control and a right status slot.
    // The bottom unit has two larger round sockets, not a fourth drawer handle.
    if (j > 0) {
      plate(0.25, 0.043, 0.013, recess, model, 0.063, y + 0.025, 0.239, 0.012, 0.003);
      plate(0.23, 0.009, 0.010, mat(0x7790ab), model, 0.063, y + 0.021, 0.248, 0.003, 0.002);
    }
    for (const [index, x] of (j === 0 ? [-0.18, 0.155] : [-0.18]).entries()) {
      const port = mesh(new THREE.TorusGeometry(0.041, 0.008, 8, 40), chrome, model);
      port.name = index === 1 ? 'server-extra-port-0' : `server-power-port-${j}`;
      port.position.set(x, y, 0.245);
      sphere(0.033, recess, V(x, y, 0.239), model, 1, 1, 0.35);
      if (j === 2) statusLight(model, x, y, 0.249, 0.016);
    }
'''+s[b:];f.write_text(s)
f=p/'badges.js';s=f.read_text().replace('const material = glowMat(color, 1.2);','const material = glowMat(role === "Experts" ? 0xe8e7ff : color, role === "Experts" ? 1.08 : 1.2);')
a=s.index('    for (const angle of [0, Math.PI / 3, -Math.PI / 3])');b=s.index('  } else if (role === "AI Agents")',a)
s=s[:a]+'''    // A portrait with glasses and an open book, rather than an unrelated atom.
    const head = loop(0.061, 0.008, 0, 0.046);
    head.scale.y = 1.12;
    head.name = "expert-portrait-emblem";
    for (const x of [-0.024, 0.024]) loop(0.022, 0.005, x, 0.050).scale.y = 0.75;
    const shoulders = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.099, -0.100, 0.061),
      new THREE.Vector3(-0.087, -0.042, 0.061),
      new THREE.Vector3(-0.050, -0.014, 0.061),
      new THREE.Vector3(0, -0.041, 0.061),
      new THREE.Vector3(0.050, -0.014, 0.061),
      new THREE.Vector3(0.087, -0.042, 0.061),
      new THREE.Vector3(0.099, -0.100, 0.061),
    ]);
    mesh(new THREE.TubeGeometry(shoulders, 32, 0.008, 6, false), material, parent);
    for (const side of [-1, 1]) {
      const points = [[0,-0.076],[side*0.066,-0.049],[side*0.066,-0.103],[0,-0.125]];
      line(points.map(([x,y]) => new THREE.Vector3(x,y,0.069)), 0xe8e7ff, 0.9, parent);
    }
'''+s[b:];f.write_text(s)
# Calibration is an explicit maintenance command; normal tests use the committed palette.
f=root/'source/review/capture.mjs';s=f.read_text().replace("await import('./calibrate-apps.mjs');\n",'')
s=s.replace("  for (const asset of manifest.components) {",'''  check('server reference control layout', await page.evaluate(() => {
    const root = studio.registry.get('data.systems').root;
    return Boolean(root.getObjectByName('server-power-port-2') && root.getObjectByName('server-extra-port-0'));
  }));
  check('expert uses portrait emblem', await page.evaluate(() => Boolean(studio.registry.get('actor.experts').root.getObjectByName('expert-portrait-emblem'))));
  for (const asset of manifest.components) {''')
f.write_text(s)
f=root/'source/review/README.md';s=f.read_text().replace('Screen backing colors are calibrated against 16 fixed sRGB candidates before capture.','Screen backing colors were calibrated against 16 fixed sRGB candidates. To recalibrate deliberately, run `node source/review/calibrate-apps.mjs` with the candidate served on port 8765 before capture. Normal tests use the committed palette and do not retune colors.');f.write_text(s)
print('Corrected server controls and expert emblem; normal review uses committed palette.')
