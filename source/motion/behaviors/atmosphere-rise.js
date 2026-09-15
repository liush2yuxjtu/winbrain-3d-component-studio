export const ATMOSPHERE_RISE = Object.freeze({
  id: "atmosphere.data-rise",
  name: "Atmosphere Data Rise",
  category: "Data Flow",
  primitive: "riseY",
  trigger: "ambient.loop",
  tokens: ["motion.speed.rise-progress"],
  usedBy: ["world.atmosphere"],
  description: "底层到数据平台之间的发光数据点持续向上流动。",
});
