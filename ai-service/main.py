"""
City AI Traffic Intelligence Engine - AI microservice (SIH26127).

Hosts the computer-vision pipeline (vehicle detection, plate detection,
OCR, tracking, Re-ID). Called internally by the Spring Boot backend and
by scripts/process_video.py; not exposed to the frontend.
"""

from fastapi import FastAPI, HTTPException

from schemas import ProcessVideoRequest, ProcessVideoResponse
from services.video_pipeline import VideoPipeline

app = FastAPI(
    title="City AI Traffic Intelligence - AI Service",
    version="0.2.0",
    description="Internal computer-vision service (detection, OCR, tracking, Re-ID).",
)

# Loaded once at process startup - the YOLO/EasyOCR model weights are
# expensive to initialize (a few seconds), not something to redo per request.
_pipeline: VideoPipeline | None = None


def get_pipeline() -> VideoPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = VideoPipeline()
    return _pipeline


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "city-ai-ai-service", "version": "0.2.0"}


@app.post("/process-video", response_model=ProcessVideoResponse)
def process_video(request: ProcessVideoRequest) -> ProcessVideoResponse:
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

    return ProcessVideoResponse(
        camera_id=request.camera_id,
        video_path=request.video_path,
        frames_processed=frames_processed,
        detections=detections,
    )
