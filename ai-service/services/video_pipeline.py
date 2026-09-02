"""Orchestrates the full per-video AI pipeline:

video -> tracked vehicle boxes (detection + ByteTrack)
      -> plate region detection (sampled)
      -> OCR
      -> plate normalization
      -> evidence frame saved to disk

Produces a list of DetectionEvent records. Storage is the Spring Boot
backend's job (see scripts/process_video.py, which posts these to
POST /api/detections/ingest) - this module never talks to a database.
"""

from datetime import datetime, timedelta
from pathlib import Path

import cv2

from ai.ocr import OCRService
from ai.plate_detector import PlateDetector
from ai.tracker import VehicleTracker
from schemas import DetectionEvent
from utils.plate_normalizer import normalize_plate

# repo_root/data/evidence/<camera_id>/<frame>_<track>.jpg
EVIDENCE_DIR = Path(__file__).resolve().parents[2] / "data" / "evidence"


class VideoPipeline:
    def __init__(self):
        self.tracker = VehicleTracker()
        self.plate_detector = PlateDetector()
        self.ocr = OCRService()

    def process(
        self,
        video_path: str,
        camera_id: str,
        start_time_iso: str,
        frame_stride: int = 5,
        plate_sample_stride: int = 3,
    ) -> tuple[int, list[DetectionEvent]]:
        cap = cv2.VideoCapture(video_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
        cap.release()

        start_time = datetime.fromisoformat(start_time_iso)
        detections: list[DetectionEvent] = []
        frames_processed = 0

        track_plate_attempts: dict[int, int] = {}
        tracks_seen: set[int] = set()

        evidence_camera_dir = EVIDENCE_DIR / camera_id
        evidence_camera_dir.mkdir(parents=True, exist_ok=True)

        for tracked_frame, frame_img in self.tracker.track_video(video_path, frame_stride=frame_stride):
            frames_processed += 1
            timestamp = start_time + timedelta(seconds=tracked_frame.frame_number / fps)

            for vehicle in tracked_frame.vehicles:
                is_first_sighting = vehicle.track_id not in tracks_seen
                tracks_seen.add(vehicle.track_id)

                attempts = track_plate_attempts.get(vehicle.track_id, 0)
                should_attempt_plate = is_first_sighting or attempts % plate_sample_stride == 0
                track_plate_attempts[vehicle.track_id] = attempts + 1

                if not should_attempt_plate:
                    continue

                x1, y1, x2, y2 = (int(v) for v in vehicle.bbox)
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = max(x1 + 1, x2), max(y1 + 1, y2)
                crop = frame_img[y1:y2, x1:x2]

                plate_raw = None
                plate_normalized = None
                plate_confidence = None

                plates = self.plate_detector.detect(crop)
                if plates:
                    best_plate = plates[0]
                    px1, py1, px2, py2 = best_plate.bbox
                    plate_crop = crop[py1:py2, px1:px2]
                    ocr_result = self.ocr.read_plate(plate_crop)
                    if ocr_result:
                        plate_raw = ocr_result.raw_text
                        plate_normalized = normalize_plate(ocr_result.raw_text)
                        plate_confidence = ocr_result.confidence

                evidence_filename = f"frame{tracked_frame.frame_number}_track{vehicle.track_id}.jpg"
                evidence_path = evidence_camera_dir / evidence_filename
                annotated = frame_img.copy()
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 200, 0), 2)
                cv2.imwrite(str(evidence_path), annotated)

                detections.append(
                    DetectionEvent(
                        camera_id=camera_id,
                        frame_number=tracked_frame.frame_number,
                        # Treated as UTC (no timezone math for the prototype) -
                        # explicit "Z" so Java's Instant.parse() accepts it.
                        timestamp=timestamp.isoformat() + "Z",
                        vehicle_class=vehicle.vehicle_class,
                        detection_confidence=vehicle.confidence,
                        bbox=list(vehicle.bbox),
                        track_id=vehicle.track_id,
                        plate_text_raw=plate_raw,
                        plate_text_normalized=plate_normalized,
                        plate_confidence=plate_confidence,
                        # relative to the evidence root - the backend serves
                        # this at GET /evidence/<camera_id>/<file>.jpg
                        image_path=f"{camera_id}/{evidence_filename}",
                    )
                )

        return frames_processed, detections
