"""
Adverse Weather & Fog Image Dehazer Module.

Implements Dark Channel Prior (DCP) dehazing and adaptive CLAHE contrast enhancement
for foggy/hazy urban camera feeds, restoring visibility before vehicle & plate detection.
"""

from __future__ import annotations
import cv2
import numpy as np
import logging
from config import cfg

logger = logging.getLogger(__name__)


def get_dark_channel(image: np.ndarray, patch_size: int = 15) -> np.ndarray:
    """Calculate dark channel prior of an image."""
    min_channel = np.min(image, axis=2)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (patch_size, patch_size))
    dark_channel = cv2.erode(min_channel, kernel)
    return dark_channel


def estimate_atmospheric_light(image: np.ndarray, dark_channel: np.ndarray) -> np.ndarray:
    """Estimate atmospheric light intensity from top 0.1% brightest pixels in dark channel."""
    h, w = image.shape[:2]
    num_pixels = h * w
    num_brightest = max(int(num_pixels * 0.001), 1)

    dark_vec = dark_channel.reshape(-1)
    image_vec = image.reshape(-1, 3)

    indices = np.argsort(dark_vec)[-num_brightest:]
    atmospheric_light = np.max(image_vec[indices], axis=0)
    return atmospheric_light.astype(np.float64)


def estimate_transmission(image: np.ndarray, atmospheric_light: np.ndarray, omega: float = 0.85, patch_size: int = 15) -> np.ndarray:
    """Estimate transmission map of the hazy scene."""
    norm_img = image.astype(np.float64) / np.maximum(atmospheric_light, 1.0)
    transmission = 1.0 - omega * get_dark_channel(norm_img, patch_size)
    return np.clip(transmission, 0.1, 1.0)


class ImageDehazer:
    """
    Image dehazing processor for foggy/hazy camera frames.
    """

    def __init__(self, omega: float = 0.85, patch_size: int = 15, try_clahe: bool = True):
        self.omega = omega
        self.patch_size = patch_size
        self.try_clahe = try_clahe
        self.clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))

    def dehaze(self, image_bgr: np.ndarray) -> np.ndarray:
        """
        Dehaze a BGR image frame.

        Returns enhanced, dehazed BGR image.
        """
        if image_bgr is None or image_bgr.size == 0:
            return image_bgr

        try:
            # 1. Estimate Dark Channel & Atmospheric Light
            dark = get_dark_channel(image_bgr, self.patch_size)
            A = estimate_atmospheric_light(image_bgr, dark)
            
            # 2. Transmission map
            t = estimate_transmission(image_bgr, A, self.omega, self.patch_size)
            t = cv2.GaussianBlur(t.astype(np.float32), (15, 15), 0)

            # 3. Recover Scene Radiance J(x) = (I(x) - A) / max(t(x), t0) + A
            image_float = image_bgr.astype(np.float64)
            dehazed = np.zeros_like(image_float)
            for c in range(3):
                dehazed[:, :, c] = ((image_float[:, :, c] - A[c]) / np.maximum(t, 0.1)) + A[c]

            dehazed = np.clip(dehazed, 0, 255).astype(np.uint8)

            # 4. Optional CLAHE contrast sharpening
            if self.try_clahe:
                lab = cv2.cvtColor(dehazed, cv2.COLOR_BGR2LAB)
                l, a, b = cv2.split(lab)
                l = self.clahe.apply(l)
                lab = cv2.merge((l, a, b))
                dehazed = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)

            return dehazed
        except Exception as e:
            logger.debug(f"Dehaze failed: {e}. Returning original frame.")
            return image_bgr
