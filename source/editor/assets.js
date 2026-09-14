import * as THREE from "three";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { registry } from "../registry.js";
import { camera, textureCanvas } from "../core.js";

export function download(data, name, type = "application/octet-stream") {
  const url = URL.createObjectURL(
    data instanceof Blob ? data : new Blob([data], { type }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportRoot(id, annotations = true) {
  const entry = registry.get(id),
    group = (
      entry.active === entry.original && entry.nativeContent
        ? entry.nativeContent
        : entry.active
    ).clone(true);
  group.visible = true;
  group.name = id;
  // Keep asset geometry local. Layout transforms are delivered separately as JSON.
  group.traverse((o) => {
    if (o.userData.annotation && !annotations) o.visible = false;
    if (entry.state.tint && o.material) {
      const tint = (m) => {
        if (!m.isMeshStandardMaterial) return m;
        const c = m.clone();
        c.color.set(entry.state.tint);
        return c;
      };
      o.material = Array.isArray(o.material)
        ? o.material.map(tint)
        : tint(o.material);
    }
  });
  group.userData = {
    component: id,
    name: entry.name,
    source: entry.source,
    generatedWithCode: true,
  };
  group.updateMatrixWorld(true);
  return group;
}

export function exportNative(id) {
  const entry = registry.get(id);
  return JSON.stringify({
    schema: "winbrain.asset/v1",
    component: id,
    name: entry.name,
    object: exportRoot(id).toJSON(),
  });
}

let earthMap;
function proceduralEarthMap() {
  if (earthMap) return earthMap;
  // A portable, procedurally painted material for GLB. The native asset retains the live shader.
  earthMap = textureCanvas(1024, 512, (ctx, w, h) => {
    const image = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const u = (x / w) * Math.PI * 2,
          v = (y / h) * Math.PI;
        const p = [
          Math.cos(u) * Math.sin(v),
          Math.cos(v),
          Math.sin(u) * Math.sin(v),
        ];
        let n = 0;
        for (let k = 1; k <= 6; k++)
          n +=
            (Math.sin(p[0] * k * 5.7 + Math.cos(p[2] * k * 3.1) + p[1] * 7.2) *
              Math.cos(p[1] * k * 6.3 + p[2] * k * 4.2)) /
            k;
        const land = n > 0.2,
          detail = (Math.sin(x * 13.78 + y * 39.1) * 43758.5) % 1;
        const light = land && detail > 0.989;
        const rgb = light
          ? [219, 164, 87]
          : land
            ? [12 + n * 3, 22 + n * 5, 26 + n * 4]
            : [4, 11, 22];
        const i = (y * w + x) * 4;
        image.data.set([...rgb, 255], i);
      }
    ctx.putImageData(image, 0, 0);
  });
  return earthMap;
}

export async function exportGLB(id, { annotations = true } = {}) {
  const root = exportRoot(id, annotations),
    sprites = [];
  const viewQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(-0.17, Math.PI / 4, 0, "YXZ"),
  );
  root.traverse((o) => {
    if (o.isSprite) sprites.push(o);
    if (!o.material) return;
    const portable = (material) => {
      if (!material.isShaderMaterial) return material;
      if (material.transparent)
        return new THREE.MeshBasicMaterial({
          color: 0x509fff,
          transparent: true,
          opacity: 0.055,
          side: THREE.FrontSide,
          depthWrite: false,
        });
      return new THREE.MeshBasicMaterial({ map: proceduralEarthMap() });
    };
    o.material = Array.isArray(o.material)
      ? o.material.map(portable)
      : portable(o.material);
  });
  for (const sprite of sprites) {
    if (!sprite.visible) {
      sprite.removeFromParent();
      continue;
    }
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: sprite.material.map,
        color: sprite.material.color,
        transparent: true,
        opacity: sprite.material.opacity,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    );
    plane.position.copy(sprite.position);
    plane.scale.copy(sprite.scale);
    const parentQ = sprite.parent.getWorldQuaternion(new THREE.Quaternion());
    plane.quaternion.copy(parentQ.invert().multiply(viewQuaternion));
    plane.position.add(
      new THREE.Vector3(
        (0.5 - sprite.center.x) * sprite.scale.x,
        (0.5 - sprite.center.y) * sprite.scale.y,
        0,
      ).applyQuaternion(plane.quaternion),
    );
    plane.name = sprite.userData.annotation ? "annotation" : "glow";
    sprite.parent.add(plane);
    sprite.removeFromParent();
  }
  return await new GLTFExporter().parseAsync(root, {
    binary: true,
    onlyVisible: true,
    maxTextureSize: 1024,
  });
}

export function assetManifest() {
  return {
    schema: "winbrain.catalog/v1",
    reference: { width: 1536, height: 1024 },
    components: [...registry.values()].map((e) => ({
      id: e.id,
      name: e.name,
      category: e.category,
      source: e.source,
      version: e.version || 1,
      referenceRect: e.rect,
      glb: `assets/${e.id}.glb`,
      native: `assets/${e.id}.wb3d.json`,
      preview: `previews/${e.id}.png`,
      mockPreview: `previews/mock-${e.id}.png`,
      previewMode: "asset",
      note: e.shader
        ? "原生资产保留程序地形与大气；GLB 使用便携近似材质。"
        : null,
    })),
  };
}
