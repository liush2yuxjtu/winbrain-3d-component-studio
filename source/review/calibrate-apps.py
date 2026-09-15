from pathlib import Path
import json,sys,importlib.util
import cv2
root=Path(__file__).resolve().parents[2]
temp=Path(sys.argv[1]); colors=json.loads(sys.argv[2])
spec=importlib.util.spec_from_file_location('comparison',root/'visual-diff/compare.py')
mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
ref=cv2.imread(str(root/'assets/reference.png'))
manifest=json.loads((root/'assets/catalog.json').read_text())
assets=[c for c in manifest['components'] if c['id'].startswith('app.')]
results={c['id']:[] for c in assets}
for color in colors:
    image=cv2.imread(str(temp/(color+'.png')))
    assert image is not None and image.shape==ref.shape
    diff=cv2.absdiff(ref,image)
    ssim=mod.ssim_map(ref,image)
    for c in assets:
        x,y,w,h=c['referenceRect']
        mae=float(diff[y:y+h,x:x+w].mean())
        similarity=float(ssim[y:y+h,x:x+w].mean())
        results[c['id']].append({'color':'#'+color,'mae_rgb':round(mae,4),'ssim_gray':round(similarity,5),'objective':mae/255+0.5*(1-similarity)})
selected={id:min(values,key=lambda v:v['objective']) for id,values in results.items()}
# Persist measured parameters; regular builds do not need a browser or the reference.
lines=['// Backing colors calibrated at the canonical camera; see asset-review/palette-calibration.json.','export const SCREEN_PALETTE = {']
for id,row in selected.items(): lines.append('  '+id.split('.')[1]+': 0x'+row['color'][1:]+',')
lines.append('};')
(root/'source/components/application-palette.js').write_text('\n'.join(lines)+'\n')
(root/'asset-review').mkdir(exist_ok=True)
(root/'asset-review/palette-calibration.json').write_text(json.dumps({'method':'Fixed geometry and camera; 16 sRGB backing colors; minimize MAE/255 + 0.5*(1-SSIM) on the existing context crop. Final joint render is measured separately.','selected':selected,'candidates':results},indent=2))
print('Measured screen backing colors:',json.dumps(selected,indent=2))
