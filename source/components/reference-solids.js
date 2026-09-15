import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

// Bake once into ordinary exportable geometry; no runtime volume shader.
function bakeField(resolution, half, center, distance) {
  const material = new THREE.MeshBasicMaterial();
  const field = new MarchingCubes(resolution, material, false, false, 80000);
  field.isolation = 0;
  for (let z=0;z<resolution;z++) for(let y=0;y<resolution;y++) for(let x=0;x<resolution;x++) {
    const px=(2*x/resolution-1)*half[0]+center[0];
    const py=(2*y/resolution-1)*half[1]+center[1];
    const pz=(2*z/resolution-1)*half[2]+center[2];
    field.setCell(x,y,z,-distance(px,py,pz,x,y));
  }
  field.update();
  if (field.count <= 0 || field.count >= 80000*3) throw new Error('Invalid implicit surface size');
  const geometry=new THREE.BufferGeometry();
  for(const key of ['position','normal']) geometry.setAttribute(key,new THREE.BufferAttribute(field.geometry.getAttribute(key).array.slice(0,field.count*3),3));
  geometry.scale(...half); geometry.translate(...center);
  geometry.computeBoundingBox(); geometry.computeBoundingSphere();
  field.geometry.dispose(); material.dispose();
  return geometry;
}
const smoothMin=(a,b,k)=> {const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*0.25;};

export function createUnifiedExpertBust() {
  return bakeField(64,[0.47,0.37,0.30],[0,0.34,0],(x,y,z)=>{
    // Lower chest is nearly straight-sided; shoulder ellipsoid rounds into the neck.
    const q=[Math.abs(x)-0.20,Math.abs(y-0.235)-0.17,Math.abs(z)-0.105];
    let d=Math.hypot(...q.map(v=>Math.max(v,0)))+Math.min(Math.max(...q),0)-0.065;
    const shoulder=(Math.hypot(x/0.278,(y-0.413)/0.22,z/0.18)-1)*0.18;
    d=smoothMin(d,shoulder,0.065);
    for(const side of [-1,1]) {
      const ax=side*0.20,ay=0.467,bx=side*0.282,by=0.102;
      const vx=bx-ax,vy=by-ay;
      const t=Math.max(0,Math.min(1,((x-ax)*vx+(y-ay)*vy)/(vx*vx+vy*vy)));
      const arm=Math.hypot(x-ax-t*vx,y-ay-t*vy,z)-0.078;
      d=smoothMin(d,arm,0.06);
    }
    return Math.max(d,0.025-y);
  });
}

export function createRoundedCloudSolid(shape) {
  const n=72, border=shape.getPoints(24), signed=new Float32Array(n*n);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const px=(2*x/n-1)*0.55,py=(2*y/n-1)*0.43+0.34;
    let best=Infinity,inside=false;
    for(let i=0,j=border.length-1;i<border.length;j=i++){
      const a=border[j],b=border[i],vx=b.x-a.x,vy=b.y-a.y;
      const t=Math.max(0,Math.min(1,((px-a.x)*vx+(py-a.y)*vy)/(vx*vx+vy*vy||1)));
      best=Math.min(best,(px-a.x-t*vx)**2+(py-a.y-t*vy)**2);
      if(((a.y>py)!==(b.y>py)) && px < (b.x-a.x)*(py-a.y)/(b.y-a.y)+a.x) inside=!inside;
    }
    signed[y*n+x]=Math.sqrt(best)*(inside?-1:1);
  }
  const geometry=bakeField(n,[0.55,0.43,0.19],[0,0.34,0],(_x,_y,z,ix,iy)=>{
    const d=signed[iy*n+ix];
    const crown=0.018*(1-Math.exp(-Math.max(-d,0)/0.07));
    const dz=Math.abs(z)-0.060-crown;
    return Math.hypot(Math.max(d,0),Math.max(dz,0))+Math.min(Math.max(d,dz),0)-0.024;
  });
  // Separate face/edge material groups on one continuous surface, with no duplicated cap.
  const positions=geometry.attributes.position,normals=geometry.attributes.normal;
  const groups=[[],[]],ngroups=[[],[]];
  for(let i=0;i<positions.count;i+=3){
    const face=(Math.abs(normals.getZ(i))+Math.abs(normals.getZ(i+1))+Math.abs(normals.getZ(i+2)))/3 > 0.86 ? 0:1;
    for(let j=i;j<i+3;j++){
      groups[face].push(positions.getX(j),positions.getY(j),positions.getZ(j));
      ngroups[face].push(normals.getX(j),normals.getY(j),normals.getZ(j));
    }
  }
  geometry.setAttribute('position',new THREE.Float32BufferAttribute([...groups[0],...groups[1]],3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute([...ngroups[0],...ngroups[1]],3));
  geometry.addGroup(0,groups[0].length/3,0);
  geometry.addGroup(groups[0].length/3,groups[1].length/3,1);
  return geometry;
}
