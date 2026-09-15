# WinBrain Motion System

Motion is split from Assets and from scene composition.

## Layers

1. **Motion Tokens** — reusable speed, amplitude and clock values (`tokens.js`).
2. **Primitives** — smallest reusable operations (`floatY`, `followPath`, `riseY`, `orbitYaw`).
3. **Bindings** — runtime records connect primitives to actual scene objects and channels.
4. **Behaviors** — semantic motions such as `robot.idle` and `connection.packet-flow`.
5. **Timelines** — compose multiple behaviors, currently `hero.ambient`.
6. **Triggers** — define when behavior starts/stops (`scene.ready`, `ui.auto-rotate`, `ui.pause`, `pointer.drag`).

## Runtime ownership

The homepage creates components first. Existing component animation records are then adopted by `runtime.js`, which namespaces the old `kind` values so the legacy homepage frame loop no longer owns those motion formulas. The Motion Runtime applies the same values through reusable primitives.

Current migrated motions:

- `actor.ai-agents` → `robot.idle`
- `structure.connections` → `connection.packet-flow`
- `world.atmosphere` → `atmosphere.data-rise`
- homepage camera → `camera.auto-orbit`

`motion.html` and `motion-manifest.json` are generated from `library.js` so the audit page and machine-readable contract stay aligned with the runtime source. The generated-page workflow tracks both existing outputs and newly-created Motion outputs.
