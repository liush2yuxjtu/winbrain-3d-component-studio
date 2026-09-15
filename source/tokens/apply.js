import * as THREE from "three";
import {
  renderer,
  scene,
  camera,
  target,
  view,
  initialView,
  updateCamera,
  silver,
  white,
  black,
  glass,
  tubeGlass,
  levels,
} from "../core.js";
import { TOKENS, hex } from "./tokens.js";

function setPhysical(material, values) {
  for (const [key, value] of Object.entries(values)) {
    if (key in material) material[key] = value;
  }
  material.needsUpdate = true;
}

function setDirectional(light, token) {
  light.color.setHex(hex(token.color));
  light.intensity = token.intensity;
  light.position.set(...token.position);
}

export function applyDesignTokens() {
  renderer.setClearColor(hex(TOKENS.color.sceneClear), 0);
  renderer.toneMappingExposure = TOKENS.rendering.toneMappingExposure;
  scene.environmentIntensity = TOKENS.rendering.environmentIntensity;

  const ortho = TOKENS.camera.ortho;
  camera.left = ortho.left;
  camera.right = ortho.right;
  camera.top = ortho.top;
  camera.bottom = ortho.bottom;
  camera.near = ortho.near;
  camera.far = ortho.far;
  target.set(...TOKENS.camera.target);
  Object.assign(view, {
    yaw: TOKENS.camera.yaw,
    pitch: TOKENS.camera.pitch,
    zoom: TOKENS.camera.zoom,
  });
  Object.assign(initialView, view);
  updateCamera();

  const hemi = scene.children.find((node) => node.isHemisphereLight);
  if (hemi) {
    hemi.color.setHex(hex(TOKENS.lighting.hemisphere.sky));
    hemi.groundColor.setHex(hex(TOKENS.lighting.hemisphere.ground));
    hemi.intensity = TOKENS.lighting.hemisphere.intensity;
  }
  const directionals = scene.children.filter((node) => node.isDirectionalLight);
  if (directionals[0]) setDirectional(directionals[0], TOKENS.lighting.key);
  if (directionals[1]) setDirectional(directionals[1], TOKENS.lighting.rim);
  if (directionals[2]) setDirectional(directionals[2], TOKENS.lighting.front);

  silver.color.setHex(hex(TOKENS.color.silver));
  setPhysical(silver, TOKENS.material.silver);
  white.color.setHex(hex(TOKENS.color.white));
  setPhysical(white, TOKENS.material.white);
  black.color.setHex(hex(TOKENS.color.black));

  glass.color.setHex(hex(TOKENS.color.glass));
  setPhysical(glass, TOKENS.material.glass);
  glass.side = THREE.DoubleSide;
  glass.transparent = true;
  glass.depthWrite = false;

  tubeGlass.color.setHex(hex(TOKENS.color.tubeGlass));
  setPhysical(tubeGlass, TOKENS.material.tubeGlass);
  tubeGlass.transparent = true;
  tubeGlass.depthWrite = false;

  levels[3] = TOKENS.layers.applicationY;
  levels[2] = TOKENS.layers.intelligenceY;
  levels[1] = TOKENS.layers.dataY;
}
