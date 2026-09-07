/**
 * Routing Engine for Real-Road Trajectory Mapping
 * Connects camera checkpoint coordinates along actual Pune roads via OSRM (Open Source Routing Machine),
 * with robust in-memory caching and fallback road curve generation.
 */

const routeCache = new Map<string, [number, number][]>();

/**
 * Fetch real driving road coordinates between a list of GPS waypoints [longitude, latitude].
 * Falls back to piecewise smooth road coordinates if OSRM is unreachable or timed out.
 */
export async function fetchRoadRoute(
  waypoints: [number, number][],
): Promise<[number, number][]> {
  if (waypoints.length < 2) return waypoints;

  const cacheKey = waypoints.map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`).join(";");
  const cached = routeCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Build OSRM query string: lng,lat;lng,lat;...
  const coordsParam = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordsParam}?overview=full&geometries=geojson`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(osrmUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (
        data.code === "Ok" &&
        Array.isArray(data.routes) &&
        data.routes.length > 0 &&
        data.routes[0].geometry?.coordinates
      ) {
        const roadCoords: [number, number][] = data.routes[0].geometry.coordinates;
        if (roadCoords.length >= 2) {
          routeCache.set(cacheKey, roadCoords);
          return roadCoords;
        }
      }
    }
  } catch (err) {
    console.warn("OSRM routing service unavailable, generating fallback path:", err);
  }

  // Fallback: Generate dense intermediate road-following points
  const fallbackCoords: [number, number][] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const start = waypoints[i];
    const end = waypoints[i + 1];
    const steps = 20;

    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      // Slight smooth curved deviation to simulate road layout instead of straight Euclidean line
      const deviationFactor = Math.sin(t * Math.PI) * 0.0012;
      const lng = start[0] + (end[0] - start[0]) * t + (i % 2 === 0 ? deviationFactor : -deviationFactor);
      const lat = start[1] + (end[1] - start[1]) * t + (i % 2 === 1 ? deviationFactor : -deviationFactor);
      fallbackCoords.push([lng, lat]);
    }
  }
  fallbackCoords.push(waypoints[waypoints.length - 1]);

  routeCache.set(cacheKey, fallbackCoords);
  return fallbackCoords;
}
