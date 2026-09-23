# WinBrain status and follow-ups

Snapshot: 2026-09-23. Source baseline: [`4bc3f86`](https://github.com/liush2yuxjtu/winbrain-3d-component-studio/commit/4bc3f868068efd1253323cf9c62aa1977b6bcb7f). This document separates shipped functionality, recorded evidence, and proposed follow-ups. Recheck the current revision before using these numbers as an acceptance result.

## Shipped

- A live three-layer 3D world and Component Studio with 22 registered assets.
- 22 GLB exports, 22 native assets, and 44 asset preview images.
- Token / Motion / UI / Asset sources, 28 documented UI components, and 28 isolated UI previews plus their index.
- `manifest.json`, `DESIGN.md`, `components.html`, visual comparison tools, and the existing verification scripts.
- PRs #1 through #9 were merged as of this snapshot. [Pages deployment 35715930152](https://github.com/liush2yuxjtu/winbrain-3d-component-studio/actions/runs/35715930152) succeeded for the source baseline.

The editor and asset tooling are implemented. Labels such as AI Chat and Experts within the scene do not establish a connected business backend.

## Design System v2 boundary

[PR #9](https://github.com/liush2yuxjtu/winbrain-3d-component-studio/pull/9) added four Markdown files: the v2 entrypoint, visual language, Screen contract, and Flow contract. It changed no runtime behavior.

The `schemas/` layer named in the v2 entrypoint is a proposed layer; PR #9 did not add schema files. Example Screen IDs and the Flow diagram are contracts, not implemented Screen instances or verified end-to-end workflows. Existing pages can supply the first concrete implementation.

## Evidence

| Evidence | Scope |
|---|---|
| `verification.json`: 33 passing checks | Recorded asset/editor verification; not rerun by this documentation update |
| `design-system-verification.json`: 47 passing checks, 32/32 style parity | Recorded local Chromium verification; the report identifies localhost as its base |
| Public home and Studio spot-check, 2026-09-23 | Home visibly rendered; Explore expanded controls; Studio loaded 22 components and switched to independent 3D with the robot visibly rendered |
| `npm --prefix source run check:docs` | Recomputes the design audit and checks documentation plus four regression limits |

The public spot-check does not replace the full browser suite, mobile acceptance, persistence/import/export verification, or temporal flicker analysis. MAE and SSIM in `visual-diff/` are historical image measurements, not a fidelity percentage.

## Triage

No P0 outage was established by the checks above. Priorities below are proposed execution order, not claims that work has started.

| Priority | Follow-up | Acceptance |
|---|---|---|
| P1 | Close the review coverage gap around the final #7/#8 fixes | Review the exact final diffs, resolve findings, and preserve the review evidence; a rate-limit notice is not a completed review |
| P1 | Implement one v2 Screen/Flow path using the existing asset gallery, editor, and world | Machine-readable instances reference real registry IDs and renderable states; validate a gallery → editor → world path in a real browser with exact-revision evidence and persistence/reload checks |
| P2 | Resolve Token and radius consistency | Follow `DESIGN.md` §5.7; inline homepage Token definitions without weakening CSP; explicitly decide the radius scale, editor palette, and comparison/global participation before changing appearance; rerun relevant visual/runtime checks |
| P2 | Consolidate repeated labels and page headers | Implement shared definitions, regenerate previews, and verify shipping/preview parity plus keyboard and selected-state semantics |

The audit currently allows nine duplicated radius literal occurrences. The 462 raw colour occurrences are not 462 tasks: the audit also reports 323 distinct values and 284 singletons. Use the existing audit and distinguish deliberate one-off 3D values from copies of existing Tokens.

Independent game VFX work belongs to its own project. It is not a prerequisite for using this asset/component studio.

## Recheck before changing scope

Run `/verify` before a PR as required by `AGENTS.md`. For executable changes, existing tests and real caller behavior both matter. This documentation correction adds no executable behavior; its runtime verdict is `SKIP`.
