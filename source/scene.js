import { buildWorld } from "./world.js";
// Use the same loaded typefaces in the homepage and component previews.
document.fonts.ready.then(() => {
  buildWorld();
  import("./home.js");
});
