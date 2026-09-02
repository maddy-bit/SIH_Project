"""Pydantic models shared between the FastAPI app and the pipeline."""

from pydantic import BaseModel


class DetectionEvent(BaseModel):
    camera_id: str
    frame_number: int
    timestamp: str  # ISO-8601, computed from video fps + a base start time
    vehicle_class: str
    detection_confidence: float
    bbox: list[float]  # x1, y1, x2, y2
    track_id: int | None = None
    plate_text_raw: str | None = None
    plate_text_normalized: str | None = None
    plate_confidence: float | None = None
    image_path: str | None = None


class ProcessVideoRequest(BaseModel):
    video_path: str
    camera_id: str
    start_time: str  # ISO-8601 timestamp of the video's first frame
    frame_stride: int = 5
    plate_sample_stride: int = 3  # only attempt plate detection/OCR every Nth tracked frame


class ProcessVideoResponse(BaseModel):
    camera_id: str
    video_path: str
    frames_processed: int
    detections: list[DetectionEvent]
