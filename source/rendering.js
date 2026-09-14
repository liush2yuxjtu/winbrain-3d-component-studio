import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { W, H, renderer, scene, camera } from "./core.js";
const rt = new THREE.WebGLRenderTarget(W, H, {
  type: THREE.HalfFloatType,
  samples: 4,
});
const composer = new EffectComposer(renderer, rt);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.45, 0.62, 1.15);
composer.addPass(bloom);
composer.addPass(new OutputPass()); // Multisampling and supersampling preserve fine text and glass edges.

export { composer, bloom };
