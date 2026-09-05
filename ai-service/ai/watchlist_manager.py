"""
Watchlist Manager & Security Alerting Engine.

Maintains hotlisted target license plates (stolen/wanted vehicles) and triggers
real-time security alerts:
  - HOTLIST_MATCH: Target vehicle observed on camera
  - CLONED_PLATE: Same plate detected on 2 distant cameras simultaneously
  - SPEED_VIOLATION: Vehicle travel speed exceeds physical feasibility limits (>150 km/h)
"""

from __future__ import annotations
import uuid
import logging
from typing import Dict, List, Optional
from schemas import (
    WatchlistEntry,
    SecurityAlert,
    VehicleObservation,
    VehicleJourney,
)

logger = logging.getLogger(__name__)


class WatchlistManager:
    def __init__(self):
        # hotlist: clean_plate -> WatchlistEntry
        self.watchlist: Dict[str, WatchlistEntry] = {}
        self.alerts: List[SecurityAlert] = []

        # Seed default watchlist for demonstration
        self.add_to_watchlist("MH15TC554", owner_name="WANTED_TARGET_01", reason="STOLEN_VEHICLE", severity="CRITICAL")
        self.add_to_watchlist("KL55R2473", owner_name="WANTED_TARGET_02", reason="SUSPECT_OF_INTEREST", severity="HIGH")

    def _clean(self, plate: str) -> str:
        return plate.replace("-", "").replace(" ", "").upper()

    def add_to_watchlist(self, plate_number: str, owner_name: str = "", reason: str = "SUSPECTED_STOLEN", severity: str = "HIGH") -> WatchlistEntry:
        clean_p = self._clean(plate_number)
        entry = WatchlistEntry(
            plate_number=clean_p,
            owner_name=owner_name,
            reason=reason,
            severity=severity,
        )
        self.watchlist[clean_p] = entry
        logger.info(f"Added plate '{clean_p}' to security watchlist.")
        return entry

    def check_observation(self, obs: VehicleObservation, global_id: str | None = None) -> Optional[SecurityAlert]:
        """Check a single vehicle observation against the watchlist."""
        if not obs.license_plate:
            return None

        clean_p = self._clean(obs.license_plate)
        if clean_p in self.watchlist:
            entry = self.watchlist[clean_p]
            alert = SecurityAlert(
                alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
                alert_type="HOTLIST_MATCH",
                severity=entry.severity,
                plate_number=clean_p,
                global_id=global_id,
                camera_id=obs.camera_id,
                timestamp=obs.timestamp_first,
                description=f"SECURITY ALERT: Watchlisted vehicle '{clean_p}' ({entry.reason}) spotted on {obs.camera_id}!",
            )
            self.alerts.append(alert)
            logger.warning(alert.description)
            return alert

        return None

    def check_journey(self, journey: VehicleJourney) -> List[SecurityAlert]:
        """Check full vehicle journey for anti-spoofing / cloned plate alerts."""
        journey_alerts: List[SecurityAlert] = []

        if not journey.waypoints:
            return journey_alerts

        # Check anomalies in journey
        for anom in journey.anomalies:
            if anom.anomaly_type == "CONCURRENT_PRESENCE":
                alert = SecurityAlert(
                    alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
                    alert_type="CLONED_PLATE",
                    severity="CRITICAL",
                    plate_number=journey.primary_plate or "UNKNOWN",
                    global_id=journey.global_id,
                    camera_id=anom.camera_id,
                    timestamp=anom.timestamp,
                    description=f"CLONED PLATE ALARM: {anom.description}",
                )
                journey_alerts.append(alert)
                self.alerts.append(alert)

            elif anom.anomaly_type == "IMPALA_SPEED_VIOLATION":
                alert = SecurityAlert(
                    alert_id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
                    alert_type="SPEED_VIOLATION",
                    severity="HIGH",
                    plate_number=journey.primary_plate or "UNKNOWN",
                    global_id=journey.global_id,
                    camera_id=anom.camera_id,
                    timestamp=anom.timestamp,
                    description=f"SPEED VIOLATION: {anom.description}",
                )
                journey_alerts.append(alert)
                self.alerts.append(alert)

        return journey_alerts

    def get_all_watchlist_entries(self) -> List[WatchlistEntry]:
        return list(self.watchlist.values())

    def get_all_alerts(self) -> List[SecurityAlert]:
        return self.alerts
