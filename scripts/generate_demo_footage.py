"""Generate the controlled multi-camera demo scenario used for cross-camera
ANPR trajectory matching.

Real CCTV footage with legible plates isn't available for this prototype
(and shouldn't be fabricated as "real" if it were faked), so each camera's
clip is a synthetic composite: a REAL vehicle photo crop - extracted from
real traffic footage by the actual detector, see
scripts/extract_vehicle_sprites.py - moving across a plain road backdrop,
with a rendered license-plate patch attached to it. The video is synthetic;
the detection, plate-region-detection and OCR that later run on it are
genuine inference over real pixels, not scripted output.

This is disclosed, not hidden: every generated clip is stamped
"SYNTHETIC DEMO FEED" in-frame.

Usage:
    ai-service/.venv/bin/python3 scripts/generate_demo_footage.py
"""

from pathlib import Path

import cv2
import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
SPRITES_DIR = REPO_ROOT / "ai-service" / "assets" / "vehicle_sprites"
OUTPUT_DIR = REPO_ROOT / "videos"

WIDTH, HEIGHT = 640, 360
FPS = 15
DURATION_SECONDS = 6
FRAME_COUNT = FPS * DURATION_SECONDS

# camera_id -> (plate, sprite_filename). CAM-12 is intentionally omitted -
# it's the "camera offline" demo case (see data/cameras.json).
SCENARIO: dict[str, tuple[str, str]] = {
    "CAM-01": ("MH12AB1234", "car_0.jpg"),
    "CAM-02": ("MH14CD5678", "car_1.jpg"),
    "CAM-03": ("MH12AB1234", "car_0.jpg"),
    "CAM-04": ("MH12EF9012", "car_2.jpg"),
    "CAM-05": ("MH14CD5678", "car_1.jpg"),
    "CAM-06": ("MH12EF9012", "car_2.jpg"),
    "CAM-07": ("MH12AB1234", "car_0.jpg"),
    "CAM-08": ("MH12OP0123", "bus_0.jpg"),
    "CAM-09": ("MH12MN6789", "bus_1.jpg"),
    "CAM-10": ("MH04KL2345", "car_2.jpg"),
    "CAM-11": ("MH12AB1234", "car_0.jpg"),
}


def make_road_background() -> np.ndarray:
    frame = np.full((HEIGHT, WIDTH, 3), (58, 58, 60), dtype=np.uint8)  # asphalt gray
    cv2.rectangle(frame, (0, 0), (WIDTH, 40), (40, 40, 42), -1)  # curb strip
    lane_y = HEIGHT // 2
    for x in range(0, WIDTH, 40):
        cv2.line(frame, (x, lane_y), (x + 20, lane_y), (210, 210, 200), 3)
    return frame


def render_plate(vehicle_bgr: np.ndarray, plate_text: str) -> np.ndarray:
    """Composite a plausible rear-plate patch onto the bottom third of a vehicle crop."""
    vehicle_bgr = vehicle_bgr.copy()
    h, w = vehicle_bgr.shape[:2]
    plate_w, plate_h = int(w * 0.62), max(18, int(h * 0.16))
    px1 = (w - plate_w) // 2
    py1 = int(h * 0.72)
    px2, py2 = px1 + plate_w, py1 + plate_h

    if py2 > h:
        py2 = h
        py1 = max(0, py2 - plate_h)

    cv2.rectangle(vehicle_bgr, (px1, py1), (px2, py2), (255, 255, 255), -1)
    cv2.rectangle(vehicle_bgr, (px1, py1), (px2, py2), (20, 20, 20), 1)

    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = plate_h / 34.0
    thickness = max(1, plate_h // 16)
    text = f"{plate_text[:2]} {plate_text[2:4]} {plate_text[4:-4]} {plate_text[-4:]}"
    (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, thickness)
    while text_w > plate_w - 6 and font_scale > 0.2:
        font_scale -= 0.05
        (text_w, text_h), _ = cv2.getTextSize(text, font, font_scale, thickness)

    text_x = px1 + max(2, (plate_w - text_w) // 2)
    text_y = py1 + (plate_h + text_h) // 2
    cv2.putText(vehicle_bgr, text, (text_x, text_y), font, font_scale, (10, 10, 10), thickness, cv2.LINE_AA)
    return vehicle_bgr


def generate_camera_clip(camera_id: str, plate: str, sprite_filename: str) -> Path:
    sprite_path = SPRITES_DIR / sprite_filename
    sprite = cv2.imread(str(sprite_path))
    if sprite is None:
        raise FileNotFoundError(f"sprite not found: {sprite_path}")

    sprite_w = 200
    scale = sprite_w / sprite.shape[1]
    sprite = cv2.resize(sprite, (sprite_w, int(sprite.shape[0] * scale)))
    sprite = render_plate(sprite, plate)
    sprite_h = sprite.shape[0]

    background = make_road_background()

    out_path = OUTPUT_DIR / f"{camera_id}.mp4"
    writer = cv2.VideoWriter(str(out_path), cv2.VideoWriter_fourcc(*"mp4v"), FPS, (WIDTH, HEIGHT))

    y = HEIGHT // 2 - sprite_h // 2
    x_start, x_end = -sprite_w, WIDTH
    for frame_idx in range(FRAME_COUNT):
        frame = background.copy()
        progress = frame_idx / max(1, FRAME_COUNT - 1)
        x = int(x_start + (x_end - x_start) * progress)

        # Composite sprite onto frame, clipped to frame bounds.
        sx1, sy1 = max(0, -x), max(0, -y)
        fx1, fy1 = max(0, x), max(0, y)
        fx2 = min(WIDTH, x + sprite_w)
        fy2 = min(HEIGHT, y + sprite_h)
        sx2 = sx1 + (fx2 - fx1)
        sy2 = sy1 + (fy2 - fy1)
        if fx2 > fx1 and fy2 > fy1:
            frame[fy1:fy2, fx1:fx2] = sprite[sy1:sy2, sx1:sx2]

        cv2.putText(frame, f"{camera_id} - SYNTHETIC DEMO FEED", (10, HEIGHT - 12),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 0), 1, cv2.LINE_AA)
        writer.write(frame)

    writer.release()
    return out_path


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for camera_id, (plate, sprite_filename) in SCENARIO.items():
        out_path = generate_camera_clip(camera_id, plate, sprite_filename)
        print(f"{camera_id}: wrote {out_path.relative_to(REPO_ROOT)} (plate={plate}, sprite={sprite_filename})")


if __name__ == "__main__":
    main()
