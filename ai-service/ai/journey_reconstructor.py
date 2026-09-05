"""
Vehicle Journey Timeline Reconstructor & Anomaly Detector.

Builds chronological timeline journeys for global vehicle identities across all
camera feeds, calculates inter-camera transit times and speeds, and flags anomalies
(e.g., speed violations, impossible travel jumps, plate discrepancies).
"""

from __future__ import annotations
import logging
from schemas import (
    GlobalVehicleRecord,
    VehicleJourney,
    JourneyWaypoint,
    AnomalyAlert,
)
from ai.camera_topology import CameraTopologyService

logger = logging.getLogger(__name__)


class JourneyReconstructor:
    def __init__(self, topology_service: CameraTopologyService | None = None):
        self.topology_service = topology_service or CameraTopologyService()

    def reconstruct_journey(self, record: GlobalVehicleRecord) -> VehicleJourney:
        """
        Takes a GlobalVehicleRecord containing multi-camera observations and builds
        a chronological VehicleJourney with waypoints and anomaly detection.
        """
        if not record.observations:
            return VehicleJourney(
                global_id=record.global_id,
                primary_plate=record.primary_plate,
                color=record.color,
                vehicle_type=record.vehicle_type,
                waypoints=[],
                total_distance_km=0.0,
                duration_seconds=0.0,
                anomalies=[],
            )

        # Sort observations chronologically by first seen timestamp
        sorted_obs = sorted(record.observations, key=lambda o: o.timestamp_first)

        waypoints: list[JourneyWaypoint] = []
        anomalies: list[AnomalyAlert] = []
        total_dist_km = 0.0

        prev_obs: JourneyWaypoint | None = None

        for idx, obs in enumerate(sorted_obs):
            dwell = max(0.0, obs.timestamp_last - obs.timestamp_first)
            wp = JourneyWaypoint(
                camera_id=obs.camera_id,
                timestamp_enter=obs.timestamp_first,
                timestamp_exit=obs.timestamp_last,
                dwell_time_seconds=dwell,
                track_id=obs.track_id,
                crop_path=obs.crop_path,
                license_plate_read=obs.license_plate,
            )

            if prev_obs is not None:
                # Calculate transit parameters
                dist_km = self.topology_service.haversine_distance_km(prev_obs.camera_id, obs.camera_id)
                time_diff_sec = obs.timestamp_first - prev_obs.timestamp_exit
                
                if time_diff_sec > 0.1 and dist_km > 0:
                    speed_kmh = dist_km / (time_diff_sec / 3600.0)
                    wp.transit_speed_kmh = float(speed_kmh)
                    wp.transit_distance_km = float(dist_km)
                    total_dist_km += dist_km

                    # Anomaly 1: Excessive Speed / Teleportation
                    if speed_kmh > 150.0:
                        anomalies.append(
                            AnomalyAlert(
                                anomaly_type="IMPALA_SPEED_VIOLATION",
                                severity="HIGH",
                                description=(
                                    f"Physical impossibility: Vehicle travelled {dist_km:.2f}km between "
                                    f"{prev_obs.camera_id} and {obs.camera_id} at {speed_kmh:.1f} km/h."
                                ),
                                timestamp=obs.timestamp_first,
                                camera_id=obs.camera_id,
                            )
                        )
                elif prev_obs.camera_id != obs.camera_id and time_diff_sec <= 0.1:
                    anomalies.append(
                        AnomalyAlert(
                            anomaly_type="CONCURRENT_PRESENCE",
                            severity="CRITICAL",
                            description=(
                                f"Cloned plate / duplication suspected: Vehicle observed simultaneously on "
                                f"{prev_obs.camera_id} and {obs.camera_id} at t={obs.timestamp_first:.1f}s."
                            ),
                            timestamp=obs.timestamp_first,
                            camera_id=obs.camera_id,
                        )
                    )

            # Anomaly 2: Plate reading mismatch within same global track
            if obs.license_plate and record.primary_plate:
                clean_obs = obs.license_plate.replace("-", "").replace(" ", "").upper()
                clean_primary = record.primary_plate.replace("-", "").replace(" ", "").upper()
                if clean_obs != clean_primary and obs.plate_confidence > 0.75:
                    anomalies.append(
                        AnomalyAlert(
                            anomaly_type="PLATE_DISCREPANCY",
                            severity="MEDIUM",
                            description=(
                                f"Plate mismatch on camera {obs.camera_id}: read '{obs.license_plate}' vs "
                                f"consensus primary plate '{record.primary_plate}'."
                            ),
                            timestamp=obs.timestamp_first,
                            camera_id=obs.camera_id,
                        )
                    )

            waypoints.append(wp)
            prev_obs = wp

        t_start = waypoints[0].timestamp_enter
        t_end = waypoints[-1].timestamp_exit
        total_duration = max(0.0, t_end - t_start)

        return VehicleJourney(
            global_id=record.global_id,
            primary_plate=record.primary_plate,
            color=record.color,
            vehicle_type=record.vehicle_type,
            waypoints=waypoints,
            total_distance_km=float(total_dist_km),
            duration_seconds=float(total_duration),
            anomalies=anomalies,
        )
