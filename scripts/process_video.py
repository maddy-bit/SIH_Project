"""Process one camera's video through the real AI pipeline and store the
resulting detections in the backend.

    ai-service/.venv/bin/python3 scripts/process_video.py \\
        --video videos/CAM-01.mp4 --camera CAM-01 --start-time 2026-08-30T18:14:23

Runs the pipeline in-process (imports ai-service directly - no need to have
the FastAPI server running) and POSTs each resulting detection to the
Spring Boot backend's POST /api/detections/ingest. The backend must be
running first (`cd backend && mvn spring-boot:run`).
"""

import argparse
import os
import sys
from pathlib import Path

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "ai-service"))

from services.video_pipeline import VideoPipeline  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", required=True, help="Path to the video file (relative to repo root or absolute).")
    parser.add_argument("--camera", required=True, help="Camera id, e.g. CAM-01 (must exist in data/cameras.json).")
    parser.add_argument(
        "--start-time", required=True,
        help="ISO-8601 timestamp (UTC, no offset) of the video's first frame, e.g. 2026-08-30T18:14:23.",
    )
    parser.add_argument("--frame-stride", type=int, default=5)
    parser.add_argument("--plate-sample-stride", type=int, default=3)
    parser.add_argument("--backend-url", default="http://localhost:8080")
    parser.add_argument(
        "--ingest-username", default=os.environ.get("INGEST_USERNAME", "ingest"),
        help="POST /api/detections/ingest is behind HTTP Basic auth - see backend/security/SecurityConfig.java. "
             "Defaults to $INGEST_USERNAME or 'ingest'.",
    )
    parser.add_argument(
        "--ingest-password", default=os.environ.get("INGEST_PASSWORD", "change-me-in-production"),
        help="Defaults to $INGEST_PASSWORD or the backend's dev default.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Run the pipeline and print detections without posting to the backend.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    video_path = Path(args.video)
    if not video_path.is_absolute():
        video_path = (REPO_ROOT / video_path).resolve()

    if not video_path.exists():
        print(f"error: video not found: {video_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Processing {video_path.name} for {args.camera} (this loads YOLO + EasyOCR - a few seconds)...")
    pipeline = VideoPipeline()
    frames_processed, detections = pipeline.process(
        video_path=str(video_path),
        camera_id=args.camera,
        start_time_iso=args.start_time,
        frame_stride=args.frame_stride,
        plate_sample_stride=args.plate_sample_stride,
    )
    print(f"Frames processed: {frames_processed}. Detections: {len(detections)}.")

    if args.dry_run:
        for d in detections:
            print(d.model_dump())
        return

    stored = 0
    for d in detections:
        payload = {
            "cameraId": d.camera_id,
            "timestamp": d.timestamp,
            "vehicleClass": d.vehicle_class,
            "detectionConfidence": d.detection_confidence,
            "plateTextRaw": d.plate_text_raw,
            "plateTextNormalized": d.plate_text_normalized,
            "plateConfidence": d.plate_confidence,
            "trackId": d.track_id,
            "frameNumber": d.frame_number,
            "imagePath": d.image_path,
        }
        response = requests.post(
            f"{args.backend_url}/api/detections/ingest",
            json=payload,
            auth=(args.ingest_username, args.ingest_password),
            timeout=10,
        )
        if response.status_code == 201:
            stored += 1
        else:
            print(f"  failed to store detection (frame {d.frame_number}): {response.status_code} {response.text}")

    print(f"Stored {stored}/{len(detections)} detections via {args.backend_url}/api/detections/ingest")


if __name__ == "__main__":
    main()
