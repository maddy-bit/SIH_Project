"""
Urban Traffic Analytics & Congestion Engine.

Computes junction-level and city-wide traffic metrics:
  - Throughput / Flow rate (vehicles per minute)
  - Average vehicle transit speed
  - Modal class distribution (Cars vs Trucks vs Buses vs Motorcycles)
  - Congestion Index (GREEN / YELLOW / RED)
"""

from __future__ import annotations
import logging
from collections import defaultdict, Counter
from typing import Dict, List
from schemas import (
    VehicleObservation,
    TrafficNodeAnalytics,
    TrafficSummaryResponse,
    VehicleJourney,
)
from ai.camera_topology import CameraTopologyService

logger = logging.getLogger(__name__)


class TrafficAnalyticsEngine:
    def __init__(self, topology_service: CameraTopologyService | None = None):
        self.topology_service = topology_service or CameraTopologyService()

    def compute_analytics(
        self,
        camera_observations: Dict[str, List[VehicleObservation]],
        journeys: List[VehicleJourney] | None = None,
    ) -> TrafficSummaryResponse:
        """
        Computes city-wide and per-camera traffic analytics.
        """
        node_analytics: List[TrafficNodeAnalytics] = []
        all_speeds: List[float] = []
        total_vehicles = 0

        for cam_id, obs_list in camera_observations.items():
            cam_name = self.topology_service.nodes[cam_id].name if cam_id in self.topology_service.nodes else f"Junction {cam_id}"
            count = len(obs_list)
            total_vehicles += count

            # Calculate time span of observations at this camera
            if obs_list:
                t_min = min(o.timestamp_first for o in obs_list)
                t_max = max(o.timestamp_last for o in obs_list)
                span_minutes = max(0.5, (t_max - t_min) / 60.0)
                vpm = count / span_minutes
            else:
                vpm = 0.0

            # Modal split (vehicle type breakdown)
            types = [o.vehicle_type for o in obs_list if o.vehicle_type]
            modal_counts = dict(Counter(types)) if types else {"car": count}

            # Collect speeds associated with this camera from journeys
            cam_speeds: List[float] = []
            if journeys:
                for j in journeys:
                    for wp in j.waypoints:
                        if wp.camera_id == cam_id and wp.transit_speed_kmh is not None and wp.transit_speed_kmh > 0:
                            cam_speeds.append(wp.transit_speed_kmh)

            avg_speed = float(sum(cam_speeds) / len(cam_speeds)) if cam_speeds else 45.0
            all_speeds.extend(cam_speeds)

            # Determine Congestion Status
            if vpm > 25 or avg_speed < 15.0:
                status = "RED"       # Heavy congestion
            elif vpm > 12 or avg_speed < 30.0:
                status = "YELLOW"    # Moderate congestion
            else:
                status = "GREEN"     # Free flow

            node_analytics.append(
                TrafficNodeAnalytics(
                    camera_id=cam_id,
                    camera_name=cam_name,
                    vehicle_count=count,
                    flow_rate_vpm=round(float(vpm), 2),
                    avg_speed_kmh=round(avg_speed, 1),
                    congestion_status=status,
                    modal_split=modal_counts,
                )
            )

        city_avg_speed = float(sum(all_speeds) / len(all_speeds)) if all_speeds else 45.0
        
        # Overall city congestion index
        red_count = sum(1 for n in node_analytics if n.congestion_status == "RED")
        if red_count >= max(1, len(node_analytics) // 3):
            city_status = "RED"
        elif any(n.congestion_status == "YELLOW" for n in node_analytics):
            city_status = "YELLOW"
        else:
            city_status = "GREEN"

        return TrafficSummaryResponse(
            total_active_cameras=len(camera_observations),
            total_vehicles_observed=total_vehicles,
            city_avg_speed_kmh=round(city_avg_speed, 1),
            city_congestion_status=city_status,
            node_analytics=node_analytics,
        )
