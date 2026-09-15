export const HERO_AMBIENT = Object.freeze({
  id: "hero.ambient",
  name: "Hero Ambient Loop",
  mode: "parallel",
  loop: true,
  trigger: "scene.ready",
  tracks: [
    "robot.idle",
    "connection.packet-flow",
    "atmosphere.data-rise",
  ],
  optionalTracks: ["camera.auto-orbit"],
  description: "首页默认环境动效并行运行；相机自动旋转由用户单独开启。",
});
