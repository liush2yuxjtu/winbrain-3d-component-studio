import { attachSceneSettings } from "./settings/scene.js";
import { buildWorld } from "./world.js";
import { animated, view, updateCamera, pos, renderer } from "./core.js";
import { createMotionRuntime, attachHomeMotionControls } from "./motion/runtime.js";

// Use the same loaded typefaces in the homepage and component previews.
document.fonts.ready.then(async () => {
  buildWorld();
  const motion = createMotionRuntime({
    animated,
    view,
    updateCamera,
    pos,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  });
  motion.start();
  await import("./home.js");
  attachHomeMotionControls(motion, { renderer });
  attachSceneSettings({ motion });
});
