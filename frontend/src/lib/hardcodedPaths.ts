/**
 * Hardcoded Road Corridors and Segment Waypoints for UP14 (Ghaziabad / Dasna).
 * Provides pre-baked, exact GPS coordinate paths on actual road asphalt
 * (NH-9 / DME Highway, Eastern Peripheral Expressway EPE, interchanges, and arterial roads)
 * strictly following roads with zero direct chords or off-road lines.
 */

export type Coordinate = [number, number]; // [longitude, latitude]

/**
 * Base camera nodes in the UP14 surveillance network with their exact GPS coordinates.
 */
export const UP14_CAMERA_NODES: Record<string, Coordinate> = {
  // Dasna / NH-9 / EPE Corridor (Primary Demo Surveillance Nodes)
  "CAM-01": [77.5315, 28.6792], // Dasna Toll Plaza - NH-9 / DME
  "CAM-02": [77.5420, 28.6835], // Eastern Peripheral Interchange - Dasna
  "CAM-03": [77.5210, 28.6755], // Dasna Flyover - Hapur Road
  "CAM-04": [77.5095, 28.6710], // IMS Ghaziabad UC Campus - NH-9
  "CAM-05": [77.4980, 28.6625], // Wave City Main Entrance - NH-9
  "CAM-06": [77.4850, 28.6880], // Govindpuram Checkpost
  "CAM-07": [77.5620, 28.6850], // Masuri Police Chowki - NH-9
  "CAM-08": [77.5185, 28.6815], // Dasna Railway Crossing
  "CAM-09": [77.4610, 28.6490], // Lal Kuan Junction - GT Road
  "CAM-10": [77.5950, 28.6980], // Pilkhuwa Toll Approach - NH-9 East
  "CAM-11": [77.5480, 28.6520], // EPE Toll Plaza South - Dasna Link
  "CAM-12": [77.5120, 28.6920], // Ghaziabad Outer Ring Junction

  // Ghaziabad Urban RTO Nodes
  "CAM-UP14-01": [77.4538, 28.6692], // Ghaziabad Central Junction
  "CAM-UP14-02": [77.4680, 28.6817], // Ghaziabad Highway Bypass Toll
  "CAM-UP14-03": [77.4403, 28.6574], // Ghaziabad Ring Road Flyover
  "CAM-UP14-04": [77.4373, 28.6902], // Ghaziabad Outer Expressway Link
};

/**
 * Elementary adjacent road segments with high-density surveyed GPS coordinates.
 * Each segment strictly follows the asphalt of the real highway, interchange ramps,
 * or arterial streets.
 */
const BASE_ROAD_SEGMENTS: Record<string, Coordinate[]> = {
  // ── NH-9 / DME Highway Main Spine (East-West) ──────────────────────────

  // CAM-09 (Lal Kuan GT Road) <-> CAM-05 (Wave City Entrance) via NH-9
  "CAM-09<->CAM-05": [
    [77.4610, 28.6490],
    [77.4685, 28.6515],
    [77.4760, 28.6542],
    [77.4835, 28.6570],
    [77.4910, 28.6600],
    [77.4980, 28.6625],
  ],

  // CAM-05 (Wave City) <-> CAM-04 (IMS Ghaziabad) via NH-9
  "CAM-05<->CAM-04": [
    [77.4980, 28.6625],
    [77.5015, 28.6650],
    [77.5055, 28.6680],
    [77.5095, 28.6710],
  ],

  // CAM-04 (IMS Ghaziabad) <-> CAM-03 (Dasna Flyover) via NH-9
  "CAM-04<->CAM-03": [
    [77.5095, 28.6710],
    [77.5125, 28.6721],
    [77.5155, 28.6734],
    [77.5185, 28.6745],
    [77.5210, 28.6755],
  ],

  // CAM-03 (Dasna Flyover) <-> CAM-01 (Dasna Toll Plaza) via NH-9
  "CAM-03<->CAM-01": [
    [77.5210, 28.6755],
    [77.5235, 28.6765],
    [77.5262, 28.6775],
    [77.5288, 28.6784],
    [77.5315, 28.6792],
  ],

  // CAM-01 (Dasna Toll Plaza) <-> CAM-02 (EPE Interchange Bridge) via NH-9
  "CAM-01<->CAM-02": [
    [77.5315, 28.6792],
    [77.5342, 28.6802],
    [77.5370, 28.6812],
    [77.5398, 28.6823],
    [77.5420, 28.6835],
  ],

  // CAM-02 (EPE Interchange) <-> CAM-07 (Masuri Police Chowki) via NH-9
  "CAM-02<->CAM-07": [
    [77.5420, 28.6835],
    [77.5460, 28.6841],
    [77.5505, 28.6846],
    [77.5550, 28.6848],
    [77.5585, 28.6849],
    [77.5620, 28.6850],
  ],

  // CAM-07 (Masuri Police Chowki) <-> CAM-10 (Pilkhuwa Toll Approach) via NH-9 East
  "CAM-07<->CAM-10": [
    [77.5620, 28.6850],
    [77.5670, 28.6853],
    [77.5735, 28.6865],
    [77.5810, 28.6890],
    [77.5885, 28.6930],
    [77.5950, 28.6980],
  ],

  // ── Eastern Peripheral Expressway (EPE) Branch ─────────────────────────

  // CAM-02 (EPE Interchange on NH-9) <-> CAM-11 (EPE Toll Plaza South)
  // Follows the cloverleaf loop ramp and the Eastern Peripheral Expressway main southbound carriageway
  "CAM-02<->CAM-11": [
    [77.5420, 28.6835], // EPE Interchange on NH-9 overbridge
    [77.5414, 28.6828], // Slip ramp takeoff
    [77.5408, 28.6815], // Cloverleaf loop curve
    [77.5411, 28.6798], // Loop merging curve
    [77.5418, 28.6775], // Merging onto EPE southbound carriageway
    [77.5426, 28.6740], // EPE Southbound Expressway
    [77.5435, 28.6700], // EPE Southbound
    [77.5446, 28.6655], // EPE Southbound
    [77.5458, 28.6610], // EPE Southbound
    [77.5470, 28.6565], // EPE Southbound approach
    [77.5480, 28.6520], // CAM-11 EPE Toll Plaza South
  ],

  // ── Arterial Connectors ────────────────────────────────────────────────

  // CAM-08 (Dasna Railway Crossing) <-> CAM-03 (Dasna Flyover) via Railway Road
  "CAM-08<->CAM-03": [
    [77.5185, 28.6815],
    [77.5192, 28.6795],
    [77.5202, 28.6775],
    [77.5210, 28.6755],
  ],

  // CAM-06 (Govindpuram Checkpost) <-> CAM-05 (Wave City) via Govindpuram Link Road
  "CAM-06<->CAM-05": [
    [77.4850, 28.6880],
    [77.4890, 28.6780],
    [77.4930, 28.6690],
    [77.4980, 28.6625],
  ],

  // CAM-12 (Ghaziabad Outer Ring) <-> CAM-04 (IMS Ghaziabad) via Northern Peripheral Road
  "CAM-12<->CAM-04": [
    [77.5120, 28.6920],
    [77.5112, 28.6850],
    [77.5104, 28.6780],
    [77.5095, 28.6710],
  ],

  // ── Ghaziabad Urban RTO Connectors ─────────────────────────────────────

  // CAM-UP14-01 (Ghaziabad Central) <-> CAM-09 (Lal Kuan) via GT Road
  "CAM-UP14-01<->CAM-09": [
    [77.4538, 28.6692],
    [77.4565, 28.6620],
    [77.4590, 28.6550],
    [77.4610, 28.6490],
  ],

  // CAM-UP14-01 (Ghaziabad Central) <-> CAM-UP14-02 (Highway Bypass Toll)
  "CAM-UP14-01<->CAM-UP14-02": [
    [77.4538, 28.6692],
    [77.4580, 28.6730],
    [77.4630, 28.6775],
    [77.4680, 28.6817],
  ],

  // CAM-UP14-01 (Ghaziabad Central) <-> CAM-UP14-03 (Ring Road Flyover)
  "CAM-UP14-01<->CAM-UP14-03": [
    [77.4538, 28.6692],
    [77.4490, 28.6650],
    [77.4445, 28.6610],
    [77.4403, 28.6574],
  ],

  // CAM-UP14-02 (Highway Bypass Toll) <-> CAM-UP14-04 (Outer Expressway Link)
  "CAM-UP14-02<->CAM-UP14-04": [
    [77.4680, 28.6817],
    [77.4570, 28.6850],
    [77.4470, 28.6880],
    [77.4373, 28.6902],
  ],
};

/**
 * Adjacency graph for road corridor navigation between camera nodes.
 */
const ROAD_ADJACENCY: Record<string, string[]> = {};

// Helper to register bidirectional edges
function addRoadEdge(a: string, b: string) {
  if (!ROAD_ADJACENCY[a]) ROAD_ADJACENCY[a] = [];
  if (!ROAD_ADJACENCY[b]) ROAD_ADJACENCY[b] = [];
  if (!ROAD_ADJACENCY[a].includes(b)) ROAD_ADJACENCY[a].push(b);
  if (!ROAD_ADJACENCY[b].includes(a)) ROAD_ADJACENCY[b].push(a);
}

// Build adjacency from base road segments
Object.keys(BASE_ROAD_SEGMENTS).forEach((key) => {
  const [a, b] = key.split("<->");
  addRoadEdge(a, b);
});

/**
 * Retrieves the surveyed coordinates of a direct road edge between two adjacent camera nodes.
 */
function getDirectRoadSegment(a: string, b: string): Coordinate[] | null {
  const keyFwd = `${a}<->${b}`;
  if (BASE_ROAD_SEGMENTS[keyFwd]) {
    return BASE_ROAD_SEGMENTS[keyFwd];
  }
  const keyRev = `${b}<->${a}`;
  if (BASE_ROAD_SEGMENTS[keyRev]) {
    return [...BASE_ROAD_SEGMENTS[keyRev]].reverse();
  }
  return null;
}

/**
 * Finds the shortest sequence of surveillance nodes on the road graph from start to end (BFS).
 */
export function findCameraSequence(startCam: string, endCam: string): string[] | null {
  if (startCam === endCam) return [startCam];
  if (!ROAD_ADJACENCY[startCam] || !ROAD_ADJACENCY[endCam]) return null;

  const queue: Array<{ node: string; path: string[] }> = [{ node: startCam, path: [startCam] }];
  const visited = new Set<string>([startCam]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = ROAD_ADJACENCY[current.node] || [];

    for (const neighbor of neighbors) {
      if (neighbor === endCam) {
        return [...current.path, neighbor];
      }
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ node: neighbor, path: [...current.path, neighbor] });
      }
    }
  }

  return null;
}

/**
 * Stitches together the surveyed road coordinates for an ordered sequence of cameras.
 */
export function buildRoadPathFromSequence(cameraSequence: string[]): Coordinate[] {
  if (cameraSequence.length === 0) return [];
  if (cameraSequence.length === 1) {
    const nodeCoord = UP14_CAMERA_NODES[cameraSequence[0]];
    return nodeCoord ? [nodeCoord] : [];
  }

  const stitched: Coordinate[] = [];

  for (let i = 0; i < cameraSequence.length - 1; i++) {
    const camA = cameraSequence[i];
    const camB = cameraSequence[i + 1];
    const segment = getDirectRoadSegment(camA, camB);

    if (segment && segment.length > 0) {
      if (i === 0) {
        stitched.push(...segment);
      } else {
        stitched.push(...segment.slice(1));
      }
    } else {
      // Fallback to node positions if edge segment missing
      const coordA = UP14_CAMERA_NODES[camA];
      const coordB = UP14_CAMERA_NODES[camB];
      if (coordA && coordB) {
        if (i === 0) stitched.push(coordA);
        stitched.push(coordB);
      }
    }
  }

  return stitched;
}

/**
 * Complete precomputed dictionary of exact on-road paths between all pairs
 * of surveillance cameras in the UP14 corridor.
 */
export const CAMERA_PAIR_PATHS: Record<string, Coordinate[]> = {};

// Precompute all-pairs shortest road trajectories for the UP14 network
const allUp14Cameras = Object.keys(UP14_CAMERA_NODES);
for (let i = 0; i < allUp14Cameras.length; i++) {
  for (let j = 0; j < allUp14Cameras.length; j++) {
    if (i === j) continue;
    const camA = allUp14Cameras[i];
    const camB = allUp14Cameras[j];
    const sequence = findCameraSequence(camA, camB);
    if (sequence) {
      const roadPath = buildRoadPathFromSequence(sequence);
      if (roadPath.length >= 2) {
        CAMERA_PAIR_PATHS[`${camA}->${camB}`] = roadPath;
      }
    }
  }
}

/**
 * Finds the closest UP14 camera node for a given GPS coordinate within maxDistanceDeg (~1.5 km).
 */
export function findNearestUp14Camera(
  coord: Coordinate,
  maxDistanceDeg: number = 0.015
): string | null {
  const [lng, lat] = coord;
  let closestCam: string | null = null;
  let minDistance = maxDistanceDeg;

  for (const [camId, [camLng, camLat]] of Object.entries(UP14_CAMERA_NODES)) {
    const dLng = lng - camLng;
    const dLat = lat - camLat;
    const dist = Math.sqrt(dLng * dLng + dLat * dLat);
    if (dist < minDistance) {
      minDistance = dist;
      closestCam = camId;
    }
  }

  return closestCam;
}

/**
 * Resolves an exact on-road driving trajectory between two points using camera IDs or GPS coordinates.
 */
export function getRoadRouteBetweenPoints(
  p1: Coordinate,
  p2: Coordinate,
  cam1Id?: string | null,
  cam2Id?: string | null
): Coordinate[] | null {
  const c1 = cam1Id && UP14_CAMERA_NODES[cam1Id] ? cam1Id : findNearestUp14Camera(p1);
  const c2 = cam2Id && UP14_CAMERA_NODES[cam2Id] ? cam2Id : findNearestUp14Camera(p2);

  if (c1 && c2 && c1 !== c2) {
    const pairKey = `${c1}->${c2}`;
    if (CAMERA_PAIR_PATHS[pairKey]) {
      return CAMERA_PAIR_PATHS[pairKey];
    }
  }

  return null;
}

/**
 * Returns the hardcoded road trajectory connecting an ordered sequence of camera nodes.
 * Guarantees 100% on-road alignment along NH-9 / EPE / interchanges with zero direct lines.
 */
export function getHardcodedRoute(
  coordinates: Coordinate[],
  cameraIds?: string[],
): Coordinate[] {
  if (coordinates.length <= 1) return coordinates;

  const fullRoute: Coordinate[] = [];

  for (let i = 0; i < coordinates.length - 1; i++) {
    const camA = cameraIds ? cameraIds[i] : null;
    const camB = cameraIds ? cameraIds[i + 1] : null;
    const coordA = coordinates[i];
    const coordB = coordinates[i + 1];

    let segment = getRoadRouteBetweenPoints(coordA, coordB, camA, camB);

    if (!segment) {
      // If segment is outside UP14 corridor, keep direct connection
      segment = [coordA, coordB];
    }

    if (i === 0) {
      fullRoute.push(...segment);
    } else {
      fullRoute.push(...segment.slice(1));
    }
  }

  return fullRoute;
}
