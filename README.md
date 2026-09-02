# City AI Traffic Intelligence Engine (SIH26127)

City-wide AI engine for multi-camera ANPR trajectory tracking and urban
traffic analytics — a prototype for SIH problem statement SIH26127.

> **Status: Phases 1–6.** The full pipeline runs end-to-end for a single
> camera: real video → real YOLOv8 vehicle detection → real ByteTrack
> tracking → real plate-region detection → real EasyOCR → normalized plate
> → stored in the backend → searchable via `GET /api/vehicles/{plate}`.
> Cross-camera trajectory scoring (Phase 9), the map, live mode and
> analytics are not implemented yet.

## Architecture

```
frontend/     Next.js + TypeScript + Tailwind + Framer Motion (investigation UI)
backend/      Spring Boot (Java 21) — REST API, database, trajectory engine,
              business logic. The system of record.
ai-service/   Python FastAPI — computer-vision pipeline (vehicle detection,
              plate detection, OCR, tracking, Re-ID). Called internally by
              the Spring Boot backend; not exposed to the frontend directly.
```

```
Frontend (Next.js)
   │  HTTP / WebSocket
   ▼
Backend (Spring Boot)  ──HTTP──▶  AI Service (FastAPI)
   │
   ▼
Database (H2 for prototype → PostgreSQL/PostGIS later)
```

The AI service is Python because the computer-vision stack (YOLO,
PaddleOCR/EasyOCR, ByteTrack) is Python-first with no mature Java
equivalent. Spring Boot owns the API, persistence, trajectory-scoring logic
and all business rules; it calls the AI service only for inference.

## Prerequisites

- Java 21+ and Maven 3.9+
- Node.js 20+ and npm
- Python 3.11+

## Running locally

Each service runs independently. Open three terminals:

**Backend** (port 8080)

```bash
cd backend
mvn spring-boot:run
```

Verify: `curl http://localhost:8080/api/health`

**AI service** (port 8000)

```bash
cd ai-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn main:app --port 8000 --reload
```

Verify: `curl http://localhost:8000/health`

**Frontend** (port 3000)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the header status bar should read
**SYSTEM ONLINE**, confirming the frontend reached the backend's
`/api/health` endpoint (CORS is pre-configured for `localhost:3000`).

## Running the AI pipeline (Phases 3–6)

The AI service's Python dependencies are heavy (PyTorch, for YOLO and
EasyOCR) — install them once:

```bash
cd ai-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

**Demo footage.** `videos/source_traffic_1.mp4` and `source_traffic_2.mp4`
are real traffic clips (Intel IoT DevKit's public sample-videos repo) used
to prove the detector works on genuine footage. Real CCTV footage with
legible plates isn't available for a prototype, so the controlled
multi-camera scenario (`videos/CAM-*.mp4`) is generated: real vehicle
photo crops - extracted from those same real clips by the actual detector
(`scripts/extract_vehicle_sprites.py`) - composited onto a plain road
backdrop with a rendered plate patch (`scripts/generate_demo_footage.py`).
Every generated clip is stamped "SYNTHETIC DEMO FEED" on-screen. The
detection, tracking, plate-localization and OCR that run on these clips
are genuine model inference over real pixels — nothing about the *results*
is scripted, only the *input footage* is a disclosed composite. Both
scripts have already been run; their outputs are committed, so you don't
need to re-run them unless you want to regenerate the scenario.

**Process a camera's video and store its detections** (backend must be
running first):

```bash
ai-service/.venv/bin/python3 scripts/process_video.py \
  --video videos/CAM-01.mp4 --camera CAM-01 --start-time 2026-08-30T18:14:23
```

This loads YOLOv8 + EasyOCR, runs detection → tracking → plate detection →
OCR → normalization on the video, saves an evidence frame per detection
under `data/evidence/`, and POSTs each detection to
`POST /api/detections/ingest`. Add `--dry-run` to see the detections
without storing them.

The demo scenario (target vehicle `MH12AB1234` passing `CAM-01` →
`CAM-03` → `CAM-07` → `CAM-11`, plus decoy vehicles on other cameras) is
reproduced with:

```bash
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-01.mp4 --camera CAM-01 --start-time 2026-08-30T18:14:23
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-03.mp4 --camera CAM-03 --start-time 2026-08-30T18:21:52
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-07.mp4 --camera CAM-07 --start-time 2026-08-30T18:35:18
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-11.mp4 --camera CAM-11 --start-time 2026-08-30T18:48:02
# decoys, so the search isn't hardcoded to one vehicle:
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-02.mp4 --camera CAM-02 --start-time 2026-08-30T17:50:00
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-04.mp4 --camera CAM-04 --start-time 2026-08-30T18:05:00
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-05.mp4 --camera CAM-05 --start-time 2026-08-30T18:40:00
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-06.mp4 --camera CAM-06 --start-time 2026-08-30T19:10:00
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-08.mp4 --camera CAM-08 --start-time 2026-08-30T17:30:00
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-09.mp4 --camera CAM-09 --start-time 2026-08-30T20:00:00
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-10.mp4 --camera CAM-10 --start-time 2026-08-30T16:45:00
```

**Verify the search API:**

```bash
curl http://localhost:8080/api/vehicles/MH12AB1234
curl http://localhost:8080/api/vehicles/MH12AB1234/detections
```

The summary response should show 4 cameras visited (`CAM-01`, `CAM-03`,
`CAM-07`, `CAM-11`) — this is real output from real inference on the demo
footage, not fixtures. Evidence frames are served at
`GET /evidence/{cameraId}/{filename}`.

## AI pipeline modules

| Module | Role | Approach |
| --- | --- | --- |
| `ai-service/ai/vehicle_detector.py` | Vehicle detection | Pretrained YOLOv8n (COCO), no custom training |
| `ai-service/ai/tracker.py` | Multi-object tracking | Ultralytics' built-in ByteTrack |
| `ai-service/ai/plate_detector.py` | Plate region localization | Pretrained OpenCV Haar cascade (baseline; swap for a YOLO plate model later) |
| `ai-service/ai/ocr.py` | Plate text reading | Pretrained EasyOCR |
| `ai-service/utils/plate_normalizer.py` | Plate normalization | Regex-based canonicalization ("MH 12 AB 1234" → "MH12AB1234") |
| `ai-service/ai/reid.py` | Appearance similarity | HSV color-histogram baseline (interface ready for a learned Re-ID model) |

Every module exposes a small, swappable interface (`detect()`, `track_video()`,
`read_plate()`, `embed()`/`similarity()`) so a stronger model can replace
the baseline without touching callers.

## Configuration

| File | Purpose |
| --- | --- |
| `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`) |
| `backend/src/main/resources/application.yml` | Server port, H2 datasource, CORS origins, `app.data-dir`/`app.evidence-dir`, AI service base URL |

The backend's H2 database is file-based at `backend/data/` (git-ignored) so
data survives restarts during development; swap the datasource for
PostgreSQL/PostGIS when moving beyond the prototype. `data/cameras.json`
and `data/vehicles.json` (repo root) are the seed camera network and the
mock vehicle registry, loaded at backend startup.

## API reference (current)

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Liveness |
| `GET /api/cameras` | List all cameras |
| `GET /api/cameras/{id}` | One camera |
| `GET /api/vehicles/{plate}` | Vehicle intelligence summary (first/last seen, cameras visited, detection count) |
| `GET /api/vehicles/{plate}/detections` | Raw detection events for a plate, chronological |
| `POST /api/detections/ingest` | Store one AI-pipeline detection event (used by `scripts/process_video.py`) |
| `POST /api/detections/ingest/batch` | Same, batched |
| `GET /evidence/{cameraId}/{file}` | Saved evidence frame for a detection |

Plate lookups accept any casing/spacing ("mh12ab1234", "MH 12 AB 1234") -
both sides normalize the same way (`utils/plate_normalizer.py` /
`util/PlateNormalizer.java`). An unknown plate or camera returns a `404`
with a JSON error body, not a stack trace.

## Build phases

This project is built incrementally. See the phase plan for what's next:

1. **Project skeleton** ✅
2. FastAPI/Spring Boot + database schema ✅
3. Camera/video demo dataset ✅
4. Vehicle detection ✅ (pretrained YOLOv8n)
5. Plate detection + OCR ✅ (Haar cascade + EasyOCR)
6. Detection storage + search API ✅
7. Multi-object tracking ✅ (ByteTrack, folded into Phase 4-6 above)
8. Cross-camera matching — not started (next)
9. Trajectory reconstruction engine — not started
10. Map visualization — not started
11. Investigation frontend (search → results → evidence) — not started
12. Evidence viewer — not started
13. Live WebSocket simulation — not started
14. Analytics dashboard — not started
15. Polish + testing — not started

Later phases replace the mocked/H2/single-node pieces with PostgreSQL+PostGIS,
Redis, and a proper vehicle registry integration — the interfaces are kept
clean for that swap; none of it is built prematurely.
