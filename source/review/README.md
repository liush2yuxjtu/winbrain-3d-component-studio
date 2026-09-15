# P0/P1 visual review

The review covers 16 corrected assets. Both builds use the same Chromium,
1536 x 1024 viewport, DPR 1, reduced motion, clean storage and original camera.
Actual GPU backbuffer pixels are copied 1:1 into an identically sized 2D canvas
before the DOM screenshot to avoid a headless WebGL compositor stall. Frozen
stability uses the native GPU backbuffers directly. No reference-image pixels
are inserted into the candidate render; no registration or warping is applied.

Run the candidate on port 8765 and baseline commit
`bc2a884927706d66fe107d8c0c2c2b7af81ba853` on port 8766 after building both.
With Playwright 1.63.0, its Chromium browser, numpy 2.2.6 and OpenCV 4.12.0.88:

```sh
node --test source/review/storage-scope.test.mjs
node source/review/capture.mjs
python3 source/review/compare.py
(cd source && node build-catalog.mjs)
```

All 22 GLBs are parsed again after export. Native files and both preview modes
are regenerated, and their hashes are recorded. Per-asset metrics measure the
full-scene reference rectangle, including neighbors and background. They are
not isolated-model scores or approval percentages. Mixed results stay visible.

A documented 1053-draw compatibility reservation keeps the previous Earth and
atmosphere sequence while the city adopts its own seeded layout. A separate
migration should replace the remaining shared environment stream.

Preview paths have independent layout, upload and BroadcastChannel storage.
Frozen-frame stability is not a complete interactive animation/flicker audit.

Screen backing colors were calibrated against 16 fixed sRGB candidates. To recalibrate deliberately, run `node source/review/calibrate-apps.mjs` with the candidate served on port 8765 before capture. Normal tests use the committed palette and do not retune colors. Only material colors change; camera, geometry, reference and text remain fixed. Scores and all candidates are in `asset-review/palette-calibration.json`; the final joint render is measured again independently. Regular `npm run build` uses the committed palette and requires no browser or calibration step.
