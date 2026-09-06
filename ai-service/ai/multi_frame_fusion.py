"""
Multi-frame OCR evidence fusion & track aggregation module.

Accumulates OCR plate observations over frames of a single camera track,
applies character position voting, confidence weighting, and noise filtering
to produce a high-confidence consensus license plate reading.
"""

from __future__ import annotations
from collections import Counter, defaultdict
import logging
import numpy as np
from schemas import PlateObservation, VehicleObservation
from ai.ocr import validate_plate_format

logger = logging.getLogger(__name__)


class MultiFrameFusionService:
    """
    Aggregates multi-frame plate observations for a single tracked vehicle instance.
    """

    def fuse_plate_observations(self, observations: list[PlateObservation]) -> tuple[str | None, float]:
        """
        Given a list of PlateObservation objects from multiple frames of the same track:
        1. Filter out raw text with low OCR confidence (<0.30).
        2. Format-check texts to prioritize standard Indian formats.
        3. Perform character position voting weighted by frame OCR confidence.
        
        Returns:
            (consensus_text, consensus_confidence)
        """
        if not observations:
            return None, 0.0

        # Filter valid candidates
        valid_obs = [obs for obs in observations if obs.text and obs.confidence >= 0.30]
        if not valid_obs:
            # Fallback to max confidence even if low
            best = max(observations, key=lambda x: x.confidence if x.text else 0.0)
            if best and best.text and best.confidence > 0.15:
                return best.text, float(best.confidence * 0.7)
            return None, 0.0

        # If only 1 observation, return it
        if len(valid_obs) == 1:
            return valid_obs[0].text, float(valid_obs[0].confidence)

        # Prioritize valid Indian format observations
        format_valid = [obs for obs in valid_obs if validate_plate_format(obs.text)]
        candidates = format_valid if format_valid else valid_obs

        # Group exact plate strings by frequency + weighted score sum
        string_scores: dict[str, float] = defaultdict(float)
        string_counts: dict[str, int] = defaultdict(int)

        for obs in candidates:
            # Bonus weight if plate format matches Indian pattern
            weight = obs.confidence * (1.3 if validate_plate_format(obs.text) else 1.0)
            string_scores[obs.text] += weight
            string_counts[obs.text] += 1

        # Check if there is a dominant exact match
        best_string = max(string_scores.keys(), key=lambda k: string_scores[k])
        total_obs_weight = sum(string_scores.values())
        dominant_ratio = string_scores[best_string] / total_obs_weight

        if dominant_ratio >= 0.5 or len(candidates) <= 2:
            avg_conf = min(0.99, (string_scores[best_string] / string_counts[best_string]) * 1.1)
            return best_string, float(avg_conf)

        # Positional voting for string alignment (if candidates have similar lengths)
        lengths = [len(obs.text) for obs in candidates]
        common_len = Counter(lengths).most_common(1)[0][0]
        same_len_obs = [obs for obs in candidates if len(obs.text) == common_len]

        if not same_len_obs:
            avg_conf = min(0.99, string_scores[best_string] / string_counts[best_string])
            return best_string, float(avg_conf)

        fused_chars = []
        char_conf_sum = 0.0

        for pos in range(common_len):
            pos_votes: dict[str, float] = defaultdict(float)
            for obs in same_len_obs:
                char = obs.text[pos]
                pos_votes[char] += obs.confidence
            winning_char = max(pos_votes.keys(), key=lambda c: pos_votes[c])
            fused_chars.append(winning_char)
            char_conf_sum += pos_votes[winning_char] / len(same_len_obs)

        fused_text = "".join(fused_chars)
        consensus_conf = min(0.98, char_conf_sum / common_len)

        return fused_text, float(consensus_conf)

    def aggregate_vehicle_observation(
        self,
        camera_id: str,
        track_id: int,
        plate_observations: list[PlateObservation],
        color_predictions: list[str],
        type_predictions: list[str],
        reid_embeddings: list,
        timestamps: list[float],
        crop_paths: list[str],
    ) -> VehicleObservation:
        """
        Aggregates multi-frame raw detections for a track into a clean VehicleObservation.
        """
        # 1. Consensus Plate
        consensus_plate, plate_conf = self.fuse_plate_observations(plate_observations)

        # 2. Dominant Color (mode)
        valid_colors = [c for c in color_predictions if c and c != "Other" and c != "Unknown"]
        dominant_color = Counter(valid_colors).most_common(1)[0][0] if valid_colors else "Unknown"

        # 3. Dominant Type (mode)
        valid_types = [t for t in type_predictions if t and t != "vehicle"]
        dominant_type = Counter(valid_types).most_common(1)[0][0] if valid_types else "car"

        # 4. Average ReID embedding
        valid_embeddings = [e.vector for e in reid_embeddings if e is not None and e.vector is not None]
        if valid_embeddings:
            avg_vec = np.mean(valid_embeddings, axis=0)
            norm = np.linalg.norm(avg_vec)
            if norm > 1e-6:
                avg_vec = avg_vec / norm
            mean_reid = avg_vec.tolist()
        else:
            mean_reid = []

        # Timestamps range
        t_start = min(timestamps) if timestamps else 0.0
        t_end = max(timestamps) if timestamps else 0.0
        best_crop = crop_paths[0] if crop_paths else None

        return VehicleObservation(
            camera_id=camera_id,
            track_id=track_id,
            timestamp_first=t_start,
            timestamp_last=t_end,
            license_plate=consensus_plate,
            plate_confidence=plate_conf,
            color=dominant_color,
            vehicle_type=dominant_type,
            reid_embedding=mean_reid,
            crop_path=best_crop,
            plate_history=plate_observations,
        )
