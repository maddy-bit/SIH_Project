"""
YOLOv8n License Plate Detector Fine-Tuning Script.

Trains a YOLOv8n object detection model on the prepared license plate dataset
(`datasets/license_plates/dataset.yaml`) and exports the trained weights to
`ai-service/models/plate_detector_yolov8n.pt`.
"""

from __future__ import annotations
import os
import shutil
import logging
from pathlib import Path
from ultralytics import YOLO

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_plate_detector")

REPO_ROOT = Path(__file__).resolve().parents[1]
DATASET_YAML = REPO_ROOT / "datasets" / "license_plates" / "dataset.yaml"
OUTPUT_MODEL_PATH = REPO_ROOT / "ai-service" / "models" / "plate_detector_yolov8n.pt"


def train_model(epochs: int = 15, batch_size: int = 8, img_size: int = 640):
    if not DATASET_YAML.exists():
        logger.error(f"Dataset configuration not found at {DATASET_YAML}. Run scripts/prepare_plate_dataset.py first!")
        return

    logger.info("Initializing YOLOv8n base model for fine-tuning...")
    model = YOLO("yolov8n.pt")

    logger.info(f"Starting training for {epochs} epochs (batch={batch_size}, imgsz={img_size})...")
    results = model.train(
        data=str(DATASET_YAML),
        epochs=epochs,
        batch=batch_size,
        imgsz=img_size,
        patience=5,
        project=str(REPO_ROOT / "runs" / "detect"),
        name="train_plate",
        exist_ok=True,
        verbose=True,
    )

    best_weights = REPO_ROOT / "runs" / "detect" / "train_plate" / "weights" / "best.pt"
    if best_weights.exists():
        OUTPUT_MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(str(best_weights), str(OUTPUT_MODEL_PATH))
        logger.info(f"Successfully trained and saved model weights to: {OUTPUT_MODEL_PATH}")
    else:
        logger.warning(f"Could not locate best weights at {best_weights}.")


if __name__ == "__main__":
    train_model()
