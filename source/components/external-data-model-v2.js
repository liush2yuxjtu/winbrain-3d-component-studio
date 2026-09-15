import * as THREE from "three";
import { createRoundedCloudSolid } from "./reference-solids.js";

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
  const geometry = createRoundedCloudSolid(shape);
  const cloud = new THREE.Mesh(geometry, [face, bevel]);
  cloud.name = "external-data-cloud-v3";
  cloud.userData.modelRevision = 3;
  cloud.userData.construction = "shape-driven-rounded-extrusion";
  cloud.rotation.y = -0.12;
  cloud.scale.setScalar(0.90);
  parent.add(cloud);
  return cloud;
}
