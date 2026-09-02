"""Vehicle re-identification: appearance embedding + similarity.

Baseline implementation for the prototype: an HSV color histogram of the
vehicle crop. It's cheap, needs no extra model weights, and is "good
enough" to distinguish e.g. a white SUV from a red hatchback when plate
evidence is missing or unreadable on one camera.

The embed()/similarity() interface is the integration point for a real
learned Re-ID embedding model (e.g. a ResNet/OSNet vehicle-ReID network)
later - callers never need to change.
"""

from dataclasses import dataclass

import cv2
import numpy as np


@dataclass
class ReIdEmbedding:
    vector: np.ndarray


class ReIdService:
    def embed(self, vehicle_crop_bgr) -> ReIdEmbedding | None:
        if vehicle_crop_bgr is None or vehicle_crop_bgr.size == 0:
            return None

        hsv = cv2.cvtColor(vehicle_crop_bgr, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1], None, [30, 32], [0, 180, 0, 256])
        cv2.normalize(hist, hist)
        return ReIdEmbedding(vector=hist.flatten())

    def similarity(self, a: ReIdEmbedding, b: ReIdEmbedding) -> float:
        """Returns a 0-1 similarity score (correlation of color histograms)."""
        score = cv2.compareHist(
            a.vector.astype("float32"), b.vector.astype("float32"), cv2.HISTCMP_CORREL
        )
        return float(max(0.0, min(1.0, (score + 1.0) / 2.0)))
