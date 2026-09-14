import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildWorld } from "../world.js";
import { renderer, scene, camera, world, W, H, pos, levels, sceneBackdrop } from "../core.js";
import { composer } from "../rendering.js";
import {
  registry,
  updateComponent,
  projectedPivot,
  cloneAsset,
  replaceComponent,
  restoreAsset,
  resetComponent,
  parseGLB,
  serializeConfig,
  applyConfig,
  saveLayout,
  loadSaved,
} from "../registry.js";
import { download, exportGLB, exportNative, assetManifest } from "./assets.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const canonicalCamera = camera.clone();
canonicalCamera.updateMatrixWorld(true);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.enableDamping = false;
controls.minZoom = 0.1;
controls.maxZoom = 12;
let selected = "actor.ai-agents",
  mode = "mock",
  zoom = 1,
  crop = [0, 0, W, H];
let pending = false,
  renders = 0,
  dirty = false,
  holdingReference = false,
  toastTimer;
const raycaster = new THREE.Raycaster();
const artboard = $("#artboard");
const rows = new Map();
const plaqueAnchors = [];

export async function startStudio() {
  await document.fonts.ready;
  buildWorld();
  await loadSaved();
  createPlaques();
  createList();
  wireEvents();
  const initial = new URLSearchParams(location.search);
  if (registry.has(initial.get("component")))
    selected = initial.get("component");
  if (["composition", "asset", "mock"].includes(initial.get("view")))
    mode = initial.get("view");
  selectComponent(selected);
  new ResizeObserver(() => resizeStage(false)).observe($("#stage-scroll"));
  window.studio = {
    registry,
    renderer,
    camera,
    scene,
    controls,
    select: selectComponent,
    setMode,
    render: renderNow,
    update: applyPatch,
    state: () => ({
      selected,
      mode,
      zoom,
      crop: [...crop],
      renders,
      config: serializeConfig(),
    }),
    setReference,
    exportGLB,
    exportNative,
    assetManifest,
    applyConfig,
    saveLayout,
    parseGLB,
    replaceComponent,
    restoreAsset,
    cloneAsset,
    resize: resizeStage,
    snapshot: () => renderer.domElement.toDataURL("image/png"),
  };
}

function createPlaques() {
  for (const [id, title, sub, depth, raise] of [
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
    anchor.position.copy(pos(-0.2, levels[id] + raise, depth));
    world.add(anchor);
    const entry = registry.get(
      "platform." + { 1: "data", 2: "intelligence", 3: "application" }[id],
    );
    entry.root.attach(anchor);
    const el = document.createElement("div");
    el.className = "platform-label";
    el.dataset.level=id;
    el.innerHTML = `<span class="plate-number">0${id}</span><span><strong>${title}</strong><small>${sub}</small></span>`;
    $("#home-overlay").append(el);
    plaqueAnchors.push({ anchor, el });
  }
}

function createList() {
  const container = $("#component-list");
  const categories = [
    "平台与结构",
    "应用屏幕",
    "智能角色",
    "业务对象",
    "世界环境",
  ];
  $("#component-count").textContent = `${registry.size} 组件`;
  const glyphs = {
    platform: "▱",
    structure: "⌘",
    actor: "♙",
    app: "▣",
    data: "◫",
    city: "▥",
    world: "◉",
  };
  for (const category of categories) {
    const entries = [...registry.values()].filter(
      (e) => e.category === category,
    );
    const section = document.createElement("section");
    section.className = "component-category";
    const title = document.createElement("div");
    title.className = "library-category";
    title.innerHTML = `<span>${category}</span><span>${String(entries.length).padStart(2, "0")}</span>`;
    section.append(title);
    for (const entry of entries) {
      const button = document.createElement("button");
      const family = entry.id.split(".")[0];
      button.className = "component-item";
      button.dataset.id = entry.id;
      button.dataset.family = family;
      button.innerHTML = `<span class="component-glyph">${glyphs[family]}</span><span>${entry.name}</span>${entry.version === 2 ? '<span class="item-version">V2</span>' : ""}<span class="edit-dot"></span>`;
      button.onclick = () => selectComponent(entry.id);
      section.append(button);
      rows.set(entry.id, button);
      const option = new Option(entry.name, entry.id);
      $("#replacement-preset").add(option);
    }
    container.append(section);
  }
}

function selectComponent(id) {
  if (!registry.has(id)) return;
  selected = id;
  const entry = registry.get(id);
  for (const [rowId, row] of rows) {
    row.classList.toggle("active", rowId === id);
    row.setAttribute("aria-pressed", String(rowId === id));
  }
  $("#selected-title").textContent = entry.name;
  $("#stage-eyebrow").textContent =
    `${entry.category} / ${String([...registry.keys()].indexOf(id) + 1).padStart(2, "0")} OF ${registry.size}`;
  $("#component-id").textContent = id;
  $("#source-path").textContent = entry.source;
  $("#asset-type").textContent = entry.shader
    ? "PROCEDURAL PLANET / SHADER"
    : entry.version === 2
      ? "CERAMIC ASSISTANT / VERSION 02"
      : "PROCEDURAL COMPONENT";
  $("#export-note").textContent = entry.shader
    ? "原生资产保留地形与大气程序。GLB 使用可移植的近似材质。"
    : "GLB 可用于其他三维工具。原生资产保留全部材质与光效。";
  syncInspector();
  setMode(mode);
}

function syncInspector() {
  const entry = registry.get(selected),
    state = entry.state;
  for (const key of ["dx", "dy", "depth", "sx", "sy", "sz", "rx", "ry", "rz"]) {
    const value = state[key] * (key[0] === "s" ? 100 : 1);
    $("#" + key).value = String(Math.round(value * 1000) / 1000);
  }
  $("#component-visible").checked = state.visible;
  $("#tint").value = state.tint || "#82bbff";
  $("#active-asset").textContent = state.asset
    ? state.asset.startsWith("builtin:")
      ? `已替换 · ${registry.get(state.asset.slice(8))?.name || state.asset}`
      : `本地资产 · ${state.asset.split(":").slice(2).join(":")}`
    : entry.version === 2
      ? "代码原生模型 · 机器人 V2"
      : "代码原生模型";
  updateReadout();
}

function updateReadout() {
  const pivot = projectedPivot(selected);
  $("#pivot-readout").textContent =
    `模型基点：X ${pivot.x.toFixed(1)} · Y ${pivot.y.toFixed(1)}`;
  const marker = $("#pivot-marker");
  marker.style.left = (pivot.x - crop[0]) * zoom + "px";
  marker.style.top = (pivot.y - crop[1]) * zoom + "px";
  marker.querySelector("span").textContent =
    `${pivot.x.toFixed(1)}, ${pivot.y.toFixed(1)}`;
  marker.style.display = mode === "mock" ? "block" : "none";
}

function setMode(next) {
  if (!["composition", "asset", "mock"].includes(next)) return;
  mode = next;
  document.body.dataset.view = mode;
  $$("[data-mode]")
    .filter((el) => el.tagName === "BUTTON")
    .forEach((el) => {
      el.classList.toggle("active", el.dataset.mode === mode);
      el.setAttribute("aria-pressed", String(el.dataset.mode === mode));
    });
  camera.copy(canonicalCamera);
  camera.clearViewOffset();
  controls.enabled = mode === "asset";
  if (mode === "asset") frameAsset();
  $("#home-overlay").style.display = mode === "composition" ? "block" : "none";
  $("#stage-caption").textContent =
    mode === "asset"
      ? "拖动旋转 · 滚轮缩放 · F 重新居中"
      : mode === "mock"
        ? "锁定参考视角 · 拖动微调位置"
        : "完整首页 · 点击模型选择组件";
  $("#show-context").disabled = mode !== "mock";
  $("#zoom").disabled = mode === "asset";
  $("#crop-coordinates").style.display = mode === "mock" ? "block" : "none";
  resizeStage(false);
  updateReference();
}

function frameAsset() {
  for (const e of registry.values()) e.root.visible = e.state.visible;
  scene.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(registry.get(selected).root);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.73;
  const aspect = Math.max(
    0.7,
    $("#stage-scroll").clientWidth / $("#stage-scroll").clientHeight,
  );
  camera.left = -radius * aspect;
  camera.right = radius * aspect;
  camera.top = radius;
  camera.bottom = -radius;
  camera.zoom = 1;
  camera.position
    .copy(center)
    .add(
      new THREE.Vector3(
        Math.sin(Math.PI / 4 + 0.5) * Math.cos(0.34),
        Math.sin(0.34),
        Math.cos(Math.PI / 4 + 0.5) * Math.cos(0.34),
      ).multiplyScalar(Math.max(48, radius * 3)),
    );
  camera.lookAt(center);
  camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.update();
  camera.updateMatrixWorld(true);
  // Fit projected geometry, rather than an oversized world-axis bounding sphere.
  const projected = new THREE.Box3();
  registry.get(selected).active.traverse((o) => {
    if (!o.geometry || !o.visible) return;
    o.geometry.computeBoundingBox();
    if (o.isSprite) {
      const p = o
        .getWorldPosition(new THREE.Vector3())
        .applyMatrix4(camera.matrixWorldInverse);
      const scale = o.getWorldScale(new THREE.Vector3());
      projected.expandByPoint(
        new THREE.Vector3(p.x - scale.x / 2, p.y - scale.y / 2, p.z),
      );
      projected.expandByPoint(
        new THREE.Vector3(p.x + scale.x / 2, p.y + scale.y / 2, p.z),
      );
    } else {
      const box = o.geometry.boundingBox;
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z])
            projected.expandByPoint(
              new THREE.Vector3(x, y, z)
                .applyMatrix4(o.matrixWorld)
                .applyMatrix4(camera.matrixWorldInverse),
            );
    }
  });
  if (!projected.isEmpty()) {
    const extent = projected.getSize(new THREE.Vector3());
    const half = Math.max(extent.y, extent.x / aspect) * 0.58;
    camera.left = -half * aspect;
    camera.right = half * aspect;
    camera.top = half;
    camera.bottom = -half;
    const mid = projected.getCenter(new THREE.Vector3());
    const shift = new THREE.Vector3(mid.x, mid.y, 0).applyQuaternion(
      camera.quaternion,
    );
    camera.position.add(shift);
    controls.target.add(shift);
    camera.updateProjectionMatrix();
    controls.update();
  }
}

function resizeStage(refit = true) {
  if (!registry.size) return;
  const availW = Math.max(180, $("#stage-scroll").clientWidth - 56);
  const availH = Math.max(160, $("#stage-scroll").clientHeight - 56);
  let width, height;
  if (mode === "asset") {
    width = availW;
    height = availH;
    if (refit) frameAsset();
    const extent = (camera.top - camera.bottom) / 2;
    camera.left = (-extent * width) / height;
    camera.right = (extent * width) / height;
    camera.updateProjectionMatrix();
    crop = [0, 0, width, height];
    zoom = 1;
  } else {
    crop = mode === "mock" ? [...registry.get(selected).rect] : [0, 0, W, H];
    const chosen = $("#zoom").value;
    zoom =
      chosen === "fit"
        ? Math.min(availW / crop[2], availH / crop[3])
        : Number(chosen);
    width = Math.round(crop[2] * zoom);
    height = Math.round(crop[3] * zoom);
    zoom = width / crop[2];
    height = crop[3] * zoom;
    camera.copy(canonicalCamera);
    camera.setViewOffset(W, H, ...crop);
    camera.updateProjectionMatrix();
  }
  artboard.style.width = width + "px";
  artboard.style.height = height + "px";
  renderer.setPixelRatio(Number($("#quality").value));
  renderer.setSize(width, height, false);
  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(width, height);
  $("#home-overlay").style.transform = `scale(${zoom})`;
  const reference = $("#reference img");
  reference.style.width = W * zoom + "px";
  reference.style.height = H * zoom + "px";
  reference.style.left = -crop[0] * zoom + "px";
  reference.style.top = -crop[1] * zoom + "px";
  const grid = $("#alignment-grid");
  const step = (zoom >= 4 ? 1 : 16) * zoom;
  grid.style.backgroundSize = `${step}px ${step}px`;
  grid.style.backgroundPosition = `${(-crop[0] * zoom) % step}px ${(-crop[1] * zoom) % step}px`;
  $("#crop-coordinates").textContent =
    `REF  ${crop[0]}, ${crop[1]}  /  ${crop[2]} × ${crop[3]} px`;
  $("#view-readout").textContent =
    mode === "asset"
      ? `独立三维视图 · ${width} × ${height}`
      : `原图 1536 × 1024 · 显示 ${(zoom * 100).toFixed(0)}% · 1 px = ${(14 / 1024).toFixed(6)} 场景单位`;
  updateReadout();
  requestRender();
}

function setReference(show, opacity = 35) {
  $("#show-reference").checked = show;
  $("#reference-opacity").value = String(opacity);
  updateReference();
}
function updateReference() {
  const visible =
    (holdingReference || $("#show-reference").checked) && mode !== "asset";
  $("#reference").style.display = visible ? "block" : "none";
  $("#reference").style.opacity = holdingReference
    ? "1"
    : String(Number($("#reference-opacity").value) / 100);
  $("#reference").style.mixBlendMode =
    !holdingReference && $("#difference").checked ? "difference" : "normal";
  $("#opacity-value").textContent = $("#reference-opacity").value + "%";
  $("#alignment-grid").style.display =
    $("#show-grid").checked && !holdingReference ? "block" : "none";
  $("#pivot-marker").style.visibility = holdingReference ? "hidden" : "visible";
  $("#world").style.visibility = holdingReference ? "hidden" : "visible";
  $("#home-overlay").style.visibility = holdingReference ? "hidden" : "visible";
}

function updateVisibility() {
  const context =
    mode === "composition" || (mode === "mock" && $("#show-context").checked);
  for (const e of registry.values()) {
    e.root.visible = e.state.visible && (context || e.id === selected);
    e.root.traverse((o) => {
      if (o.userData.annotation) o.visible = $("#show-annotations").checked;
    });
  }
}
function renderNow() {
  pending = false;
  if (!registry.size) return;
  updateVisibility();
  scene.background = mode === "composition" ? sceneBackdrop : new THREE.Color(mode === "asset" ? 0x141e2c : 0x1c2532);
  for (const { anchor, el } of plaqueAnchors) {
    const p = anchor
      .getWorldPosition(new THREE.Vector3())
      .project(canonicalCamera);
    el.style.left =
      THREE.MathUtils.clamp((p.x * 0.5 + 0.5) * W, 565, 975) + "px";
    el.style.top = (-p.y * 0.5 + 0.5) * H + "px";
  }
  renderer.info.reset();
  composer.render();
  renders++;
  if (!document.body.dataset.ready) {
    document.body.dataset.ready = "true";
    $("#loading")?.remove();
  }
}
function requestRender() {
  if (!pending) {
    pending = true;
    requestAnimationFrame(renderNow);
  }
}

function markDirty(id = selected) {
  dirty = true;
  $("#save-status").textContent = "有未保存的修改";
  if (id) rows.get(id)?.classList.add("changed");
}
function applyPatch(patch, id = selected) {
  updateComponent(id, patch);
  markDirty(id);
  syncInspector();
  requestRender();
}
function nudge(dx, dy, factor = 1) {
  const state = registry.get(selected).state;
  applyPatch({
    dx: Math.round((state.dx + dx * factor) * 1000) / 1000,
    dy: Math.round((state.dy + dy * factor) * 1000) / 1000,
  });
}
function toast(text) {
  clearTimeout(toastTimer);
  $("#toast").textContent = text;
  $("#toast").classList.add("show");
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 4200);
}
async function busy(button, action) {
  button.disabled = true;
  try {
    await action();
  } catch (e) {
    toast(e.message);
    console.error(e);
  } finally {
    button.disabled = false;
  }
}

function wireEvents() {
  controls.addEventListener("change", requestRender);
  $$("button[data-mode]").forEach(
    (b) => (b.onclick = () => setMode(b.dataset.mode)),
  );
  $("#frame-view").onclick = () => {
    if (mode === "asset") frameAsset();
    else $("#zoom").value = "fit";
    resizeStage();
  };
  $("#zoom").onchange = () => resizeStage(false);
  $("#quality").onchange = () => resizeStage(false);
  for (const id of [
    "show-reference",
    "reference-opacity",
    "difference",
    "show-grid",
  ])
    $("#" + id).oninput = updateReference;
  $("#show-context").onchange = requestRender;
  $("#show-annotations").onchange = requestRender;
  $("#component-search").oninput = (e) => {
    const normalize = (value) =>
      value.toLowerCase().replace(/[-_.]/g, " ").replace(/\s+/g, " ").trim();
    const query = normalize(e.target.value);
    for (const [id, row] of rows)
      row.hidden = !normalize(
        id + " " + registry.get(id).name + " " + registry.get(id).category,
      ).includes(query);
    $$(".component-category").forEach(
      (section) =>
        (section.hidden = [...section.querySelectorAll("button")].every(
          (b) => b.hidden,
        )),
    );
  };
  for (const key of ["dx", "dy", "depth", "rx", "ry", "rz", "sx", "sy", "sz"])
    $("#" + key).onchange = (e) => {
      const value = Number(e.target.value);
      if (!Number.isFinite(value)) return syncInspector();
      let patch = { [key]: value / (key[0] === "s" ? 100 : 1) };
      if (key[0] === "s" && $("#lock-scale").checked) {
        const state = registry.get(selected).state,
          ratio = value / 100 / state[key];
        patch = Object.fromEntries(
          ["sx", "sy", "sz"].map((k) => [k, state[k] * ratio]),
        );
      }
      applyPatch(patch);
    };
  $$("[data-nudge]").forEach(
    (b) =>
      (b.onclick = (e) =>
        nudge(
          ...b.dataset.nudge.split(",").map(Number),
          e.shiftKey ? 10 : e.altKey ? 0.1 : 1,
        )),
  );
  $("#component-visible").onchange = (e) =>
    applyPatch({ visible: e.target.checked });
  $("#tint").oninput = (e) => applyPatch({ tint: e.target.value });
  $("#clear-tint").onclick = () => applyPatch({ tint: null });
  $("#reset-component").onclick = () => {
    resetComponent(selected);
    markDirty();
    syncInspector();
    requestRender();
    toast("当前组件已恢复默认。");
  };
  $("#restore-asset").onclick = () => {
    restoreAsset(selected);
    markDirty();
    syncInspector();
    requestRender();
  };
  $("#replace-preset").onclick = () => {
    const id = $("#replacement-preset").value;
    if (!id) return toast("先在上方选择一个资产。");
    replaceComponent(selected, cloneAsset(id), "builtin:" + id);
    markDirty();
    syncInspector();
    requestRender();
    toast("模型已替换，尺寸与占位已自动适配。");
  };
  $("#replace-file").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const destination = selected;
    try {
      const bytes = await file.arrayBuffer();
      const asset = await parseGLB(bytes);
      const name = `local:${crypto.randomUUID?.() || Date.now()}:${file.name}`;
      replaceComponent(destination, asset, name, bytes);
      markDirty(destination);
      syncInspector();
      requestRender();
      toast("已导入并替换模型；保存后首页也会使用它。");
    } catch (error) {
      toast(error.message);
    } finally {
      e.target.value = "";
    }
  };
  $("#export-glb").onclick = (e) =>
    busy(e.currentTarget, async () => {
      const id = selected;
      download(await exportGLB(id), id + ".glb");
      toast("已导出独立 GLB 资产。");
    });
  $("#export-native").onclick = () =>
    download(
      exportNative(selected),
      selected + ".wb3d.json",
      "application/json",
    );
  $("#export-layout").onclick = () => {
    download(
      JSON.stringify(serializeConfig(), null, 2),
      "winbrain-layout.json",
      "application/json",
    );
    toast("已导出布局；本地导入的模型文件请一并交付。");
  };
  $("#import-layout").onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const missing = await applyConfig(JSON.parse(await file.text()));
      markDirty();
      syncInspector();
      requestRender();
      toast(
        missing.length
          ? "布局已导入，部分本地模型需重新导入。"
          : "布局已导入，可以预览并保存到首页。",
      );
    } catch (error) {
      toast(error.message);
    } finally {
      e.target.value = "";
    }
  };
  $("#save-layout").onclick = (e) =>
    busy(e.currentTarget, async () => {
      await saveLayout();
      dirty = false;
      $("#save-status").textContent = "已保存到当前浏览器";
      toast("已应用到首页。已打开的首页会同步更新。");
    });
  $("#reset-all").onclick = () => {
    for (const id of registry.keys()) resetComponent(id);
    markDirty();
    syncInspector();
    requestRender();
    toast("已恢复整页默认布局；保存后应用到首页。");
  };
  $("#take-snapshot").textContent = "保存模型 PNG";
  $("#take-snapshot").onclick = () => {
    renderNow();
    renderer.domElement.toBlob((blob) =>
      download(blob, `${selected}-${mode}.png`),
    );
    toast("已保存模型画面，不含参考图与编辑工具。");
  };
  const hold = () => {
      holdingReference = true;
      updateReference();
    },
    release = () => {
      holdingReference = false;
      updateReference();
    };
  $("#hold-reference").onpointerdown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    hold();
  };
  $("#hold-reference").onpointerup = release;
  $("#hold-reference").onpointercancel = release;
  addEventListener("blur", release);
  addEventListener("keydown", (e) => {
    if (e.target.matches("input,select,textarea")) return;
    const keys = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    if (keys[e.key]) {
      e.preventDefault();
      nudge(...keys[e.key], e.shiftKey ? 10 : e.altKey ? 0.1 : 1);
    }
    if (e.code === "Space") {
      e.preventDefault();
      hold();
    }
    if (e.key.toLowerCase() === "f") {
      e.preventDefault();
      $("#frame-view").click();
    }
  });
  addEventListener("keyup", (e) => {
    if (e.code === "Space") release();
  });
  let drag = null;
  renderer.domElement.addEventListener("pointerdown", (e) => {
    if (mode === "asset") return;
    drag = {
      x: e.clientX,
      y: e.clientY,
      dx: registry.get(selected).state.dx,
      dy: registry.get(selected).state.dy,
      moved: false,
    };
    renderer.domElement.setPointerCapture(e.pointerId);
    artboard.focus({ preventScroll: true });
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!drag || mode !== "mock") return;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 2 && !drag.moved)
      return;
    drag.moved = true;
    const precision = e.altKey ? 10 : 1;
    applyPatch({
      dx:
        Math.round((drag.dx + (e.clientX - drag.x) / zoom) * precision) /
        precision,
      dy:
        Math.round((drag.dy + (e.clientY - drag.y) / zoom) * precision) /
        precision,
    });
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (drag && !drag.moved && mode === "composition") {
      const bounds = renderer.domElement.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
          1 - ((e.clientY - bounds.top) / bounds.height) * 2,
        ),
        camera,
      );
      const hit = raycaster
        .intersectObjects(
          [...registry.values()]
            .filter((v) => v.root.visible)
            .map((v) => v.root),
          true,
        )
        .find((h) => h.object.userData.componentId && !h.object.isSprite);
      if (hit) selectComponent(hit.object.userData.componentId);
    }
    drag = null;
  });
  renderer.domElement.addEventListener("pointercancel", () => (drag = null));
}

startStudio();
