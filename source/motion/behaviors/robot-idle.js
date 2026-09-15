export const ROBOT_IDLE = Object.freeze({
  id: "robot.idle",
  name: "Robot Idle Float",
  category: "Ambient",
  primitive: "floatY",
  trigger: "ambient.loop",
  tokens: ["motion.speed.robot-float", "motion.amplitude.robot-float-y"],
  usedBy: ["actor.ai-agents"],
  description: "AI 机器人在底座上做轻微上下浮动。",
});
