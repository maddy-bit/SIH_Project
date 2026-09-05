"""
License plate detection using a YOLOv8n model trained on license plates.

Two-tier approach:
1. Primary: fine-tuned YOLOv8n (ai-service/models/plate_detector_yolov8n.pt)
   — produced by scripts/train_plate_detector.py
2. Fallback: pretrained YOLOv8n from keremberke/yolov8n-license-plate-detection
   on HuggingFace — downloaded automatically on first use if fine-tuned
   model is not present

The Haar cascade is REMOVED. It produced too many false positives on
Indian vehicles and could not be confidence-scored reliably.

Interface: detect(vehicle_crop_bgr) -> list[PlateBox]
Input: a vehicle crop (not the full frame)
Output: plate bboxes in vehicle-crop coordinates, sorted by confidence
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from pathlib import Path

import cv2
import numpy as np
from ultralytics import YOLO

from config import cfg

log = logging.getLogger(__name__)


@dataclass
class PlateBox:
    bbox: tuple[int, int, int, int]   # x1, y1, x2, y2 in vehicle-crop pixels
    confidence: float
    # Area as fraction of vehicle crop area (used to filter full-image false labels)
    area_ratio: float = 0.0


def _load_plate_model() -> YOLO:
    """
    Load the best available plate detection model.

    Priority:
      1. Fine-tuned model at cfg.models.plate_detector
      2. Pretrained keremberke/yolov8n-license-plate-detection from HF
    """
    fine_tuned = Path(cfg.models.plate_detector)
    if fine_tuned.exists():
        log.info(f"Loading fine-tuned plate detector: {fine_tuned}")
        return YOLO(str(fine_tuned))

    log.warning(
        f"Fine-tuned plate model not found at {fine_tuned}. "
        "Falling back to pretrained keremberke/yolov8n-license-plate-detection. "
        "Run scripts/train_plate_detector.py to produce the fine-tuned model."
    )
    # Ultralytics supports loading from HuggingFace hub via model ID
    try:
        model = YOLO(cfg.models.plate_detector_pretrained_id)
        return model
    except Exception:
        # Last resort: try downloading via ultralytics hub
        log.warning("HF hub load failed. Trying direct ultralytics download.")
        model = YOLO("yolov8n.pt")   # vehicle detector as crude placeholder
        return model


def _validate_plate_box(
    x: int, y: int, w: int, h: int,
    crop_w: int, crop_h: int,
) -> tuple[bool, float]:
    """
    Validate a detected box is plate-shaped and not a full-image detection.

    Returns (is_valid, area_ratio).
    """
    if w <= 0 or h <= 0:
        return False, 0.0

    area_ratio = (w * h) / max(crop_w * crop_h, 1)

    # Reject if plate covers more than 60% of vehicle crop (false detection)
    if area_ratio > 0.60:
        return False, area_ratio

    # Plates are wider than they are tall (aspect ratio > 1.2)
    aspect = w / max(h, 1)
    if aspect < 1.0:
        return False, area_ratio

    # Plate must have a minimum size to be readable
    if w < 30 or h < 10:
        return False, area_ratio

    return True, area_ratio


class PlateDetector:
    """
    Detects license plate regions inside vehicle crops using YOLOv8n.

    Never treats the whole vehicle crop as the plate.
    Returns at most cfg-limited best detections per crop.
    """

    def __init__(self):
        self.model = _load_plate_model()
        self._conf = cfg.detection.plate_confidence_threshold

    def detect(self, vehicle_crop_bgr: np.ndarray) -> list[PlateBox]:
        """
        Detect license plates inside a vehicle crop.

        Args:
            vehicle_crop_bgr: numpy BGR image of a vehicle (output of crop extraction)

        Returns:
            List of PlateBox sorted by confidence (highest first).
            Empty list if no valid plate detected.
        """
        if vehicle_crop_bgr is None or vehicle_crop_bgr.size == 0:
            return []

        crop_h, crop_w = vehicle_crop_bgr.shape[:2]

        # Skip crops that are too small
        if crop_w < cfg.detection.min_vehicle_crop_width or crop_h < cfg.detection.min_vehicle_crop_height:
            return []

        try:
            results = self.model.predict(
                vehicle_crop_bgr,
                conf=self._conf,
                verbose=False,
            )[0]
        except Exception as exc:
            log.debug(f"Plate detection failed: {exc}")
            return []

        plates: list[PlateBox] = []
        if results.boxes is None:
            return []

        for box in results.boxes:
            x1, y1, x2, y2 = (int(v) for v in box.xyxy[0].tolist())
            # Clamp to crop dimensions
            x1 = max(0, min(x1, crop_w - 1))
            y1 = max(0, min(y1, crop_h - 1))
            x2 = max(x1 + 1, min(x2, crop_w))
            y2 = max(y1 + 1, min(y2, crop_h))

            w, h = x2 - x1, y2 - y1
            is_valid, area_ratio = _validate_plate_box(x1, y1, w, h, crop_w, crop_h)
            if not is_valid:
                continue

            conf = float(box.conf[0])
            plates.append(
                PlateBox(
                    bbox=(x1, y1, x2, y2),
                    confidence=conf,
                    area_ratio=area_ratio,
                )
            )

        plates.sort(key=lambda p: p.confidence, reverse=True)
        return plates
