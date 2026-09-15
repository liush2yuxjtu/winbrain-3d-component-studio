export const MOTION_TOKENS = Object.freeze({
  clock: Object.freeze({ maxDelta: 0.05 }),
  speed: Object.freeze({
    cameraOrbit: 0.1,
    robotFloat: 1.6,
    packetProgress: 0.16,
    riseProgress: 0.23,
  }),
  amplitude: Object.freeze({ robotFloatY: 0.024 }),
});

export const MOTION_TOKEN_CATALOG = Object.freeze([
  { id: "motion.clock.max-delta", group: "Clock", value: 0.05, unit: "s", usage: ["hero.ambient"] },
  { id: "motion.speed.camera-orbit", group: "Speed", value: 0.1, unit: "rad/s", usage: ["camera.auto-orbit"] },
  { id: "motion.speed.robot-float", group: "Speed", value: 1.6, unit: "rad/s", usage: ["robot.idle"] },
  { id: "motion.speed.packet-progress", group: "Speed", value: 0.16, unit: "path/s", usage: ["connection.packet-flow"] },
  { id: "motion.speed.rise-progress", group: "Speed", value: 0.23, unit: "path/s", usage: ["atmosphere.data-rise"] },
  { id: "motion.amplitude.robot-float-y", group: "Amplitude", value: 0.024, unit: "scene", usage: ["robot.idle"] },
]);
