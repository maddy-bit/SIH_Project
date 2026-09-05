"""
Camera Agent & Video Processing Pipeline module.

Processes a single video feed for a camera node:
1. Detects & tracks vehicles using YOLOv8s + ByteTrack.
2. Extracts vehicle crops, predicts dominant color & vehicle type.
3. Detects license plates (YOLOv8n LP) & extracts preprocessed OCR text.
4. Computes ResNet50 Re-ID embeddings.
5. Aggregates multi-frame observations per track using MultiFrameFusionService.
"""

from __future__ import annotations
import os
import cv2
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Set

from config import cfg
from schemas import (
    DetectionEvent,
    PlateObservation,
    VehicleObservation,
)
from ai.tracker import VehicleTracker
from ai.plate_detector import PlateDetector
from ai.plate_preprocessor import PlatePreprocessor
from ai.ocr import OCRService
from ai.color_classifier import ColorClassifier
from ai.reid import ReIdService, ReIdEmbedding
from ai.multi_frame_fusion import MultiFrameFusionService
from utils.plate_normalizer import normalize_plate

from ai.dehazer import ImageDehazer

logger = logging.getLogger(__name__)

EVIDENCE_DIR = Path(__file__).resolve().parents[2] / "data" / "evidence"


class CameraAgent:
    """
    Per-camera processing agent. Isolates state & tracking for a single camera feed.
    """

    def __init__(self, camera_id: str):
        self.camera_id = camera_id
        self.tracker = VehicleTracker()
        self.plate_detector = PlateDetector()
        self.plate_preprocessor = PlatePreprocessor()
        self.ocr = OCRService()
        self.color_classifier = ColorClassifier()
        self.reid_service = ReIdService()
        self.fusion_service = MultiFrameFusionService()
        self.dehazer = ImageDehazer()

        self.evidence_dir = EVIDENCE_DIR / camera_id
        self.evidence_dir.mkdir(parents=True, exist_ok=True)

    def process_feed(
        self,
        video_path: str,
        start_time_iso: str = "2026-09-05T12:00:00",
        frame_stride: int = int(cfg.FRAME_STRIDE),
        plate_sample_stride: int = int(cfg.PLATE_SAMPLE_STRIDE),
        enable_dehaze: bool = False,
    ) -> tuple[int, list[VehicleObservation], list[DetectionEvent]]:
        """
        Process an entire video feed.

        Returns:
            (total_frames_processed, list_of_vehicle_observations, list_of_detection_events)
        """
        if not os.path.exists(video_path):
            logger.error(f"Video file not found: {video_path}")
            return 0, [], []

        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        cap.release()

        try:
            start_time = datetime.fromisoformat(start_time_iso.replace("Z", ""))
        except Exception:
            start_time = datetime.now()

        # Track accumulators
        track_plates: Dict[int, List[PlateObservation]] = {}
        track_colors: Dict[int, List[str]] = {}
        track_types: Dict[int, List[str]] = {}
        track_reids: Dict[int, List[ReIdEmbedding]] = {}
        track_timestamps: Dict[int, List[float]] = {}
        track_crops: Dict[int, List[str]] = {}
        track_frame_counts: Dict[int, int] = {}

        detection_events: List[DetectionEvent] = []
        frames_processed = 0

        logger.info(f"[{self.camera_id}] Starting feed processing: {video_path}")

        for tracked_frame, frame_img in self.tracker.track_video(video_path, frame_stride=frame_stride):
            frames_processed += 1
            rel_sec = tracked_frame.frame_number / fps
            abs_time = start_time + timedelta(seconds=rel_sec)
            timestamp_sec = rel_sec  # Relative timestamp in video timeline

            for vehicle in tracked_frame.vehicles:
                tid = vehicle.track_id
                
                # Initialize track accumulators if new
                if tid not in track_plates:
                    track_plates[tid] = []
                    track_colors[tid] = []
                    track_types[tid] = []
                    track_reids[tid] = []
                    track_timestamps[tid] = []
                    track_crops[tid] = []
                    track_frame_counts[tid] = 0

                count = track_frame_counts[tid]
                track_frame_counts[tid] = count + 1
                track_timestamps[tid].append(timestamp_sec)
                track_types[tid].append(vehicle.vehicle_class)

                # Extract vehicle crop
                x1, y1, x2, y2 = [int(v) for v in vehicle.bbox]
                h_img, w_img = frame_img.shape[:2]
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w_img, max(x1 + 1, x2)), min(h_img, max(y1 + 1, y2))
                crop = frame_img[y1:y2, x1:x2]

                if crop.size == 0:
                    continue

                # Sample evidence attributes periodically
                if count % plate_sample_stride == 0 or count == 0:
                    # 1. Color Classification
                    color_res = self.color_classifier.classify(crop)
                    color_str = color_res.color if hasattr(color_res, "color") else str(color_res)
                    track_colors[tid].append(color_str)

                    # 2. Re-ID Embedding
                    emb = self.reid_service.embed(crop)
                    if emb:
                        track_reids[tid].append(emb)

                    # 3. License Plate Detection & OCR
                    plates = self.plate_detector.detect(crop)
                    plate_text_raw = None
                    plate_text_norm = None
                    plate_conf = None

                    if plates:
                        best_plate = plates[0]
                        px1, py1, px2, py2 = best_plate.bbox
                        plate_crop = crop[py1:py2, px1:px2]

                        ocr_res = self.ocr.read_plate(plate_crop)
                        if ocr_res and ocr_res.confidence >= 0.20:
                            plate_text_raw = ocr_res.raw_text
                            plate_text_norm = normalize_plate(ocr_res.raw_text)
                            plate_conf = float(ocr_res.confidence)

                            track_plates[tid].append(
                                PlateObservation(
                                    text=ocr_res.raw_text,
                                    confidence=plate_conf,
                                    frame_number=tracked_frame.frame_number,
                                    timestamp=timestamp_sec,
                                    crop=plate_crop if count < 2 else None,
                                )
                            )

                    # Save evidence frame
                    crop_filename = f"crop_frame{tracked_frame.frame_number}_track{tid}.jpg"
                    crop_full_path = self.evidence_dir / crop_filename
                    cv2.imwrite(str(crop_full_path), crop)
                    rel_crop_path = f"{self.camera_id}/{crop_filename}"
                    track_crops[tid].append(rel_crop_path)

                    # Record legacy detection event
                    detection_events.append(
                        DetectionEvent(
                            camera_id=self.camera_id,
                            frame_number=tracked_frame.frame_number,
                            timestamp=abs_time.isoformat() + "Z",
                            vehicle_class=vehicle.vehicle_class,
                            detection_confidence=vehicle.confidence,
                            bbox=list(vehicle.bbox),
                            track_id=tid,
                            plate_text_raw=plate_text_raw,
                            plate_text_normalized=plate_text_norm,
                            plate_confidence=plate_conf,
                            image_path=rel_crop_path,
                        )
                    )

        # Aggregate tracks into VehicleObservation objects
        vehicle_observations: List[VehicleObservation] = []
        for tid in track_timestamps.keys():
            if not track_timestamps[tid]:
                continue
            obs = self.fusion_service.aggregate_vehicle_observation(
                camera_id=self.camera_id,
                track_id=tid,
                plate_observations=track_plates[tid],
                color_predictions=track_colors[tid],
                type_predictions=track_types[tid],
                reid_embeddings=track_reids[tid],
                timestamps=track_timestamps[tid],
                crop_paths=track_crops[tid],
            )
            vehicle_observations.append(obs)

        logger.info(
            f"[{self.camera_id}] Finished feed processing. Processed {frames_processed} frames, "
            f"aggregated {len(vehicle_observations)} vehicle tracks."
        )

        return frames_processed, vehicle_observations, detection_events


# Backward compatibility wrapper
class VideoPipeline:
    def __init__(self):
        pass

    def process(
        self,
        video_path: str,
        camera_id: str,
        start_time_iso: str = "2026-09-05T12:00:00",
        frame_stride: int = int(cfg.FRAME_STRIDE),
        plate_sample_stride: int = int(cfg.PLATE_SAMPLE_STRIDE),
    ) -> tuple[int, list[DetectionEvent]]:
        agent = CameraAgent(camera_id)
        frames, _, events = agent.process_feed(
            video_path, start_time_iso, frame_stride, plate_sample_stride
        )
        return frames, events
