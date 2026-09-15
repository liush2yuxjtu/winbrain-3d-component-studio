import * as THREE from "three";

// Replace only the planar front cap with a gently convex, tessellated glass face.
// All pixels still come from exportable geometry and physical materials.
function crownFront(geometry, shape) {
  const border = shape.getPoints(24);
  const positions = [], normals = [], uvs = [], front = [], frontNormals = [];
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  const groups = geometry.groups.slice();
  geometry.clearGroups();
  function crown(v) {
    let best = Infinity, dx = 0, dy = 0;
    for (let i = 1; i < border.length; i++) {
      const a = border[i-1], b = border[i], ex = b.x-a.x, ey = b.y-a.y;
      const t = Math.max(0,Math.min(1,((v.x-a.x)*ex+(v.y-a.y)*ey)/(ex*ex+ey*ey || 1)));
      const x = v.x-a.x-t*ex, y = v.y-a.y-t*ey, d2=x*x+y*y;
      if (d2 < best) { best=d2; dx=x; dy=y; }
    }
    const d = Math.sqrt(best), height=0.028*(1-Math.exp(-d/0.055));
    const slope=0.028/0.055*Math.exp(-d/0.055), inv=d>1e-6?1/d:0;
    const normal=new THREE.Vector3(-dx*inv*slope,-dy*inv*slope,1).normalize();
    front.push(v.x,v.y,v.z+height); frontNormals.push(normal.x,normal.y,normal.z);
  }
  function split(a,b,c,level) {
    if (!level) { crown(a); crown(b); crown(c); return; }
    const ab=a.clone().add(b).multiplyScalar(0.5), bc=b.clone().add(c).multiplyScalar(0.5), ca=c.clone().add(a).multiplyScalar(0.5);
    split(a,ab,ca,level-1); split(ab,b,bc,level-1); split(ca,bc,c,level-1); split(ab,bc,ca,level-1);
  }
  for (const group of groups) {
    const start=positions.length/3;
    for (let i=group.start;i<group.start+group.count;i+=3) {
      const isFront=[i,i+1,i+2].every(j=>n.getZ(j)>0.99 && p.getZ(j)>0.09);
      if (isFront) {
        split(...[i,i+1,i+2].map(j=>new THREE.Vector3(p.getX(j),p.getY(j),p.getZ(j))),2);
      } else for (const j of [i,i+1,i+2]) {
        positions.push(p.getX(j),p.getY(j),p.getZ(j));
        normals.push(n.getX(j),n.getY(j),n.getZ(j)); uvs.push(uv.getX(j),uv.getY(j));
      }
    }
    const count=positions.length/3-start;
    if(count) geometry.addGroup(start,count,group.materialIndex);
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  const face=new THREE.BufferGeometry();
  face.setAttribute('position',new THREE.Float32BufferAttribute(front,3));
  face.setAttribute('normal',new THREE.Float32BufferAttribute(frontNormals,3));
  face.computeBoundingSphere();
  return face;
}

export function createExternalDataModelV2(parent) {
  const shape = new THREE.Shape();
  shape.moveTo(-0.28, 0.04);
  shape.lineTo(0.28, 0.04);
  shape.bezierCurveTo(0.39, 0.04, 0.455, 0.118, 0.455, 0.229);
  shape.bezierCurveTo(0.455, 0.337, 0.391, 0.409, 0.295, 0.397);
  shape.bezierCurveTo(0.292, 0.547, 0.207, 0.660, 0.049, 0.660);
  shape.bezierCurveTo(-0.106, 0.660, -0.220, 0.552, -0.224, 0.408);
  shape.bezierCurveTo(-0.363, 0.414, -0.455, 0.321, -0.455, 0.218);
  shape.bezierCurveTo(-0.455, 0.109, -0.384, 0.040, -0.28, 0.04);
  shape.closePath();
  const face = new THREE.MeshPhysicalMaterial({
    color: 0x94b6e2, metalness: 0.02, roughness: 0.30,
    transmission: 0.23, thickness: 0.15, ior: 1.32,
    opacity: 1, depthWrite: true,
    clearcoat: 0.9, clearcoatRoughness: 0.18,
    emissive: 0x386da4, emissiveIntensity: 0.12,
  });
  const bevel = new THREE.MeshPhysicalMaterial({
    color: 0xd3eaff, metalness: 0.05, roughness: 0.18,
    transmission: 0.16, thickness: 0.08, ior: 1.34,
    opacity: 1, depthWrite: true,
    clearcoat: 1, clearcoatRoughness: 0.1,
    emissive: 0x6ca8e1, emissiveIntensity: 0.22,
  });
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.14, steps: 1, curveSegments: 40,
    bevelEnabled: true, bevelSize: 0.028, bevelThickness: 0.026, bevelSegments: 8,
    material: 0, extrudeMaterial: 1,
  });
  geometry.translate(0, 0, -0.07);
  const crowned = crownFront(geometry,shape);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  const cloud = new THREE.Mesh(geometry, [face, bevel]);
  cloud.name = "external-data-cloud-v3";
  cloud.userData.modelRevision = 3;
  cloud.userData.construction = "shallow beveled extrusion with tessellated convex frosted front";
  cloud.rotation.y = -0.12;
  cloud.scale.setScalar(0.90);
  const front = new THREE.Mesh(crowned,face);
  front.name = "external-data-cloud-v3-crowned-front";
  cloud.add(front);
  parent.add(cloud);
  return cloud;
}
