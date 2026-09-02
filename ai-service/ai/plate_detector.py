"""License-plate region detection inside a vehicle crop.

Baseline implementation: an OpenCV Haar cascade (pretrained, bundled in
models/haarcascade_russian_plate_number.xml - it generalizes reasonably to
rectangular plate-like regions regardless of country). This keeps the
pipeline dependency-light for the prototype. Swap for a dedicated
YOLO plate-detection model later without changing the interface (detect()).
"""

from dataclasses import dataclass
from pathlib import Path

import cv2

DEFAULT_CASCADE_PATH = Path(__file__).resolve().parent.parent / "models" / "haarcascade_russian_plate_number.xml"


@dataclass
class PlateBox:
    bbox: tuple[int, int, int, int]  # x1, y1, x2, y2 in pixels, relative to the crop passed in
    confidence: float


class PlateDetector:
    def __init__(self, cascade_path: Path = DEFAULT_CASCADE_PATH):
        cascade_path = Path(cascade_path)
        if not cascade_path.exists():
            raise FileNotFoundError(
                f"Haar cascade not found at {cascade_path}. "
                "See ai-service/models/README.md for how to fetch it."
            )
        self.cascade = cv2.CascadeClassifier(str(cascade_path))

    def detect(self, vehicle_crop_bgr) -> list[PlateBox]:
        """Find plate-like rectangular regions inside a vehicle crop."""
        if vehicle_crop_bgr is None or vehicle_crop_bgr.size == 0:
            return []

        gray = cv2.cvtColor(vehicle_crop_bgr, cv2.COLOR_BGR2GRAY)
        rects, reject_levels, level_weights = self.cascade.detectMultiScale3(
            gray,
            scaleFactor=1.03,
            minNeighbors=1,
            minSize=(20, 8),
            outputRejectLevels=True,
        )

        plates: list[PlateBox] = []
        for (x, y, w, h), weight in zip(rects, level_weights):
            # levelWeights is an unbounded cascade-stage score; squash it into
            # a rough 0-1 confidence for display purposes.
            confidence = float(min(1.0, max(0.0, weight / 10.0)))
            plates.append(PlateBox(bbox=(int(x), int(y), int(x + w), int(y + h)), confidence=confidence))

        plates.sort(key=lambda p: p.confidence, reverse=True)
        return plates
