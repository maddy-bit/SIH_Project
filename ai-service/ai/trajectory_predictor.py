"""
Next-Junction Trajectory Predictor & Spatial Markov Model.

Analyzes a target vehicle's recent camera waypoints and spatial topology graph,
computes transition probabilities between camera nodes, and forecasts the top-3
most likely next camera junctions with estimated arrival timestamps (ETA).
"""

from __future__ import annotations
import math
import logging
from collections import defaultdict
from typing import Dict, List, Optional
from schemas import (
    VehicleJourney,
    GlobalVehicleRecord,
    TrajectoryCandidate,
    TrajectoryPredictionResponse,
)
from ai.camera_topology import CameraTopologyService

logger = logging.getLogger(__name__)


class TrajectoryPredictor:
    """
    Spatial Markov chain & topological transition predictor for vehicle movements.
    """

    def __init__(self, topology_service: CameraTopologyService | None = None):
        self.topology_service = topology_service or CameraTopologyService()
        # transition_counts[from_cam][to_cam] = count
        self.transitions: Dict[str, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.historical_travel_times: Dict[tuple[str, str], List[float]] = defaultdict(list)

    def train_from_journeys(self, journeys: List[VehicleJourney]):
        """Build transition frequency matrix from historical vehicle journeys."""
        for j in journeys:
            if len(j.waypoints) < 2:
                continue
            for i in range(len(j.waypoints) - 1):
                c1 = j.waypoints[i].camera_id
                c2 = j.waypoints[i + 1].camera_id
                if c1 != c2:
                    self.transitions[c1][c2] += 1
                    dt = j.waypoints[i + 1].timestamp_enter - j.waypoints[i].timestamp_exit
                    if dt > 0:
                        self.historical_travel_times[(c1, c2)].append(dt)

    def predict_next_junction(
        self,
        record: GlobalVehicleRecord,
        journey: VehicleJourney | None = None,
    ) -> TrajectoryPredictionResponse:
        """
        Forecasts top-3 next camera junctions for a target vehicle based on its
        latest waypoint and spatial topology transition probabilities.
        """
        if not record.observations:
            return TrajectoryPredictionResponse(
                global_id=record.global_id,
                primary_plate=record.primary_plate,
                current_camera_id="UNKNOWN",
                last_seen_timestamp=0.0,
                candidates=[],
            )

        # Sort observations chronologically
        sorted_obs = sorted(record.observations, key=lambda o: o.timestamp_last)
        last_obs = sorted_obs[-1]
        curr_cam = last_obs.camera_id
        t_last = last_obs.timestamp_last

        # Identify candidate next cameras from spatial topology
        all_cams = list(self.topology_service.nodes.keys())
        candidates: List[TrajectoryCandidate] = []

        total_obs_transitions = sum(self.transitions[curr_cam].values())

        for target_cam in all_cams:
            if target_cam == curr_cam:
                continue

            dist_km = self.topology_service.haversine_distance_km(curr_cam, target_cam)
            if dist_km > 30.0:
                # Exclude distant non-adjacent cameras >30km for city predictions
                continue

            # Transition probability
            if total_obs_transitions > 0 and target_cam in self.transitions[curr_cam]:
                prob = self.transitions[curr_cam][target_cam] / float(total_obs_transitions)
            else:
                # Distance inverse weighting fallback if no historical transitions
                prob = 1.0 / max(dist_km, 0.5)

            # Travel time estimation (~ 40 km/h average city travel speed)
            hist_times = self.historical_travel_times.get((curr_cam, target_cam))
            if hist_times:
                est_seconds = sum(hist_times) / len(hist_times)
            else:
                est_seconds = (dist_km / 40.0) * 3600.0

            node_name = self.topology_service.nodes[target_cam].name if target_cam in self.topology_service.nodes else f"Junction {target_cam}"

            candidates.append(
                TrajectoryCandidate(
                    next_camera_id=target_cam,
                    next_camera_name=node_name or target_cam,
                    probability=float(prob),
                    estimated_travel_seconds=float(est_seconds),
                    estimated_arrival_timestamp=float(t_last + est_seconds),
                )
            )

        # Normalize probabilities and sort top-3 candidates
        if candidates:
            prob_sum = sum(c.probability for c in candidates)
            if prob_sum > 0:
                for c in candidates:
                    c.probability = float(c.probability / prob_sum)
            candidates.sort(key=lambda c: c.probability, reverse=True)
            top_candidates = candidates[:3]
        else:
            top_candidates = []

        return TrajectoryPredictionResponse(
            global_id=record.global_id,
            primary_plate=record.primary_plate,
            current_camera_id=curr_cam,
            last_seen_timestamp=t_last,
            candidates=top_candidates,
        )
