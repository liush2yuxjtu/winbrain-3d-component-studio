// WinBrain Design Tokens
// This is the shared source of truth for reusable UI and 3D design decisions.
// Component-specific geometry stays with each component; repeated design rules live here.

export const TOKENS = {
  color: {
    canvas: "#101720",
    panel: "#182434",
    panelElevated: "#161F2B",
    border: "#31445F",
    divider: "#28313F",
    text: "#DCE7F6",
    textMuted: "#93A9C5",
    textDim: "#8D9AAB",
    accent: "#67CCFF",
    accentBlue: "#668AFF",
    accentViolet: "#9F81FF",
    sceneBackground: "#141B25",
    sceneClear: "#07101B",
    silver: "#C6D5ED",
    white: "#E8F3FF",
    black: "#061126",
    glass: "#365A95",
    tubeGlass: "#ACCDF9",
  },
  typography: {
    familyUi: "Roboto, Arial, sans-serif",
    heroSize: "44px",
    heroWeight: 600,
    layerTitleSize: "20px",
    layerTitleWeight: 500,
    bodySize: "14px",
    captionSize: "12px",
  },
  spacing: {
    4: "4px",
    8: "8px",
    12: "12px",
    16: "16px",
    24: "24px",
    32: "32px",
    48: "48px",
  },
  radius: {
    control: "16px",
    card: "9px",
    panel: "19px",
    dialog: "20px",
  },
  material: {
    default: {
      roughness: 0.25,
      metalness: 0.22,
      clearcoat: 0.8,
      clearcoatRoughness: 0.16,
    },
    silver: { metalness: 0.62, roughness: 0.21 },
    white: { metalness: 0.3, roughness: 0.2 },
    glass: {
      metalness: 0.15,
      roughness: 0.1,
      transmission: 0.55,
      thickness: 0.4,
      ior: 1.38,
      opacity: 0.27,
    },
    tubeGlass: {
      metalness: 0.1,
      roughness: 0.07,
      opacity: 0.16,
    },
  },
  rendering: {
    toneMappingExposure: 1.1,
    environmentIntensity: 0.4,
    pixelRatioMin: 1.5,
    pixelRatioMax: 2,
  },
  lighting: {
    hemisphere: { sky: "#B8D8FF", ground: "#071020", intensity: 0.9 },
    key: { color: "#D5E9FF", intensity: 2.2, position: [-6, 12, 10] },
    rim: { color: "#658CFF", intensity: 1.7, position: [6, 8, -7] },
    front: { color: "#FFFFFF", intensity: 0.65, position: [4, 6, 15] },
  },
  camera: {
    ortho: { left: -10.5, right: 10.5, top: 7, bottom: -7, near: 0.1, far: 160 },
    target: [0, 4.3, 0],
    yaw: Math.PI / 4,
    pitch: 0.17,
    zoom: 1,
    distance: 48,
  },
  layers: {
    applicationY: 7.6,
    intelligenceY: 4.1,
    dataY: 1.05,
  },
};

export const TOKEN_CATALOG = [
  { id: "color.canvas", group: "Color", type: "color", value: TOKENS.color.canvas, css: "--wb-color-canvas", usage: ["catalog", "tokens"] },
  { id: "color.panel", group: "Color", type: "color", value: TOKENS.color.panel, css: "--wb-color-panel", usage: ["catalog", "studio"] },
  { id: "color.panel-elevated", group: "Color", type: "color", value: TOKENS.color.panelElevated, css: "--wb-color-panel-elevated", usage: ["catalog", "motion", "tokens"] },
  { id: "color.border", group: "Color", type: "color", value: TOKENS.color.border, css: "--wb-color-border", usage: ["catalog", "studio", "tokens"] },
  { id: "color.divider", group: "Color", type: "color", value: TOKENS.color.divider, css: "--wb-color-divider", usage: ["studio"] },
  { id: "color.text", group: "Color", type: "color", value: TOKENS.color.text, css: "--wb-color-text", usage: ["catalog", "studio", "tokens"] },
  { id: "color.text-muted", group: "Color", type: "color", value: TOKENS.color.textMuted, css: "--wb-color-text-muted", usage: ["catalog", "studio", "tokens"] },
  { id: "color.text-dim", group: "Color", type: "color", value: TOKENS.color.textDim, css: "--wb-color-text-dim", usage: ["studio"] },
  { id: "color.accent", group: "Color", type: "color", value: TOKENS.color.accent, css: "--wb-color-accent", usage: ["platform.application", "platform.intelligence", "platform.data", "app.chat", "app.workbench", "app.integrations"] },
  { id: "color.accent-blue", group: "Color", type: "color", value: TOKENS.color.accentBlue, css: "--wb-color-accent-blue", usage: ["platform.application", "platform.intelligence", "platform.data"] },
  { id: "color.accent-violet", group: "Color", type: "color", value: TOKENS.color.accentViolet, css: "--wb-color-accent-violet", usage: ["world.scene"] },
  { id: "color.scene-background", group: "Color", type: "color", value: TOKENS.color.sceneBackground, css: "--wb-color-scene-background", usage: ["world.scene"] },
  { id: "color.scene-clear", group: "Color", type: "color", value: TOKENS.color.sceneClear, css: "--wb-color-scene-clear", usage: ["world.scene"] },
  { id: "color.silver", group: "Color", type: "color", value: TOKENS.color.silver, css: "--wb-color-silver", usage: ["world.materials"] },
  { id: "color.white", group: "Color", type: "color", value: TOKENS.color.white, css: "--wb-color-white", usage: ["world.materials"] },
  { id: "color.black", group: "Color", type: "color", value: TOKENS.color.black, css: "--wb-color-black", usage: ["world.materials"] },
  { id: "color.glass", group: "Color", type: "color", value: TOKENS.color.glass, css: "--wb-color-glass", usage: ["platform.application", "platform.intelligence", "platform.data"] },
  { id: "color.tube-glass", group: "Color", type: "color", value: TOKENS.color.tubeGlass, css: "--wb-color-tube-glass", usage: ["structure.columns"] },

  { id: "type.hero.size", group: "Typography", type: "dimension", value: TOKENS.typography.heroSize, css: "--wb-type-hero-size", usage: ["home.hero"] },
  { id: "type.hero.weight", group: "Typography", type: "number", value: TOKENS.typography.heroWeight, css: "--wb-type-hero-weight", usage: ["home.hero"] },
  { id: "type.layer-title.size", group: "Typography", type: "dimension", value: TOKENS.typography.layerTitleSize, css: "--wb-type-layer-title-size", usage: ["platform.application", "platform.intelligence", "platform.data"] },
  { id: "type.body.size", group: "Typography", type: "dimension", value: TOKENS.typography.bodySize, css: "--wb-type-body-size", usage: ["home", "catalog", "studio", "tokens"] },
  { id: "type.caption.size", group: "Typography", type: "dimension", value: TOKENS.typography.captionSize, css: "--wb-type-caption-size", usage: ["catalog", "studio", "tokens"] },
  { id: "type.family.ui", group: "Typography", type: "font-family", value: TOKENS.typography.familyUi, css: "--wb-type-family-ui", usage: ["home", "catalog", "studio", "tokens"] },
  { id: "type.layer-title.weight", group: "Typography", type: "number", value: TOKENS.typography.layerTitleWeight, css: "--wb-type-layer-title-weight", usage: ["platform.application", "platform.intelligence", "platform.data"] },

  { id: "space.4", group: "Spacing", type: "dimension", value: TOKENS.spacing[4], css: "--wb-space-4", usage: ["catalog", "studio", "tokens"] },
  { id: "space.8", group: "Spacing", type: "dimension", value: TOKENS.spacing[8], css: "--wb-space-8", usage: ["catalog", "studio", "tokens"] },
  { id: "space.12", group: "Spacing", type: "dimension", value: TOKENS.spacing[12], css: "--wb-space-12", usage: ["catalog", "studio", "tokens"] },
  { id: "space.16", group: "Spacing", type: "dimension", value: TOKENS.spacing[16], css: "--wb-space-16", usage: ["catalog", "studio", "tokens"] },
  { id: "space.24", group: "Spacing", type: "dimension", value: TOKENS.spacing[24], css: "--wb-space-24", usage: ["home", "catalog", "studio", "tokens"] },
  { id: "space.32", group: "Spacing", type: "dimension", value: TOKENS.spacing[32], css: "--wb-space-32", usage: ["home", "tokens"] },
  { id: "space.48", group: "Spacing", type: "dimension", value: TOKENS.spacing[48], css: "--wb-space-48", usage: ["home", "catalog"] },

  { id: "radius.control", group: "Radius", type: "dimension", value: TOKENS.radius.control, css: "--wb-radius-control", usage: ["studio", "tokens"] },
  { id: "radius.card", group: "Radius", type: "dimension", value: TOKENS.radius.card, css: "--wb-radius-card", usage: ["catalog"] },
  { id: "radius.panel", group: "Radius", type: "dimension", value: TOKENS.radius.panel, css: "--wb-radius-panel", usage: ["home", "studio", "tokens"] },
  { id: "radius.dialog", group: "Radius", type: "dimension", value: TOKENS.radius.dialog, css: "--wb-radius-dialog", usage: ["home.dialog"] },

  { id: "material.default.roughness", group: "3D Material", type: "number", value: TOKENS.material.default.roughness, css: "--wb-material-default-roughness", usage: ["world.materials"] },
  { id: "material.default.metalness", group: "3D Material", type: "number", value: TOKENS.material.default.metalness, css: "--wb-material-default-metalness", usage: ["world.materials"] },
  { id: "material.glass.opacity", group: "3D Material", type: "number", value: TOKENS.material.glass.opacity, css: "--wb-material-glass-opacity", usage: ["platform.application", "platform.intelligence", "platform.data"] },
  { id: "material.glass.roughness", group: "3D Material", type: "number", value: TOKENS.material.glass.roughness, css: "--wb-material-glass-roughness", usage: ["platform.application", "platform.intelligence", "platform.data"] },
  { id: "material.glass.transmission", group: "3D Material", type: "number", value: TOKENS.material.glass.transmission, css: "--wb-material-glass-transmission", usage: ["platform.application", "platform.intelligence", "platform.data"] },
  { id: "material.glass.ior", group: "3D Material", type: "number", value: TOKENS.material.glass.ior, css: "--wb-material-glass-ior", usage: ["platform.application", "platform.intelligence", "platform.data"] },

  { id: "light.environment.intensity", group: "Lighting", type: "number", value: TOKENS.rendering.environmentIntensity, css: "--wb-light-environment-intensity", usage: ["world.scene"] },
  { id: "light.key.intensity", group: "Lighting", type: "number", value: TOKENS.lighting.key.intensity, css: "--wb-light-key-intensity", usage: ["world.scene"] },
  { id: "light.rim.intensity", group: "Lighting", type: "number", value: TOKENS.lighting.rim.intensity, css: "--wb-light-rim-intensity", usage: ["world.scene"] },
  { id: "light.front.intensity", group: "Lighting", type: "number", value: TOKENS.lighting.front.intensity, css: "--wb-light-front-intensity", usage: ["world.scene"] },
  { id: "render.exposure", group: "Lighting", type: "number", value: TOKENS.rendering.toneMappingExposure, css: "--wb-render-exposure", usage: ["world.scene"] },

  { id: "camera.yaw", group: "Camera", type: "radian", value: TOKENS.camera.yaw, css: "--wb-camera-yaw", usage: ["home.reference-view", "studio.mock-view"] },
  { id: "camera.pitch", group: "Camera", type: "radian", value: TOKENS.camera.pitch, css: "--wb-camera-pitch", usage: ["home.reference-view", "studio.mock-view"] },
  { id: "camera.zoom", group: "Camera", type: "number", value: TOKENS.camera.zoom, css: "--wb-camera-zoom", usage: ["home.reference-view", "studio.mock-view"] },
  { id: "camera.distance", group: "Camera", type: "number", value: TOKENS.camera.distance, css: "--wb-camera-distance", usage: ["home.reference-view", "studio.mock-view"] },

  { id: "layer.application.y", group: "Layout", type: "scene-unit", value: TOKENS.layers.applicationY, css: "--wb-layer-application-y", usage: ["platform.application", "app.chat", "app.workbench", "app.integrations"] },
  { id: "layer.intelligence.y", group: "Layout", type: "scene-unit", value: TOKENS.layers.intelligenceY, css: "--wb-layer-intelligence-y", usage: ["platform.intelligence", "actor.projects", "actor.experts", "actor.ai-agents", "actor.employees"] },
  { id: "layer.data.y", group: "Layout", type: "scene-unit", value: TOKENS.layers.dataY, css: "--wb-layer-data-y", usage: ["platform.data", "data.people", "data.documents", "data.tasks", "data.business-data", "data.systems", "data.devices", "data.external-data"] },
];

export function hex(value) {
  return Number.parseInt(String(value).replace("#", ""), 16);
}

export function cssTokenEntries() {
  return TOKEN_CATALOG.filter((token) => token.css);
}
