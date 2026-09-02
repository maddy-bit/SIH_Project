"""Multi-object tracking across frames of a single camera's video.

Uses Ultralytics' built-in ByteTrack integration (model.track(...)), which
does detection + tracking together for efficiency. Yields one TrackedFrame
per processed frame, each carrying zero or more TrackedVehicle boxes with
stable track_ids for as long as ByteTrack can keep them associated.
"""

from dataclasses import dataclass
from pathlib import Path

from ultralytics import YOLO

from ai.vehicle_detector import COCO_VEHICLE_CLASSES, DEFAULT_WEIGHTS_PATH


@dataclass
class TrackedVehicle:
    track_id: int
    bbox: tuple[float, float, float, float]
    vehicle_class: str
    confidence: float


@dataclass
class TrackedFrame:
    frame_number: int
    vehicles: list[TrackedVehicle]


class VehicleTracker:
    def __init__(self, weights: str | Path = DEFAULT_WEIGHTS_PATH, confidence_threshold: float = 0.35):
        self.model = YOLO(str(weights))
        self.confidence_threshold = confidence_threshold

    def track_video(self, video_path: str, frame_stride: int = 1):
        """Stream tracked detections for a video file.

        frame_stride > 1 samples every Nth frame (cheaper, coarser timestamps)
        instead of every frame - practical for a multi-camera prototype.
        """
        results_stream = self.model.track(
            source=video_path,
            conf=self.confidence_threshold,
            classes=list(COCO_VEHICLE_CLASSES.keys()),
            tracker="bytetrack.yaml",
            persist=True,
            stream=True,
            verbose=False,
        )

        for frame_number, result in enumerate(results_stream):
            if frame_stride > 1 and frame_number % frame_stride != 0:
                continue

            vehicles: list[TrackedVehicle] = []
            boxes = result.boxes
            if boxes is not None and boxes.id is not None:
                for box, track_id in zip(boxes, boxes.id):
                    cls_id = int(box.cls[0])
                    if cls_id not in COCO_VEHICLE_CLASSES:
                        continue
                    x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
                    vehicles.append(
                        TrackedVehicle(
                            track_id=int(track_id),
                            bbox=(x1, y1, x2, y2),
                            vehicle_class=COCO_VEHICLE_CLASSES[cls_id],
                            confidence=float(box.conf[0]),
                        )
                    )

            yield TrackedFrame(frame_number=frame_number, vehicles=vehicles), result.orig_img
