export const CAMERA_AUTO_ORBIT = Object.freeze({
  id: "camera.auto-orbit",
  name: "Camera Auto Orbit",
  category: "Camera",
  primitive: "orbitYaw",
  trigger: "ui.auto-rotate",
  tokens: ["motion.speed.camera-orbit"],
  usedBy: ["home.reference-view"],
  description: "用户开启自动旋转后，相机围绕组织世界缓慢旋转。",
});
