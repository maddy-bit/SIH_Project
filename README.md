# City AI Traffic Intelligence Engine (SIH26127)

City-wide AI engine for multi-camera ANPR trajectory tracking and urban
traffic analytics — a prototype for SIH problem statement SIH26127.

> **Status: all 15 phases complete.** Real video → real YOLOv8 vehicle
> detection → real ByteTrack tracking → real plate-region detection →
> real EasyOCR → normalized plate → stored in the backend →
> reconstructed into a confidence-scored route → a search-driven
> dashboard (map, intelligence panel, timeline, evidence viewer) → a
> live-tracking simulation over WebSocket → city-wide analytics. This is
> a **complete hackathon prototype, not production software** - see
> "What this is (and isn't)" near the bottom for exactly what that gap
> is. See "Investigation frontend" below for a map-rendering caveat
> specific to this dev sandbox.

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

## Trajectory engine (Phases 8–9)

`GET /api/vehicles/{plate}/trajectory` reconstructs the most probable route:

```bash
curl http://localhost:8080/api/vehicles/MH12AB1234/trajectory
```

```json
{
  "vehicle": { "plate": "MH12AB1234", "vehicleType": "SUV", "color": "White", ... },
  "points": [
    { "cameraId": "CAM-01", "timestamp": "...", "incomingTransitionConfidence": null, ... },
    { "cameraId": "CAM-03", "timestamp": "...", "incomingTransitionConfidence": 0.90, ... },
    { "cameraId": "CAM-07", "timestamp": "...", "incomingTransitionConfidence": 0.87, ... },
    { "cameraId": "CAM-11", "timestamp": "...", "incomingTransitionConfidence": 0.89, ... }
  ],
  "overallConfidence": 0.888,
  "estimatedDistanceKm": 11.18,
  "estimatedDurationMinutes": 33,
  "warning": null
}
```

**How it works** (`backend/.../trajectory/`):

1. `TrajectoryEngine` collapses the raw per-frame detections for a plate
   (many rows per camera pass) into one visit per camera, in timestamp
   order.
2. `TrajectoryScoringService` scores every consecutive camera-to-camera
   transition - this is the "don't just connect detections in timestamp
   order" reasoning the pipeline is supposed to do:
   `transition_confidence = 0.30·plate_score + 0.25·kinematic_score + 0.15·geographic_score + 0.15·direction_score + 0.15·appearance_score`
   - **plate_score** - OCR confidence of the two reads.
   - **kinematic_score** - is `distance / elapsed_time` a plausible urban
     speed? An implied speed over 150 km/h is flagged as physically
     implausible (capped confidence, explanatory note) rather than
     silently trusted - e.g. a plate misread that happens to normalize to
     a real-looking plate.
   - **geographic_score** - stands in for road-network connectivity
     (`CameraGraph`, see below).
   - **direction_score** - does the camera-to-camera bearing agree with
     the destination camera's recorded facing direction?
   - **appearance_score** - Re-ID placeholder (neutral until embeddings
     are persisted - see Known limitations).
3. `CameraGraph` computes distance/bearing/estimated-travel-time
   geometrically (great-circle) as a stand-in for a real road-network
   `CameraEdge` table, which the prototype doesn't have.
4. Overall confidence is the average transition confidence. One detection
   only → `overallConfidence: null` and
   `"warning": "NO_RELIABLE_TRAJECTORY_FOUND: only one camera detection available."`,
   matching the master prompt's low-evidence error case.

**Known limitation (honestly scoped):** a detection is only ever linked to
a `Vehicle` when its own plate was read (see `DetectionIngestionService`),
so there's exactly one detection stream per plate to score - not several
competing candidate identities to disambiguate between using appearance
when the plate is unreadable on some cameras. The scoring above still
catches implausible *transitions* within that stream; multi-candidate
appearance-based disambiguation (persisted Re-ID embeddings + a proper
assignment step) is a natural next phase, not yet built.

## Investigation frontend (Phases 10–11)

The dashboard (`http://localhost:3000`) is a single search-driven view:

- **`VehicleSearchPanel`** — registration number input + mode toggle
  (Historical / Live / Historical+Live). Only Historical calls anything
  right now; Live and Historical+Live are visibly present but disabled -
  Phase 13 wires them up.
- **`InvestigationMap`** (`components/InvestigationMap.tsx`) — the
  centerpiece. **MapLibre GL JS**, not Mapbox GL JS: the master prompt
  calls for Mapbox, but that requires a paid-tier API token this prototype
  doesn't have. MapLibre is Mapbox GL JS's open-source fork with the same
  API surface and no token required, so the swap is a later drop-in if a
  token becomes available. The basemap is CARTO's free `dark_all` raster
  tiles (no key needed) with all camera-network and trajectory data drawn
  as GeoJSON layers on top: every camera as a small status-colored dot,
  the reconstructed route as a line, numbered markers at each camera visit
  (click one, or a timeline entry, to sync selection and fly the map
  there), and a **Replay Trajectory** button that animates a marker along
  the route, pacing each hop by its real elapsed time (capped to a
  watchable ~6s total) rather than a fixed speed.
- **`VehicleIntelligencePanel`** — first/last seen, cameras visited,
  distance, travel time, overall trajectory confidence: all from
  `GET /api/vehicles/{plate}` + `.../trajectory`, nothing hardcoded.
- **`DetectionTimeline`** — one row per camera visit with the gap to the
  next (`↓ 7 min`) and its match confidence, matching the master prompt's
  timeline example format. Clicking a row (or a map marker) drives the
  same `selectedIndex` state, so the evidence panel and map stay in sync.
- **`EvidenceViewer`** — the actual saved frame for the selected
  detection (`GET /evidence/{cameraId}/{file}`), with its confidence
  scores.

Search states are explicit, not just a spinner: idle → searching →
**found** (intelligence panel + timeline + map all populate) or
**not-found** (plain explanation, not a blank screen) or **error**
(network/backend failure, distinguished from "no such vehicle").

**Known limitation - map rendering wasn't visually verified.** This
sandbox's outbound network policy blocks every public map-tile host
(CARTO, OpenStreetMap, MapLibre's own demo tiles all return 403 here), and
headless Chromium in this container never got WebGL past
`isSourceLoaded()==false` even with an empty style and no tile requests at
all - most likely a software-rendering quirk of this specific sandbox, not
the app. What *is* verified: the component reaches `style.load`, adds its
sources/layers with correctly-shaped GeoJSON (checked via
`queryRenderedFeatures`/`getStyle()` in a live page), throws no console
errors, and every non-map panel driven by the exact same search state
renders real backend data correctly (see the screenshots taken during
development). Standard MapLibre GL JS usage - GeoJSON sources, circle/line
layers, `Marker` - is heavily used in production elsewhere, so this is
flagged as "please confirm it visually on your machine" rather than
claimed as verified.

## Live tracking simulation (Phase 13)

`GET /ws/live/{plate}` (WebSocket) replays a vehicle's already-reconstructed
trajectory as a paced, chronological stream - the master prompt's "simulate
live camera processing" spec. This is explicitly a simulation over stored
demo data, not a live RTSP/camera feed (there is no such feed in this
prototype). Each connection gets:

```
{"type":"connected","plate":"MH12AB1234","totalEvents":4}
{"type":"detection","index":0,"total":4,"point":{...same shape as a trajectory point...}}
... one every 3 seconds ...
{"type":"complete","overallConfidence":0.888,"estimatedDistanceKm":11.18,"estimatedDurationMinutes":33}
```

An unknown plate gets `{"type":"error","message":"..."}` and the socket
closes, instead of hanging.

In the UI, the search panel's **Live** and **Historical + Live** modes use
this: Live builds the map/timeline progressively as events arrive (nothing
fetched up front); Historical + Live loads the full route immediately via
REST and then uses the live stream purely to auto-advance the selected
point, like an automatic guided replay. A pulsing "LIVE" badge shows
connection state, and the map's marker/timeline stay in sync with whichever
mode is active.

## Analytics (Phase 14)

`GET /api/analytics/overview` and the **City Traffic Summary** tab compute
real aggregates from stored detections/trajectories - camera network
status, vehicle type distribution, detections by hour, busiest cameras,
average transition speed, common origins/destinations, and top routes (the
most frequent camera-to-camera hops seen across all vehicles' scored
trajectories). Nothing here is a canned number; on a fresh/empty database
every panel just shows "no data yet" rather than fabricated figures.

## Testing (Phase 15)

- **Backend unit tests** (`backend/src/test/...`): `PlateNormalizerTest`,
  `GeoUtilsTest`, `TrajectoryScoringServiceTest` - run with `mvn test`.
- **API smoke test** (`scripts/smoke_test.sh`): hits every REST endpoint
  against a running backend and checks status codes + real response
  content (not just "did it 200"). Run it after ingesting the demo
  scenario: `./scripts/smoke_test.sh` (or pass a different base URL).
- Both frontend (`npm run lint`, `npm run build`) and backend (`mvn
  compile` with warnings enabled) build clean with zero warnings as of
  this phase.

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
| `GET /api/vehicles/{plate}/trajectory` | Reconstructed route: cameras visited, per-transition confidence, distance, duration |
| `POST /api/detections/ingest` | Store one AI-pipeline detection event (used by `scripts/process_video.py`) |
| `POST /api/detections/ingest/batch` | Same, batched |
| `GET /api/analytics/overview` | City-wide aggregates (see Phase 14 below) |
| `GET /ws/live/{plate}` (WebSocket) | Live-simulation detection stream (see Phase 13 below) |
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
8. Cross-camera matching ✅ (plate-linked; transition plausibility scored - see Known limitation above)
9. Trajectory reconstruction engine ✅ (`GET /api/vehicles/{plate}/trajectory`)
10. Map visualization ✅ (MapLibre GL JS - see Known limitation below)
11. Investigation frontend (search → results → evidence) ✅
12. Evidence viewer ✅ (folded into Phase 11 - `EvidenceViewer` component)
13. Live WebSocket simulation ✅ (`GET /ws/live/{plate}`, wired into Live/Historical+Live search modes)
14. Analytics dashboard ✅ (`GET /api/analytics/overview` + City Traffic Summary tab)
15. Polish + testing ✅ (backend unit tests, `scripts/smoke_test.sh`, zero-warning builds)

**All 15 phases of the SIH26127 prototype plan are complete.** See
"What this is (and isn't)" below for what that does and doesn't mean.

## What this is (and isn't)

This is a **complete, working hackathon prototype** that genuinely does
what the problem statement asks: real pretrained-model inference
(detection, tracking, OCR) on demo video, cross-camera trajectory
reconstruction with a reasoned confidence score, a full investigation UI
(search → map → timeline → evidence), a live-tracking simulation, and
city-wide analytics - all built on real stored data with no fabricated
numbers anywhere in the stack. That is what the 15-phase plan above set
out to build, and it's done.

**It is not production software**, and getting there is a different, much
larger project than finishing this one - the original brief for this repo
was explicit that building that system now would be over-engineering a
one-week prototype. None of the following exists yet:

| Area | Prototype state | What "production" would need |
| --- | --- | --- |
| **Auth** | None - the API is open | Real authentication (SSO/OAuth), session management |
| **Authorization** | None | Role-based access control, per-investigation permissions |
| **Audit logging** | None | Who searched what, when, evidence chain-of-custody logs |
| **Database** | H2, file-based, single node | PostgreSQL + PostGIS, connection pooling, backups, migrations |
| **Vehicle registry** | Local mock JSON (`data/vehicles.json`) | A real authorized RTO/government registry integration - `VehicleRegistryService` is the interface built for this swap |
| **Camera ingestion** | Pre-recorded demo clips, processed by a manual CLI script | Real RTSP ingestion, a job queue, horizontal scaling across many cameras |
| **AI inference** | CPU, single-process, one video at a time | GPU inference servers, batching, a model-serving layer |
| **Plate detection** | OpenCV Haar cascade baseline | A trained YOLO plate-detection model |
| **Re-ID / appearance matching** | Color-histogram placeholder, not persisted | A learned Re-ID embedding model, persisted vectors, real multi-candidate disambiguation when plates are unreadable |
| **Road network** | Great-circle distance/bearing (`CameraGraph`) | Real road-network data (a `CameraEdge`/routing table) |
| **Transport/security** | Plain HTTP, permissive CORS, no rate limiting | HTTPS everywhere, tightened CORS, rate limiting, input hardening |
| **Map** | MapLibre + free CARTO tiles | Mapbox GL JS + a paid token (or a licensed enterprise basemap), if the org has one |
| **Scale/infra** | One backend process, one AI-service process, local disk | Kafka/event streaming, Redis, object storage, container orchestration |
| **Ops** | Manual `mvn`/`npm`/`uvicorn` commands | Dockerized deployment, CI/CD, monitoring/alerting |

Every one of these has a clean seam already built for it - interfaces like
`VehicleRegistryService`, `ReIdService`, `PlateDetector`, and `CameraGraph`
exist specifically so the mock/simple implementation can be swapped
without touching callers. That was a deliberate architecture choice from
Phase 1 onward, not an afterthought.

If you want to go further, the honest next step isn't "keep adding
phases" - it's picking a specific piece from the table above (most likely:
a real database + auth, since almost everything else depends on those)
and scoping it as its own project.

Later phases replace the mocked/H2/single-node pieces with PostgreSQL+PostGIS,
Redis, and a proper vehicle registry integration — the interfaces are kept
clean for that swap; none of it is built prematurely.
