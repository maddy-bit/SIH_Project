"""OCR over a cropped plate region using EasyOCR (pretrained weights).

Returns whatever EasyOCR actually reads - never fabricated. Low-confidence
or empty reads are surfaced as such (read_plate returns None) rather than
guessed at.
"""

from dataclasses import dataclass

import easyocr


@dataclass
class OcrResult:
    raw_text: str
    confidence: float


class OCRService:
    def __init__(self, languages: tuple[str, ...] = ("en",), gpu: bool = False):
        self.reader = easyocr.Reader(list(languages), gpu=gpu, verbose=False)

    def read_plate(self, plate_crop_bgr) -> OcrResult | None:
        if plate_crop_bgr is None or plate_crop_bgr.size == 0:
            return None

        results = self.reader.readtext(plate_crop_bgr)
        if not results:
            return None

        # Concatenate all detected text fragments left-to-right (a plate can
        # be split into multiple text boxes by EasyOCR, e.g. "MH12" / "AB1234"),
        # and average their confidences.
        results.sort(key=lambda r: r[0][0][0])  # sort by left x of the box
        raw_text = " ".join(r[1] for r in results).strip()
        avg_confidence = sum(r[2] for r in results) / len(results)

        if not raw_text:
            return None

        return OcrResult(raw_text=raw_text, confidence=float(avg_confidence))
