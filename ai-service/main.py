"""
City AI Multi-Camera Vehicle Intelligence AI Microservice (SIH26127 BEL).

Provides REST API endpoints for:
  - Single & Multi-Camera Video Feed Processing (/process-video, /process-multi-camera)
  - Vehicle Journey Trajectory Timelines (/vehicle-journey/{global_id})
  - GIS Map GeoJSON Trajectory Lines (/geojson-trajectories/{global_id})
  - Next-Junction Trajectory Forecasting (/predict-trajectory/{global_id})
  - City-Wide Urban Traffic Analytics (/traffic-analytics)
  - Security Watchlists & Security Alerts (/watchlist, /security-alerts)
  - Health & System Status (/health)
"""

from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional, Dict, Any

from schemas import (
    ProcessVideoRequest,
    ProcessVideoResponse,
    MultiCameraFeedRequest,
    MultiCameraProcessingResult,
    VehicleJourney,
    GlobalVehicleRecord,
    TrajectoryPredictionResponse,
    TrafficSummaryResponse,
    WatchlistEntry,
    SecurityAlert,
)
from services.video_pipeline import VideoPipeline
from services.multi_camera_orchestrator import MultiCameraOrchestrator

app = FastAPI(
    title="City AI ANPR Trajectory & Urban Traffic Intelligence Engine (SIH26127 BEL)",
    version="2.0.0",
    description="Bharat Electronics Limited (BEL) City-Wide Multi-Camera ANPR Trajectory & GIS Analytics System.",
)

_pipeline: Optional[VideoPipeline] = None
_orchestrator: Optional[MultiCameraOrchestrator] = None


def get_pipeline() -> VideoPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = VideoPipeline()
    return _pipeline


def get_orchestrator() -> MultiCameraOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = MultiCameraOrchestrator()
    return _orchestrator


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "city-ai-anpr-trajectory-engine",
        "organization": "Bharat Electronics Limited (BEL)",
        "sih_problem": "SIH26127",
        "version": "2.0.0",
    }


@app.post("/process-video", response_model=ProcessVideoResponse)
def process_video(request: ProcessVideoRequest) -> ProcessVideoResponse:
    """Processes a single camera video feed."""
    try:
        pipeline = get_pipeline()
        frames_processed, detections = pipeline.process(
            video_path=request.video_path,
            camera_id=request.camera_id,
            start_time_iso=request.start_time,
            frame_stride=request.frame_stride,
            plate_sample_stride=request.plate_sample_stride,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Processing failed: {exc}") from exc

    return ProcessVideoResponse(
        camera_id=request.camera_id,
        video_path=request.video_path,
        frames_processed=frames_processed,
        detections=detections,
    )


@app.post("/process-multi-camera", response_model=MultiCameraProcessingResult)
def process_multi_camera(request: MultiCameraFeedRequest) -> MultiCameraProcessingResult:
    """Processes multiple camera video feeds, performs cross-camera tracking & journey reconstruction."""
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.process_multi_camera_feeds(request, parallel=request.parallel)
        return result
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Multi-camera processing failed: {exc}") from exc


@app.get("/vehicle-journey/{global_id}", response_model=VehicleJourney)
def get_vehicle_journey(global_id: str) -> VehicleJourney:
    """Retrieves the reconstructed cross-camera timeline journey and anomaly alerts for a global vehicle ID."""
    orchestrator = get_orchestrator()
    journey = orchestrator.get_vehicle_journey(global_id)
    if not journey:
        raise HTTPException(status_code=404, detail=f"Global vehicle ID '{global_id}' not found.")
    return journey


@app.get("/predict-trajectory/{global_id}", response_model=TrajectoryPredictionResponse)
def predict_next_trajectory(global_id: str) -> TrajectoryPredictionResponse:
    """Forecasts top-3 candidate next camera junctions and ETA for a target vehicle."""
    orchestrator = get_orchestrator()
    prediction = orchestrator.predict_next_trajectory(global_id)
    if not prediction:
        raise HTTPException(status_code=404, detail=f"Global vehicle ID '{global_id}' not found.")
    return prediction


@app.get("/traffic-analytics", response_model=TrafficSummaryResponse)
def get_traffic_analytics() -> TrafficSummaryResponse:
    """Returns city-wide and junction-level traffic flow, speed profiles, and congestion statuses."""
    orchestrator = get_orchestrator()
    return orchestrator.get_traffic_summary()


@app.get("/watchlist", response_model=List[WatchlistEntry])
def get_watchlist() -> List[WatchlistEntry]:
    """Retrieves all registered target plates in the security watchlist."""
    orchestrator = get_orchestrator()
    return orchestrator.watchlist_manager.get_all_watchlist_entries()


@app.post("/watchlist", response_model=WatchlistEntry)
def add_watchlist_entry(entry: WatchlistEntry) -> WatchlistEntry:
    """Adds a new plate to the security watchlist."""
    orchestrator = get_orchestrator()
    return orchestrator.watchlist_manager.add_to_watchlist(
        plate_number=entry.plate_number,
        owner_name=entry.owner_name or "",
        reason=entry.reason,
        severity=entry.severity,
    )


@app.get("/security-alerts", response_model=List[SecurityAlert])
def get_security_alerts() -> List[SecurityAlert]:
    """Returns active security alerts (hotlist matches, cloned plates, speed violations)."""
    orchestrator = get_orchestrator()
    return orchestrator.watchlist_manager.get_all_alerts()


@app.get("/geojson-trajectories/{global_id}")
def get_geojson_trajectory(global_id: str) -> Dict[str, Any]:
    """Generates GeoJSON FeatureCollection format trajectory line for GIS map rendering."""
    orchestrator = get_orchestrator()
    journey = orchestrator.get_vehicle_journey(global_id)
    if not journey:
        raise HTTPException(status_code=404, detail=f"Global vehicle ID '{global_id}' not found.")

    coordinates = []
    for wp in journey.waypoints:
        node = orchestrator.topology_service.nodes.get(wp.camera_id)
        if node:
            coordinates.append([node.longitude, node.latitude])

    geojson = {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": coordinates,
                },
                "properties": {
                    "global_id": journey.global_id,
                    "primary_plate": journey.primary_plate or "UNKNOWN",
                    "color": journey.color,
                    "vehicle_type": journey.vehicle_type,
                    "total_distance_km": journey.total_distance_km,
                    "duration_seconds": journey.duration_seconds,
                    "waypoints_count": len(journey.waypoints),
                },
            }
        ],
    }
    return geojson
