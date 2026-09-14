import * as THREE from "three";
import { groupAt, levels, label, clickable } from "../core.js";
import { capture } from "../registry.js";
import { createBusinessModel, createPedestal } from "./business-models.js";
const dataNodes = [
  {
    name: "People",
    x: -5.28,
    d: -0.52,
    r: 0.48,
    h: 0.7,
    type: "people",
    rect: [332, 610, 96, 140],
  },
  {
    name: "Documents",
    x: -4.0,
    d: 0.6,
    r: 0.63,
    h: 0.86,
    type: "doc",
    rect: [411, 582, 133, 196],
  },
  {
    name: "Tasks",
    x: -2.76,
    d: 3.44,
    r: 0.62,
    h: 0.82,
    type: "task",
    rect: [505, 635, 130, 174],
  },
  {
    name: "Business Data",
    x: -0.15,
    d: 3.78,
    r: 1,
    h: 0.8,
    type: "data",
    rect: [667, 613, 183, 201],
  },
  {
    name: "Systems",
    x: 2.3,
    d: 3.88,
    r: 0.64,
    h: 0.8,
    type: "server",
    rect: [879, 649, 115, 173],
  },
  {
    name: "Devices",
    x: 3.73,
    d: 3,
    r: 0.64,
    h: 0.9,
    type: "laptop",
    rect: [988, 633, 112, 159],
  },
  {
    name: "External Data",
    x: 5.1,
    d: 1.8,
    r: 0.6,
    h: 0.8,
    type: "cloud",
    rect: [1094, 634, 116, 153],
  },
];
export function createDataObjects() {
  for (const n of dataNodes)
    capture(
      "data." + n.name.toLowerCase().replaceAll(" ", "-"),
      {
        name: n.name,
        category: "业务对象",
        source: "components/business-models.js",
        rect: n.rect,
        version: 4,
      },
      () => {
        const g = groupAt(n.x, levels[1] + 0.14, n.d);
        createPedestal(n, g);
        label(
          g,
          n.name,
          0,
          n.h - 0.22,
          n.r + 0.12,
          n.type === "data" ? 2.1 : 1.65,
          0.31,
          { font: 27, weight: 400 },
        );
        const icon = new THREE.Group();
        icon.name = n.type + "-sculpture";
        icon.position.y = n.h + 0.125;
        g.add(icon);
        createBusinessModel(n.type, icon);
        if (n.type === "data") {
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
