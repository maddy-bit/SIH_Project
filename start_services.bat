@echo off
title City AI Traffic Intelligence - Launcher
echo =======================================================================
echo   Starting City AI Traffic Intelligence Engine (SIH26127)
echo =======================================================================
echo.

echo [1/3] Launching Python FastAPI AI Service (Port 8000)...
start "City AI - ML Service (Port 8000)" cmd /k "cd /d %~dp0ai-service && python -m uvicorn main:app --port 8000 --reload"

echo [2/3] Launching Spring Boot Backend (Port 8080)...
start "City AI - Backend (Port 8080)" cmd /k "cd /d %~dp0backend && mvn spring-boot:run"

echo [3/3] Launching Next.js Frontend (Port 3000)...
start "City AI - Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =======================================================================
echo All services launched in separate windows!
echo   * Frontend Web UI:      http://localhost:3000
echo   * Backend Health API:   http://localhost:8080/api/health
echo   * AI Microservice Docs: http://localhost:8000/docs
echo =======================================================================

