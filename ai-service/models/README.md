# models/

`yolov8n.pt` — pretrained Ultralytics YOLOv8-nano weights (COCO classes),
used by `ai/vehicle_detector.py` and `ai/tracker.py`. Not committed (binary,
~6.5MB) - `VehicleDetector`/`VehicleTracker` auto-download it here via
Ultralytics on first run. EasyOCR's recognition weights are similarly
auto-downloaded on first use, to `~/.EasyOCR/` (not tracked here).

`haarcascade_russian_plate_number.xml` — pretrained OpenCV Haar cascade for
detecting rectangular license-plate-like regions. Used as the prototype's
baseline plate detector (`ai/plate_detector.py`). Not bundled with
`opencv-python-headless`, so it's fetched once and checked in here:

```bash
curl -o haarcascade_russian_plate_number.xml \
  https://raw.githubusercontent.com/opencv/opencv/4.x/data/haarcascades/haarcascade_russian_plate_number.xml
```

This is a generic rectangle-shaped-object cascade, not India-specific — it
works well enough as a baseline for the prototype because it's just finding
the plate's *region*, not reading it (EasyOCR does the reading). Swap this
for a dedicated YOLO plate-detection model later without touching the
`PlateDetector` interface.
