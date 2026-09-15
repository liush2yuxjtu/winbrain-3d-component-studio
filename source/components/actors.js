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
import { person, characterBase } from "./people.js";
import { createRobot } from "./robot.js";
import { createRoleEmblem } from "./badges.js";
const teams = [
  { key: "Projects", x: -4, d: 0.05, color: 0x2868f2 },
  { key: "Experts", x: -1.35, d: 0.55, color: 0x7764df },
  { key: "AI Agents", x: 1.45, d: 1.45, color: 0x70d4ff },
  { key: "Employees", x: 4, d: 1.45, color: 0x32a89e },
];
export function createActors() {
  for (const t of teams) {
    capture(
      "actor." + t.key.toLowerCase().replaceAll(" ", "-"),
      {
        name: {
          Projects: "项目团队",
          Experts: "专家",
          "AI Agents": "AI 机器人",
          Employees: "员工团队",
        }[t.key],
        category: "智能角色",
        source:
          t.key === "AI Agents"
            ? "components/robot.js"
            : "components/people.js",
        version: 5,
        rect: {
          Projects: [380, 366, 186, 172],
          Experts: [581, 357, 174, 183],
          "AI Agents": [778, 357, 179, 194],
          Employees: [987, 377, 198, 177],
        }[t.key],
      },
      () => {
        const yOffset = {
          Projects: 0.09,
          Experts: 0.105,
          "AI Agents": 0.045,
          Employees: 0.055,
        }[t.key];
        const g = groupAt(t.x, levels[2] + yOffset, t.d);
        g.userData.layer = 2;
        g.userData.name = t.key;
        const frosted = t.key === "Experts" || t.key === "AI Agents" || t.key === "Employees";
        characterBase(g, t.color, t.key === "Experts" ? 0.8 : 0.83, frosted);
        if (t.key === "Projects") {
          person(g, -0.39, -0.12, t.color, 0.69);
          person(g, 0.41, -0.1, t.color, 0.65);
          person(g, 0, 0.17, t.color, 0.88);
        } else if (t.key === "Experts") {
          // Static design shows one compact expert bust centered over the base.
          person(g, 0, 0.085, t.color, 0.94, true);
        } else if (t.key === "Employees") {
          // Tighten the triangular cluster; previous spread made the silhouette too wide.
          person(g, 0.17, -0.10, t.color, 0.8);
          person(g, -0.22, 0.16, t.color, 0.72);
          person(g, 0.46, -0.21, t.color, 0.5);
        } else {
          createRobot(g);
        }
        g.traverse((o) => {
          if (o.isMesh) {
            o.userData.layer = 2;
            o.userData.name = t.key;
            clickable.push(o);
          }
        });
        const textGroup = new THREE.Group();
        textGroup.position.x = {
          Projects: -0.66,
          Experts: 0.02,
          "AI Agents": -0.42,
          Employees: -0.22,
        }[t.key];
        g.add(textGroup);
        const titleY =
          t.key === "Projects"
            ? 1.79
            : t.key === "Experts"
              ? 2.02
              : t.key === "AI Agents"
                ? 2.04
                : 1.76;
        const titleSprite = label(textGroup, t.key, 0, titleY, 0, 1.9, 0.31, {
          font: 31,
          weight: 500,
        });
        if (t.key !== "Experts") titleSprite.center.x = 0;
        const sub =
          t.key === "Projects"
            ? ["Turn goals into results"]
            : t.key === "Experts"
              ? ["Domain knowledge", "and experience"]
              : t.key === "AI Agents"
                ? ["24/7 execution", "by your side"]
                : ["Human + AI collaboration"];
        sub.forEach((str, i) => {
          const s = label(
            textGroup,
            str,
            0,
            titleY - 0.3 - i * 0.215,
            0,
            2.15,
            0.28,
            { font: 23, color: "#c2d4ed", weight: 400 },
          );
          if (t.key !== "Experts") s.center.x = 0;
        });
        const badgeHeight = {
          Projects: 1.5,
          Experts: 1.66,
          "AI Agents": 1.66,
          Employees: 1.57,
        }[t.key];
        const badge = groupAt(t.x - 0.96, levels[2] + badgeHeight, t.d - 0.18);
        const badgeGlass = frosted
          ? mat(0xc7d9ef, {
              metalness: 0.03,
              roughness: 0.44,
              transmission: 0.34,
              thickness: 0.15,
              ior: 1.33,
              transparent: true,
              opacity: 0.34,
              depthWrite: false,
              clearcoat: 0.34,
              clearcoatRoughness: 0.45,
            })
          : tubeGlass;
        box(0.37, 0.43, 0.07, badgeGlass, new THREE.Vector3(), badge, 0.065);
        createRoleEmblem(
          badge,
          t.key,
          t.key === "AI Agents" ? 0xbaa2ff : t.color,
        );
        const badgeGlow = softGlow(badge, new THREE.Vector3(), 0.7, t.color);
        badgeGlow.material.opacity = frosted ? 0.42 : 1;
      },
    );
  }
}
export { teams };
