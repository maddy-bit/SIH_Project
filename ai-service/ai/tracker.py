"""
Per-camera multi-object vehicle tracker using Ultralytics ByteTrack.

Key design decision: track IDs are ALWAYS scoped to a camera_id.
A track_id=17 from CAM-01 is completely different from track_id=17
from CAM-02. The camera_id is always carried alongside the track_id.

TrackedVehicle carries camera_id explicitly so downstream code can
never accidentally treat local IDs as global.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from ultralytics import YOLO

from config import cfg


@dataclass
class TrackedVehicle:
    camera_id: str                              # ← always explicit
    track_id: int                               # local to this camera only
    bbox: tuple[float, float, float, float]     # x1, y1, x2, y2 pixels
    vehicle_class: str
    confidence: float
    class_id: int


@dataclass
class TrackedFrame:
    camera_id: str
    frame_number: int
    timestamp_seconds: float        # elapsed time in the video
    vehicles: list[TrackedVehicle]


class VehicleTracker:
    """
    Wraps Ultralytics ByteTrack for single-camera tracking.

    The tracker is stateful: it must be initialized fresh for each video
    (do NOT share one VehicleTracker instance across cameras).
    """

    def __init__(
        self,
        camera_id: str,
        weights: str | Path | None = None,
        confidence_threshold: float | None = None,
    ):
        self.camera_id = camera_id
        self._weights = str(weights or cfg.models.vehicle_detector)
        self._conf = confidence_threshold or cfg.detection.vehicle_confidence_threshold
        self._vehicle_classes = cfg.detection.vehicle_classes
        self.model = YOLO(self._weights)

    def track_video(
        self,
        video_path: str,
        frame_stride: int | None = None,
    ):
        """
        Stream tracked detections for a video file.

        Yields (TrackedFrame, original_frame_bgr) for every sampled frame.
        frame_stride > 1 samples every Nth frame (cheaper, coarser timestamps).

        Args:
            video_path: path to a video file or RTSP/HTTP stream URL
            frame_stride: override cfg.tracking.frame_stride
        """
        import cv2

        stride = frame_stride if frame_stride is not None else cfg.tracking.frame_stride

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        cap.release()

        results_stream = self.model.track(
            source=video_path,
            conf=self._conf,
            classes=list(self._vehicle_classes.keys()),
            tracker=cfg.tracking.tracker_config,
            persist=True,
            stream=True,
            verbose=False,
        )

        for frame_number, result in enumerate(results_stream):
            if stride > 1 and frame_number % stride != 0:
                continue

            timestamp_seconds = frame_number / fps
            vehicles: list[TrackedVehicle] = []
            boxes = result.boxes

            if boxes is not None and boxes.id is not None:
                for box, track_id in zip(boxes, boxes.id):
                    cls_id = int(box.cls[0])
                    if cls_id not in self._vehicle_classes:
                        continue
                    x1, y1, x2, y2 = (float(v) for v in box.xyxy[0].tolist())
                    if x2 <= x1 or y2 <= y1:
                        continue
                    vehicles.append(
                        TrackedVehicle(
                            camera_id=self.camera_id,
                            track_id=int(track_id),
                            bbox=(x1, y1, x2, y2),
                            vehicle_class=self._vehicle_classes[cls_id],
                            confidence=float(box.conf[0]),
                            class_id=cls_id,
                        )
                    )

            yield (
                TrackedFrame(
                    camera_id=self.camera_id,
                    frame_number=frame_number,
                    timestamp_seconds=timestamp_seconds,
                    vehicles=vehicles,
                ),
                result.orig_img,
            )
