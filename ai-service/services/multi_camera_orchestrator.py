"""
Multi-Camera System Orchestrator (SIH26127 BEL).

Coordinates CameraAgent instances, ingests local observations into GlobalVehicleRegistry,
runs Next-Junction Trajectory Forecasting, generates Urban Traffic Analytics,
and manages Security Watchlists & Cloned Plate Alerts.
"""

from __future__ import annotations
import os
import logging
from typing import Dict, List, Optional
from concurrent.futures import ThreadPoolExecutor

from schemas import (
    MultiCameraFeedRequest,
    MultiCameraProcessingResult,
    VehicleJourney,
    GlobalVehicleRecord,
    CameraObservation,
    TrajectoryPredictionResponse,
    TrafficSummaryResponse,
    WatchlistEntry,
    SecurityAlert,
)
from services.video_pipeline import CameraAgent
from ai.global_vehicle_registry import GlobalVehicleRegistry
from ai.journey_reconstructor import JourneyReconstructor
from ai.camera_topology import CameraTopologyService, CameraNode
from ai.trajectory_predictor import TrajectoryPredictor
from ai.traffic_analytics import TrafficAnalyticsEngine
from ai.watchlist_manager import WatchlistManager

logger = logging.getLogger(__name__)


class MultiCameraOrchestrator:
    def __init__(self, topology_service: Optional[CameraTopologyService] = None):
        self.topology_service = topology_service or CameraTopologyService()
        self.registry = GlobalVehicleRegistry()
        self.reconstructor = JourneyReconstructor(self.topology_service)
        self.predictor = TrajectoryPredictor(self.topology_service)
        self.analytics_engine = TrafficAnalyticsEngine(self.topology_service)
        self.watchlist_manager = WatchlistManager()

    def register_camera_nodes(self, nodes: List[CameraNode]):
        for n in nodes:
            self.topology_service.add_camera(n.camera_id, n.latitude, n.longitude, n.name)

    def process_camera_feed(
        self,
        camera_id: str,
        video_path: str,
        start_time_iso: str = "2026-09-05T12:00:00",
        frame_stride: int = 5,
        enable_dehaze: bool = False,
    ) -> CameraObservation:
        """
        Process a single camera feed and register observations into global registry & watchlist.
        """
        agent = CameraAgent(camera_id)
        frames_processed, obs_list, _ = agent.process_feed(
            video_path=video_path,
            start_time_iso=start_time_iso,
            frame_stride=frame_stride,
            enable_dehaze=enable_dehaze,
        )

        global_ids_assigned = []
        for obs in obs_list:
            gid = self.registry.register_or_update(obs)
            global_ids_assigned.append(gid)

            # Security Watchlist check
            self.watchlist_manager.check_observation(obs, global_id=gid)

        return CameraObservation(
            camera_id=camera_id,
            video_path=video_path,
            total_frames=frames_processed,
            tracks_detected=len(obs_list),
            vehicle_observations=obs_list,
        )

    def process_multi_camera_feeds(
        self,
        request: MultiCameraFeedRequest,
        parallel: bool = False,
    ) -> MultiCameraProcessingResult:
        """
        Processes feeds from multiple cameras, links identities, reconstructs journeys,
        trains spatial trajectory predictor, and evaluates security alerts.
        """
        logger.info(f"Starting SIH26127 multi-camera processing for {len(request.feeds)} feeds.")

        for feed in request.feeds:
            if feed.latitude is not None and feed.longitude is not None:
                self.topology_service.add_camera(
                    feed.camera_id, feed.latitude, feed.longitude, feed.camera_name or ""
                )

        camera_observations: List[CameraObservation] = []
        total_frames = 0
        total_tracks = 0

        if parallel and len(request.feeds) > 1:
            with ThreadPoolExecutor(max_workers=min(4, len(request.feeds))) as executor:
                futures = [
                    executor.submit(
                        self.process_camera_feed,
                        feed.camera_id,
                        feed.video_path,
                        feed.start_time_iso,
                        request.frame_stride,
                        request.enable_dehaze,
                    )
                    for feed in request.feeds
                ]
                for fut in futures:
                    cam_obs = fut.result()
                    camera_observations.append(cam_obs)
                    total_frames += cam_obs.total_frames
                    total_tracks += cam_obs.tracks_detected
        else:
            for feed in request.feeds:
                cam_obs = self.process_camera_feed(
                    camera_id=feed.camera_id,
                    video_path=feed.video_path,
                    start_time_iso=feed.start_time_iso,
                    frame_stride=request.frame_stride,
                    enable_dehaze=request.enable_dehaze,
                )
                camera_observations.append(cam_obs)
                total_frames += cam_obs.total_frames
                total_tracks += cam_obs.tracks_detected

        # Reconstruct journeys & check anti-spoofing security alerts
        records = self.registry.get_all_records()
        journeys: List[VehicleJourney] = []
        all_anomalies = []
        security_alerts: List[SecurityAlert] = []

        for rec in records:
            j = self.reconstructor.reconstruct_journey(rec)
            journeys.append(j)
            if j.anomalies:
                all_anomalies.extend(j.anomalies)

            alerts = self.watchlist_manager.check_journey(j)
            security_alerts.extend(alerts)

        # Train trajectory predictor on reconstructed journeys
        self.predictor.train_from_journeys(journeys)

        # Append observation alerts
        security_alerts.extend(self.watchlist_manager.get_all_alerts())
        # Deduplicate alerts by alert_id
        unique_alerts = list({a.alert_id: a for a in security_alerts}.values())

        return MultiCameraProcessingResult(
            total_cameras=len(request.feeds),
            total_frames_processed=total_frames,
            total_tracks_detected=total_tracks,
            unique_vehicles_identified=len(journeys),
            camera_observations=camera_observations,
            vehicle_journeys=journeys,
            anomalies_detected=all_anomalies,
            security_alerts=unique_alerts,
        )

    def get_vehicle_journey(self, global_id: str) -> Optional[VehicleJourney]:
        rec = self.registry.get_record(global_id)
        if not rec:
            return None
        return self.reconstructor.reconstruct_journey(rec)

    def predict_next_trajectory(self, global_id: str) -> Optional[TrajectoryPredictionResponse]:
        rec = self.registry.get_record(global_id)
        if not rec:
            return None
        journey = self.reconstructor.reconstruct_journey(rec)
        return self.predictor.predict_next_junction(rec, journey)

    def get_traffic_summary(self) -> TrafficSummaryResponse:
        cam_obs_map = {}
        for rec in self.registry.get_all_records():
            for obs in rec.observations:
                if obs.camera_id not in cam_obs_map:
                    cam_obs_map[obs.camera_id] = []
                cam_obs_map[obs.camera_id].append(obs)

        all_journeys = [self.reconstructor.reconstruct_journey(r) for r in self.registry.get_all_records()]
        return self.analytics_engine.compute_analytics(cam_obs_map, all_journeys)
