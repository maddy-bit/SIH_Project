"""
City AI Traffic Intelligence Engine - AI microservice (SIH26127).

Phase 1: skeleton only. This service will host the computer-vision
pipeline (vehicle detection, plate detection, OCR, tracking, Re-ID)
starting in Phase 3+, and is called internally by the Spring Boot
backend - it is not exposed directly to the frontend.
"""

from fastapi import FastAPI

app = FastAPI(
    title="City AI Traffic Intelligence - AI Service",
    version="0.1.0",
    description="Internal computer-vision service (detection, OCR, tracking, Re-ID).",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "city-ai-ai-service", "version": "0.1.0"}
