#!/usr/bin/env bash
# End-to-end smoke test against a running backend (Phase 15 polish).
# Assumes the demo scenario has already been ingested (see README's
# "Running the AI pipeline" section) - checks real stored data, not fixtures.
#
# Usage: ./scripts/smoke_test.sh [backend_base_url]

set -uo pipefail

BASE_URL="${1:-http://localhost:8080}"
PASS=0
FAIL=0

check() {
  local description="$1" method="$2" path="$3" expected_status="$4"
  local status
  status=$(curl -s -o /tmp/smoke_test_body.json -w "%{http_code}" -X "$method" "${BASE_URL}${path}")
  if [ "$status" = "$expected_status" ]; then
    echo "PASS  ($status) $description"
    PASS=$((PASS + 1))
  else
    echo "FAIL  (expected $expected_status, got $status) $description"
    FAIL=$((FAIL + 1))
  fi
}

check_contains() {
  local description="$1" path="$2" needle="$3"
  local body
  body=$(curl -s "${BASE_URL}${path}")
  if echo "$body" | grep -q "$needle"; then
    echo "PASS  $description"
    PASS=$((PASS + 1))
  else
    echo "FAIL  $description (expected to find '$needle')"
    FAIL=$((FAIL + 1))
  fi
}

check_auth() {
  local description="$1" method="$2" path="$3" expected_status="$4"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" -u "ingest:${INGEST_PASSWORD:-change-me-in-production}" "${BASE_URL}${path}")
  if [ "$status" = "$expected_status" ]; then
    echo "PASS  ($status) $description"
    PASS=$((PASS + 1))
  else
    echo "FAIL  (expected $expected_status, got $status) $description"
    FAIL=$((FAIL + 1))
  fi
}

echo "Smoke testing ${BASE_URL} ..."
echo

check "health check"                       GET "/api/health"                                  200
check "list cameras"                       GET "/api/cameras"                                 200
check "get one camera"                     GET "/api/cameras/CAM-01"                          200
check "unknown camera -> 404"              GET "/api/cameras/CAM-99"                           404
check "known vehicle summary"              GET "/api/vehicles/MH12AB1234"                      200
check "known vehicle detections"           GET "/api/vehicles/MH12AB1234/detections"           200
check "known vehicle trajectory"           GET "/api/vehicles/MH12AB1234/trajectory"           200
check "plate is case/space insensitive"    GET "/api/vehicles/mh%2012%20ab%201234"             200
check "unknown plate -> 404"               GET "/api/vehicles/ZZ99ZZ9999"                      404
check "unknown plate trajectory -> 404"    GET "/api/vehicles/ZZ99ZZ9999/trajectory"           404
check "analytics overview"                 GET "/api/analytics/overview"                       200

check_contains "trajectory covers the demo route" "/api/vehicles/MH12AB1234/trajectory" "CAM-11"
check_contains "analytics reports real camera count" "/api/analytics/overview" "totalCameras"

# Security (SecurityConfig.java): writes and the audit log require auth.
check "unauthenticated ingest -> 401"      POST "/api/detections/ingest"                       401
check "unauthenticated audit log -> 401"   GET  "/api/audit/recent"                            401
check_auth "authenticated audit log -> 200" GET "/api/audit/recent?limit=1"                     200

# Spatial (SpatialCameraService.java): only meaningful on the postgres
# profile - see README's "Production datasource" section. On H2 it's a
# clear 501, which this still checks for (never a silent wrong answer).
NEARBY_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/api/cameras/nearby?lat=18.53&lon=73.85&radiusKm=5")
if [ "$NEARBY_STATUS" = "200" ] || [ "$NEARBY_STATUS" = "501" ]; then
  echo "PASS  ($NEARBY_STATUS) nearby-cameras spatial query (200 on postgres, 501 on H2)"
  PASS=$((PASS + 1))
else
  echo "FAIL  (got $NEARBY_STATUS) nearby-cameras spatial query"
  FAIL=$((FAIL + 1))
fi

echo
echo "----------------------------------------"
echo "Passed: $PASS   Failed: $FAIL"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
