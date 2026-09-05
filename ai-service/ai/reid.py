"""
Vehicle re-identification service using ResNet50 appearance embeddings with HSV fallback.

Extracts a high-dimensional feature vector (2048-dim from ResNet50 avgpool layer)
for vehicle crops to enable visual feature comparison across camera feeds.

Falls back gracefully to HSV color histogram feature vector if PyTorch/torchvision
is unavailable or fails on CPU.
"""

from __future__ import annotations
from dataclasses import dataclass
import cv2
import numpy as np
import logging
from config import cfg

logger = logging.getLogger(__name__)

# Lazy loading PyTorch to avoid startup penalty if not needed immediately
_TORCH_AVAILABLE = False
_resnet_model = None
_resnet_transforms = None

def _init_resnet():
    global _TORCH_AVAILABLE, _resnet_model, _resnet_transforms
    if _resnet_model is not None:
        return
    try:
        import torch
        import torchvision.models as models
        import torchvision.transforms as transforms
        
        device = torch.device(cfg.DEVICE if torch.cuda.is_available() else "cpu")
        
        # Load weights without classification head (use avgpool output)
        weights = models.ResNet50_Weights.DEFAULT
        model = models.resnet50(weights=weights)
        model.fc = torch.nn.Identity() # output raw 2048-dim embeddings
        model.to(device)
        model.eval()
        
        _resnet_transforms = transforms.Compose([
            transforms.ToPILImage(),
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        _resnet_model = (model, device)
        _TORCH_AVAILABLE = True
        logger.info("ResNet50 Re-ID feature extractor initialized successfully.")
    except Exception as e:
        logger.warning(f"PyTorch/ResNet50 unavailable for Re-ID ({e}). Falling back to HSV histogram embedding.")
        _TORCH_AVAILABLE = False


@dataclass
class ReIdEmbedding:
    vector: np.ndarray  # float32 array, L2 normalized
    embedding_type: str = "resnet50"  # "resnet50" or "hsv"

    def to_list(self) -> list[float]:
        return self.vector.tolist()


class ReIdService:
    def __init__(self, use_deep_model: bool = True):
        self.use_deep_model = use_deep_model
        if self.use_deep_model:
            _init_resnet()

    def embed(self, vehicle_crop_bgr: np.ndarray) -> ReIdEmbedding | None:
        """
        Extract L2-normalized embedding vector for a vehicle crop.
        Returns ReIdEmbedding or None if crop is invalid.
        """
        if vehicle_crop_bgr is None or vehicle_crop_bgr.size == 0:
            return None

        h, w = vehicle_crop_bgr.shape[:2]
        if h < 20 or w < 20:
            return None

        if self.use_deep_model and _TORCH_AVAILABLE and _resnet_model is not None:
            try:
                import torch
                model, device = _resnet_model
                rgb = cv2.cvtColor(vehicle_crop_bgr, cv2.COLOR_BGR2RGB)
                tensor = _resnet_transforms(rgb).unsqueeze(0).to(device)
                
                with torch.no_grad():
                    feat = model(tensor).squeeze(0).cpu().numpy()
                
                # L2 normalize
                norm = np.linalg.norm(feat)
                if norm > 1e-6:
                    feat = feat / norm
                else:
                    feat = np.zeros_like(feat)

                return ReIdEmbedding(vector=feat.astype(np.float32), embedding_type="resnet50")
            except Exception as e:
                logger.debug(f"ResNet extraction failed: {e}. Falling back to HSV.")

        # Fallback HSV embedding (normalized 960-dim histogram)
        hsv = cv2.cvtColor(vehicle_crop_bgr, cv2.COLOR_BGR2HSV)
        hist = cv2.calcHist([hsv], [0, 1, 2], None, [16, 16, 8], [0, 180, 0, 256, 0, 256])
        vector = hist.flatten().astype(np.float32)
        norm = np.linalg.norm(vector)
        if norm > 1e-6:
            vector = vector / norm

        return ReIdEmbedding(vector=vector, embedding_type="hsv")

    def similarity(self, a: ReIdEmbedding | None, b: ReIdEmbedding | None) -> float:
        """
        Compute cosine similarity between two embeddings.
        Returns float score between 0.0 and 1.0.
        """
        if a is None or b is None:
            return 0.0
        if a.vector is None or b.vector is None:
            return 0.0
        if len(a.vector) == 0 or len(b.vector) == 0:
            return 0.0

        # Cosine similarity for L2-normalized vectors = dot product
        if a.embedding_type == b.embedding_type:
            dot = float(np.dot(a.vector, b.vector))
            # Clip between 0 and 1
            return max(0.0, min(1.0, (dot + 1.0) / 2.0 if a.embedding_type == "hsv" else dot))

        # Different embedding types - return baseline 0.0
        return 0.0
