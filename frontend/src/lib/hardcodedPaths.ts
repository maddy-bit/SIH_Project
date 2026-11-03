/**
 * Hardcoded Road Corridors and Segment Waypoints.
 * Provides pre-baked, exact GPS coordinate paths between camera surveillance nodes
 * without relying on external internet routing servers (OSRM / Google Maps Directions API).
 */

export type Coordinate = [number, number]; // [longitude, latitude]

/**
 * Exact hardcoded highway & arterial road paths between known surveillance nodes.
 * Stored bidirectionally (key is "CAM-A->CAM-B").
 */
export const CAMERA_PAIR_PATHS: Record<string, Coordinate[]> = {
  // Dasna NH-9 / DME Expressway Corridor
  "CAM-01->CAM-02": [
    [77.5315, 28.6792],
    [77.5345, 28.6806],
    [77.5382, 28.6821],
    [77.5420, 28.6835],
  ],
  "CAM-01->CAM-03": [
    [77.5315, 28.6792],
    [77.5282, 28.6779],
    [77.5248, 28.6766],
    [77.5210, 28.6755],
  ],
  "CAM-03->CAM-07": [
    [77.5210, 28.6755],
    [77.5262, 28.6773],
    [77.5315, 28.6792],
    [77.5395, 28.6818],
    [77.5475, 28.6834],
    [77.5550, 28.6844],
    [77.5620, 28.6850],
  ],
  "CAM-07->CAM-11": [
    [77.5620, 28.6850],
    [77.5585, 28.6812],
    [77.5535, 28.6765],
    [77.5490, 28.6720],
    [77.5450, 28.6690],
  ],
  "CAM-01->CAM-07": [
    [77.5315, 28.6792],
    [77.5395, 28.6818],
    [77.5475, 28.6834],
    [77.5550, 28.6844],
    [77.5620, 28.6850],
  ],
  "CAM-03->CAM-04": [
    [77.5210, 28.6755],
    [77.5170, 28.6738],
    [77.5130, 28.6722],
    [77.5095, 28.6710],
  ],
  "CAM-04->CAM-05": [
    [77.5095, 28.6710],
    [77.5055, 28.6682],
    [77.5015, 28.6650],
    [77.4980, 28.6625],
  ],
  "CAM-05->CAM-06": [
    [77.4980, 28.6625],
    [77.4930, 28.6690],
    [77.4890, 28.6780],
    [77.4850, 28.6880],
  ],
  "CAM-07->CAM-09": [
    [77.5620, 28.6850],
    [77.5530, 28.6875],
    [77.5450, 28.6900],
    [77.5380, 28.6920],
  ],
  "CAM-09->CAM-10": [
    [77.5380, 28.6920],
    [77.5335, 28.6875],
    [77.5290, 28.6835],
    [77.5270, 28.6810],
  ],
  "CAM-10->CAM-11": [
    [77.5270, 28.6810],
    [77.5330, 28.6770],
    [77.5390, 28.6730],
    [77.5450, 28.6690],
  ],
  "CAM-01->CAM-11": [
    [77.5315, 28.6792],
    [77.5360, 28.6758],
    [77.5405, 28.6724],
    [77.5450, 28.6690],
  ],
};

// Also generate reverse paths automatically
Object.entries(CAMERA_PAIR_PATHS).forEach(([key, coords]) => {
  const [a, b] = key.split("->");
  const reverseKey = `${b}->${a}`;
  if (!CAMERA_PAIR_PATHS[reverseKey]) {
    CAMERA_PAIR_PATHS[reverseKey] = [...coords].reverse();
  }
});

/**
 * Deterministic road corridor generator connecting two GPS points with realistic highway tangents.
 */
function buildDeterministicRoadSegment(
  start: Coordinate,
  end: Coordinate,
  segmentIndex: number = 0,
): Coordinate[] {
  const [sLng, sLat] = start;
  const [eLng, eLat] = end;

  // Calculate segment straight distance
  const dx = eLng - sLng;
  const dy = eLat - sLat;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 0.0001) return [start, end];

  // Number of interpolated waypoints based on distance
  const steps = Math.max(8, Math.min(24, Math.round(dist * 500)));
  const coords: Coordinate[] = [start];

  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    // Natural highway road curvature (gentle S-curve / road deviation)
    const curveDeviation = Math.sin(t * Math.PI) * 0.0006 * (segmentIndex % 2 === 0 ? 1 : -1);
    const lng = sLng + dx * t - (dy / dist) * curveDeviation;
    const lat = sLat + dy * t + (dx / dist) * curveDeviation;
    coords.push([+lng.toFixed(6), +lat.toFixed(6)]);
  }

  coords.push(end);
  return coords;
}

/**
 * Returns the hardcoded road trajectory connecting an ordered sequence of camera nodes.
 *
 * @param cameraIds Optional list of camera IDs (e.g. ["CAM-01", "CAM-03", "CAM-07", "CAM-11"])
 * @param coordinates Ordered array of [lng, lat] coordinates corresponding to each camera
 */
export function getHardcodedRoute(
  coordinates: Coordinate[],
  cameraIds?: string[],
): Coordinate[] {
  if (coordinates.length <= 1) return coordinates;

  const fullRoute: Coordinate[] = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const startCoord = coordinates[i];
    const endCoord = coordinates[i + 1];
    const camA = cameraIds ? cameraIds[i] : null;
    const camB = cameraIds ? cameraIds[i + 1] : null;

    let segment: Coordinate[] | null = null;

    // Check pre-baked camera pair path table
    if (camA && camB) {
      const lookupKey = `${camA}->${camB}`;
      if (CAMERA_PAIR_PATHS[lookupKey]) {
        segment = CAMERA_PAIR_PATHS[lookupKey];
      }
    }

    // Fallback to deterministic road corridor segment
    if (!segment) {
      segment = buildDeterministicRoadSegment(startCoord, endCoord, i);
    }

    // Append segment, omitting first coordinate if not initial to prevent duplicate nodes
    if (i === 0) {
      fullRoute.push(...segment);
    } else {
      fullRoute.push(...segment.slice(1));
    }
  }

  return fullRoute;
}
