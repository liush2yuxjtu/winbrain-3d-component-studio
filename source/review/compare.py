"""Compare original-coordinate screenshots; never register, resize or warp inputs."""
from pathlib import Path
import cv2
import numpy as np
import json, hashlib, html, importlib.util, os, subprocess
from datetime import datetime, timezone
root = Path(__file__).resolve().parents[2]
out = root / 'asset-review'
spec = importlib.util.spec_from_file_location('visual_compare', root/'visual-diff/compare.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
ref = cv2.imread(str(root/'assets/reference.png'))
before = cv2.imread(str(out/'before.png'))
after = cv2.imread(str(out/'after.png'))
assert ref.shape == before.shape == after.shape == (1024,1536,3)
assert after.std() > 10, 'Render is blank or nearly blank'
region_before = module.compare(out/'before.png')
region_after = module.compare(out/'after.png')
ssims = [module.ssim_map(ref, image) for image in (before,after)]
manifest = json.loads((root/'assets/catalog.json').read_text())
# P0/P1 review assets start at v5. New isolated replacements may advance to v6+
# and must remain in the same visual review instead of silently disappearing.
changed = [c for c in manifest['components'] if c['version'] >= 5]
assert len(changed) == 16, f'Expected 16 corrected assets, found {len(changed)}'
rows=[]
for c in changed:
    x,y,w,h=c['referenceRect']; sl=np.s_[y:y+h,x:x+w]
    scores=[]
    for image,ssim in zip((before,after),ssims):
        scores.append({'mae_rgb':round(float(cv2.absdiff(ref[sl],image[sl]).mean()),4),
                       'ssim_gray':round(float(ssim[sl].mean()),5)})
    magnitude=cv2.absdiff(cv2.GaussianBlur(ref,(0,0),3),cv2.GaussianBlur(after,(0,0),3)).mean(2)
    heat=cv2.applyColorMap(np.clip(magnitude*3,0,255).astype(np.uint8),cv2.COLORMAP_INFERNO)
    for name,image in [('reference',ref),('before',before),('after',after),('diff',heat)]:
        cv2.imwrite(str(out/f"{c['id']}-{name}.png"),image[sl])
    b,a=scores
    status=('improved' if a['mae_rgb']<b['mae_rgb'] and a['ssim_gray']>b['ssim_gray']
            else 'regressed' if a['mae_rgb']>b['mae_rgb'] and a['ssim_gray']<b['ssim_gray']
            else 'mixed')
    rows.append({'id':c['id'],'rect':[x,y,w,h],'before':b,'after':a,'status':status,
                 'measurement':'canonical full-scene context crop; includes neighboring objects'})
frozen={}
for name in ('before','after'):
    images=[cv2.imread(str(out/f'{name}-frozen-{i}.png')) for i in range(3)]
    frozen[name]=max(int(cv2.absdiff(images[0],image).max()) for image in images[1:])
assert frozen['after']==0, f'Frozen-frame instability: {frozen}'
files={}
for c in manifest['components']:
    for key in ('glb','native','preview','mockPreview'):
        f=root/c[key]
        assert f.stat().st_size > 100, str(f)
        files[c[key]]=hashlib.sha256(f.read_bytes()).hexdigest()
# The review job may merge upstream before building. GITHUB_SHA identifies the
# triggering commit, not necessarily the source tree that was actually rendered.
source_commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
result={'source_commit':source_commit,'workflow_trigger_commit':os.environ.get('GITHUB_SHA'),
        'baseline_commit':'bc2a884927706d66fe107d8c0c2c2b7af81ba853',
        'generated_at':datetime.now(timezone.utc).isoformat(),'reference_sha256':hashlib.sha256((root/'assets/reference.png').read_bytes()).hexdigest(),
        'viewport':[1536,1024],'dpr':1,'registration':'none','frozen_frame_max_delta':frozen,
        'assets':rows,'regions_before':region_before['regions'],'regions_after':region_after['regions'],'export_sha256':files}
(out/'metrics.json').write_text(json.dumps(result,indent=2))
cards=[]
for row in rows:
    id=row['id']; b=row['before']; a=row['after']
    state={'improved':'Both metrics improved; visual acceptance still required',
           'regressed':'Both metrics regressed: needs further repair',
           'mixed':'Mixed metrics: inspect visually'}[row['status']]
    pictures=''.join(f'<figure><img loading="lazy" src="{id}-{key}.png" alt="{html.escape(id)} {title}"><figcaption>{title}</figcaption></figure>' for key,title in [('reference','Reference'),('before','Before'),('after','After'),('diff','Reference vs after heatmap')])
    cards.append(f'<section id="{id}"><h2>{id}</h2><p>{state}. MAE {b["mae_rgb"]:.2f} → {a["mae_rgb"]:.2f}; SSIM {b["ssim_gray"]:.3f} → {a["ssim_gray"]:.3f}.</p><div class="shots">{pictures}</div><p><a href="../studio.html?component={id}&view=mock">Open alignment editor</a> · <a href="../previews/{id}.png">Independent 3D snapshot</a></p></section>')
page='''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>WinBrain P0/P1 asset review</title><style>*{box-sizing:border-box}body{margin:0;background:#111925;color:#eaf1fa;font:16px/1.6 system-ui,sans-serif}main{max-width:1450px;margin:auto;padding:32px 24px}h1{font-size:38px}p{color:#bdccdf}a{color:#91bdff}section{padding:22px;margin:22px 0;border:1px solid #3b4c63;border-radius:16px;background:#182333}.shots{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0;background:#101721;border-radius:8px;overflow:hidden}img{display:block;width:100%;height:240px;object-fit:contain}figcaption{padding:8px;font-size:13px}nav{display:flex;gap:20px;flex-wrap:wrap}:focus-visible{outline:3px solid #91bdff}@media(max-width:750px){.shots{grid-template-columns:1fr 1fr}main{padding:20px 14px}img{height:180px}}@media(max-width:420px){.shots{grid-template-columns:1fr}}</style></head><body><main><h1>P0/P1 asset review</h1><nav><a href="../index.html">3D homepage</a><a href="../catalog.html">Asset catalog</a><a href="metrics.json">Measured results</a><a href="verification.json">Browser checks</a></nav><p>Fresh reference / before / after / heatmap comparisons for all 16 targeted assets. Identical 1536 × 1024 viewport, DPR 1, reduced motion, fixed original camera, clean browser storage. No image registration or warping.</p><p>Important: the metrics below measure each asset's full-scene context crop, including neighboring geometry and background. They are not isolated-model similarity scores or approval percentages. Mixed results and regressions remain visible rather than being marked passed.</p>'''+''.join(cards)+'</main></body></html>'
(out/'index.html').write_text(page)
print(json.dumps({'assets':len(rows),'frozen':frozen,'source_commit':source_commit,'before':region_before['regions']['whole'],'after':region_after['regions']['whole']},indent=2))