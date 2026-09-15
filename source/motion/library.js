import { MOTION_TOKEN_CATALOG } from "./tokens.js";
import { ROBOT_IDLE } from "./behaviors/robot-idle.js";
import { PACKET_FLOW } from "./behaviors/packet-flow.js";
import { ATMOSPHERE_RISE } from "./behaviors/atmosphere-rise.js";
import { CAMERA_AUTO_ORBIT } from "./behaviors/camera-auto-orbit.js";
import { HERO_AMBIENT } from "./timelines/hero-ambient.js";

export const MOTION_PRIMITIVES = Object.freeze([
  { id: "floatY", name: "Float Y", channel: "position.y", description: "围绕基准 Y 做正弦浮动。" },
  { id: "followPath", name: "Follow Path", channel: "position.xyz", description: "沿 Curve 的 0–1 进度循环移动。" },
  { id: "riseY", name: "Rise Y", channel: "position.xyz", description: "在给定上下边界之间向上循环。" },
  { id: "orbitYaw", name: "Orbit Yaw", channel: "camera.yaw", description: "按速度持续改变相机 yaw。" },
]);

export const MOTION_BEHAVIORS = Object.freeze([
  ROBOT_IDLE,
  PACKET_FLOW,
  ATMOSPHERE_RISE,
  CAMERA_AUTO_ORBIT,
]);

export const MOTION_TIMELINES = Object.freeze([HERO_AMBIENT]);

export const MOTION_TRIGGERS = Object.freeze([
  { id: "scene.ready", name: "Scene Ready", description: "三维世界构建完成后启动环境 Timeline。" },
  { id: "ambient.loop", name: "Ambient Loop", description: "场景处于运行状态时持续循环。" },
  { id: "ui.auto-rotate", name: "Auto Rotate Toggle", description: "用户点击自动旋转按钮后启停。" },
  { id: "ui.pause", name: "Pause Motion Toggle", description: "用户暂停或继续环境光流。" },
  { id: "pointer.drag", name: "Pointer Drag", description: "开始手动旋转场景时停止自动相机旋转。" },
]);

export const MOTION_LIBRARY = Object.freeze({
  schema: "winbrain.motion/v1",
  tokens: MOTION_TOKEN_CATALOG,
  primitives: MOTION_PRIMITIVES,
  behaviors: MOTION_BEHAVIORS,
  timelines: MOTION_TIMELINES,
  triggers: MOTION_TRIGGERS,
});

export function motionsForAsset(assetId) {
  return MOTION_BEHAVIORS.filter((motion) => motion.usedBy.includes(assetId));
}
