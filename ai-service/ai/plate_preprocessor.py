"""
Plate image enhancement pipeline.

Preprocessing dramatically improves EasyOCR accuracy on real traffic
license plate crops, especially for:
- Low-resolution plates from distant cameras
- Foggy / hazy conditions
- Under/over-exposed crops

Pipeline:
  1. Resize to target height (min 64px) — OCR needs sufficient resolution
  2. Grayscale
  3. CLAHE (Contrast Limited Adaptive Histogram Equalization)
  4. Gaussian denoise
  5. Unsharp mask sharpening
  6. Optional adaptive binarization (for very noisy crops)

Returns both the preprocessed grayscale AND a 3-channel BGR version
suitable for EasyOCR (which accepts both).
"""

from __future__ import annotations

import cv2
import numpy as np

from config import cfg


class PlatePreprocessor:
    """Enhances a plate crop for OCR."""

    def __init__(self):
        p = cfg.preprocessing
        self._clahe = cv2.createCLAHE(
            clipLimit=p.clahe_clip_limit,
            tileGridSize=p.clahe_tile_grid,
        )
        self._denoise_kernel = p.denoise_kernel
        self._sharpen_amount = p.sharpen_amount
        self._try_binarize = p.try_binarize
        self._target_h = cfg.ocr.target_plate_height

    def enhance(self, plate_crop_bgr: np.ndarray) -> np.ndarray:
        """
        Enhance a plate crop for OCR.

        Returns an enhanced BGR image. If input is too small or empty,
        returns the input unchanged.
        """
        if plate_crop_bgr is None or plate_crop_bgr.size == 0:
            return plate_crop_bgr

        h, w = plate_crop_bgr.shape[:2]
        if h < 4 or w < 8:
            return plate_crop_bgr

        # ── 1. Resize to minimum OCR-friendly height ──────────────────────
        if h < self._target_h:
            scale = self._target_h / h
            new_w = max(1, int(w * scale))
            plate_crop_bgr = cv2.resize(
                plate_crop_bgr, (new_w, self._target_h),
                interpolation=cv2.INTER_CUBIC,
            )

        # ── 2. Grayscale ─────────────────────────────────────────────────
        gray = cv2.cvtColor(plate_crop_bgr, cv2.COLOR_BGR2GRAY)

        # ── 3. CLAHE contrast enhancement ────────────────────────────────
        gray = self._clahe.apply(gray)

        # ── 4. Gaussian denoise ───────────────────────────────────────────
        k = self._denoise_kernel
        if k > 1:
            gray = cv2.GaussianBlur(gray, (k, k), 0)

        # ── 5. Unsharp mask sharpening ────────────────────────────────────
        blur = cv2.GaussianBlur(gray, (0, 0), 3)
        gray = cv2.addWeighted(gray, 1 + self._sharpen_amount, blur, -self._sharpen_amount, 0)
        gray = np.clip(gray, 0, 255).astype(np.uint8)

        # ── 6. Optional adaptive binarization ────────────────────────────
        # Only apply if the image has good local contrast differences
        if self._try_binarize:
            binary = cv2.adaptiveThreshold(
                gray, 255,
                cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY,
                blockSize=15,
                C=5,
            )
            # Choose binary if it has higher contrast (std dev)
            if binary.std() > gray.std() * 1.2:
                gray = binary

        # Return as 3-channel BGR so EasyOCR and OpenCV callers both work
        return cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    def sharpness_score(self, image_bgr: np.ndarray) -> float:
        """
        Compute a sharpness score using Laplacian variance.

        Higher = sharper. Used to select the best frame for OCR.
        """
        if image_bgr is None or image_bgr.size == 0:
            return 0.0
        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY) if len(image_bgr.shape) == 3 else image_bgr
        return float(cv2.Laplacian(gray, cv2.CV_64F).var())
