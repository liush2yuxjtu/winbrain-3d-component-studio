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
export function createColumns() {
  return capture(
    "structure.columns",
    {
      name: "玻璃支撑柱",
      category: "平台与结构",
      source: "components/columns.js",
      rect: [518, 307, 482, 407],
    },
    () => {
      // Transparent structural columns and their illuminated inner channels.
      for (const [x, d] of [
        [-2.95, 1.55],
        [0.04, 2.8],
        [2.78, 1.55],
      ]) {
        for (const [lo, hi] of [
          [levels[1], levels[2]],
          [levels[2], levels[3]],
        ]) {
          const p = pos(x, (lo + hi) / 2, d);
          box(0.24, hi - lo, 0.24, tubeGlass, p, world, 0.03);
          beam(
            pos(x - 0.06, lo, d - 0.02),
            pos(x - 0.06, hi, d - 0.02),
            0.008,
            glowMat(0x7fcaff, 0.85),
          );
          beam(
            pos(x + 0.085, lo, d + 0.08),
            pos(x + 0.085, hi, d + 0.08),
            0.004,
            cyan,
          );
          const foot = groupAt(x, lo + 0.17, d);
          cyl(0.36, 0.36, 0.045, tubeGlass, new THREE.Vector3(), foot);
          ring(0.34, 0.03, 0x76c9ff, foot, 0.008);
          pool(foot, 0, 0.04, 0, 1.3, 0x49c1ff);
        }
      }
    },
  );
}
