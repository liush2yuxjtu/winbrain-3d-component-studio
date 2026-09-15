import fs from 'node:fs/promises';
import path from 'node:path';

// Inspectable, higher-resolution context renders. Scoring still uses the untouched
// 1536x1024 homepage capture and the original static design's canonical rectangles.
export async function captureTargetedEvidence(page, out) {
  const dir = path.join(out, 'reference-pass');
  await fs.mkdir(dir, {recursive: true});
  const records = [];
  for (const [id, rect] of [
    ['actor.experts', [581,357,174,183]],
    ['data.external-data', [1094,634,116,153]],
  ]) {
    const image = await page.evaluate(([id,rect]) => {
      const {camera,renderer} = winbrain;
      const oldWidth=renderer.domElement.width, oldHeight=renderer.domElement.height;
      const pixelRatio=renderer.getPixelRatio();
      try {
        camera.setViewOffset(1536,1024,...rect);
        renderer.setPixelRatio(1);
        renderer.setSize(rect[2]*4,rect[3]*4,false);
        winbrain.renderOnce();
        return renderer.domElement.toDataURL('image/png');
      } finally {
        camera.clearViewOffset();
        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(oldWidth/pixelRatio,oldHeight/pixelRatio,false);
        winbrain.renderOnce();
      }
    }, [id,rect]);
    const file = `${id}-detail.png`;
    await fs.writeFile(path.join(dir,file), Buffer.from(image.split(',')[1],'base64'));
    records.push({id,file,rect,output:[rect[2]*4,rect[3]*4],method:'camera view offset, existing scene and postprocessing; inspection only, not used for scoring'});
  }
  await fs.writeFile(path.join(dir,'capture.json'),JSON.stringify({records},null,2));
}
