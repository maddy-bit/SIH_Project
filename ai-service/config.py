"""
Central configuration for the multi-camera vehicle intelligence system.

All thresholds, model paths, and pipeline tunables live here.
Import `cfg` from anywhere in the codebase — never hard-code thresholds.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# ─── paths ───────────────────────────────────────────────────────────────────

_AI_SERVICE_ROOT = Path(__file__).resolve().parent
_REPO_ROOT = _AI_SERVICE_ROOT.parent
_MODELS_DIR = _AI_SERVICE_ROOT / "models"
_DATA_DIR = _REPO_ROOT / "data"


@dataclass
class ModelPaths:
    vehicle_detector: Path = _MODELS_DIR / "yolov8s.pt"
    # Preferred: fine-tuned LP model. Fallback: pretrained HF model downloaded at runtime.
    plate_detector: Path = _MODELS_DIR / "plate_detector_yolov8n.pt"
    # Pretrained fallback (downloaded from HF on first use if fine-tuned not present)
    plate_detector_pretrained_id: str = "keremberke/yolov8n-license-plate-detection"


@dataclass
class DetectionConfig:
    vehicle_confidence_threshold: float = 0.35
    plate_confidence_threshold: float = 0.30
    # COCO class IDs to vehicle type label
    vehicle_classes: dict[int, str] = field(default_factory=lambda: {
        2: "car",
        3: "motorcycle",
        5: "bus",
        7: "truck",
    })
    # Minimum vehicle crop dimensions to attempt plate detection
    min_vehicle_crop_width: int = 80
    min_vehicle_crop_height: int = 60


@dataclass
class TrackingConfig:
    # ByteTrack parameters
    tracker_config: str = "bytetrack.yaml"
    # Sample every Nth frame for full processing (1 = every frame)
    frame_stride: int = 5
    # Attempt plate detection every Nth tracked observation per track
    plate_sample_stride: int = 3
    # Max frames to keep a track alive without detection
    max_age: int = 30


@dataclass
class OCRConfig:
    languages: tuple[str, ...] = ("en",)
    use_gpu: bool = False
    # Minimum OCR confidence to accept a reading as usable
    min_confidence: float = 0.30
    # Below this, mark reading as UNCERTAIN rather than discarding
    uncertain_threshold: float = 0.55
    # Minimum plate crop dimensions before attempting OCR
    min_plate_width: int = 60
    min_plate_height: int = 20
    # Target height for plate resize before OCR
    target_plate_height: int = 80


@dataclass
class PreprocessingConfig:
    # CLAHE clip limit for contrast enhancement
    clahe_clip_limit: float = 3.0
    clahe_tile_grid: tuple[int, int] = (8, 8)
    # Gaussian blur kernel (odd numbers only)
    denoise_kernel: int = 3
    # Unsharp mask strength
    sharpen_amount: float = 1.5
    # Whether to apply adaptive binarization as a fallback
    try_binarize: bool = True


@dataclass
class ReIDConfig:
    # Embedding dimensions: 2048 (ResNet50) + 96 (color hist)
    embedding_dim: int = 2144
    # Normalize inputs to ImageNet stats
    imagenet_mean: tuple[float, float, float] = (0.485, 0.456, 0.406)
    imagenet_std: tuple[float, float, float] = (0.229, 0.224, 0.225)
    input_size: tuple[int, int] = (224, 224)
    use_gpu: bool = False


@dataclass
class IdentityScoringConfig:
    # Weights must sum to 1.0
    weight_plate: float = 0.40
    weight_reid: float = 0.30
    weight_color: float = 0.12
    weight_type: float = 0.10
    weight_temporal: float = 0.05
    weight_topology: float = 0.03

    # Match thresholds
    confirmed_threshold: float = 0.75
    probable_threshold: float = 0.50

    # Plate scoring: character error rate <= this gives full credit
    plate_exact_match_threshold: float = 0.95
    # If plate normalized edit distance > this, plate score = 0
    plate_max_distance_ratio: float = 0.35

    # ReID cosine similarity thresholds
    reid_high_similarity: float = 0.85
    reid_low_similarity: float = 0.40


@dataclass
class TopologyConfig:
    cameras_file: Path = _DATA_DIR / "cameras.json"
    # Assumed maximum vehicle speed (km/h) for minimum travel time
    max_vehicle_speed_kmh: float = 80.0
    # Assumed minimum vehicle speed (km/h) for maximum feasible time
    min_vehicle_speed_kmh: float = 5.0
    # Hard cap: vehicle cannot reappear after this many seconds at any camera
    max_wait_seconds: float = 7200.0  # 2 hours
    # Vehicles cannot teleport: minimum time between any two camera sightings
    absolute_min_seconds: float = 10.0


@dataclass
class EvidenceConfig:
    evidence_dir: Path = _DATA_DIR / "evidence"
    # Draw vehicle bbox, plate bbox, text overlay on evidence images
    annotate_evidence: bool = True
    # Save best-quality evidence image per global vehicle
    save_best_frame: bool = True


@dataclass
class PipelineConfig:
    models: ModelPaths = field(default_factory=ModelPaths)
    detection: DetectionConfig = field(default_factory=DetectionConfig)
    tracking: TrackingConfig = field(default_factory=TrackingConfig)
    ocr: OCRConfig = field(default_factory=OCRConfig)
    preprocessing: PreprocessingConfig = field(default_factory=PreprocessingConfig)
    reid: ReIDConfig = field(default_factory=ReIDConfig)
    identity: IdentityScoringConfig = field(default_factory=IdentityScoringConfig)
    topology: TopologyConfig = field(default_factory=TopologyConfig)
    evidence: EvidenceConfig = field(default_factory=EvidenceConfig)

    # Logging: print association reasons to stdout
    verbose_association: bool = True

    # Top-level property aliases for convenience
    @property
    def DEVICE(self) -> str:
        return "cuda" if self.reid.use_gpu else "cpu"

    @property
    def FRAME_STRIDE(self) -> int:
        return self.tracking.frame_stride

    @property
    def PLATE_SAMPLE_STRIDE(self) -> int:
        return self.tracking.plate_sample_stride

    @property
    def MAX_FEASIBLE_SPEED_KMH(self) -> float:
        return float(self.topology.max_vehicle_speed_kmh)

    @property
    def WEIGHT_PLATE_MATCH(self) -> float:
        return float(self.identity.weight_plate)

    @property
    def WEIGHT_REID_SIMILARITY(self) -> float:
        return float(self.identity.weight_reid)

    @property
    def WEIGHT_COLOR_MATCH(self) -> float:
        return float(self.identity.weight_color)

    @property
    def WEIGHT_TYPE_MATCH(self) -> float:
        return float(self.identity.weight_type)

    @property
    def WEIGHT_TEMPORAL_DELTA(self) -> float:
        return float(self.identity.weight_temporal)

    @property
    def WEIGHT_TOPOLOGY_FEASIBILITY(self) -> float:
        return float(self.identity.weight_topology)

    @property
    def MATCH_SCORE_THRESHOLD(self) -> float:
        return float(self.identity.probable_threshold)


# Singleton — import and use everywhere
cfg = PipelineConfig()
