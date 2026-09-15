# 3D Flicker Hypothesis & Verification Playbook

This document captures the reusable debugging method used to investigate rotation-related flicker in the WinBrain 3D scene.

## Goal

Do not begin by guessing the fix. First turn a visual complaint such as “it flickers when rotating” into a measurable failure, form a hypothesis, change one relevant variable, and rerun the same test.

## Verification toolchain

### 1. Playwright + real Chrome

Use a real browser to reproduce the user interaction path.

For this project the important path is pointer drag on the WebGL canvas, not only programmatic camera changes or keyboard input.

Capture during the interaction:

- screenshots / frames
- camera yaw / pitch
- DOM label positions
- computed CSS transform
- opacity / visibility
- any relevant rendering state

The browser run is the primary reproduction tool.

### 2. Runtime instrumentation

Read live values from the page instead of relying on visual judgment alone.

Useful examples:

- camera yaw
- camera position
- projected label x/y
- CSS transform matrix
- opacity
- backdrop-filter
- renderOrder

A useful failure signature is: input changes smoothly, but a derived visual coordinate changes discontinuously.

In the rotation flicker investigation, pointer movement was small and continuous while platform labels could jump by roughly 60–87 px in a single step. That converted “looks like flicker” into a measurable bug.

### 3. OpenCV temporal analysis

Flicker is a time-series problem, so use consecutive frames instead of only comparing one screenshot with a reference image.

The project includes `visual-diff/temporal-flicker.py` for adjacent-frame analysis.

Useful outputs include:

- mean absolute delta
- p95 pixel delta
- changed-pixel ratio above thresholds
- median / MAD baseline
- single-frame spike detection

Use OpenCV after a hypothesis-driven code change to check whether abnormal temporal spikes remain.

### 4. Immutable Git commit previews

Always verify the exact commit being discussed.

Prefer a preview URL pinned to the commit hash rather than a moving branch URL. Also test the real hosted preview environment, not only localhost, because browser scaling, compositor behavior, CSP and host behavior can differ.

## Hypothesis loop

Use this loop for 3D visual bugs:

1. Reproduce the visual symptom in the real interaction path.
2. Instrument the relevant runtime values.
3. Find a measurable discontinuity or abnormal state transition.
4. Form one concrete hypothesis.
5. Change the minimum amount of code needed to test that hypothesis.
6. Run the same interaction again.
7. Compare runtime values and consecutive-frame OpenCV results.
8. Accept or reject the hypothesis.
9. Repeat until the measurable failure disappears.

## Example from the platform-label flicker investigation

### Hypothesis 1: transparent-object depth sorting

Evidence:

- glass, additive glow and transparent geometry were all present
- transparent objects had unstable ordering potential

Action:

- deterministic `renderOrder` buckets were added

Result:

- useful for transparent geometry, but the label flicker remained

Conclusion:

- hypothesis was incomplete

### Hypothesis 2: DOM re-rasterization

Evidence:

- projected labels moved using fractional coordinates
- moving labels used `backdrop-filter: blur()`

Action:

- remove moving backdrop blur
- use stable compositor transforms / pixel snapping

Result:

- reduced raster shimmer, but large position jumps could still be reproduced

Conclusion:

- still not the root cause

### Hypothesis 3: stale camera matrix during DOM projection

Evidence:

- pointer input and camera yaw changed continuously
- DOM projected positions occasionally jumped by about 60–87 px
- DOM label projection happened before the WebGL render pass
- camera position / lookAt had changed, but camera world matrices were not explicitly synchronized before `.project(camera)`

Action:

- synchronize the current camera matrix before DOM projection

Result:

- the previously observed large single-step jumps disappeared in the same hosted-preview pointer-drag test
- label movement returned to a continuous range

Conclusion:

- hypothesis verified

## Recommended standard for future 3D visual bugs

For every flicker / jump / shimmer issue, capture both of these forms of evidence:

### Behavioral evidence

- exact URL / commit
- exact interaction used to reproduce
- browser / viewport
- before and after runtime state samples

### Temporal visual evidence

- 30–80 consecutive frames
- OpenCV adjacent-frame metrics
- spike summary for the affected regions

Do not mark a visual bug fixed only because:

- the page loads
- one screenshot looks correct
- localhost looks correct
- the code appears logically correct

A fix is verified only when the same reproduction path no longer produces the measurable failure.

## Minimal reusable checklist

- [ ] Reproduce on the real preview URL
- [ ] Use real pointer / wheel / orbit interaction
- [ ] Log camera state
- [ ] Log projected overlay positions
- [ ] Capture consecutive frames
- [ ] Run temporal OpenCV comparison
- [ ] Change one hypothesis-relevant variable
- [ ] Repeat the identical test
- [ ] Compare before vs after
- [ ] Pin the result to a Git commit
