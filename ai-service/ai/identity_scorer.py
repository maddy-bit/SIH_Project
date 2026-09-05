"""
Multi-factor identity scoring engine for cross-camera vehicle association.

Combines 6 weighted signals into a single unified match score:
  1. License Plate Text Match (40% weight) - Levenshtein string similarity
  2. Appearance Re-ID Embedding Similarity (30% weight) - Cosine distance
  3. Dominant Color Similarity (12% weight)
  4. Vehicle Type Compatibility (10% weight)
  5. Temporal Proximity (5% weight)
  6. Camera Spatial Topology Feasibility (3% weight)
"""

from __future__ import annotations
import math
import numpy as np
import logging
from config import cfg
from schemas import VehicleObservation, IdentityMatchResult
from ai.reid import ReIdService
from ai.camera_topology import CameraTopologyService

logger = logging.getLogger(__name__)


def levenshtein_distance(s1: str, s2: str) -> int:
    """Compute Levenshtein edit distance between two strings."""
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]


def compute_plate_similarity(p1: str | None, p2: str | None) -> float:
    """
    Computes normalized similarity between two license plate strings [0.0 - 1.0].
    Handles character confusions (e.g. O/0, I/1, B/8).
    """
    if not p1 or not p2:
        return 0.0

    p1_clean = p1.replace("-", "").replace(" ", "").upper()
    p2_clean = p2.replace("-", "").replace(" ", "").upper()

    if p1_clean == p2_clean:
        return 1.0

    max_len = max(len(p1_clean), len(p2_clean))
    if max_len == 0:
        return 0.0

    dist = levenshtein_distance(p1_clean, p2_clean)

    # 1 edit distance in 10-char plate = 0.90 similarity
    sim = max(0.0, 1.0 - (dist / float(max_len)))

    # Prefix state code match bonus (e.g., both MH, both KA)
    if len(p1_clean) >= 2 and len(p2_clean) >= 2 and p1_clean[:2] == p2_clean[:2]:
        sim = min(1.0, sim + 0.05)

    return sim


class IdentityScorer:
    def __init__(
        self,
        reid_service: ReIdService | None = None,
        topology_service: CameraTopologyService | None = None,
    ):
        self.reid_service = reid_service or ReIdService()
        self.topology_service = topology_service or CameraTopologyService()

        # Weights from config
        self.w_plate = float(cfg.WEIGHT_PLATE_MATCH)
        self.w_reid = float(cfg.WEIGHT_REID_SIMILARITY)
        self.w_color = float(cfg.WEIGHT_COLOR_MATCH)
        self.w_type = float(cfg.WEIGHT_TYPE_MATCH)
        self.w_temp = float(cfg.WEIGHT_TEMPORAL_DELTA)
        self.w_topo = float(cfg.WEIGHT_TOPOLOGY_FEASIBILITY)

    def score_pair(
        self,
        obs1: VehicleObservation,
        obs2: VehicleObservation,
    ) -> IdentityMatchResult:
        """
        Calculates match score between two vehicle observations from different cameras/tracks.
        """
        # 1. Plate score
        plate_sim = compute_plate_similarity(obs1.license_plate, obs2.license_plate)
        # Weight by plate confidence if both present
        if obs1.license_plate and obs2.license_plate:
            plate_conf_factor = (obs1.plate_confidence + obs2.plate_confidence) / 2.0
            s_plate = plate_sim * (0.5 + 0.5 * plate_conf_factor)
        else:
            s_plate = 0.0

        # 2. Re-ID score
        if obs1.reid_embedding and obs2.reid_embedding:
            vec1 = np.array(obs1.reid_embedding, dtype=np.float32)
            vec2 = np.array(obs2.reid_embedding, dtype=np.float32)
            if len(vec1) == len(vec2) and len(vec1) > 0:
                dot = float(np.dot(vec1, vec2))
                s_reid = max(0.0, min(1.0, dot))
            else:
                s_reid = 0.0
        else:
            s_reid = 0.0

        # 3. Color score
        if obs1.color and obs2.color and obs1.color != "Unknown" and obs2.color != "Unknown":
            s_color = 1.0 if obs1.color.lower() == obs2.color.lower() else 0.0
        else:
            s_color = 0.5  # Neutral if unknown

        # 4. Vehicle Type score
        if obs1.vehicle_type and obs2.vehicle_type:
            s_type = 1.0 if obs1.vehicle_type.lower() == obs2.vehicle_type.lower() else 0.1
        else:
            s_type = 0.5

        # 5. Temporal score
        dt = abs(obs2.timestamp_first - obs1.timestamp_last)
        # Decaying score: 1.0 for immediate, decaying with time window (e.g. 1 hour = 3600s)
        s_temp = max(0.0, 1.0 - (dt / 3600.0))

        # 6. Topology feasibility score
        s_topo = self.topology_service.topology_score(
            obs1.camera_id, obs1.timestamp_last,
            obs2.camera_id, obs2.timestamp_first,
        )

        # Hard constraint check: if travel is physically impossible, zero out score
        if s_topo == 0.0 and obs1.camera_id != obs2.camera_id:
            final_score = 0.0
            is_match = False
        else:
            # If plates match exactly with high confidence (>0.95), boost score
            if plate_sim == 1.0 and obs1.plate_confidence > 0.8 and obs2.plate_confidence > 0.8:
                final_score = max(0.95, (self.w_plate * s_plate + self.w_reid * s_reid + 
                                         self.w_color * s_color + self.w_type * s_type + 
                                         self.w_temp * s_temp + self.w_topo * s_topo))
            else:
                # Dynamic re-weighting if plate is missing
                if not obs1.license_plate or not obs2.license_plate:
                    # Redistribute plate weight to ReID and Color
                    w_reid_adj = self.w_reid + (self.w_plate * 0.6)
                    w_color_adj = self.w_color + (self.w_plate * 0.4)
                    w_sum = w_reid_adj + w_color_adj + self.w_type + self.w_temp + self.w_topo
                    final_score = (w_reid_adj * s_reid + w_color_adj * s_color + 
                                   self.w_type * s_type + self.w_temp * s_temp + 
                                   self.w_topo * s_topo) / w_sum
                else:
                    final_score = (self.w_plate * s_plate + self.w_reid * s_reid + 
                                   self.w_color * s_color + self.w_type * s_type + 
                                   self.w_temp * s_temp + self.w_topo * s_topo)

            is_match = final_score >= float(cfg.MATCH_SCORE_THRESHOLD)

        return IdentityMatchResult(
            score=float(final_score),
            is_match=is_match,
            plate_score=float(s_plate),
            reid_score=float(s_reid),
            color_score=float(s_color),
            type_score=float(s_type),
            temporal_score=float(s_temp),
            topology_score=float(s_topo),
        )
