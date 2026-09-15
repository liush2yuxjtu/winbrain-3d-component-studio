// Browser-side geometry assertions. Called by capture.mjs before exports.
export async function checkReferenceModels(page, check) {
  const report = await page.evaluate(() => {
    const expert = studio.registry.get('actor.experts').root;
    const frames = ['left', 'right'].map(side => expert.getObjectByName(`expert-v3-glasses-frame-${side}`));
    // Test actual triangles as well as the Shape metadata: no front/back cap may
    // cover the lens center. Overlaid transparent boxes cannot satisfy this.
    function centerCovered(geometry) {
      const p = geometry.attributes.position, index = geometry.index;
      for (let i = 0; i < (index?.count ?? p.count); i += 3) {
        const ids = [0,1,2].map(j => index ? index.getX(i+j) : i+j);
        const a = ids.map(j => [p.getX(j), p.getY(j), p.getZ(j)]);
        if (Math.max(...a.map(v=>v[2])) - Math.min(...a.map(v=>v[2])) > 1e-6) continue;
        const cross = (u,v) => u[0]*v[1]-u[1]*v[0];
        const c = [cross(a[0],a[1]), cross(a[1],a[2]), cross(a[2],a[0])];
        if (Math.abs(c.reduce((s,v)=>s+v,0)) < 1e-10) continue;
        if (c.every(v=>v>=-1e-8) || c.every(v=>v<=1e-8)) return true;
      }
      return false;
    }
    const holes = frames.map(f => !!f && f.geometry.parameters.shapes.holes.length === 1 && !centerCovered(f.geometry));
    const cloudRoot = studio.registry.get('data.external-data').root;
    const cloud = cloudRoot.getObjectByName('external-data-cloud-v3');
    let cloudSize = null;
    if (cloud) {
      cloud.geometry.computeBoundingBox();
      const b=cloud.geometry.boundingBox;
      cloudSize = [b.max.x-b.min.x,b.max.y-b.min.y,b.max.z-b.min.z];
    }
    return {
      holes,
      lenses: ['left','right'].every(side => expert.getObjectByName(`expert-v3-glasses-lens-${side}`)?.material.transmission > 0.8),
      cloudSize,
      cloudConstruction: cloud?.userData.construction,
      unifiedBust: expert.getObjectByName('expert-v3-bust')?.userData.construction === 'unified-chest-shoulders-sleeves',
      singleCloud: cloud?.children.length === 0,
      cloudMaterials: Array.isArray(cloud?.material) && cloud.material.length === 2,
      noCloudHalo: !cloudRoot.getObjectByName('external-data-cloud-v2-rim'),
    };
  });
  check('expert: both glasses have actual open lens apertures', report.holes.length === 2 && report.holes.every(Boolean), report);
  check('expert: transmissive lenses exist inside apertures', report.lenses);
  check('expert: shoulders and short sleeves share one surface', report.unifiedBust);
  check('cloud: closed shallow beveled extrusion', report.cloudConstruction === 'shape-driven-rounded-extrusion' && report.singleCloud && report.cloudSize[2] > 0.1 && report.cloudSize[2] < report.cloudSize[0] * 0.25, report.cloudSize);
  check('cloud: distinct face and edge materials; no duplicate halo', report.cloudMaterials && report.noCloudHalo);
}
