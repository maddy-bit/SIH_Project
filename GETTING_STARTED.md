# Getting Started

You forked or cloned this repo — here's how to get it running and see the
real thing work, not just read about it. For the full technical story
(architecture, what's genuinely tested vs. not, the production-readiness
gap analysis), see [`README.md`](./README.md) — this doc is just the fast
path to a working demo.

## What you're getting

A working prototype for **SIH26127**: multi-camera ANPR (license-plate
recognition), cross-camera vehicle trajectory reconstruction, a live map
investigation UI, and city traffic analytics — built on real pretrained
AI models (YOLOv8, EasyOCR, ByteTrack) running against demo footage, a
Spring Boot + PostgreSQL/PostGIS (or H2) backend, and a Next.js frontend.

## 1. Prerequisites

| Tool | Version | Check with |
| --- | --- | --- |
| Java | 21+ | `java -version` |
| Maven | 3.9+ | `mvn -version` |
| Node.js | 20+ | `node -v` |
| npm | (bundled with Node) | `npm -v` |
| Python | 3.11+ | `python3 --version` |

You'll also want **~8 GB of free disk** the first time you set up the AI
service — its dependencies include PyTorch, and model weights download on
first use.

Optional, only if you want the real production datasource instead of the
zero-config default: **PostgreSQL 16 + the PostGIS extension**.

## 2. Clone

```bash
git clone https://github.com/maddy-bit/SIH_Project.git
cd SIH_Project
```

## 3. Set up each service

You'll run three things: the backend (Spring Boot), the AI service
(Python), and the frontend (Next.js). Open three terminals.

**Backend:**

```bash
cd backend
mvn spring-boot:run
```

Leave this running. Verify: `curl http://localhost:8080/api/health` should
return `{"status":"ok",...}`.

**AI service** (heavier install — PyTorch et al.):

```bash
cd ai-service
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

You don't need to run this as a server for the next step — the ingestion
script below imports it directly. (It *can* also run standalone:
`.venv/bin/uvicorn main:app --port 8000 --reload`, used by later phases /
if you're calling its HTTP API directly.)

**Frontend:**

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000** — you should see a dark dashboard with
**SYSTEM ONLINE** in the header. That confirms the frontend can reach the
backend. At this point the vehicle search will return "no vehicle found"
for everything — that's expected, see the next step.

## 4. Load the demo data (important — do this once)

**The database starts empty.** The demo video clips are committed to the
repo (`videos/`), but nobody has run them through the AI pipeline yet on
your machine — that step writes into your local database, which is
git-ignored on purpose (it's generated data, not source).

From the repo root, with the backend still running:

```bash
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-01.mp4 --camera CAM-01 --start-time 2026-08-30T18:14:23
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-03.mp4 --camera CAM-03 --start-time 2026-08-30T18:21:52
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-07.mp4 --camera CAM-07 --start-time 2026-08-30T18:35:18
ai-service/.venv/bin/python3 scripts/process_video.py --video videos/CAM-11.mp4 --camera CAM-11 --start-time 2026-08-30T18:48:02
```

Each command takes a few seconds (loading YOLOv8 + EasyOCR, then running
real detection/OCR on the clip) and ends with `Stored 5/5 detections via
http://localhost:8080/api/detections/ingest`. This is genuine model
inference on real video frames — not fixtures.

Want the full 11-camera network (decoy vehicles, so the search isn't
hardcoded to one plate)? See the complete command list in the README's
["Running the AI pipeline"](./README.md#running-the-ai-pipeline-phases-36)
section.

## 5. See it work

Back in the browser at http://localhost:3000:

1. The search box is pre-filled with `MH12AB1234` — the demo scenario's
   target vehicle. Click **SEARCH VEHICLE**.
2. You should see: a vehicle intelligence panel (SUV, White, 4 cameras,
   ~11 km, ~33 min, ~89% trajectory confidence), a detection timeline
   (`CAM-01 → CAM-03 → CAM-07 → CAM-11` with gaps and match confidences),
   and an evidence panel showing the actual detected frame with the
   plate.
3. Click **▶ Replay Trajectory** to animate the route.
4. Try the **Live** search mode to watch detections stream in over a
   WebSocket instead of loading all at once.
5. Switch to the **City Traffic Summary** tab for the analytics
   dashboard.

If the map area is blank: that's very likely your network blocking the
free CARTO tile CDN (common on some corporate/VPN networks), not a bug —
everything else works independently of it. See the README's
[map-rendering caveat](./README.md#investigation-frontend-phases-1011)
if it persists.

## 6. Verify everything end-to-end (optional but recommended)

```bash
./scripts/smoke_test.sh
```

This hits every API endpoint and checks real responses (not just "did it
200") — 17 checks, should all pass. Also run the backend's own test suite:

```bash
cd backend && mvn test
```

## 7. Auth note

Two endpoints require credentials — `POST /api/detections/ingest` (used
by the script in step 4) and `GET /api/audit/recent`. Local defaults:

```
username: ingest
password: change-me-in-production
```

`scripts/process_video.py` sends these automatically. **Change them**
(`INGEST_USERNAME`/`INGEST_PASSWORD` env vars) before deploying this
anywhere other than your own machine.

## 8. Want the real PostgreSQL + PostGIS datasource instead of H2?

```bash
sudo -u postgres psql -c "CREATE USER cityai WITH PASSWORD 'cityai_dev_password';"
sudo -u postgres psql -c "CREATE DATABASE cityai OWNER cityai;"
sudo -u postgres psql -d cityai -c "CREATE EXTENSION IF NOT EXISTS postgis;"

cd backend
SPRING_PROFILES_ACTIVE=postgres mvn spring-boot:run
```

Then repeat step 4 against this fresh database. See the README's
["Production datasource"](./README.md#production-datasource-postgresql--postgis)
section for what this actually gives you (a real `GET /api/cameras/nearby`
spatial query, not just an unused extension install).

## 9. Docker (written, not build-verified — see README)

```bash
docker compose up --build
```

This *should* bring up Postgres+PostGIS, the backend, the AI service, and
the frontend together. It's written to standard patterns but hasn't been
build-tested in every environment — if it doesn't work first try, file an
issue or fix forward; don't assume it's supposed to be broken.

## Troubleshooting

- **"video not found" from `process_video.py`** — run it from the repo
  root, not from inside `scripts/` or `ai-service/`.
- **Port already in use** — something else is on 8080/3000/8000; stop it
  or override (`SERVER_PORT` env var for the backend, `-p` flag for
  `next dev`).
- **First AI-service run is slow** — YOLOv8 weights (~6 MB) and EasyOCR's
  models (~50–100 MB) download on first use. Later runs are fast.
- **`mvn` can't find Java 21** — check `JAVA_HOME` points at a JDK 21
  install, not an older one.

## Where to go deeper

- [`README.md`](./README.md) — architecture, every API endpoint, what's
  genuinely tested vs. not, and the full production-readiness gap
  analysis with a prioritized roadmap.
- [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — what runs on
  every push.
- No `LICENSE` file exists yet in this repo — that's the repo owner's
  call to add, not assumed here.
