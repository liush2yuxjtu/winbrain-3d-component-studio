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
  robot.position.y = 0.11;
  // The static reference reads as a compact assistant, not a wide toy robot.
  robot.scale.set(0.96, 0.86, 0.94);
  robot.name = "Aster • ceramic assistant v3";
  parent.add(robot);
  const ceramic = mat(0xdbe8f5, {
    roughness: 0.38,
    metalness: 0.04,
    clearcoat: 0.38,
    clearcoatRoughness: 0.34,
  });
  const frostedWhite = mat(0xcfe0f2, {
    roughness: 0.46,
    metalness: 0.02,
    transmission: 0.16,
    thickness: 0.13,
    transparent: true,
    opacity: 0.82,
    clearcoat: 0.26,
    clearcoatRoughness: 0.44,
  });
  cyl(0.31, 0.405, 0.13, frostedWhite, new THREE.Vector3(0, 0.065, 0), robot);
  sphere(0.325, frostedWhite, new THREE.Vector3(0, 0.265, 0), robot, 1, 0.74, 0.88);
  cyl(0.115, 0.145, 0.18, silver, new THREE.Vector3(0, 0.455, 0), robot);
  const head = plate(0.69, 0.59, 0.5, ceramic, robot, 0, 0.82, 0, 0.15, 0.022);
  head.name = "rounded-ceramic-head";
  const visorMat = mat(0x10243c, {
    roughness: 0.3,
    metalness: 0.08,
    transmission: 0.12,
    transparent: true,
    opacity: 0.92,
    clearcoat: 0.24,
  });
  const face = plate(0.52, 0.35, 0.08, visorMat, robot, 0, 0.82, 0.255, 0.115, 0.01);
  face.name = "rounded-inset-visor";
  for (const sx of [-1, 1]) {
    sphere(
      0.041,
      glowMat(0x4aaeff, 2.4),
      new THREE.Vector3(sx * 0.122, 0.83, 0.305),
      robot,
      1,
      1.65,
      0.55,
    );
    sphere(
      0.095,
      silver,
      new THREE.Vector3(sx * 0.385, 0.81, 0.01),
      robot,
      0.58,
      1.5,
      1,
    );
  }
  const mouth = new THREE.EllipseCurve(
    0,
    0,
    0.07,
    0.036,
    Math.PI,
    TAU,
    false,
    0,
  )
    .getPoints(20)
    .map((p) => new THREE.Vector3(p.x, 0.755 + p.y, 0.306));
  line(mouth, 0x549bff, 0.82, robot);
  beam(
    new THREE.Vector3(0, 1.095, 0),
    new THREE.Vector3(0.015, 1.29, 0),
    0.021,
    silver,
    robot,
  );
  sphere(0.043, glowMat(0xb2ddff, 1.35), new THREE.Vector3(0.015, 1.29, 0), robot);
  for (const side of [-1, 1]) {
    const arm = mesh(
      new THREE.CapsuleGeometry(0.064, 0.18, 6, 16),
      silver,
      robot,
    );
    arm.position.set(side * 0.305, 0.285, 0.005);
    arm.rotation.z = side * 0.19;
    sphere(
      0.068,
      ceramic,
      new THREE.Vector3(side * 0.34, 0.17, 0.03),
      robot,
      0.82,
      1.1,
      1,
    );
  }
  ring(0.122, 0.5, 0x8cdeff, robot, 0.008);
  box(
    0.095,
    0.034,
    0.021,
    cyan,
    new THREE.Vector3(0, 0.265, 0.285),
    robot,
    0.012,
  );
  outline(0.525, 0.355, 0.135, 0.3, 0x7192c1, 0.38, robot, 0, 0.82);
  animated.push({ object: robot, kind: "robot", base: robot.position.y });
  return robot;
}
