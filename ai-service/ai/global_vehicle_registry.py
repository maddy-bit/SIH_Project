"""
Global Vehicle Identity Registry module.

Maintains unified global vehicle identities across all camera feeds.
Assigns persistent `global_id` (e.g., VEH-GLOBAL-00102) to physical vehicles
by matching local camera track observations to existing global records.
"""

from __future__ import annotations
import uuid
import logging
from typing import Dict, List, Optional
from schemas import VehicleObservation, GlobalVehicleRecord
from ai.identity_scorer import IdentityScorer
from config import cfg

logger = logging.getLogger(__name__)


class GlobalVehicleRegistry:
    def __init__(self, identity_scorer: IdentityScorer | None = None):
        self.scorer = identity_scorer or IdentityScorer()
        self.records: dict[str, GlobalVehicleRecord] = {}  # global_id -> Record
        self.plate_to_global_id: dict[str, str] = {}       # clean_plate -> global_id
        self._next_id_seq = 1000

    def _generate_global_id(self) -> str:
        self._next_id_seq += 1
        return f"VEH-GLOBAL-{self._next_id_seq}"

    def register_or_update(self, observation: VehicleObservation) -> str:
        """
        Process a new VehicleObservation from a camera pipeline.
        Matches against existing global records or creates a new one.

        Returns:
            global_id (str) assigned to this observation.
        """
        clean_plate = observation.license_plate.replace("-", "").replace(" ", "").upper() if observation.license_plate else None

        # 1. Fast path: Direct exact plate lookup if high confidence plate
        if clean_plate and observation.plate_confidence >= 0.70:
            if clean_plate in self.plate_to_global_id:
                global_id = self.plate_to_global_id[clean_plate]
                self._update_existing_record(global_id, observation)
                logger.info(f"Direct plate match '{clean_plate}' -> {global_id}")
                return global_id

        # 2. Multi-signal matching against existing global records
        best_global_id = None
        best_score = 0.0

        for gid, record in self.records.items():
            # Construct a representative observation from the global record
            repr_obs = self._record_to_representative_observation(record)
            match_res = self.scorer.score_pair(observation, repr_obs)

            if match_res.is_match and match_res.score > best_score:
                best_score = match_res.score
                best_global_id = gid

        if best_global_id is not None:
            self._update_existing_record(best_global_id, observation)
            logger.info(f"Multi-signal match (score={best_score:.3f}) -> {best_global_id}")
            return best_global_id

        # 3. No match found: Register new global vehicle record
        new_gid = self._generate_global_id()
        new_record = GlobalVehicleRecord(
            global_id=new_gid,
            primary_plate=observation.license_plate,
            plate_confidence=observation.plate_confidence,
            color=observation.color,
            vehicle_type=observation.vehicle_type,
            observations=[observation],
            reid_embedding=observation.reid_embedding,
            first_seen_timestamp=observation.timestamp_first,
            last_seen_timestamp=observation.timestamp_last,
            cameras_visited=[observation.camera_id],
        )

        self.records[new_gid] = new_record
        if clean_plate and observation.plate_confidence >= 0.60:
            self.plate_to_global_id[clean_plate] = new_gid

        logger.info(f"Registered new global vehicle identity -> {new_gid} (Plate: {observation.license_plate})")
        return new_gid

    def _update_existing_record(self, global_id: str, obs: VehicleObservation):
        rec = self.records[global_id]
        rec.observations.append(obs)
        rec.last_seen_timestamp = max(rec.last_seen_timestamp, obs.timestamp_last)

        if obs.camera_id not in rec.cameras_visited:
            rec.cameras_visited.append(obs.camera_id)

        # Update primary plate if new observation has higher confidence plate
        if obs.license_plate and (not rec.primary_plate or obs.plate_confidence > rec.plate_confidence):
            rec.primary_plate = obs.license_plate
            rec.plate_confidence = obs.plate_confidence
            clean = obs.license_plate.replace("-", "").replace(" ", "").upper()
            self.plate_to_global_id[clean] = global_id

        # Update color/type if previous was Unknown
        if (not rec.color or rec.color == "Unknown") and obs.color != "Unknown":
            rec.color = obs.color
        if (not rec.vehicle_type or rec.vehicle_type == "car") and obs.vehicle_type != "car":
            rec.vehicle_type = obs.vehicle_type

    def _record_to_representative_observation(self, record: GlobalVehicleRecord) -> VehicleObservation:
        latest = record.observations[-1] if record.observations else None
        return VehicleObservation(
            camera_id=latest.camera_id if latest else "CAM-SYS",
            track_id=latest.track_id if latest else 0,
            timestamp_first=record.first_seen_timestamp,
            timestamp_last=record.last_seen_timestamp,
            license_plate=record.primary_plate,
            plate_confidence=record.plate_confidence,
            color=record.color,
            vehicle_type=record.vehicle_type,
            reid_embedding=record.reid_embedding,
            crop_path=latest.crop_path if latest else None,
        )

    def get_record(self, global_id: str) -> GlobalVehicleRecord | None:
        return self.records.get(global_id)

    def get_all_records(self) -> list[GlobalVehicleRecord]:
        return list(self.records.values())
