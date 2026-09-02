"""Vehicle detection using a pretrained YOLOv8 model.

No custom training - this wraps Ultralytics' COCO-pretrained weights and
filters to the vehicle-relevant classes. Swappable for RT-DETR or a
fine-tuned model later without changing the interface (detect()).
"""

from dataclasses import dataclass
from pathlib import Path

from ultralytics import YOLO

# COCO class ids -> our vehicle taxonomy. auto-rickshaw has no COCO class;
# it will typically be detected as "motorcycle" or "car" depending on shape.
COCO_VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

DEFAULT_WEIGHTS_PATH = Path(__file__).resolve().parent.parent / "models" / "yolov8n.pt"


@dataclass
class VehicleBox:
    bbox: tuple[float, float, float, float]  # x1, y1, x2, y2 in pixels
    vehicle_class: str
    confidence: float


class VehicleDetector:
    """Detects vehicles in a single frame using a pretrained YOLOv8 model."""

    def __init__(self, weights: str | Path = DEFAULT_WEIGHTS_PATH, confidence_threshold: float = 0.35):
        # ultralytics auto-downloads to this path on first use if missing.
        self.model = YOLO(str(weights))
        self.confidence_threshold = confidence_threshold

    def detect(self, frame) -> list[VehicleBox]:
        """Run detection on a single BGR frame (numpy array from OpenCV)."""
        results = self.model.predict(
            frame,
            conf=self.confidence_threshold,
            classes=list(COCO_VEHICLE_CLASSES.keys()),
            verbose=False,
        )[0]

        boxes: list[VehicleBox] = []
        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in COCO_VEHICLE_CLASSES:
                continue
            x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
            boxes.append(
                VehicleBox(
                    bbox=(x1, y1, x2, y2),
                    vehicle_class=COCO_VEHICLE_CLASSES[cls_id],
                    confidence=float(box.conf[0]),
                )
            )
        return boxes
