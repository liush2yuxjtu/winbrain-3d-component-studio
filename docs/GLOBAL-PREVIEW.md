# Global preview for PR #3

Entry: https://liush2yuxjtu.github.io/winbrain-3d-component-studio/pr-preview/global-880c52f/global.html

The standalone `global.html` is a review surface for the complete scene, not a new model revision. It is served alongside the verified preview assets. The published preview also includes `eli5.html`, `preview.json`, and a `comparison.html` compatibility route.

## Provenance

- Model source: `880c52f19da923a216c26addb997ad1a1235ab19`
- Model exports and scene snapshots: `fb6a10f901868f951aee9ff8e6df8ed445feca03`
- Global HTML source: `f14ae67b66a6f86a150f01b995dabf7dc12b2966`
- Initial preview publication: `54e1f2c1158bb3de147e732acd3e70119ebd1cb4`

The publication reuses the exact previous preview subtree and adds the global viewer, metadata, QA report and comparison route. It adds only `pr-preview/global-880c52f/` and `pr-preview/global/` on the Pages branch. Production root and historical previews remain unchanged. PR #3 is not merged.

## Small preview defects addressed

1. The previous published scene had a `comparison.html` link but that file was absent in the published preview. The new preview includes a compatibility redirect to `global.html#compare`, using the actual current scene screenshot and original static PNG.
2. Full-scene review controls are now outside the scaled 1536px artwork. Buttons have at least 44px height; mobile comparison panels stack rather than overflowing.
3. The page distinguishes current code snapshot, live WebGL, original static design and side-by-side comparison. Its default is explicitly a screenshot, not a claimed live render.
4. Model, artifact and viewer revisions are separately recorded.
5. Live WebGL loads on request, defaults to paused animation, and stops rendering when hidden. A loading timeout retains a labeled snapshot and direct scene link rather than a permanent spinner.

## Local browser verification

The authored HTML was rendered in Chromium at 1440x1080, 768x1024 and 390x844, including dark and light browser preferences and reduced motion. For local layout verification only, relative image paths were replaced with data URIs containing the unchanged checked-in PNG bytes. No model or reference image was altered.

Passed: images load; no horizontal overflow; view controls are at least 44px high; exactly one mode is selected; current/reference/compare switching; keyboard Enter activation; no page JavaScript errors; simulated live loading timeout keeps an explicitly labeled snapshot and a direct-scene fallback.

Live iframe behavior is not covered by this offline layout test and is checked separately on the deployed site. The existing 37 model/browser checks and 22 GLB reimports belong to the model validation run, not a new model test run for this HTML-only change.

## Limits

Existing design differences remain. This is a limited preview usability pass, not full visual acceptance, a complete animated flicker audit, or a claim of an exact reference match.
