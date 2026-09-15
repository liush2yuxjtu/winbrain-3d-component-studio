export const PACKET_FLOW = Object.freeze({
  id: "connection.packet-flow",
  name: "Connection Packet Flow",
  category: "Data Flow",
  primitive: "followPath",
  trigger: "ambient.loop",
  tokens: ["motion.speed.packet-progress"],
  usedBy: ["structure.connections"],
  description: "协作层光点沿项目、专家、AI Agent 与员工之间的曲线循环移动。",
});
