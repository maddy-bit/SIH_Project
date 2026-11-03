/**
 * Spatiotemporal Graph Routing Engine for Real-Road Trajectory Mapping.
 * Evaluates temporal feasibility, kinematics, and centripetal spline interpolation.
 */

import {
  solveSpatiotemporalTrajectory,
  SpatiotemporalWaypoint,
  SpatiotemporalTrajectoryResult,
  Coordinate,
} from "./spatiotemporalGraph";
import type { CameraDto, TrajectoryPointDto } from "./api";

export type { Coordinate, SpatiotemporalWaypoint, SpatiotemporalTrajectoryResult };

const routeCache = new Map<string, Coordinate[]>();

/**
 * Fetch real driving road coordinates using the Spatiotemporal Graph Engine.
 */
export async function fetchRoadRoute(
  waypoints: Coordinate[] | TrajectoryPointDto[] | SpatiotemporalWaypoint[],
  cameraIds?: string[],
  cameraNetwork?: CameraDto[]
): Promise<Coordinate[]> {
  if (!waypoints || waypoints.length < 2) {
    if (waypoints && waypoints.length === 1) {
      const p = waypoints[0];
      return Array.isArray(p) ? [p] : [[p.longitude, p.latitude]];
    }
    return [];
  }

  // Normalize into SpatiotemporalWaypoint objects
  const stWaypoints: SpatiotemporalWaypoint[] = waypoints.map((p, idx) => {
    if (Array.isArray(p)) {
      return {
        cameraId: cameraIds?.[idx] || `CAM-${idx + 1}`,
        longitude: p[0],
        latitude: p[1],
      };
    }
    return {
      cameraId: p.cameraId || cameraIds?.[idx] || `CAM-${idx + 1}`,
      cameraName: p.cameraName,
      longitude: p.longitude,
      latitude: p.latitude,
      timestamp: p.timestamp,
      direction: p.direction,
      plateConfidence: p.plateConfidence,
      detectionConfidence: p.detectionConfidence,
    };
  });

  const cacheKey = stWaypoints
    .map((w) => `${w.cameraId}:${w.longitude.toFixed(5)},${w.latitude.toFixed(5)}`)
    .join(";");

  const cached = routeCache.get(cacheKey);
  if (cached && cached.length > 0) {
    return cached;
  }

  // Solve using Spatiotemporal Graph Trajectory Algorithm
  const result = solveSpatiotemporalTrajectory(stWaypoints, cameraNetwork);
  routeCache.set(cacheKey, result.routeCoordinates);
  return result.routeCoordinates;
}
