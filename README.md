# City AI Traffic Intelligence Engine (SIH26127)

City-wide AI engine for multi-camera ANPR trajectory tracking and urban
traffic analytics — a prototype for SIH problem statement SIH26127.

> **Status: Phase 1 — project skeleton.** Search, trajectory reconstruction,
> map visualization, live tracking and analytics are not implemented yet.
> This phase only proves the three services boot and talk to each other.

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

## Configuration

| File | Purpose |
| --- | --- |
| `frontend/.env.local` | `NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:8080`) |
| `backend/src/main/resources/application.yml` | Server port, H2 datasource, CORS origins, AI service base URL |

The backend's H2 database is file-based at `backend/data/` (git-ignored) so
data survives restarts during development; swap the datasource for
PostgreSQL/PostGIS when moving beyond the prototype.

## Build phases

This project is built incrementally. See the phase plan for what's next:

1. **Project skeleton** ✅ (this phase)
2. FastAPI/Spring Boot + database schema
3. Camera/video demo dataset
4. Vehicle detection
5. Plate detection + OCR
6. Detection storage + search API
7. Multi-object tracking
8. Cross-camera matching
9. Trajectory reconstruction engine
10. Map visualization
11. Investigation frontend (search → results → evidence)
12. Evidence viewer
13. Live WebSocket simulation
14. Analytics dashboard
15. Polish + testing

Later phases replace the mocked/H2/single-node pieces with PostgreSQL+PostGIS,
Redis, and a proper vehicle registry integration — the interfaces are kept
clean for that swap; none of it is built prematurely.
