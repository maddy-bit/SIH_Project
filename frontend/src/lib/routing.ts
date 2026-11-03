/**
 * Hardcoded Routing Engine for Real-Road Trajectory Mapping.
 * Connects camera checkpoint coordinates along hardcoded highway/road corridor paths,
 * ensuring fast, deterministic, offline trajectory reconstruction without external API calls.
 */

import { getHardcodedRoute, Coordinate } from "./hardcodedPaths";

const routeCache = new Map<string, Coordinate[]>();

/**
 * Fetch real driving road coordinates between a list of GPS waypoints [longitude, latitude].
 * Uses hardcoded camera corridor segments and deterministic highway curve waypoints.
 */
export async function fetchRoadRoute(
  waypoints: Coordinate[],
  cameraIds?: string[],
): Promise<Coordinate[]> {
  if (!waypoints || waypoints.length < 2) return waypoints;

  // Deduplicate consecutive identical coordinates
  const cleanWaypoints: Coordinate[] = [];
  const cleanCameraIds: string[] = [];

  for (let i = 0; i < waypoints.length; i++) {
    const curr = waypoints[i];
    const prev = cleanWaypoints[cleanWaypoints.length - 1];
    if (!prev || prev[0] !== curr[0] || prev[1] !== curr[1]) {
      cleanWaypoints.push(curr);
      if (cameraIds && cameraIds[i]) {
        cleanCameraIds.push(cameraIds[i]);
      }
    }
  }

  if (cleanWaypoints.length < 2) return cleanWaypoints;

  const cacheKey = cleanWaypoints
    .map(([lng, lat]) => `${lng.toFixed(5)},${lat.toFixed(5)}`)
    .join(";");

  const cached = routeCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Generate hardcoded road geometry connecting cameras
  const hardcodedRoadCoords = getHardcodedRoute(cleanWaypoints, cleanCameraIds.length === cleanWaypoints.length ? cleanCameraIds : undefined);

  routeCache.set(cacheKey, hardcodedRoadCoords);
  return hardcodedRoadCoords;
}
