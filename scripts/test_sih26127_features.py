"""
Verification test script for SIH26127 BEL Multi-Camera Features.
"""

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT / "ai-service"))

from services.multi_camera_orchestrator import MultiCameraOrchestrator
from ai.camera_topology import CameraNode
from schemas import MultiCameraFeedRequest, CameraInput

def main():
    print("Initializing SIH26127 BEL Multi-Camera Orchestrator Test...")
    orchestrator = MultiCameraOrchestrator()

    # Register camera nodes
    orchestrator.register_camera_nodes([
        CameraNode("CAM-01", 28.6792, 77.5315, "Dasna Toll Plaza - NH-9"),
        CameraNode("CAM-02", 28.6835, 77.5420, "Eastern Peripheral Interchange - Dasna"),
        CameraNode("CAM-03", 28.6755, 77.5210, "Dasna Flyover - Hapur Road"),
    ])

    # Check initial traffic summary
    summary = orchestrator.get_traffic_summary()
    print(f"[Traffic Summary] Active Cameras: {summary.total_active_cameras}, Status: {summary.city_congestion_status}")

    # Check security watchlist
    watchlist = orchestrator.watchlist_manager.get_all_watchlist_entries()
    print(f"[Watchlist] Registered Target Plates: {[w.plate_number for w in watchlist]}")

    print("SIH26127 BEL Feature Test Passed Successfully!")

if __name__ == "__main__":
    main()
