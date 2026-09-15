import * as THREE from "three";
import {
  mat,
  mesh,
  sphere,
  glowMat,
  textureCanvas,
  rr,
  groupAt,
  levels,
  clickable,
  pool,
  line,
} from "../core.js";
import { capture } from "../registry.js";
import {
  plate,
  outline,
  facePlane,
  roundedShape,
  solidShape,
} from "./exhibit-geometry.js";
import { appIcon } from "../assets/app-icons.js";
// UI surfaces, chart bars and app tiles are separately extruded geometry.
// Canvas carries type and the glass sheen; brand artwork is embedded from official sources.
const screens = [
  {
    name: "AI Chat",
    kind: "chat",
    x: -3.13,
    w: 2.22,
    h: 1.72,
    d: -0.6,
    px: 165,
    py: 127,
    tilt: 0.004,
    rect: [450, 107, 181, 150],
  },
  {
    name: "Business Workbench",
    kind: "workbench",
    x: 0.08,
    w: 3.5,
    h: 1.92,
    d: -0.65,
    px: 258,
    py: 141,
    tilt: 0.022,
    rect: [637, 103, 275, 162],
  },
  {
    name: "Apps & Integrations",
    kind: "integrations",
    x: 3.34,
    w: 2.26,
    h: 1.9,
    d: -0.6,
    px: 167,
    py: 140,
    tilt: 0.068,
    rect: [922, 102, 184, 165],
  },
];
const edge = mat(0x91acd6, {
  metalness: 0.48,
  roughness: 0.16,
  transparent: true,
  opacity: 0.54,
  depthWrite: false,
});
const widgetGlass = mat(0x485b85, {
  metalness: 0.32,
  roughness: 0.24,
  transparent: true,
  opacity: 0.68,
});
const darkWidget = mat(0x25344d, { metalness: 0.18, roughness: 0.34 });
const iconPorcelain = mat(0xf4f7ff, {
  metalness: 0.1,
  roughness: 0.22,
  clearcoat: 1,
  emissive: 0x8c9cb9,
  emissiveIntensity: 0.18,
});
function textTexture(s, paint) {
  return textureCanvas(s.px * 4, s.py * 4, (c) => {
    c.scale(4, 4);
    c.textBaseline = "alphabetic";
    const text = (t, x, y, size = 12, color = "#c6d2e7", weight = 400) => {
      c.fillStyle = color;
      c.font = `${weight} ${size}px Roboto, Arial`;
      c.fillText(t, x, y);
    };
    paint(c, text);
  });
}
function buildScreen(s, g) {
  const xp = (x) => (x / s.px - 0.5) * s.w,
    yp = (y) => (0.5 - y / s.py) * s.h;
  const panel = (
    x,
    y,
    w,
    h,
    z = 0.1,
    depth = 0.045,
    material = widgetGlass,
    r = 4,
  ) =>
    plate(
      (w / s.px) * s.w,
      (h / s.py) * s.h,
      depth,
      material,
      g,
      xp(x + w / 2),
      yp(y + h / 2),
      z,
      (r / s.px) * s.w,
      0.004,
    );
  const frame = roundedShape(s.w - 0.015, s.h - 0.015, 0.07);
  frame.holes.push(roundedShape(s.w - 0.055, s.h - 0.055, 0.055));
  solidShape(frame, 0.155, edge, g, 0.007).name = "beveled-glass-chassis";
  plate(
    s.w - 0.048,
    s.h - 0.048,
    0.028,
    new THREE.MeshBasicMaterial({
      color: 0x29354d,
      // An opaque smoked backing writes depth before the transparent platform
      // edges render. The bevel and reflected front sheet remain translucent.
      transparent: false,
    }),
    g,
    0,
    0,
    -0.012,
    0.055,
    0.006,
  );
  const sheen = textureCanvas(512, 384, (c, w, h) => {
    const gradient = c.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, "#8b9bbb66");
    gradient.addColorStop(0.36, "#61739255");
    gradient.addColorStop(0.8, "#35476822");
    gradient.addColorStop(1, "#8496ca55");
    rr(c, 2, 2, w - 4, h - 4, 16, gradient);
    const reflection = c.createLinearGradient(0, 0, w, 0);
    reflection.addColorStop(0, "#d7edff25");
    reflection.addColorStop(0.07, "#d7edff00");
    reflection.addColorStop(0.88, "#acbeff00");
    reflection.addColorStop(1, "#aabbff28");
    rr(c, 3, 3, w - 6, h - 6, 16, reflection);
    const bounce = c.createLinearGradient(0, h * 0.55, 0, h);
    bounce.addColorStop(0, "#8dacf900");
    bounce.addColorStop(0.72, "#8caaf92c");
    bounce.addColorStop(1, "#a1b8ff65");
    rr(c, 3, 3, w - 6, h - 6, 16, bounce);
  });
  facePlane(s.w - 0.025, s.h - 0.025, sheen, g, 0, 0, 0.082);
  outline(s.w - 0.012, s.h - 0.012, 0.074, 0.086, 0xd2dcf5, 0.75, g);
  outline(s.w - 0.018, s.h - 0.018, 0.071, -0.072, 0x798ecc, 0.52, g);
  line(
    [
      new THREE.Vector3(-s.w / 2 + 0.015, -s.h / 2 + 0.06, 0.075),
      new THREE.Vector3(-s.w / 2 + 0.015, s.h / 2 - 0.07, 0.075),
    ],
    0xf2f6ff,
    0.7,
    g,
  );
  let paint;
  if (s.kind === "chat") {
    panel(
      17,
      16,
      19,
      20,
      0.113,
      0.068,
      mat(0x6799ba, { metalness: 0.3, roughness: 0.22 }),
      3,
    );
    const icon = new THREE.Group();
    g.add(icon);
    icon.position.set(xp(26.5), yp(26), 0.157);
    sphere(
      0.047,
      mat(0xdff6ff),
      new THREE.Vector3(0, 0.024, 0.012),
      icon,
      1,
      1,
      0.7,
    );
    const shoulder = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.082, -0.066, 0),
      new THREE.Vector3(-0.054, -0.025, 0.013),
      new THREE.Vector3(0, -0.055, 0.019),
      new THREE.Vector3(0.054, -0.025, 0.013),
      new THREE.Vector3(0.082, -0.066, 0),
    ]);
    mesh(
      new THREE.TubeGeometry(shoulder, 24, 0.008, 6, false),
      mat(0xdff6ff),
      icon,
    );
    panel(
      18,
      47,
      132,
      68,
      0.102,
      0.022,
      mat(0x546783, {
        metalness: 0.15,
        roughness: 0.45,
        transparent: true,
        opacity: 0.36,
      }),
      5,
    );
    outline(
      (132 / s.px) * s.w,
      (68 / s.py) * s.h,
      0.06,
      0.12,
      0x92a7d2,
      0.18,
      g,
      xp(84),
      yp(81),
    );
    panel(
      30,
      96,
      16,
      13,
      0.144,
      0.041,
      mat(0x7899bb, { metalness: 0.35, roughness: 0.25 }),
      3,
    );
    paint = (c, text) => {
      text("AI Chat", 43, 28, 15, "#f6f7ff", 500);
      text("Ask anything,", 31, 65, 12);
      text("get things done.", 31, 80, 12);
      text("↔", 33, 106, 11, "#f1f8ff");
      text("··", 135, 99, 12, "#b4c8ea");
      c.fillStyle = "#aebdd7";
      c.fillRect(22, 57, 1, 1);
      c.fillRect(22, 73, 1, 1);
      c.fillStyle = "#a1b2cb";
      c.fillRect(51, 100, 13, 0.6);
      c.fillRect(51, 104, 9, 0.5);
    };
  } else if (s.kind === "workbench") {
    panel(19, 17, 20, 21, 0.113, 0.065, mat(0x7fbdd8, { roughness: 0.2 }), 4);
    outline(0.158, 0.124, 0.026, 0.156, 0xe5fcff, 0.95, g, xp(29), yp(26));
    line(
      [
        new THREE.Vector3(xp(24), yp(29), 0.158),
        new THREE.Vector3(xp(23), yp(33), 0.158),
        new THREE.Vector3(xp(28), yp(30), 0.158),
      ],
      0xe8ffff,
      0.9,
      g,
    );
    const small = [
      { x: 35, w: 30 },
      { x: 71, w: 31 },
      { x: 109, w: 46 },
      { x: 163, w: 58 },
    ];
    for (let j = 0; j < small.length; j++) {
      const p = small[j];
      panel(p.x, 70, p.w, 48, 0.114, 0.066, darkWidget, 4);
      outline(
        (p.w / s.px) * s.w,
        (48 / s.py) * s.h,
        0.037,
        0.15,
        0x8ea5d3,
        0.24,
        g,
        xp(p.x + p.w / 2),
        yp(94),
      );
      if (j < 2)
        for (let row = 0; row < 7; row++) {
          panel(
            p.x + 4,
            75 + row * 5.8,
            2.1,
            1.4,
            0.156,
            0.008,
            mat(row === 0 ? 0xa6cbea : 0x6983a7, {
              metalness: 0,
              roughness: 0.7,
            }),
            0.5,
          );
          panel(
            p.x + 8,
            75 + row * 5.8,
            10 + (row % 3) * 3,
            0.65,
            0.156,
            0.008,
            mat(0x8197b8, { metalness: 0, roughness: 0.8 }),
            0.2,
          );
        }
      if (j === 2) {
        for (let k = 0; k < 5; k++) {
          const hh = [10, 17, 24, 13, 31][k];
          panel(
            p.x + 7 + k * 6.7,
            110 - hh,
            3.7,
            hh,
            0.173,
            0.057,
            mat([0x5944ba, 0x7862e4, 0x9f79ff, 0x607be2, 0x8d74ff][k], {
              metalness: 0.25,
              roughness: 0.24,
              emissive: 0x402b83,
              emissiveIntensity: 0.5,
            }),
            0.5,
          );
        }
        panel(p.x + 6, 112, 35, 0.55, 0.17, 0.01, mat(0x718cb5), 0.2);
      }
      if (j === 3) {
        panel(
          p.x + 6,
          77,
          46,
          34,
          0.161,
          0.025,
          mat(0x174675, {
            metalness: 0.5,
            roughness: 0.2,
            emissive: 0x1260a0,
            emissiveIntensity: 0.4,
          }),
          2,
        );
        outline(
          (46 / s.px) * s.w,
          (34 / s.py) * s.h,
          0.035,
          0.18,
          0x48baff,
          0.9,
          g,
          xp(p.x + 29),
          yp(94),
        );
        const circle = mesh(
          new THREE.TorusGeometry(0.157, 0.011, 8, 64),
          glowMat(0x65d4ed, 1.6),
          g,
        );
        circle.position.set(xp(p.x + 29), yp(94), 0.199);
      }
    }
    panel(
      228,
      69,
      7,
      49,
      0.101,
      0.015,
      mat(0x485680, { transparent: true, opacity: 0.35 }),
      3,
    );
    paint = (c, text) => {
      text("Business Workbench", 50, 28, 15, "#f7f8ff", 500);
      text("Projects · Tasks · Insights", 50, 49, 12);
      text("‹", 22, 79, 11, "#a6badb");
      text("·", 22, 95, 13);
      text("·", 22, 113, 13);
      text("⌄", 188, 97, 11, "#9deeff");
    };
  } else {
    const brands = ["slack", "github", "notion", "lark"];
    for (let i = 0; i < 5; i++) {
      const x = 15 + i * 27;
      const tile = panel(
        x,
        74,
        22,
        36,
        0.144,
        0.116,
        i === 4 ? mat(0x46536d, { roughness: 0.25 }) : iconPorcelain,
        5,
      );
      tile.name = i === 4 ? "more-apps-tile" : `${brands[i]}-raised-icon-tile`;
      if (i < 4) {
        const width = (17 / s.px) * s.w,
          logo = facePlane(
            width,
            width,
            appIcon(brands[i]),
            g,
            xp(x + 11),
            yp(92),
            0.206,
          );
        logo.material.dispose();
        logo.material = iconPorcelain.clone();
        logo.material.map = appIcon(brands[i]);
        logo.material.transparent = true;
        logo.material.depthWrite = false;
        logo.name = `official-${brands[i]}-artwork`;
      } else
        for (let k = -1; k <= 1; k++)
          sphere(
            0.009,
            mat(0xdce7fa),
            new THREE.Vector3(xp(x + 11) + k * 0.043, yp(92), 0.209),
            g,
          );
    }
    paint = (c, text) => {
      text("Apps & Integrations", 15, 30, 14, "#f7f8ff", 500);
      text("Connect your tools", 15, 51, 12, "#e0e7f5");
    };
  }
  facePlane(s.w, s.h, textTexture(s, paint), g, 0, 0, 0.218);
  pool(g, 0, -s.h / 2 + 0.015, 0, s.w * 1.13, 0x637fe8);
}
export function createApplications() {
  for (const s of screens)
    capture(
      "app." + s.kind,
      {
        name: s.name,
        category: "应用屏幕",
        source: "components/applications.js",
        rect: s.rect,
        version: 5,
      },
      () => {
        const g = groupAt(
          s.x,
          levels[3] + (s.kind === "chat" ? 1.185 : 1.14),
          s.d,
        );
        g.rotation.z = s.tilt;
        g.rotation.y +=
          s.kind === "chat" ? 0.025 : s.kind === "integrations" ? -0.09 : 0;
        buildScreen(s, g);
        g.traverse((o) => {
          if (o.isMesh) {
            o.userData = { ...o.userData, layer: 3, name: s.name };
            clickable.push(o);
          }
        });
      },
    );
}
