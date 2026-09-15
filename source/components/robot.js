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
import { plate, outline } from "./exhibit-geometry.js";
import { register, capture } from "../registry.js";
export function createRobot(parent) {
  const robot = new THREE.Group();
  robot.position.y = 0.13;
  robot.scale.set(1.07, 0.92, 1);
  robot.name = "Aster • ceramic assistant v2";
  parent.add(robot);
  cyl(0.34, 0.44, 0.14, white, new THREE.Vector3(0, 0.07, 0), robot);
  sphere(0.35, white, new THREE.Vector3(0, 0.28, 0), robot, 1, 0.75, 0.9);
  cyl(0.13, 0.16, 0.2, silver, new THREE.Vector3(0, 0.48, 0), robot);
  const ceramic = mat(0xe1eafa, { roughness: 0.34, metalness: 0.06, clearcoat: 0.45 });
  const head = plate(0.78, 0.66, 0.56, ceramic, robot, 0, 0.88, 0, 0.22, 0.025);
  head.name = "rounded-ceramic-head";
  const face = plate(0.61, 0.43, 0.095, black, robot, 0, 0.88, 0.284, 0.17, 0.012);
  face.name = "rounded-inset-visor";
  for (const sx of [-1, 1]) {
    sphere(
      0.046,
      glowMat(0x4aaeff, 3),
      new THREE.Vector3(sx * 0.14, 0.89, 0.34),
      robot,
      1,
      1.8,
      0.6,
    );
    sphere(
      0.11,
      silver,
      new THREE.Vector3(sx * 0.44, 0.87, 0.01),
      robot,
      0.62,
      1.65,
      1,
    );
  }
  const mouth = new THREE.EllipseCurve(
    0,
    0,
    0.085,
    0.045,
    Math.PI,
    TAU,
    false,
    0,
  )
    .getPoints(20)
    .map((p) => new THREE.Vector3(p.x, 0.81 + p.y, 0.344));
  line(mouth, 0x549bff, 1, robot);
  beam(
    new THREE.Vector3(0, 1.2, 0),
    new THREE.Vector3(0.02, 1.43, 0),
    0.025,
    silver,
    robot,
  );
  sphere(0.05, glowMat(0xb2ddff, 1.6), new THREE.Vector3(0.02, 1.43, 0), robot);
  for (const side of [-1, 1]) {
    const arm = mesh(
      new THREE.CapsuleGeometry(0.07, 0.2, 6, 16),
      silver,
      robot,
    );
    arm.position.set(side * 0.34, 0.3, 0.005);
    arm.rotation.z = side * 0.22;
    sphere(
      0.075,
      white,
      new THREE.Vector3(side * 0.375, 0.175, 0.035),
      robot,
      0.85,
      1.2,
      1,
    );
    sphere(
      0.049,
      glowMat(0x67cfff, 1.25),
      new THREE.Vector3(side * 0.465, 0.87, 0.068),
      robot,
      0.35,
      1.4,
      0.65,
    );
  }
  ring(0.135, 0.535, 0x8cdeff, robot, 0.009);
  box(
    0.105,
    0.038,
    0.024,
    cyan,
    new THREE.Vector3(0, 0.28, 0.31),
    robot,
    0.014,
  );
  outline(0.612, 0.432, 0.17, 0.338, 0x7192c1, 0.52, robot, 0, 0.88);
  animated.push({ object: robot, kind: "robot", base: robot.position.y });
  return robot;
}
