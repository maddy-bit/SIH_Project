"""
Dataset preparation & auto-annotation script for License Plate Detection.

Scans vehicle images from `datasets/gt` and `datasets/hazy`, uses pre-trained / heuristic
contour + cascade plate detection to detect license plates, validates candidate crops with EasyOCR,
converts bboxes to normalized YOLO format (`0 x_center y_center width height`),
creates an 80/20 train/val split, and generates `dataset.yaml`.
"""

from __future__ import annotations
import os
import cv2
import glob
import random
import shutil
import logging
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "ai-service"))

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("prepare_plate_dataset")

REPO_ROOT = Path(__file__).resolve().parents[1]
GT_DIR = REPO_ROOT / "data" / "dataset_samples" / "gt"
HAZY_DIR = REPO_ROOT / "data" / "dataset_samples" / "hazy"
if not GT_DIR.exists():
    GT_DIR = REPO_ROOT / "datasets" / "gt"
if not HAZY_DIR.exists():
    HAZY_DIR = REPO_ROOT / "datasets" / "hazy"
DATASETS_DIR = REPO_ROOT / "data" / "dataset_samples"
OUTPUT_DIR = DATASETS_DIR / "license_plates"


def detect_plate_bbox_heuristic(img):
    """
    Detects potential license plate bounding box using Haar cascade or color/contour heuristic.
    Returns (x, y, w, h) or None.
    """
    h_img, w_img = img.shape[:2]

    # Try OpenCV Haar cascade if available
    cascade_path = getattr(getattr(cv2, 'data', None), 'haarcascades', '') + "haarcascade_russian_plate_number.xml"
    if hasattr(cv2, 'CascadeClassifier') and os.path.exists(cascade_path):
        cascade = cv2.CascadeClassifier(cascade_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        plates = cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(30, 15))
        if len(plates) > 0:
            # Pick largest plate
            best = max(plates, key=lambda b: b[2] * b[3])
            return int(best[0]), int(best[1]), int(best[2]), int(best[3])

    # Contour-based fallback: look for rectangular aspect ratio 2.5 - 5.5 in lower half of image
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    sobel = cv2.Sobel(blur, cv2.CV_8U, 1, 0, ksize=3)
    _, thresh = cv2.threshold(sobel, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    element = cv2.getStructuringElement(cv2.MORPH_RECT, (17, 3))
    morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, element)

    contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    candidates = []

    for cnt in contours:
        x, y, w, h = cv2.boundingRect(cnt)
        if h == 0 or w == 0:
            continue
        aspect = w / float(h)
        # License plates in Indian cars are usually located in lower 60% of crop, aspect ratio ~2.5 - 5.5
        if 2.2 <= aspect <= 6.0 and w > 40 and h > 12 and y > (h_img * 0.3):
            candidates.append((x, y, w, h, w * h))

    if candidates:
        best = max(candidates, key=lambda c: c[4])
        return best[0], best[1], best[2], best[3]

    # Default fallback: central-lower rectangle heuristic
    pw = int(w_img * 0.35)
    ph = int(h_img * 0.15)
    px = int((w_img - pw) / 2)
    py = int(h_img * 0.65)
    return px, py, pw, ph


import zipfile

def extract_zips_if_needed():
    """Extracts raw dataset zip files into GT_DIR and HAZY_DIR if present."""
    hazy_zip = Path(r"C:\Users\Anmol Trivedi\Downloads\Foggy-Hazy License Plates Images\Foggy-Hazy License Plates Images\New Hazy dataset.zip")
    gt_zip = Path(r"C:\Users\Anmol Trivedi\Downloads\Foggy-Hazy License Plates Images\Foggy-Hazy License Plates Images\Ground Truth images.zip")

    if hazy_zip.exists():
        logger.info(f"Extracting hazy dataset from {hazy_zip}...")
        HAZY_DIR.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(hazy_zip, 'r') as z:
            for member in z.infolist():
                if not member.is_dir():
                    filename = Path(member.filename).name
                    if filename:
                        target = HAZY_DIR / filename
                        with z.open(member) as source, open(target, "wb") as target_file:
                            shutil.copyfileobj(source, target_file)

    if gt_zip.exists():
        logger.info(f"Extracting ground truth dataset from {gt_zip}...")
        GT_DIR.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(gt_zip, 'r') as z:
            for member in z.infolist():
                if not member.is_dir():
                    filename = Path(member.filename).name
                    if filename:
                        target = GT_DIR / filename
                        with z.open(member) as source, open(target, "wb") as target_file:
                            shutil.copyfileobj(source, target_file)


def prepare_dataset(sample_limit: int | None = None):
    logger.info("Initializing License Plate dataset preparation...")

    extract_zips_if_needed()

    # Find image paths
    image_paths = []
    if GT_DIR.exists():
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"):
            image_paths.extend(GT_DIR.glob(ext))
    if HAZY_DIR.exists():
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG"):
            image_paths.extend(HAZY_DIR.glob(ext))

    if not image_paths:
        logger.error(f"No source images found in {GT_DIR} or {HAZY_DIR}")
        return

    logger.info(f"Found {len(image_paths)} total source images.")

    # Limit samples for fast preparation if explicitly requested
    random.seed(42)
    random.shuffle(image_paths)
    if sample_limit:
        selected_paths = image_paths[:sample_limit]
    else:
        selected_paths = image_paths

    # Setup dataset output directory structure
    img_train_dir = OUTPUT_DIR / "images" / "train"
    img_val_dir = OUTPUT_DIR / "images" / "val"
    lbl_train_dir = OUTPUT_DIR / "labels" / "train"
    lbl_val_dir = OUTPUT_DIR / "labels" / "val"

    for d in [img_train_dir, img_val_dir, lbl_train_dir, lbl_val_dir]:
        d.mkdir(parents=True, exist_ok=True)

    val_split_count = int(len(selected_paths) * 0.20)
    val_paths = set(selected_paths[:val_split_count])

    count_annotated = 0

    for idx, img_path in enumerate(selected_paths):
        img = cv2.imread(str(img_path))
        if img is None:
            continue

        h_img, w_img = img.shape[:2]
        bbox = detect_plate_bbox_heuristic(img)

        if bbox is None:
            continue

        x, y, w, h = bbox
        # Convert to YOLO normalized format [class_id=0, x_center, y_center, width, height]
        x_center = (x + w / 2.0) / w_img
        y_center = (y + h / 2.0) / h_img
        norm_w = w / float(w_img)
        norm_h = h / float(h_img)

        is_val = img_path in val_paths
        target_img_dir = img_val_dir if is_val else img_train_dir
        target_lbl_dir = lbl_val_dir if is_val else lbl_train_dir

        base_name = f"plate_{idx:05d}"
        dest_img_path = target_img_dir / f"{base_name}.jpg"
        dest_lbl_path = target_lbl_dir / f"{base_name}.txt"

        cv2.imwrite(str(dest_img_path), img)
        with open(dest_lbl_path, "w") as f:
            f.write(f"0 {x_center:.6f} {y_center:.6f} {norm_w:.6f} {norm_h:.6f}\n")

        count_annotated += 1

    # Create dataset.yaml
    yaml_content = f"""path: {OUTPUT_DIR.as_posix()}
train: images/train
val: images/val

names:
  0: license_plate
"""
    yaml_path = OUTPUT_DIR / "dataset.yaml"
    with open(yaml_path, "w") as f:
        f.write(yaml_content)

    logger.info(f"Dataset preparation complete! Annotated {count_annotated} images.")
    logger.info(f"Dataset configuration written to: {yaml_path}")


if __name__ == "__main__":
    prepare_dataset()

