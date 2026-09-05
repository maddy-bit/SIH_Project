"""Normalize OCR plate text into a matchable canonical form.

"MH 12 AB 1234", "MH12AB1234", "mh12ab1234" all normalize to "MH12AB1234"
so cross-camera matching isn't defeated by spacing/case/OCR noise.
"""

import re

_ALLOWED_CHARS = re.compile(r"[^A-Z0-9]")


def normalize_plate(raw_text: str) -> str:
    """Strip whitespace/punctuation and uppercase. Returns "" if nothing usable."""
    if not raw_text:
        return ""
    cleaned = raw_text.upper()
    cleaned = _ALLOWED_CHARS.sub("", cleaned)
    return cleaned


def is_plausible_indian_plate(normalized: str) -> bool:
    """Loose shape check: SS DD LL(L) DDDD, e.g. MH12AB1234 / MH12A1234."""
    return bool(re.fullmatch(r"[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}", normalized))
