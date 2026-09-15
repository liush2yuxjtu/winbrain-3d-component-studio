from pathlib import Path
import subprocess
root=Path(__file__).resolve().parents[2]
p=root/'source/components'
# Start from the known-good opaque screen implementation and preserve its depth behavior.
s=subprocess.check_output(['git','show','bc2a884927706d66fe107d8c0c2c2b7af81ba853:source/components/applications.js'],cwd=root,text=True)
s=s.replace('import { appIcon }','import { SCREEN_PALETTE } from "./application-palette.js";\nimport { appIcon }')
s=s.replace('version: 4','version: 5').replace('color: 0x29354d,','color: SCREEN_PALETTE[s.kind],')
s=s.replace('  plate(\n    s.w - 0.048,','  const backing = plate(\n    s.w - 0.048,')
s=s.replace('  const sheen = textureCanvas','  backing.name = "smoke-backing";\n  const sheen = textureCanvas')
s=s.replace('const darkWidget = mat(0x17233d, { metalness: 0.3, roughness: 0.25 });','const darkWidget = mat(0x46516d, { metalness: 0.12, roughness: 0.38 });')
s=s.replace('mat(0x546783, {','mat(0x61738b, {')
s=s.replace('emissive: 0x8c9cb9,\n  emissiveIntensity: 0.18,','emissive: 0xb8c5dc,\n  emissiveIntensity: 0.30,')
(p/'applications.js').write_text(s)
(p/'application-palette.js').write_text('export const SCREEN_PALETTE = { chat: 0x2c3142, workbench: 0x202839, integrations: 0x2c3142 };\n')
# A plain dark central plinth matches the database display, rather than repeating facade ribs.
f=p/'business-models.js';s=f.read_text()
s=s.replace('    const map = textureCanvas(768, 256, (c, w, h) => {','''    const map = textureCanvas(768, 256, (c, w, h) => {
      if (n.type === "data") {
        const plinth = c.createLinearGradient(0, 0, 0, h);
        plinth.addColorStop(0, "#273751");
        plinth.addColorStop(0.22, "#101e32");
        plinth.addColorStop(1, "#0c1421");
        c.fillStyle = plinth; c.fillRect(0, 0, w, h);
        return;
      }''')
s=s.replace('for (let floor = 1; floor <= 3; floor++) {','for (let floor = 1; n.type !== "data" && floor <= 3; floor++) {')
s=s.replace('for (let k = 0; k < 12; k++) {','for (let k = 0; n.type !== "data" && k < 12; k++) {')
f.write_text(s)
f=p/'data-objects.js';s=f.read_text().replace('import { groupAt, levels, label, clickable }','import { groupAt, levels, label, clickable, mat }')
s=s.replace('import { dataNodes }','import { plate } from "./exhibit-geometry.js";\nimport { dataNodes }')
s=s.replace('{ font: 27, weight: 400 },','{ font: n.type === "data" ? 29 : 27, weight: n.type === "data" ? 500 : 400 },')
s=s.replace('        if (n.type === "data") {','''        if (n.type === "data") {
          const captionPanel = plate(2.54, 0.54, 0.028,
            mat(0x131e2e, { metalness: 0, roughness: 1, transparent: true, opacity: 0.94, depthWrite: false }),
            g, 0, 0.255, n.r + 0.17, 0.12, 0.004);
          captionPanel.name = "database-caption-panel";''')
f.write_text(s)
f=p/'platforms.js';s=f.read_text().replace('mat(0xb9bdca, { transparent: true, opacity: 0.07','mat(0xaabbd8, { transparent: true, opacity: 0.10');f.write_text(s)
f=root/'source/review/capture.mjs';s=f.read_text().replace("const browser = await chromium.launch", "await import('./calibrate-apps.mjs');\nconst browser = await chromium.launch");f.write_text(s)
f=root/'source/review/README.md';s=f.read_text();s+='\nScreen backing colors are calibrated against 16 fixed sRGB candidates before capture. Only material colors change; camera, geometry, reference and text remain fixed. Scores and all candidates are in `asset-review/palette-calibration.json`; the final joint render is measured again independently. Regular `npm run build` uses the committed palette and requires no browser or calibration step.\n';f.write_text(s)
print('Prepared measured palette calibration and database plinth.')
