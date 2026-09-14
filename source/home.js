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
} from "./core.js";
import { composer } from "./rendering.js";
import { earthMat, atmo } from "./components/earth.js";
import { registry, loadSaved, listenForSaved } from "./registry.js";
// Layer titles are live text, projected from 3D anchors rather than baked into art.
for (const [id, title, sub, d, raise] of [
  [
    3,
    "APPLICATION LAYER",
    "AI Conversation · Workbench · Business Action",
    3.1,
    0.45,
  ],
  [
    2,
    "INTELLIGENCE HUB",
    "Projects · Experts · Employees · AI Agents",
    3.8,
    0.2,
  ],
  [
    1,
    "DATA FOUNDATION",
    "Business Objects · Knowledge · Permissions",
    6.8,
    0.18,
  ],
]) {
  const anchor = new THREE.Object3D();
  anchor.position.copy(pos(-0.2, levels[id] + raise, d));
  world.add(anchor);
  registry
    .get("platform." + { 1: "data", 2: "intelligence", 3: "application" }[id])
    .root.attach(anchor);
  const el = document.createElement("button");
  el.className = "platform-label";
  el.dataset.level = id;
  el.setAttribute("aria-label", `Explore ${title}`);
  el.innerHTML = `<span class="plate-number">0${id}</span><span><strong>${title}</strong><small>${sub}</small></span>`;
  document.querySelector("#spatial-labels").append(el);
  labels.push({ anchor, el });
  el.addEventListener("click", () => selectLayer(id));
}
// Screen layout, model interaction, orbit, layer selection and wireframe inspection.
const layerCopy = {
  3: {
    title: "Application Layer",
    description:
      "从意图到行动：通过 AI 对话、业务工作台和集成工具，使用整个组织的能力。",
    items: ["AI Chat", "Business Workbench", "Apps & Integrations"],
  },
  2: {
    title: "Intelligence Hub",
    description:
      "项目组织工作，专家提供判断，员工与 AI 智能体一起执行。每个角色都是独立的三维对象。",
    items: ["Projects", "Experts", "AI Agents", "Employees"],
  },
  1: {
    title: "Data Foundation",
    description:
      "人员、文件、任务、系统和设备，组成企业的数字基础。当前展示为本地演示数据。",
    items: [
      "People",
      "Documents",
      "Tasks",
      "Business Data",
      "Systems",
      "Devices",
      "External Data",
    ],
  },
};
const dialog = document.querySelector("#details"),
  dialogTitle = document.querySelector("#dialog-title"),
  dialogBody = document.querySelector("#dialog-body");
function selectLayer(id, name = null) {
  const data = layerCopy[id];
  document
    .querySelectorAll(".layer")
    .forEach((el) =>
      el.classList.toggle("selected", +el.dataset.layer === +id),
    );
  document
    .querySelectorAll(".platform-label")
    .forEach((el) =>
      el.classList.toggle("selected", +el.dataset.level === +id),
    );
  dialogTitle.textContent = name || data.title;
  dialogBody.replaceChildren();
  const p = document.createElement("p");
  p.textContent = data.description;
  dialogBody.append(p);
  const list = document.createElement("div");
  list.className = "dialog-list";
  data.items.forEach((item) => {
    const b = document.createElement("button");
    b.textContent = item;
    b.onclick = () => {
      dialogTitle.textContent = item;
    };
    list.append(b);
  });
  dialogBody.append(list);
  if (!dialog.open) dialog.showModal();
}
document.querySelectorAll(".layer").forEach((el) => {
  el.onclick = () => selectLayer(el.dataset.layer);
  el.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectLayer(el.dataset.layer);
    }
  };
});
document.querySelector("[data-explore]").onclick = () => {
  const open = document.querySelector(".controls").classList.toggle("is-open");
  document
    .querySelector("[data-explore]")
    .setAttribute("aria-expanded", String(open));
};
document
  .querySelectorAll("[data-open]")
  .forEach(
    (el) =>
      (el.onclick = () =>
        selectLayer(
          { chat: 3, projects: 2, experts: 2, data: 1 }[el.dataset.open],
        )),
  );
document.querySelector(".close").onclick = () => dialog.close();
dialog.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.preventDefault();
    dialog.close();
  }
});
dialog.addEventListener("close", () =>
  document
    .querySelectorAll(".selected")
    .forEach((e) => e.classList.remove("selected")),
);
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }
});
document.querySelector("[data-search]").onclick = () => {
  dialogTitle.textContent = "Search WinBrain";
  dialogBody.innerHTML =
    '<label for="query">查找对象或应用</label><input id="query" class="search-input" type="search" placeholder="Projects, data, AI…"><div id="results" class="dialog-list"></div>';
  const input = document.querySelector("#query"),
    results = document.querySelector("#results");
  function filter() {
    results.replaceChildren();
    Object.entries(layerCopy).forEach(([id, l]) =>
      l.items
        .filter((s) => s.toLowerCase().includes(input.value.toLowerCase()))
        .forEach((s) => {
          const b = document.createElement("button");
          b.textContent = s;
          b.onclick = () => selectLayer(id, s);
          results.append(b);
        }),
    );
    if (!results.children.length) results.textContent = "没有找到匹配对象";
  }
  filter();
  input.oninput = filter;
  dialog.showModal();
  input.focus();
};
let autoRotate = false,
  paused = matchMedia("(prefers-reduced-motion: reduce)").matches,
  wireframe = false;
const reset = () => {
  document.querySelector(".controls").classList.remove("is-open");
  document
    .querySelector("[data-explore]")
    .setAttribute("aria-expanded", "false");
  if (document.querySelector(".controls").contains(document.activeElement))
    document.querySelector("[data-explore]").focus({ preventScroll: true });
  Object.assign(view, initialView);
  autoRotate = false;
  document.querySelector("#rotate").setAttribute("aria-pressed", "false");
  updateCamera();
};
document.querySelector("#reset").onclick = reset;
document.querySelector("[data-home]").onclick = reset;
document.querySelector(".brand").onclick = (e) => {
  e.preventDefault();
  reset();
};
document.querySelector("#rotate").onclick = () => {
  autoRotate = !autoRotate;
  document.querySelector("#rotate").setAttribute("aria-pressed", autoRotate);
};
document.querySelector("#pause").onclick = () => {
  paused = !paused;
  document.querySelector("#pause").setAttribute("aria-pressed", paused);
  document.querySelector("#pause").textContent = paused
    ? "继续光流"
    : "暂停光流";
};
document.querySelector("#wire").onclick = () => {
  wireframe = !wireframe;
  world.traverse((o) => {
    if (o.isMesh) {
      const materials = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of materials)
        if (m.isMeshStandardMaterial || m.isMeshPhysicalMaterial)
          m.wireframe = wireframe;
    }
  });
  world.traverse((o) => {
    if (o.material?.isShaderMaterial) o.material.wireframe = wireframe;
  });
  atmo.visible = !wireframe;
  document.querySelector("#wire").setAttribute("aria-pressed", wireframe);
};
let pointerDown = null,
  lastPointer = null,
  dragged = false;
const raycaster = new THREE.Raycaster();
function pick(e) {
  const bounds = renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector2(
    ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
    -((e.clientY - bounds.top) / bounds.height) * 2 + 1,
  );
  raycaster.setFromCamera(v, camera);
  const isVisible = (object) => {
    for (let p = object; p; p = p.parent) if (!p.visible) return false;
    return true;
  };
  const hit = raycaster
    .intersectObjects(
      [...registry.values()].filter((e) => e.root.visible).map((e) => e.root),
      true,
    )
    .find(
      (h) =>
        h.object.isMesh && h.object.userData.componentId && isVisible(h.object),
    );
  if (hit) {
    const entry = registry.get(hit.object.userData.componentId);
    const id =
      entry.id.startsWith("app.") || entry.id === "platform.application"
        ? 3
        : entry.id.startsWith("actor.") || entry.id === "platform.intelligence"
          ? 2
          : 1;
    selectLayer(id, entry.name);
  }
}
renderer.domElement.addEventListener("pointerdown", (e) => {
  pointerDown = { x: e.clientX, y: e.clientY };
  lastPointer = { ...pointerDown };
  dragged = false;
  renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener("pointermove", (e) => {
  if (!pointerDown) return;
  const dx = e.clientX - lastPointer.x,
    dy = e.clientY - lastPointer.y;
  if (Math.hypot(e.clientX - pointerDown.x, e.clientY - pointerDown.y) > 4)
    dragged = true;
  if (dragged) {
    view.yaw -= dx * 0.005;
    view.pitch = THREE.MathUtils.clamp(view.pitch + dy * 0.0035, 0.06, 0.7);
    autoRotate = false;
    document.querySelector("#rotate").setAttribute("aria-pressed", "false");
    updateCamera();
  }
  lastPointer = { x: e.clientX, y: e.clientY };
});
renderer.domElement.addEventListener("pointerup", (e) => {
  if (pointerDown && !dragged) pick(e);
  pointerDown = null;
  lastPointer = null;
});
renderer.domElement.addEventListener("pointercancel", () => {
  pointerDown = null;
  lastPointer = null;
});
renderer.domElement.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    view.zoom = THREE.MathUtils.clamp(
      view.zoom - e.deltaY * 0.0008,
      0.65,
      1.55,
    );
    updateCamera();
  },
  { passive: false },
);
renderer.domElement.addEventListener("keydown", (e) => {
  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "+",
      "-",
    ].includes(e.key)
  ) {
    e.preventDefault();
    if (e.key === "Home") reset();
    if (e.key === "ArrowLeft") view.yaw -= 0.08;
    if (e.key === "ArrowRight") view.yaw += 0.08;
    if (e.key === "ArrowUp") view.pitch = Math.min(0.7, view.pitch + 0.05);
    if (e.key === "ArrowDown") view.pitch = Math.max(0.06, view.pitch - 0.05);
    if (e.key === "+") view.zoom = Math.min(1.55, view.zoom + 0.1);
    if (e.key === "-") view.zoom = Math.max(0.65, view.zoom - 0.1);
    updateCamera();
  }
});
renderer.domElement.tabIndex = 0;
function resize() {
  const scale = innerWidth / W;
  document.querySelector(".scene").style.transform = `scale(${scale})`;
  document.querySelector(".viewport").style.height = `${H * scale}px`;
  const rw = Math.min(innerWidth, W);
  renderer.setSize(rw, (rw * H) / W, false);
  composer.setSize(rw, (rw * H) / W);
}
addEventListener("resize", resize);
resize();
let renderingEnabled = true;
let elapsed = 0,
  last = performance.now(),
  frames = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = THREE.MathUtils.clamp((now - last) / 1000, 0, 0.05);
  last = now;
  if (document.hidden || !renderingEnabled) return;
  if (!paused) elapsed += dt;
  if (autoRotate) {
    view.yaw += dt * 0.1;
    updateCamera();
  }
  for (const a of animated) {
    if (a.kind === "robot")
      a.object.position.y = a.base + Math.sin(elapsed * 1.6) * 0.024;
    if (a.kind === "packet")
      a.object.position.copy(
        a.curve.getPoint(
          THREE.MathUtils.euclideanModulo(elapsed * 0.16 + a.offset, 1),
        ),
      );
    if (a.kind === "rise")
      a.object.position.copy(
        pos(a.x, a.lo + (a.hi - a.lo) * ((elapsed * 0.23 + a.offset) % 1), a.d),
      );
  }
  for (const { anchor, el } of labels) {
    const v = anchor.getWorldPosition(new THREE.Vector3()).project(camera);
    el.style.left = `${THREE.MathUtils.clamp((v.x * 0.5 + 0.5) * W, 565, 975)}px`;
    el.style.top = `${(-v.y * 0.5 + 0.5) * H}px`;
    el.style.opacity = v.z < 1 ? "1" : "0";
  }
  renderer.info.reset();
  composer.render();
  frames++;
  if (frames === 3) {
    document.body.dataset.ready = "true";
    document.querySelector("#loading").remove();
  }
}
requestAnimationFrame(frame);
window.winbrain = {
  registry,
  scene,
  camera,
  renderer,
  world,
  view,
  reset,
  setView: (yaw, pitch, zoom = 1) => {
    view.yaw = yaw;
    view.pitch = pitch;
    view.zoom = zoom;
    updateCamera();
  },
  selectLayer,
  renderOnce: () => composer.render(),
  setPaused: (value) => (paused = value),
  setRenderingEnabled: (value) => (renderingEnabled = value),
  stats: () => {
    let meshes = 0,
      triangles = 0;
    scene.traverse((o) => {
      if (o.isMesh) {
        meshes++;
        triangles +=
          (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
      }
    });
    return {
      meshes,
      triangles,
      externalTextures: 0,
      referenceImages: 0,
      frames,
      drawCalls: renderer.info.render.calls,
      threeRevision: THREE.REVISION,
    };
  },
};

loadSaved().then(() => composer.render());
listenForSaved(() => composer.render());
