"""
Vehicle detection using a pretrained YOLOv8s model.

YOLOv8s (small) is chosen over YOLOv8n (nano) for better mAP on real
traffic footage while remaining practical on CPU (~10-15 fps on a modern
i7/i9 at 1080p with frame stride).

Interface: detect(frame) -> list[VehicleBox]
All tunables are driven by config.cfg, not hard-coded.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ultralytics import YOLO

from config import cfg


@dataclass
class VehicleBox:
    bbox: tuple[float, float, float, float]   # x1, y1, x2, y2 pixels
    vehicle_class: str
    confidence: float
    class_id: int


class VehicleDetector:
    """
    Detects vehicles in a single BGR frame using pretrained YOLOv8s.

    Uses COCO vehicle classes (car, motorcycle, bus, truck).
    The model is downloaded automatically by Ultralytics on first use.
    """

    def __init__(
        self,
        weights: str | Path | None = None,
        confidence_threshold: float | None = None,
    ):
        self._weights = str(weights or cfg.models.vehicle_detector)
        self._conf_threshold = confidence_threshold or cfg.detection.vehicle_confidence_threshold
        self._vehicle_classes = cfg.detection.vehicle_classes
        # Load model — Ultralytics auto-downloads if the path doesn't exist
        # (yolov8s.pt is fetched from the official release bucket)
        self.model = YOLO(self._weights)

    def detect(self, frame) -> list[VehicleBox]:
        """
        Run detection on a single BGR frame (numpy ndarray from OpenCV).

        Returns a list of VehicleBox in descending confidence order.
        """
        results = self.model.predict(
            frame,
            conf=self._conf_threshold,
            classes=list(self._vehicle_classes.keys()),
            verbose=False,
        )[0]

        boxes: list[VehicleBox] = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in self._vehicle_classes:
                continue
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
            # Reject degenerate boxes
            if x2 <= x1 or y2 <= y1:
                continue
            boxes.append(
                VehicleBox(
                    bbox=(x1, y1, x2, y2),
                    vehicle_class=self._vehicle_classes[cls_id],
                    confidence=float(box.conf[0]),
                    class_id=cls_id,
                )
            )

        boxes.sort(key=lambda b: b.confidence, reverse=True)
        return boxes


# Keep backward-compatible constants for code that imports from here
COCO_VEHICLE_CLASSES = cfg.detection.vehicle_classes
DEFAULT_WEIGHTS_PATH = cfg.models.vehicle_detector
