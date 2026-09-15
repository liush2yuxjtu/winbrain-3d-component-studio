"""Detect temporal 3D flicker from sequential screenshots with OpenCV.

Usage:
  python3 visual-diff/temporal-flicker.py path/to/frames/*.png

The script compares adjacent frames after a light Gaussian blur so normal
sub-pixel antialiasing noise is de-emphasized. It reports global and regional
change ratios, plus the worst adjacent-frame pair. A high isolated spike is a
useful signal for one-frame transparency/order flashes.
"""

import json
import sys
from pathlib import Path

import cv2
import numpy as np

REGIONS = {
    "whole": [0, 0, 1536, 1024],
    "applications": [325, 160, 1217, 390],
    "intelligence": [300, 340, 1230, 650],
    "data_foundation": [260, 580, 1260, 900],
    "earth": [120, 835, 1410, 1024],
}


def frame_delta(a, b):
    a = cv2.GaussianBlur(a, (0, 0), 1.2)
    b = cv2.GaussianBlur(b, (0, 0), 1.2)
    diff = cv2.absdiff(a, b)
    magnitude = diff.mean(axis=2)
    return diff, magnitude


def summarize(magnitude, rect):
    x1, y1, x2, y2 = rect
    region = magnitude[y1:y2, x1:x2]
    return {
        "mean_abs_delta": round(float(region.mean()), 4),
        "p95_abs_delta": round(float(np.percentile(region, 95)), 4),
        "changed_ratio_gt_12": round(float((region > 12).mean()), 6),
        "changed_ratio_gt_24": round(float((region > 24).mean()), 6),
    }


def main(values):
    files = [Path(value).resolve() for value in values]
    if len(files) < 2:
        raise SystemExit("Pass at least two sequential PNG/JPEG frames.")

    frames = [cv2.imread(str(file)) for file in files]
    if any(frame is None for frame in frames):
        raise SystemExit("One or more frames could not be read by OpenCV.")

    shape = frames[0].shape
    if any(frame.shape != shape for frame in frames):
        raise SystemExit("All frames must have identical dimensions.")

    pairs = []
    for index in range(len(frames) - 1):
        diff, magnitude = frame_delta(frames[index], frames[index + 1])
        pair = {
            "from": str(files[index]),
            "to": str(files[index + 1]),
            "regions": {
                name: summarize(magnitude, rect)
                for name, rect in REGIONS.items()
                if rect[2] <= shape[1] and rect[3] <= shape[0]
            },
        }
        pair["score"] = pair["regions"].get("whole", summarize(magnitude, [0, 0, shape[1], shape[0]]))["changed_ratio_gt_24"]
        pairs.append(pair)

    scores = np.array([pair["score"] for pair in pairs], dtype=np.float32)
    median = float(np.median(scores))
    mad = float(np.median(np.abs(scores - median)))
    worst_index = int(np.argmax(scores))
    worst = pairs[worst_index]
    spike_threshold = median + max(0.002, 6 * mad)

    result = {
        "opencv": cv2.__version__,
        "frames": len(frames),
        "pairs": len(pairs),
        "median_changed_ratio_gt_24": round(median, 6),
        "mad_changed_ratio_gt_24": round(mad, 6),
        "spike_threshold": round(spike_threshold, 6),
        "worst_pair_index": worst_index,
        "worst_pair": worst,
        "suspected_one_frame_flicker": bool(worst["score"] > spike_threshold),
        "pair_metrics": pairs,
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main(sys.argv[1:])
