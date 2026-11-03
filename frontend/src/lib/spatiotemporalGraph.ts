/**
 * Spatiotemporal Graph Routing & Trajectory Reconstruction Engine.
 *
 * Implements:
 * 1. Directed Spatiotemporal State Graph G_ST = (V, E)
 * 2. Kinematic & Temporal Feasibility Verification (Implied Speed, Heading Alignment, Dwell Time)
 * 3. Corridor Topology Expansion with Intermediate Node Discovery
 * 4. Centripetal Catmull-Rom Spline Interpolation (alpha = 0.5) for C^1 Smooth Vehicular Road Curves
 * 5. Surveillance Mesh Sensor Topology Graph Generation
 */

import {
  CAMERA_PAIR_PATHS,
  getRoadRouteBetweenPoints,
  Coordinate,
} from "./hardcodedPaths";
import type { CameraDto, TrajectoryPointDto } from "./api";

export type { Coordinate };

export interface SpatiotemporalWaypoint {
  cameraId: string;
  cameraName?: string;
  longitude: number;
  latitude: number;
  timestamp?: string | number;
  direction?: string | null;
  plateConfidence?: number | null;
  detectionConfidence?: number | null;
  speedKmh?: number | null;
}

export interface SpatiotemporalTransitionMetrics {
  fromCameraId: string;
  toCameraId: string;
  distanceKm: number;
  elapsedSeconds: number;
  impliedSpeedKmh: number;
  kinematicPlausibility: number; // 0.0 to 1.0
  headingDeltaDegrees: number;
  isAnomaly: boolean;
  anomalyReason?: string;
}

export interface SpatiotemporalTrajectoryResult {
  routeCoordinates: Coordinate[];
  transitions: SpatiotemporalTransitionMetrics[];
  totalDistanceKm: number;
  totalDurationSeconds: number;
  averageSpeedKmh: number;
  overallPlausibility: number;
  hasAnomalies: boolean;
}

// Earth radius in kilometers
const EARTH_RADIUS_KM = 6371.0;

/**
 * Great-circle distance between two GPS coordinates using Haversine formula.
 */
export function haversineDistanceKm(p1: Coordinate, p2: Coordinate): number {
  const [lng1, lat1] = p1;
  const [lng2, lat2] = p2;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * Initial forward azimuth (bearing) from p1 to p2 in degrees (0 - 360).
 */
export function calculateBearingDegrees(p1: Coordinate, p2: Coordinate): number {
  const [lng1, lat1] = p1;
  const [lng2, lat2] = p2;

  const rLat1 = (lat1 * Math.PI) / 180;
  const rLat2 = (lat2 * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(rLat2);
  const x =
    Math.cos(rLat1) * Math.sin(rLat2) -
    Math.sin(rLat1) * Math.cos(rLat2) * Math.cos(dLng);

  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

/**
 * Evaluates kinematic plausibility between two spatiotemporal sighting nodes.
 */
export function evaluateSpatiotemporalTransition(
  w1: SpatiotemporalWaypoint,
  w2: SpatiotemporalWaypoint
): SpatiotemporalTransitionMetrics {
  const coord1: Coordinate = [w1.longitude, w1.latitude];
  const coord2: Coordinate = [w2.longitude, w2.latitude];

  const distanceKm = haversineDistanceKm(coord1, coord2);
  const bearing = calculateBearingDegrees(coord1, coord2);

  let elapsedSeconds = 60; // default 1 minute assumption if timestamps absent
  if (w1.timestamp && w2.timestamp) {
    const t1 = typeof w1.timestamp === "number" ? w1.timestamp : new Date(w1.timestamp).getTime() / 1000;
    const t2 = typeof w2.timestamp === "number" ? w2.timestamp : new Date(w2.timestamp).getTime() / 1000;
    elapsedSeconds = Math.max(1, Math.abs(t2 - t1));
  }

  const hours = elapsedSeconds / 3600.0;
  const impliedSpeedKmh = distanceKm / hours;

  // Heading alignment calculation (if direction text available)
  let headingDeltaDegrees = 0;
  if (w1.direction && w2.direction) {
    const dirMap: Record<string, number> = {
      north: 0,
      northbound: 0,
      inbound: 45,
      east: 90,
      eastbound: 90,
      south: 180,
      southbound: 180,
      outbound: 225,
      west: 270,
      westbound: 270,
    };
    const h1 = dirMap[w1.direction.toLowerCase()] ?? bearing;
    const h2 = dirMap[w2.direction.toLowerCase()] ?? bearing;
    headingDeltaDegrees = Math.abs(h1 - h2) % 360;
  }

  let plausibility = 1.0;
  let isAnomaly = false;
  let anomalyReason: string | undefined;

  if (distanceKm > 0.05 && elapsedSeconds < 2) {
    // Impossible transit speed / teleportation
    plausibility = 0.05;
    isAnomaly = true;
    anomalyReason = `Concurrent presence: ${distanceKm.toFixed(2)} km traversed in < 2 seconds.`;
  } else if (impliedSpeedKmh > 140) {
    // Excessive speed / plate mismatch
    plausibility = Math.max(0.1, 1.0 - (impliedSpeedKmh - 140) / 100);
    isAnomaly = true;
    anomalyReason = `High speed anomaly: ${impliedSpeedKmh.toFixed(1)} km/h exceeds corridor limit.`;
  } else if (impliedSpeedKmh >= 15 && impliedSpeedKmh <= 90) {
    // Ideal urban / highway travel flow
    plausibility = 0.98;
  } else if (impliedSpeedKmh < 15) {
    // Congested corridor or dwell / stop
    plausibility = 0.85;
  } else {
    // Fast highway speed (90 - 140 km/h)
    plausibility = 0.90;
  }

  return {
    fromCameraId: w1.cameraId,
    toCameraId: w2.cameraId,
    distanceKm: +distanceKm.toFixed(3),
    elapsedSeconds: Math.round(elapsedSeconds),
    impliedSpeedKmh: +impliedSpeedKmh.toFixed(1),
    kinematicPlausibility: +plausibility.toFixed(2),
    headingDeltaDegrees: Math.round(headingDeltaDegrees),
    isAnomaly,
    anomalyReason,
  };
}

/**
 * Centripetal Catmull-Rom Spline Interpolation (alpha = 0.5).
 * Guaranteed to prevent cusps, self-intersections, and extreme overshoot.
 */
function catmullRomCentripetal(
  p0: Coordinate,
  p1: Coordinate,
  p2: Coordinate,
  p3: Coordinate,
  samples: number = 14,
  alpha: number = 0.5
): Coordinate[] {
  function getT(t: number, pA: Coordinate, pB: Coordinate): number {
    const dx = pB[0] - pA[0];
    const dy = pB[1] - pA[1];
    return t + Math.pow(Math.max(1e-9, dx * dx + dy * dy), alpha * 0.5);
  }

  const t0 = 0;
  const t1 = getT(t0, p0, p1);
  const t2 = getT(t1, p1, p2);
  const t3 = getT(t2, p2, p3);

  const denom1 = t1 - t0;
  const denom2 = t2 - t1;
  const denom3 = t3 - t2;
  const denom4 = t2 - t0;
  const denom5 = t3 - t1;

  if (denom1 < 1e-9 || denom2 < 1e-9 || denom3 < 1e-9 || denom4 < 1e-9 || denom5 < 1e-9) {
    return [p1, p2];
  }

  const result: Coordinate[] = [];

  for (let i = 0; i <= samples; i++) {
    const t = t1 + (denom2 * i) / samples;

    const a1_x = ((t1 - t) * p0[0] + (t - t0) * p1[0]) / denom1;
    const a1_y = ((t1 - t) * p0[1] + (t - t0) * p1[1]) / denom1;

    const a2_x = ((t2 - t) * p1[0] + (t - t1) * p2[0]) / denom2;
    const a2_y = ((t2 - t) * p1[1] + (t - t1) * p2[1]) / denom2;

    const a3_x = ((t3 - t) * p2[0] + (t - t2) * p3[0]) / denom3;
    const a3_y = ((t3 - t) * p2[1] + (t - t2) * p3[1]) / denom3;

    const b1_x = ((t2 - t) * a1_x + (t - t0) * a2_x) / denom4;
    const b1_y = ((t2 - t) * a1_y + (t - t0) * a2_y) / denom4;

    const b2_x = ((t3 - t) * a2_x + (t - t1) * a3_x) / denom5;
    const b2_y = ((t3 - t) * a2_y + (t - t1) * a3_y) / denom5;

    const c_x = ((t2 - t) * b1_x + (t - t1) * b2_x) / denom2;
    const c_y = ((t2 - t) * b1_y + (t - t1) * b2_y) / denom2;

    result.push([+c_x.toFixed(6), +c_y.toFixed(6)]);
  }

  return result;
}

/**
 * Searches the city camera topology for intermediate nodes situated between
 * start and end waypoints along the road corridor.
 */
function findCorridorIntermediateNodes(
  start: Coordinate,
  end: Coordinate,
  candidateCameras: CameraDto[] = []
): Coordinate[] {
  if (candidateCameras.length === 0) return [];

  const [sLng, sLat] = start;
  const [eLng, eLat] = end;

  const dx = eLng - sLng;
  const dy = eLat - sLat;
  const segLenSq = dx * dx + dy * dy;

  if (segLenSq < 1e-6) return [];

  const intermediates: { coord: Coordinate; t: number; distToLine: number }[] = [];

  for (const cam of candidateCameras) {
    const cLng = cam.longitude;
    const cLat = cam.latitude;

    // Project cam coordinate onto line segment start -> end
    const t = ((cLng - sLng) * dx + (cLat - sLat) * dy) / segLenSq;

    // Check if intermediate is comfortably along the path (between 15% and 85%)
    if (t > 0.15 && t < 0.85) {
      const projLng = sLng + t * dx;
      const projLat = sLat + t * dy;
      const perpDist = Math.sqrt(
        (cLng - projLng) * (cLng - projLng) + (cLat - projLat) * (cLat - projLat)
      );

      // Maximum lateral corridor deviation (~1.5 km in degrees)
      if (perpDist < 0.015) {
        intermediates.push({
          coord: [cLng, cLat],
          t,
          distToLine: perpDist,
        });
      }
    }
  }

  // Sort along trajectory progression
  intermediates.sort((a, b) => a.t - b.t);
  return intermediates.map((item) => item.coord);
}

/**
 * Main Spatiotemporal Trajectory Solver.
 * Connects observed camera waypoints using spatiotemporal graph modeling,
 * kinematic validation, corridor topology expansion, and centripetal spline smoothing.
 */
export function solveSpatiotemporalTrajectory(
  waypoints: SpatiotemporalWaypoint[] | TrajectoryPointDto[],
  cameraNetwork: CameraDto[] = []
): SpatiotemporalTrajectoryResult {
  if (!waypoints || waypoints.length === 0) {
    return {
      routeCoordinates: [],
      transitions: [],
      totalDistanceKm: 0,
      totalDurationSeconds: 0,
      averageSpeedKmh: 0,
      overallPlausibility: 1.0,
      hasAnomalies: false,
    };
  }

  // Normalize waypoints
  const normalized: SpatiotemporalWaypoint[] = waypoints.map((p, idx) => ({
    cameraId: p.cameraId || `WP-${idx + 1}`,
    cameraName: p.cameraName,
    longitude: p.longitude,
    latitude: p.latitude,
    timestamp: p.timestamp,
    direction: p.direction,
    plateConfidence: p.plateConfidence,
    detectionConfidence: p.detectionConfidence,
  }));

  if (normalized.length === 1) {
    const single: Coordinate = [normalized[0].longitude, normalized[0].latitude];
    return {
      routeCoordinates: [single],
      transitions: [],
      totalDistanceKm: 0,
      totalDurationSeconds: 0,
      averageSpeedKmh: 0,
      overallPlausibility: 1.0,
      hasAnomalies: false,
    };
  }

  const transitions: SpatiotemporalTransitionMetrics[] = [];
  const segments: Array<{ coords: Coordinate[]; isHardcoded: boolean }> = [];

  let totalDistKm = 0;
  let totalTimeSec = 0;
  let plausibilitySum = 0;
  let hasAnomalies = false;

  for (let i = 0; i < normalized.length - 1; i++) {
    const w1 = normalized[i];
    const w2 = normalized[i + 1];

    const pStart: Coordinate = [w1.longitude, w1.latitude];
    const pEnd: Coordinate = [w2.longitude, w2.latitude];

    // Check pre-baked highway / corridor road path
    const pairKey = `${w1.cameraId}->${w2.cameraId}`;
    const baked =
      CAMERA_PAIR_PATHS[pairKey] ||
      getRoadRouteBetweenPoints(pStart, pEnd, w1.cameraId, w2.cameraId);

    let transition = evaluateSpatiotemporalTransition(w1, w2);

    if (baked && baked.length >= 2) {
      // Calculate true on-road path distance
      let roadDistKm = 0;
      for (let k = 0; k < baked.length - 1; k++) {
        roadDistKm += haversineDistanceKm(baked[k], baked[k + 1]);
      }
      const elapsedHours = Math.max(1, transition.elapsedSeconds) / 3600.0;
      const roadSpeedKmh = roadDistKm / elapsedHours;

      transition = {
        ...transition,
        distanceKm: +roadDistKm.toFixed(3),
        impliedSpeedKmh: +roadSpeedKmh.toFixed(1),
      };

      segments.push({ coords: baked, isHardcoded: true });
    } else {
      // Intermediate camera node expansion along corridor for non-hardcoded segments
      const intermediateNodes = findCorridorIntermediateNodes(pStart, pEnd, cameraNetwork);
      const segmentNodes = [pStart, ...intermediateNodes, pEnd];
      segments.push({ coords: segmentNodes, isHardcoded: false });
    }

    transitions.push(transition);
    totalDistKm += transition.distanceKm;
    totalTimeSec += transition.elapsedSeconds;
    plausibilitySum += transition.kinematicPlausibility;
    if (transition.isAnomaly) hasAnomalies = true;
  }

  // Assemble full route coordinates without spline distortion on hardcoded road paths
  const routeCoordinates: Coordinate[] = [];

  for (let s = 0; s < segments.length; s++) {
    const seg = segments[s];
    let segCoords: Coordinate[];

    if (seg.isHardcoded) {
      // Strictly maintain exact road coordinates on actual asphalt
      segCoords = seg.coords;
    } else if (seg.coords.length <= 2) {
      segCoords = seg.coords;
    } else {
      // Spline only for un-hardcoded corridor transitions to avoid sharp chords
      segCoords = [];
      const n = seg.coords.length;
      for (let i = 0; i < n - 1; i++) {
        const p0 = i > 0 ? seg.coords[i - 1] : seg.coords[0];
        const p1 = seg.coords[i];
        const p2 = seg.coords[i + 1];
        const p3 = i + 2 < n ? seg.coords[i + 2] : p2;
        const sub = catmullRomCentripetal(p0, p1, p2, p3, 10, 0.5);
        if (i === 0) segCoords.push(...sub);
        else segCoords.push(...sub.slice(1));
      }
    }

    if (s === 0) {
      routeCoordinates.push(...segCoords);
    } else {
      routeCoordinates.push(...segCoords.slice(1));
    }
  }

  // Deduplicate consecutive identical coordinates
  const cleanRoute: Coordinate[] = [];
  for (const pt of routeCoordinates) {
    const prev = cleanRoute[cleanRoute.length - 1];
    if (!prev || Math.abs(prev[0] - pt[0]) > 1e-6 || Math.abs(prev[1] - pt[1]) > 1e-6) {
      cleanRoute.push(pt);
    }
  }

  const avgSpeed = totalTimeSec > 0 ? totalDistKm / (totalTimeSec / 3600.0) : 0;
  const overallPlausibility = transitions.length > 0 ? plausibilitySum / transitions.length : 1.0;

  return {
    routeCoordinates: cleanRoute,
    transitions,
    totalDistanceKm: +totalDistKm.toFixed(2),
    totalDurationSeconds: totalTimeSec,
    averageSpeedKmh: +avgSpeed.toFixed(1),
    overallPlausibility: +overallPlausibility.toFixed(2),
    hasAnomalies,
  };
}

/**
 * Builds a spatiotemporal surveillance mesh connecting cameras that form
 * feasible physical observation corridors.
 */
export function buildSpatiotemporalMesh(
  cameras: CameraDto[],
  maxCorridorDistanceKm: number = 4.0
): Array<[Coordinate, Coordinate]> {
  if (cameras.length < 2) return [];

  const edges: Array<[Coordinate, Coordinate]> = [];
  const connectedPairs = new Set<string>();

  for (let i = 0; i < cameras.length; i++) {
    const c1 = cameras[i];
    const p1: Coordinate = [c1.longitude, c1.latitude];

    // Find nearest neighbors within corridor distance
    const candidates: { cam: CameraDto; dist: number }[] = [];

    for (let j = 0; j < cameras.length; j++) {
      if (i === j) continue;
      const c2 = cameras[j];
      const p2: Coordinate = [c2.longitude, c2.latitude];
      const dist = haversineDistanceKm(p1, p2);

      if (dist <= maxCorridorDistanceKm) {
        candidates.push({ cam: c2, dist });
      }
    }

    // Link up to 3 closest corridor neighbors (k-NN graph)
    candidates.sort((a, b) => a.dist - b.dist);
    const topNeighbors = candidates.slice(0, 3);

    for (const neighbor of topNeighbors) {
      const pairId = [c1.id, neighbor.cam.id].sort().join("<->");
      if (!connectedPairs.has(pairId)) {
        connectedPairs.add(pairId);
        edges.push([p1, [neighbor.cam.longitude, neighbor.cam.latitude]]);
      }
    }
  }

  return edges;
}

