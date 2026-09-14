import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import {
  W,
  H,
  TAU,
  host,
  renderer,
  scene,
  camera,
  target,
  view,
  initialView,
  updateCamera,
  world,
  yaw0,
  right,
  near,
  pos,
  rnd,
  random,
  mat,
  glowMat,
  silver,
  white,
  black,
  glass,
  tubeGlass,
  cyan,
  blue,
  violet,
  clickable,
  animated,
  labels,
  mesh,
  box,
  sphere,
  cyl,
  line,
  beam,
  ring,
  textureCanvas,
  rr,
  pool,
  softGlow,
  textSprite,
  label,
  groupAt,
  levels,
} from "../core.js";
import { register, capture } from "../registry.js";
import { teams } from "./actors.js";
export function createConnections() {
  return capture(
    "structure.connections",
    {
      name: "协作光路",
      category: "平台与结构",
      source: "components/connections.js",
      rect: [414, 471, 676, 94],
    },
    () => {
      // Fine collaboration tracks and moving packets, all following 3D curves.
      for (let i = 0; i < teams.length - 1; i++) {
        const a = pos(teams[i].x, levels[2] + 0.19, teams[i].d),
          b = pos(teams[i + 1].x, levels[2] + 0.19, teams[i + 1].d);
        const mid = new THREE.Vector3().lerpVectors(a, b, 0.5);
        mid.addScaledVector(near, -0.8);
        const curve = new THREE.CatmullRomCurve3([a, mid, b]);
        line(curve.getPoints(32), 0x93d4ff, 0.7);
        const packet = sphere(0.036, glowMat(0xc3f3ff, 3), a);
        animated.push({
          object: packet,
          kind: "packet",
          curve,
          offset: i * 0.23,
        });
      }
    },
  );
}
