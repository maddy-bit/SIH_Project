"""
Camera topology & spatial-temporal graph module.

Computes physical distance between cameras (Haversine formula), calculates expected
and minimum feasible travel times, and evaluates temporal-spatial feasibility between
observations on different camera nodes.
"""

from __future__ import annotations
import math
import logging
from dataclasses import dataclass
from config import cfg

logger = logging.getLogger(__name__)


@dataclass
class CameraNode:
    camera_id: str
    latitude: float
    longitude: float
    name: str = ""


class CameraTopologyService:
    def __init__(self, camera_nodes: list[CameraNode] | None = None):
        self.nodes: dict[str, CameraNode] = {}
        if camera_nodes:
            for node in camera_nodes:
                self.nodes[node.camera_id] = node

    def add_camera(self, camera_id: str, lat: float, lon: float, name: str = ""):
        self.nodes[camera_id] = CameraNode(camera_id=camera_id, latitude=lat, longitude=lon, name=name)

    def haversine_distance_km(self, cam1_id: str, cam2_id: str) -> float:
        """Calculate geographical distance in kilometers between two cameras using Haversine formula."""
        if cam1_id not in self.nodes or cam2_id not in self.nodes:
            # Unknown distance fallback
            return 0.0

        n1 = self.nodes[cam1_id]
        n2 = self.nodes[cam2_id]

        r = 6371.0  # Earth radius in kilometers
        lat1, lon1 = math.radians(n1.latitude), math.radians(n1.longitude)
        lat2, lon2 = math.radians(n2.latitude), math.radians(n2.longitude)

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return r * c

    def is_travel_feasible(
        self,
        cam1_id: str,
        t1: float,
        cam2_id: str,
        t2: float,
        max_speed_kmh: float = float(cfg.MAX_FEASIBLE_SPEED_KMH),
    ) -> tuple[bool, float, float]:
        """
        Check if moving from cam1 at t1 to cam2 at t2 is physically feasible given speed limits.

        Returns:
            (is_feasible: bool, distance_km: float, speed_kmh: float)
        """
        if cam1_id == cam2_id:
            # Same camera: feasible if t2 >= t1
            return (t2 >= t1), 0.0, 0.0

        dist_km = self.haversine_distance_km(cam1_id, cam2_id)
        delta_t_sec = abs(t2 - t1)

        if dist_km <= 0.001:
            # Co-located or topology not configured
            return True, 0.0, 0.0

        if delta_t_sec <= 0.1:
            # Impossible to be at two different distant cameras at the exact same instant
            return False, dist_km, 9999.0

        speed_kmh = (dist_km / (delta_t_sec / 3600.0))

        # Check if speed exceeds max physical limit (e.g. 150 km/h)
        is_feasible = speed_kmh <= max_speed_kmh
        return is_feasible, dist_km, speed_kmh

    def topology_score(self, cam1_id: str, t1: float, cam2_id: str, t2: float) -> float:
        """
        Returns a 0.0 - 1.0 feasibility score for cross-camera link.
        1.0 = highly plausible normal travel speed
        0.0 = physically impossible travel
        """
        feasible, dist_km, speed_kmh = self.is_travel_feasible(cam1_id, t1, cam2_id, t2)
        if not feasible:
            return 0.0
        if dist_km <= 0.001:
            return 1.0

        # Optimal city speed range ~ 20 km/h - 80 km/h
        if 5.0 <= speed_kmh <= 100.0:
            return 1.0
        elif speed_kmh < 5.0:
            # Stationary / very slow traffic
            return 0.8
        else:
            # High speed (100 - 150 km/h), possible on highways
            return max(0.2, 1.0 - (speed_kmh - 100.0) / 50.0)
