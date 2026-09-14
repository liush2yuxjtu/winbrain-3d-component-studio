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
export function createAtmosphere() {
  return capture(
    "world.atmosphere",
    {
      name: "星光、光束与薄雾",
      category: "世界环境",
      source: "components/atmosphere.js",
      rect: [280, 125, 955, 824],
    },
    () => {
      const starPos = [],
        starColors = [];
      for (let i = 0; i < 160; i++) {
        const p = pos(
          (random() - 0.5) * 36,
          (random() - 0.5) * 23 + 4,
          -18 - random() * 12,
        );
        starPos.push(p.x, p.y, p.z);
        const v = 0.22 + random() * 0.55;
        starColors.push(v * 0.62, v * 0.8, v);
      }
      const starsGeo = new THREE.BufferGeometry();
      starsGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starPos, 3),
      );
      starsGeo.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(starColors, 3),
      );
      const stars = new THREE.Points(
        starsGeo,
        new THREE.PointsMaterial({
          size: 0.01,
          vertexColors: true,
          transparent: true,
          opacity: 0.72,
          toneMapped: false,
        }),
      );
      scene.add(stars);
      const particleGeo = new THREE.BufferGeometry(),
        particlePositions = [];
      for (let i = 0; i < 340; i++) {
        const p = pos((random() - 0.5) * 11.5, random() * 8, -2 + random() * 5);
        particlePositions.push(p.x, p.y, p.z);
      }
      particleGeo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(particlePositions, 3),
      );
      world.add(
        new THREE.Points(
          particleGeo,
          new THREE.PointsMaterial({
            color: 0x6cb7ff,
            size: 0.01,
            transparent: true,
            opacity: 0.65,
            toneMapped: false,
          }),
        ),
      );
      for (let i = 0; i < 24; i++) {
        const x = (random() - 0.5) * 7,
          d = (random() - 0.5) * 3;
        const lo = -1.6 - random() * 0.25,
          hi = levels[1];
        line([pos(x, lo, d), pos(x, hi, d)], 0x5d9adf, 0.13);
        if (i % 3 === 0) {
          const o = sphere(0.019, glowMat(0x70caff, 2), pos(x, lo, d));
          animated.push({
            object: o,
            kind: "rise",
            x,
            d,
            lo,
            hi,
            offset: random(),
          });
        }
      }
      // Subtle volumetric haze behind the glass, painted entirely from the radial function.
      for (const [x, y, d, size, c] of [
        [-2, 3, -6, 9, 0x4267ba],
        [2, 5, -8, 10, 0x305794],
        [-1, -1, -5, 9, 0x689cea],
      ]) {
        const haze = softGlow(scene, pos(x, y, d), size, c);
        haze.material.opacity = 0.11;
      }
    },
  );
}
