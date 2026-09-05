"""One-off dev utility: scan the real source traffic videos with the real
vehicle detector and save the highest-confidence crop per vehicle class as
a sprite image. These sprites (real photographic vehicle pixels) are then
composited into the controlled-scenario demo clips by
scripts/generate_demo_footage.py - NOT used at inference time.

Run once from the ai-service virtualenv:
    ai-service/.venv/bin/python3 scripts/extract_vehicle_sprites.py
"""

import sys
from pathlib import Path

import cv2

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "ai-service"))

from ai.vehicle_detector import VehicleDetector  # noqa: E402

SOURCE_VIDEOS = [
    REPO_ROOT / "videos" / "source_traffic_1.mp4",
    REPO_ROOT / "videos" / "source_traffic_2.mp4",
]
OUTPUT_DIR = REPO_ROOT / "ai-service" / "assets" / "vehicle_sprites"
TARGET_PER_CLASS = 3
PADDING = 6


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    detector = VehicleDetector(confidence_threshold=0.25)
    best_by_class: dict[str, list[tuple[float, "cv2.typing.MatLike"]]] = {}

    for video_path in SOURCE_VIDEOS:
        cap = cv2.VideoCapture(str(video_path))
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        for i in range(0, total, 5):
            cap.set(cv2.CAP_PROP_POS_FRAMES, i)
            ok, frame = cap.read()
            if not ok:
                continue
            for box in detector.detect(frame):
                x1, y1, x2, y2 = (int(v) for v in box.bbox)
                x1, y1 = max(0, x1 - PADDING), max(0, y1 - PADDING)
                x2, y2 = min(frame.shape[1], x2 + PADDING), min(frame.shape[0], y2 + PADDING)
                if (x2 - x1) < 60 or (y2 - y1) < 40:
                    continue  # too small to be a useful sprite
                crop = frame[y1:y2, x1:x2].copy()
                bucket = best_by_class.setdefault(box.vehicle_class, [])
                bucket.append((box.confidence, crop))
        cap.release()
        print(f"scanned {video_path.name}")

    for vehicle_class, crops in best_by_class.items():
        crops.sort(key=lambda c: c[0], reverse=True)
        for idx, (confidence, crop) in enumerate(crops[:TARGET_PER_CLASS]):
            out_path = OUTPUT_DIR / f"{vehicle_class}_{idx}.jpg"
            cv2.imwrite(str(out_path), crop)
            print(f"saved {out_path.name} (confidence={confidence:.2f}, size={crop.shape[1]}x{crop.shape[0]})")


if __name__ == "__main__":
    main()
