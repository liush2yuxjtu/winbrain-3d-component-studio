import * as THREE from "three";
import { groupAt, levels, label, clickable, mat, cyl, ring } from "../core.js";
import { capture } from "../registry.js";
import { createBusinessModel, createPedestal } from "./business-models.js";
import { plate } from "./exhibit-geometry.js";
import { dataNodes } from "./data-layout.js";

export function createDataObjects() {
  for (const n of dataNodes)
    capture(
      "data." + n.name.toLowerCase().replaceAll(" ", "-"),
      {
        name: n.name,
        category: "业务对象",
        source: "components/business-models.js",
        rect: n.rect,
        version: 5,
      },
      () => {
        const g = groupAt(n.x, levels[1] + 0.14, n.d);
        createPedestal(n, g);
        // Reference cloud sits on a softly diffusing glass deck. Keep Tasks on its
        // original pedestal because an extra deck reduced structural similarity.
        if (n.type === "cloud") {
          const frosted = mat(0xc7dff2, {
            metalness: 0.02,
            roughness: 0.48,
            transmission: 0.32,
            thickness: 0.18,
            ior: 1.33,
            transparent: true,
            opacity: 0.34,
            depthWrite: false,
            clearcoat: 0.28,
            clearcoatRoughness: 0.5,
            side: THREE.DoubleSide,
          });
          const frostDeck = cyl(
            n.r * 0.84,
            n.r * 0.88,
            0.055,
            frosted,
            new THREE.Vector3(0, n.h + 0.11, 0),
            g,
          );
          frostDeck.name = "cloud-frosted-glass-deck";
          ring(n.r * 0.86, n.h + 0.14, 0xa9d9f0, g, 0.006);
        }
        label(
          g,
          n.name,
          0,
          n.h - 0.22,
          n.r + 0.12,
          n.type === "data" ? 2.1 : 1.65,
          0.31,
          { font: n.type === "data" ? 29 : 27, weight: n.type === "data" ? 500 : 400 },
        );
        const icon = new THREE.Group();
        icon.name = n.type + "-sculpture";
        icon.position.y = n.h + (n.type === "cloud" ? 0.105 : 0.125);
        g.add(icon);
        createBusinessModel(n.type, icon);
        const sculptureScale = {
          people: [1, 1.02, 1],
          doc: [0.96, 0.94, 1],
          task: [0.96, 1.10, 1],
          data: [1, 1, 1],
          server: [0.96, 0.95, 1],
          laptop: [1, 1.08, 1],
          cloud: [1.02, 0.94, 1.04],
        }[n.type];
        icon.scale.set(...sculptureScale);
        if (n.type === "cloud") icon.position.z -= 0.015;
        if (n.type === "data") {
          const captionPanel = plate(
            2.54,
            0.54,
            0.028,
            mat(0x131e2e, {
              metalness: 0,
              roughness: 1,
              transparent: true,
              opacity: 0.94,
              depthWrite: false,
              depthTest: false,
            }),
            g,
            0,
            0.255,
            n.r + 0.17,
            0.12,
            0.004,
          );
          captionPanel.name = "database-caption-panel";
          label(
            g,
            "Orders · Products · Inventory",
            0,
            0.35,
            n.r + 0.21,
            2.45,
            0.22,
            { font: 22, color: "#ced8e8" },
          );
          label(
            g,
            "Suppliers · Customers ...",
            0,
            0.14,
            n.r + 0.24,
            2.23,
            0.22,
            { font: 22, color: "#ced8e8" },
          );
        }
        g.traverse((o) => {
          if (o.isMesh) {
            o.userData = { ...o.userData, layer: 1, name: n.name };
            clickable.push(o);
          }
        });
      },
    );
}
