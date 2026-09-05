"""
Vehicle color classifier.

Uses HSV K-means clustering on the upper 2/3 of the vehicle crop to
find the dominant body color, avoiding ground / shadow regions.

Supported colors:
  White, Black, Gray, Silver, Red, Blue, Green, Yellow, Orange, Brown, Other

The approach: K-means (k=3) finds dominant color clusters, then the
largest cluster is mapped to a named color using calibrated HSV ranges.
This handles multi-tone vehicles (e.g. white car with dark tinted windows)
by weighting by cluster size rather than pure average.
"""

from __future__ import annotations

from dataclasses import dataclass

import cv2
import numpy as np


# ─── Color definitions in HSV space ──────────────────────────────────────────
# Each entry: (name, [(h_lo, h_hi, s_lo, s_hi, v_lo, v_hi), ...])
# Multiple ranges handle hue wrap-around (red spans 0-10 + 170-180).

_COLOR_RANGES: list[tuple[str, list[tuple[int, int, int, int, int, int]]]] = [
    ("White",  [(0, 180, 0, 40,  200, 255)]),
    ("Black",  [(0, 180, 0, 255,  0,  60)]),
    ("Silver", [(0, 180, 0, 50, 140, 200)]),
    ("Gray",   [(0, 180, 0, 50,  60, 140)]),
    ("Red",    [(0, 10,  80, 255, 80, 255),
                (165, 180, 80, 255, 80, 255)]),
    ("Orange", [(10, 25,  80, 255, 80, 255)]),
    ("Yellow", [(25, 40,  80, 255, 80, 255)]),
    ("Green",  [(40, 90,  40, 255, 40, 255)]),
    ("Blue",   [(90, 130, 50, 255, 50, 255)]),
    ("Brown",  [(10, 25,  50,  80, 40, 120)]),
]

_DEFAULT_COLOR = "Other"


def _classify_hsv(h: float, s: float, v: float) -> str:
    """Map an HSV triple to a color name."""
    hi, si, vi = int(h), int(s), int(v)
    for name, ranges in _COLOR_RANGES:
        for (h_lo, h_hi, s_lo, s_hi, v_lo, v_hi) in ranges:
            if h_lo <= hi <= h_hi and s_lo <= si <= s_hi and v_lo <= vi <= v_hi:
                return name
    return _DEFAULT_COLOR


def _dominant_color_kmeans(
    image_bgr: np.ndarray,
    k: int = 3,
    use_upper_fraction: float = 0.67,
) -> tuple[str, float]:
    """
    Cluster pixel colors in HSV space and return the dominant color name.

    Args:
        image_bgr: full vehicle crop (BGR)
        k: number of K-means clusters
        use_upper_fraction: fraction of image height to use (from top)

    Returns:
        (color_name, confidence_0_to_1)
    """
    h, w = image_bgr.shape[:2]

    # Use upper portion to avoid ground/shadow
    upper_h = max(10, int(h * use_upper_fraction))
    roi = image_bgr[:upper_h, :]

    # Convert to HSV
    hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV).reshape(-1, 3).astype(np.float32)

    if len(hsv) < k:
        return _DEFAULT_COLOR, 0.0

    # K-means clustering
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    try:
        _, labels, centers = cv2.kmeans(
            hsv, k, None, criteria, 3, cv2.KMEANS_PP_CENTERS
        )
    except cv2.error:
        return _DEFAULT_COLOR, 0.0

    # Find largest cluster
    counts = np.bincount(labels.flatten())
    dominant_idx = int(np.argmax(counts))
    dominant_center = centers[dominant_idx]
    dominant_fraction = counts[dominant_idx] / max(len(labels), 1)

    color_name = _classify_hsv(*dominant_center)

    # Confidence is a blend of cluster dominance and saturation clarity
    h_val, s_val, v_val = dominant_center
    # Low saturation = achromatic (white/gray/black) — high confidence if V confirms it
    if s_val < 40:
        confidence = dominant_fraction
    else:
        # Chromatic colors: confidence from cluster fraction + saturation strength
        confidence = dominant_fraction * 0.7 + min(s_val / 255.0, 1.0) * 0.3

    return color_name, float(np.clip(confidence, 0.0, 1.0))


@dataclass
class ColorResult:
    color: str
    confidence: float


class ColorClassifier:
    """Classifies the primary color of a vehicle crop."""

    def __init__(self, k_clusters: int = 3):
        self._k = k_clusters

    def classify(self, vehicle_crop_bgr: np.ndarray) -> ColorResult:
        """
        Classify vehicle color from a vehicle crop.

        Returns a ColorResult with color name and confidence.
        Returns Other/0.0 on failure.
        """
        if vehicle_crop_bgr is None or vehicle_crop_bgr.size == 0:
            return ColorResult(color="Other", confidence=0.0)

        h, w = vehicle_crop_bgr.shape[:2]
        if h < 10 or w < 10:
            return ColorResult(color="Other", confidence=0.0)

        color, conf = _dominant_color_kmeans(vehicle_crop_bgr, k=self._k)
        return ColorResult(color=color, confidence=conf)
