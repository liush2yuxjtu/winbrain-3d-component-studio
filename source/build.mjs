import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const root = dirname(fileURLToPath(import.meta.url));
async function bundle(entry) {
  const result = await build({
    entryPoints: [join(root, entry)],
    bundle: true,
    format: "iife",
    target: "es2022",
    minify: true,
    write: false,
    legalComments: "inline",
  });
  return result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");
}
const home = await readFile(join(root, "shell.html"), "utf8");
const homeScript = await bundle("scene.js");
await writeFile(
  join(root, "..", "index.html"),
  home.replace("<!-- THREE_SCENE -->", () => `<script>${homeScript}</script>`),
);
const studioTemplate = await readFile(
  join(root, "editor", "studio-shell.html"),
  "utf8",
);
const style = await readFile(join(root, "editor", "studio.css"), "utf8");
const homeStyle = home.split("<style>")[1].split("</style>")[0];
const homeContent =
  home.slice(home.indexOf('<header class="header">'), home.indexOf("</main>")) +
  home.slice(
    home.indexOf('<svg width="0"'),
    home.indexOf("<!-- THREE_SCENE -->"),
  );
const reference = await readFile(join(root, "..", "assets", "reference.png"));
const studioScript = await bundle("editor/studio.js");
const studio = studioTemplate
  .replace("<!-- HOME_STYLE -->", () => homeStyle)
  .replace("<!-- STUDIO_STYLE -->", () => style)
  .replace("<!-- HOME_CONTENT -->", () => homeContent)
  .replace(
    "<!-- REFERENCE_IMAGE -->",
    () => "data:image/png;base64," + reference.toString("base64"),
  )
  .replace("<!-- STUDIO_SCRIPT -->", () => `<script>${studioScript}</script>`);
await writeFile(join(root, "..", "studio.html"), studio);
console.log(
  "Built index.html and studio.html. Both embed their runtime. The reference image is embedded only in Studio.",
);
