import { MOTION_TOKENS } from "./tokens.js";
import { floatY } from "./primitives/float-y.js";
import { followPath } from "./primitives/follow-path.js";
import { riseY } from "./primitives/rise-y.js";
import { orbitYaw } from "./primitives/orbit-yaw.js";

const LEGACY_BEHAVIOR = Object.freeze({
  robot: "robot.idle",
  packet: "connection.packet-flow",
  rise: "atmosphere.data-rise",
});

function createBinding(record) {
  const legacyKind = record.kind;
  const behavior = LEGACY_BEHAVIOR[legacyKind] || legacyKind;
  record.motionKind = legacyKind;
  record.motionBehavior = behavior;
  // The old homepage frame loop ignores namespaced kinds; Motion Runtime owns them now.
  record.kind = `motion:${behavior}`;
  return { behavior, record };
}

export function createMotionRuntime({ animated, view, updateCamera, pos, reducedMotion = false }) {
  const bindings = animated.map(createBinding);
  const state = {
    elapsed: 0,
    paused: Boolean(reducedMotion),
    autoRotate: false,
    enabled: true,
    running: false,
    frames: 0,
  };
  let raf = 0;
  let last = performance.now();

  function applyBinding({ behavior, record }) {
    if (behavior === "robot.idle") {
      floatY({
        object: record.object,
        base: record.base,
        time: state.elapsed,
        angularSpeed: MOTION_TOKENS.speed.robotFloat,
        amplitude: MOTION_TOKENS.amplitude.robotFloatY,
      });
    } else if (behavior === "connection.packet-flow") {
      followPath({
        object: record.object,
        curve: record.curve,
        time: state.elapsed,
        speed: MOTION_TOKENS.speed.packetProgress,
        offset: record.offset,
      });
    } else if (behavior === "atmosphere.data-rise") {
      riseY({
        object: record.object,
        x: record.x,
        d: record.d,
        lo: record.lo,
        hi: record.hi,
        time: state.elapsed,
        speed: MOTION_TOKENS.speed.riseProgress,
        offset: record.offset,
        pos,
      });
    }
  }

  function tick(deltaSeconds) {
    if (!state.enabled) return;
    const dt = Math.max(0, Math.min(MOTION_TOKENS.clock.maxDelta, deltaSeconds));
    if (!state.paused) state.elapsed += dt;
    if (state.autoRotate) {
      orbitYaw({
        view,
        dt,
        speed: MOTION_TOKENS.speed.cameraOrbit,
        updateCamera,
      });
    }
    if (!state.paused) for (const binding of bindings) applyBinding(binding);
    state.frames += 1;
  }

  function frame(now) {
    if (!state.running) return;
    const dt = (now - last) / 1000;
    last = now;
    tick(dt);
    raf = requestAnimationFrame(frame);
  }

  const api = {
    start() {
      if (state.running) return api;
      state.running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
      return api;
    },
    stop() {
      state.running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      return api;
    },
    tick,
    setPaused(value) {
      state.paused = Boolean(value);
      return state.paused;
    },
    togglePaused() {
      return api.setPaused(!state.paused);
    },
    setAutoRotate(value) {
      state.autoRotate = Boolean(value);
      return state.autoRotate;
    },
    toggleAutoRotate() {
      return api.setAutoRotate(!state.autoRotate);
    },
    setEnabled(value) {
      state.enabled = Boolean(value);
      last = performance.now();
      return state.enabled;
    },
    inspect() {
      return {
        ...state,
        bindings: bindings.map(({ behavior, record }) => ({
          behavior,
          sourceKind: record.motionKind,
        })),
      };
    },
  };
  return api;
}

export function attachHomeMotionControls(runtime, { renderer }) {
  const rotate = document.querySelector("#rotate");
  const pause = document.querySelector("#pause");
  if (rotate) {
    rotate.onclick = () => {
      const active = runtime.toggleAutoRotate();
      rotate.setAttribute("aria-pressed", String(active));
    };
  }
  if (pause) {
    pause.onclick = () => {
      const paused = runtime.togglePaused();
      pause.setAttribute("aria-pressed", String(paused));
      pause.textContent = paused ? "继续光流" : "暂停光流";
    };
  }

  const stopAutoRotate = () => {
    runtime.setAutoRotate(false);
    if (rotate) rotate.setAttribute("aria-pressed", "false");
  };
  renderer?.domElement?.addEventListener("pointerdown", stopAutoRotate, { capture: true });
  document.querySelector("#reset")?.addEventListener("click", stopAutoRotate, { capture: true });
  document.querySelector("[data-home]")?.addEventListener("click", stopAutoRotate, { capture: true });
  document.querySelector(".brand")?.addEventListener("click", stopAutoRotate, { capture: true });

  if (window.winbrain) {
    const oldStats = window.winbrain.stats;
    const oldReset = window.winbrain.reset;
    const oldRendering = window.winbrain.setRenderingEnabled;
    window.winbrain.motion = runtime;
    window.winbrain.setPaused = (value) => runtime.setPaused(value);
    window.winbrain.setRenderingEnabled = (value) => {
      runtime.setEnabled(value);
      return oldRendering?.(value);
    };
    window.winbrain.reset = (...args) => {
      stopAutoRotate();
      return oldReset?.(...args);
    };
    window.winbrain.stats = () => ({
      ...(oldStats ? oldStats() : {}),
      motion: runtime.inspect(),
    });
  }
}
