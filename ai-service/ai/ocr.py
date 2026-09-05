"""
OCR service for license plate text extraction.

Pipeline per plate crop:
  1. Enhance via PlatePreprocessor (CLAHE, denoise, sharpen)
  2. EasyOCR text detection + recognition
  3. Sort results left-to-right and concatenate
  4. Apply Indian plate character correction (O/0, I/1 confusables)
  5. Confidence scoring and uncertainty flagging

Multi-frame fusion:
  fuse_readings() takes a list of OcrResult from multiple frames of the
  same tracked vehicle and returns a single best-guess result using
  per-character majority voting.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

import easyocr
import numpy as np

from ai.plate_preprocessor import PlatePreprocessor
from config import cfg
from utils.plate_normalizer import normalize_plate, is_plausible_indian_plate

validate_plate_format = is_plausible_indian_plate

# ─── Character correction for Indian license plates ──────────────────────────
# Indian plates use: 2 state letters + 2 district digits + 1-3 series letters + 4 digits
# Common OCR confusables by position type:
_DIGIT_TO_CHAR = {"0": "O", "1": "I", "5": "S", "8": "B"}
_CHAR_TO_DIGIT = {"O": "0", "I": "1", "S": "5", "B": "8"}

# Pattern: SS DD LL(L) DDDD
_INDIAN_PLATE_RE = re.compile(r"^([A-Z]{2})(\d{2})([A-Z]{1,3})(\d{4})$")


def _correct_indian_plate(text: str) -> str:
    """
    Apply position-aware OCR character correction for Indian plates.

    MH 12 AB 1234:
      pos 0-1: must be letters (state code)
      pos 2-3: must be digits (district)
      pos 4-6: must be letters (series)
      pos 7-10: must be digits (number)
    """
    if not text:
        return text

    # Try to match the expected pattern first
    normalized = normalize_plate(text)
    m = _INDIAN_PLATE_RE.match(normalized)
    if m:
        return normalized   # already correct

    # Attempt correction: try to fix known confusables
    corrected = list(normalized)
    n = len(corrected)

    def fix_pos(i: int, expected: str) -> None:
        if i >= n:
            return
        c = corrected[i]
        if expected == "D" and c.isalpha():    # should be digit
            if c in _CHAR_TO_DIGIT:
                corrected[i] = _CHAR_TO_DIGIT[c]
        elif expected == "L" and c.isdigit():  # should be letter
            if c in _DIGIT_TO_CHAR:
                corrected[i] = _DIGIT_TO_CHAR[c]

    # Apply position rules for standard Indian plates (10 chars)
    if n >= 10:
        for i in range(2):
            fix_pos(i, "L")       # state code: letters
        for i in range(2, 4):
            fix_pos(i, "D")       # district: digits
        for i in range(4, n - 4):
            fix_pos(i, "L")       # series: letters
        for i in range(n - 4, n):
            fix_pos(i, "D")       # number: digits

    return "".join(corrected)


# ─── Result types ─────────────────────────────────────────────────────────────

@dataclass
class OcrResult:
    raw_text: str
    corrected_text: str          # after character correction
    normalized_text: str         # after full normalization
    confidence: float
    is_uncertain: bool = False
    is_plausible_indian: bool = False


# ─── OCR service ─────────────────────────────────────────────────────────────

class OCRService:
    """EasyOCR-based plate OCR with preprocessing and character correction."""

    def __init__(self):
        oc = cfg.ocr
        self.reader = easyocr.Reader(
            list(oc.languages),
            gpu=oc.use_gpu,
            verbose=False,
        )
        self.preprocessor = PlatePreprocessor()
        self._min_conf = oc.min_confidence
        self._uncertain_threshold = oc.uncertain_threshold
        self._min_plate_w = oc.min_plate_width
        self._min_plate_h = oc.min_plate_height

    def read_plate(self, plate_crop_bgr: np.ndarray) -> OcrResult | None:
        """
        Read text from a single plate crop.

        Applies preprocessing first. Returns None if no text detected or
        confidence too low.
        """
        if plate_crop_bgr is None or plate_crop_bgr.size == 0:
            return None

        h, w = plate_crop_bgr.shape[:2]
        if w < self._min_plate_w or h < self._min_plate_h:
            return None

        # Enhance the plate image
        enhanced = self.preprocessor.enhance(plate_crop_bgr)

        # Run OCR
        try:
            results = self.reader.readtext(enhanced)
        except Exception:
            return None

        if not results:
            return None

        # Sort by left x coordinate (left-to-right reading order)
        results.sort(key=lambda r: r[0][0][0])
        raw_text = " ".join(r[1] for r in results).strip()
        avg_conf = sum(r[2] for r in results) / len(results)

        if not raw_text or avg_conf < self._min_conf:
            return None

        corrected = _correct_indian_plate(raw_text.upper().replace(" ", ""))
        normalized = normalize_plate(corrected)

        return OcrResult(
            raw_text=raw_text,
            corrected_text=corrected,
            normalized_text=normalized,
            confidence=float(avg_conf),
            is_uncertain=float(avg_conf) < self._uncertain_threshold,
            is_plausible_indian=is_plausible_indian_plate(normalized),
        )

    def fuse_readings(self, readings: list[OcrResult]) -> OcrResult | None:
        """
        Fuse multiple OCR readings from different frames of the same tracked
        vehicle into a single best-guess result.

        Strategy:
          1. If any reading has high confidence + plausible Indian pattern, prefer it.
          2. Otherwise: per-character majority voting across all normalized texts.
          3. Fall back to highest-confidence single reading.
        """
        if not readings:
            return None

        # Filter to usable readings
        usable = [r for r in readings if r.normalized_text]
        if not usable:
            return None

        # Check for a high-confidence, plausible-format winner
        plausible = [r for r in usable if r.is_plausible_indian and not r.is_uncertain]
        if plausible:
            # Among plausible readings, return the one that appears most often
            from collections import Counter
            counts = Counter(r.normalized_text for r in plausible)
            best_text, _ = counts.most_common(1)[0]
            matching = [r for r in plausible if r.normalized_text == best_text]
            best = max(matching, key=lambda r: r.confidence)
            return best

        # Per-character majority voting
        # Pad all texts to the same length with '?' for missing positions
        max_len = max(len(r.normalized_text) for r in usable)
        voted_chars = []
        for i in range(max_len):
            from collections import Counter
            chars = [r.normalized_text[i] if i < len(r.normalized_text) else "?" for r in usable]
            # Weight by confidence
            weighted = {}
            for r, c in zip(usable, chars):
                if c == "?":
                    continue
                weighted[c] = weighted.get(c, 0.0) + r.confidence
            if weighted:
                voted_chars.append(max(weighted, key=weighted.get))
            else:
                voted_chars.append("?")

        fused_text = "".join(voted_chars).replace("?", "")
        avg_conf = sum(r.confidence for r in usable) / len(usable)

        if not fused_text:
            return max(usable, key=lambda r: r.confidence)

        return OcrResult(
            raw_text=fused_text,
            corrected_text=fused_text,
            normalized_text=normalize_plate(fused_text),
            confidence=avg_conf,
            is_uncertain=avg_conf < self._uncertain_threshold,
            is_plausible_indian=is_plausible_indian_plate(normalize_plate(fused_text)),
        )
