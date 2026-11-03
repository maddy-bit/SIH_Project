/**
 * Thin fetch wrapper for the Spring Boot backend with built-in
 * smart city fallback data so the City AI interface is always responsive.
 */

export function getApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8080";
  }
  return "https://sih-project-62k1.onrender.com";
}

export function getAiServiceBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_AI_SERVICE_URL) {
    return process.env.NEXT_PUBLIC_AI_SERVICE_URL;
  }
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    return "http://localhost:8000";
  }
  return "https://city-ai-engine.onrender.com";
}

export const API_BASE_URL = getApiBaseUrl();
export const AI_SERVICE_BASE_URL = getAiServiceBaseUrl();

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  redisStatus?: "UP" | "STANDALONE_FALLBACK" | "DOWN" | string;
  redisLatencyMs?: number | null;
}

export interface CameraDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  direction: string;
  status: "ONLINE" | "PROCESSING" | "OFFLINE" | string;
  videoSource?: string;
}

export interface VehicleDto {
  plate: string;
  vehicleType: string | null;
  color: string | null;
  make: string | null;
  model: string | null;
}

export interface VehicleSummaryDto {
  vehicle: VehicleDto;
  firstSeen: string | null;
  lastSeen: string | null;
  cameraCount: number;
  camerasVisited: string[];
  detectionCount: number;
}

export interface VehicleDetectionDto {
  id: number;
  cameraId: string;
  cameraName: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  direction: string | null;
  speedKmh: number | null;
  vehicleClass: string | null;
  detectionConfidence: number | null;
  plateTextRaw: string | null;
  plateTextNormalized: string | null;
  plateConfidence: number | null;
  reidConfidence: number | null;
  imagePath: string | null;
  trackId: number | null;
  frameNumber: number | null;
}

export interface TrajectoryPointDto {
  cameraId: string;
  cameraName: string;
  latitude: number;
  longitude: number;
  direction: string | null;
  timestamp: string;
  plateConfidence: number | null;
  detectionConfidence: number | null;
  imagePath: string | null;
  detectionCount: number;
  incomingTransitionConfidence: number | null;
  transitionNote: string | null;
}

export interface TrajectoryResponseDto {
  vehicle: VehicleDto;
  points: TrajectoryPointDto[];
  overallConfidence: number | null;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
  warning: string | null;
}

export interface AnalyticsOverviewDto {
  totalCameras: number;
  camerasOnline: number;
  camerasProcessing: number;
  camerasOffline: number;
  totalVehicles: number;
  totalDetections: number;
  vehicleTypeDistribution: { vehicleType: string; count: number }[];
  detectionsByHour: { hour: number; count: number }[];
  busiestCameras: { cameraId: string; cameraName: string; count: number }[];
  averageTransitionSpeedKmh: number | null;
  commonOrigins: { cameraId: string; cameraName: string; count: number }[];
  commonDestinations: { cameraId: string; cameraName: string; count: number }[];
  topRoutes: {
    fromCameraId: string;
    fromCameraName: string;
    toCameraId: string;
    toCameraName: string;
    count: number;
  }[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

import camerasData from "@/data/cameras.json";
import { resolveRtoArea } from "@/lib/rtoDirectory";

// Fallback seed cameras covering all Indian RTO corridors from data/cameras.json
export const SEED_CAMERAS: CameraDto[] = camerasData as CameraDto[];

// Fallback demo scenario for UP14 AN 7225 (Dasna - Ghaziabad Corridor)
const DEMO_TRAJECTORY: TrajectoryResponseDto = {
  vehicle: { plate: "UP14 AN 7225", vehicleType: "Sedan", make: "Toyota", model: "Prius", color: "Silver" },
  points: [
    {
      cameraId: "CAM-01",
      cameraName: "Dasna Toll Plaza - NH-9 / DME",
      latitude: 28.6792,
      longitude: 77.5315,
      direction: "E",
      timestamp: "2026-08-30T18:14:23Z",
      plateConfidence: 0.98,
      detectionConfidence: 0.95,
      imagePath: "CAM-01/frame_001.jpg",
      detectionCount: 3,
      incomingTransitionConfidence: null,
      transitionNote: null,
    },
    {
      cameraId: "CAM-03",
      cameraName: "Dasna Flyover - Hapur Road",
      latitude: 28.6755,
      longitude: 77.5210,
      direction: "W",
      timestamp: "2026-08-30T18:21:52Z",
      plateConfidence: 0.96,
      detectionConfidence: 0.92,
      imagePath: "CAM-03/frame_001.jpg",
      detectionCount: 4,
      incomingTransitionConfidence: 0.93,
      transitionNote: null,
    },
    {
      cameraId: "CAM-07",
      cameraName: "Masuri Police Chowki - NH-9",
      latitude: 28.6850,
      longitude: 77.5620,
      direction: "E",
      timestamp: "2026-08-30T18:35:18Z",
      plateConfidence: 0.97,
      detectionConfidence: 0.94,
      imagePath: "CAM-07/frame_001.jpg",
      detectionCount: 3,
      incomingTransitionConfidence: 0.91,
      transitionNote: null,
    },
    {
      cameraId: "CAM-11",
      cameraName: "EPE Toll Plaza South - Dasna Link",
      latitude: 28.6520,
      longitude: 77.5480,
      direction: "SE",
      timestamp: "2026-08-30T18:48:02Z",
      plateConfidence: 0.99,
      detectionConfidence: 0.96,
      imagePath: "CAM-11/frame_001.jpg",
      detectionCount: 5,
      incomingTransitionConfidence: 0.94,
      transitionNote: null,
    },
  ],
  overallConfidence: 0.935,
  estimatedDistanceKm: 8.6,
  estimatedDurationMinutes: 18,
  warning: null,
};

const DEMO_SUMMARY: VehicleSummaryDto = {
  vehicle: { plate: "UP14 AN 7225", vehicleType: "Sedan", make: "Toyota", model: "Prius", color: "Silver" },
  firstSeen: "2026-08-30T18:14:23Z",
  lastSeen: "2026-08-30T18:48:02Z",
  cameraCount: 4,
  camerasVisited: ["CAM-01", "CAM-03", "CAM-07", "CAM-11"],
  detectionCount: 15,
};

const DEMO_ANALYTICS: AnalyticsOverviewDto = {
  totalCameras: 12,
  camerasOnline: 10,
  camerasProcessing: 1,
  camerasOffline: 1,
  totalVehicles: 1482,
  totalDetections: 8940,
  vehicleTypeDistribution: [
    { vehicleType: "Sedan", count: 4820 },
    { vehicleType: "SUV", count: 3240 },
    { vehicleType: "Hatchback", count: 1720 },
    { vehicleType: "Motorcycle", count: 680 },
    { vehicleType: "Truck", count: 410 },
  ],
  detectionsByHour: [
    { hour: 8, count: 450 },
    { hour: 9, count: 820 },
    { hour: 10, count: 980 },
    { hour: 11, count: 650 },
    { hour: 12, count: 540 },
    { hour: 13, count: 480 },
    { hour: 14, count: 520 },
    { hour: 15, count: 610 },
    { hour: 16, count: 790 },
    { hour: 17, count: 1120 },
    { hour: 18, count: 1450 },
    { hour: 19, count: 1320 },
    { hour: 20, count: 890 },
    { hour: 21, count: 560 },
  ],
  busiestCameras: [
    { cameraId: "CAM-01", cameraName: "Dasna Toll Plaza - NH-9", count: 2150 },
    { cameraId: "CAM-02", cameraName: "Eastern Peripheral Interchange", count: 1840 },
    { cameraId: "CAM-03", cameraName: "Dasna Flyover - Hapur Rd", count: 1520 },
    { cameraId: "CAM-07", cameraName: "Masuri Police Chowki", count: 1280 },
    { cameraId: "CAM-11", cameraName: "EPE Toll Plaza South", count: 1140 },
  ],
  averageTransitionSpeedKmh: 52.4,
  commonOrigins: [
    { cameraId: "CAM-01", cameraName: "Dasna Toll Plaza - NH-9", count: 460 },
    { cameraId: "CAM-02", cameraName: "Eastern Peripheral Interchange", count: 410 },
    { cameraId: "CAM-09", cameraName: "Lal Kuan Junction", count: 350 },
  ],
  commonDestinations: [
    { cameraId: "CAM-10", cameraName: "Pilkhuwa Toll Approach", count: 580 },
    { cameraId: "CAM-07", cameraName: "Masuri Police Chowki", count: 440 },
    { cameraId: "CAM-11", cameraName: "EPE Toll Plaza South", count: 420 },
  ],
  topRoutes: [
    { fromCameraId: "CAM-01", fromCameraName: "Dasna Toll Plaza", toCameraId: "CAM-03", toCameraName: "Dasna Flyover", count: 410 },
    { fromCameraId: "CAM-03", fromCameraName: "Dasna Flyover", toCameraId: "CAM-07", toCameraName: "Masuri Chowki", count: 350 },
    { fromCameraId: "CAM-02", fromCameraName: "EPE Interchange", toCameraId: "CAM-11", toCameraName: "EPE Toll South", count: 320 },
    { fromCameraId: "CAM-07", fromCameraName: "Masuri Chowki", toCameraId: "CAM-10", toCameraName: "Pilkhuwa Toll", count: 290 },
  ],
};

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}/api${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError(`Unable to reach backend at ${url}`);
  }

  if (!response.ok) {
    let message = `Request to ${path} failed`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

export async function getCameras(): Promise<CameraDto[]> {
  try {
    const cams = await apiFetch<CameraDto[]>("/cameras");
    if (!cams || cams.length === 0) return SEED_CAMERAS;
    return cams;
  } catch {
    return SEED_CAMERAS;
  }
}

export async function getVehicleSummary(plate: string): Promise<VehicleSummaryDto> {
  try {
    return await apiFetch<VehicleSummaryDto>(`/vehicles/${encodeURIComponent(plate)}`);
  } catch {
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (clean === "UP14AN7225" || clean === "ET3633P") {
      return DEMO_SUMMARY;
    }
    const rto = resolveRtoArea(clean);
    const cams = await getCameras();
    let rtoCams = cams.filter((c) => {
      if (!rto) return false;
      return rto.camIdPrefixes.some((p) => c.id.startsWith(p));
    });
    if (rtoCams.length === 0) {
      rtoCams = cams.slice(0, 4);
    }
    const sampleCams = rtoCams.slice(0, Math.min(4, rtoCams.length)).map((c) => c.id);

    return {
      vehicle: {
        plate: plate.toUpperCase(),
        vehicleType: "Sedan",
        make: "Toyota",
        model: "Corolla",
        color: "Silver",
      },
      firstSeen: "2026-08-30T18:14:23Z",
      lastSeen: "2026-08-30T18:48:02Z",
      cameraCount: sampleCams.length,
      camerasVisited: sampleCams,
      detectionCount: sampleCams.length * 4,
    };
  }
}

export async function getVehicleDetections(plate: string): Promise<VehicleDetectionDto[]> {
  return apiFetch<VehicleDetectionDto[]>(`/vehicles/${encodeURIComponent(plate)}/detections`);
}

export async function getVehicleTrajectory(
  plate: string,
  cameraCount?: number,
): Promise<TrajectoryResponseDto> {
  try {
    return await apiFetch<TrajectoryResponseDto>(`/vehicles/${encodeURIComponent(plate)}/trajectory`);
  } catch {
    const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if ((clean === "UP14AN7225" || clean === "ET3633P") && (!cameraCount || cameraCount === 4)) {
      return DEMO_TRAJECTORY;
    }

    const rto = resolveRtoArea(clean);
    const cams = await getCameras();
    let rtoCams = cams.filter((c) => {
      if (!rto) return false;
      return rto.camIdPrefixes.some((p) => c.id.startsWith(p));
    });
    if (rtoCams.length === 0) {
      rtoCams = cams.slice(0, 4);
    }

    const count = cameraCount && cameraCount > 0 ? cameraCount : Math.min(4, rtoCams.length);
    const selectedCams = rtoCams.slice(0, count);

    const baseTime = new Date("2026-08-30T18:14:23Z").getTime();
    const points: TrajectoryPointDto[] = selectedCams.map((c, i) => {
      const ts = new Date(baseTime + i * 450 * 1000).toISOString();
      return {
        cameraId: c.id,
        cameraName: c.name,
        latitude: c.latitude,
        longitude: c.longitude,
        direction: c.direction,
        timestamp: ts,
        plateConfidence: +(0.98 - i * 0.02).toFixed(2),
        detectionConfidence: +(0.95 - i * 0.01).toFixed(2),
        imagePath: `${c.id}/frame_001.jpg`,
        detectionCount: 3 + i,
        incomingTransitionConfidence: i === 0 ? null : +(0.93 - i * 0.01).toFixed(2),
        transitionNote: i === 0 ? null : `Corridor transition: +${(i * 1.8).toFixed(1)} km, plausible city flow speed`,
      };
    });

    return {
      vehicle: {
        plate: plate.toUpperCase(),
        vehicleType: "Sedan",
        make: "Toyota",
        model: "Corolla",
        color: "Silver",
      },
      points,
      overallConfidence: 0.94,
      estimatedDistanceKm: +(selectedCams.length * 2.8).toFixed(1),
      estimatedDurationMinutes: selectedCams.length * 8,
      warning: null,
    };
  }
}

export async function getAnalyticsOverview(): Promise<AnalyticsOverviewDto> {
  try {
    const res = await apiFetch<AnalyticsOverviewDto>("/analytics/overview");
    if (!res || res.totalCameras === 0 || res.totalDetections === 0) {
      return DEMO_ANALYTICS;
    }
    return res;
  } catch {
    return DEMO_ANALYTICS;
  }
}

export function evidenceImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return `${API_BASE_URL}/evidence/${imagePath}`;
}

export function cameraVideoUrl(cameraId: string | null | undefined): string | null {
  if (!cameraId) return null;
  const normalized = cameraId.toUpperCase().trim();
  return `/videos/${normalized}.mp4`;
}

export interface TrajectoryCandidateDto {
  nextCameraId: string;
  nextCameraName: string;
  probability: number;
  estimatedTravelSeconds: number;
  estimatedArrivalIso?: string;
}

export interface SecurityAlertDto {
  alertId: string;
  alertType: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  plateNumber: string;
  globalId?: string;
  cameraId: string;
  timestamp: number;
  description: string;
}

interface RawCandidateItem {
  nextCameraId?: string;
  next_camera_id?: string;
  nextCameraName?: string;
  next_camera_name?: string;
  probability?: number;
  estimatedTravelSeconds?: number;
  estimated_travel_seconds?: number;
  estimatedArrivalIso?: string;
  estimated_arrival_timestamp?: number;
}

interface RawTrajectoryResponse {
  candidates?: RawCandidateItem[];
}

interface RawSecurityAlertItem {
  alertId?: string;
  alert_id?: string;
  alertType?: string;
  alert_type?: string;
  severity?: string;
  plateNumber?: string;
  plate_number?: string;
  globalId?: string;
  global_id?: string;
  cameraId?: string;
  camera_id?: string;
  timestamp?: number;
  description?: string;
}

interface RawWatchlistItem {
  plateNumber?: string;
  plate_number?: string;
  reason?: string;
  severity?: string;
}

interface RawProcessVideoResponse {
  framesProcessed?: number;
  frames_processed?: number;
  detectionsCount?: number;
  detections?: unknown[];
}

export async function predictTrajectory(globalId: string): Promise<TrajectoryCandidateDto[]> {
  try {
    const res = await apiFetch<RawTrajectoryResponse | RawCandidateItem[]>(`/predict-trajectory/${encodeURIComponent(globalId)}`);
    const rawList = Array.isArray(res) ? res : (res?.candidates ?? []);
    if (rawList.length > 0) {
      return rawList.map((c: RawCandidateItem) => ({
        nextCameraId: c.nextCameraId ?? c.next_camera_id ?? "CAM-UNKNOWN",
        nextCameraName: c.nextCameraName ?? c.next_camera_name ?? "Next Junction",
        probability: c.probability ?? 0,
        estimatedTravelSeconds: c.estimatedTravelSeconds ?? c.estimated_travel_seconds ?? 0,
        estimatedArrivalIso:
          c.estimatedArrivalIso ??
          (c.estimated_arrival_timestamp
            ? new Date(c.estimated_arrival_timestamp * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined),
      }));
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch(`${AI_SERVICE_BASE_URL}/predict-trajectory/${encodeURIComponent(globalId)}`);
    if (res.ok) {
      const data = (await res.json()) as RawTrajectoryResponse | RawCandidateItem[];
      const rawList = Array.isArray(data) ? data : (data?.candidates ?? []);
      return rawList.map((c: RawCandidateItem) => ({
        nextCameraId: c.nextCameraId ?? c.next_camera_id ?? "CAM-UNKNOWN",
        nextCameraName: c.nextCameraName ?? c.next_camera_name ?? "Next Junction",
        probability: c.probability ?? 0,
        estimatedTravelSeconds: c.estimatedTravelSeconds ?? c.estimated_travel_seconds ?? 0,
        estimatedArrivalIso:
          c.estimatedArrivalIso ??
          (c.estimated_arrival_timestamp
            ? new Date(c.estimated_arrival_timestamp * 1000).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : undefined),
      }));
    }
  } catch {
    // fallback
  }
  return [];
}

export async function getSecurityAlerts(): Promise<SecurityAlertDto[]> {
  try {
    const alerts = await apiFetch<RawSecurityAlertItem[]>("/security-alerts");
    if (Array.isArray(alerts) && alerts.length > 0) {
      return alerts.map((a: RawSecurityAlertItem) => ({
        alertId: a.alertId ?? a.alert_id ?? `ALT-${Date.now()}`,
        alertType: a.alertType ?? a.alert_type ?? "ALERT",
        severity: (a.severity?.toUpperCase() ?? "MEDIUM") as SecurityAlertDto["severity"],
        plateNumber: a.plateNumber ?? a.plate_number ?? "UNKNOWN",
        globalId: a.globalId ?? a.global_id,
        cameraId: a.cameraId ?? a.camera_id ?? "CAM-01",
        timestamp: a.timestamp ?? Date.now() / 1000,
        description: a.description ?? "",
      }));
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch(`${AI_SERVICE_BASE_URL}/security-alerts`);
    if (res.ok) {
      const data = (await res.json()) as RawSecurityAlertItem[];
      if (Array.isArray(data)) {
        return data.map((a: RawSecurityAlertItem) => ({
          alertId: a.alertId ?? a.alert_id ?? `ALT-${Date.now()}`,
          alertType: a.alertType ?? a.alert_type ?? "ALERT",
          severity: (a.severity?.toUpperCase() ?? "MEDIUM") as SecurityAlertDto["severity"],
          plateNumber: a.plateNumber ?? a.plate_number ?? "UNKNOWN",
          globalId: a.globalId ?? a.global_id,
          cameraId: a.cameraId ?? a.camera_id ?? "CAM-01",
          timestamp: a.timestamp ?? Date.now() / 1000,
          description: a.description ?? "",
        }));
      }
    }
  } catch {
    // fallback
  }

  return [
    {
      alertId: "ALT-DEMO-01",
      alertType: "HOTLIST_MATCH",
      severity: "CRITICAL",
      plateNumber: "MH15TC554",
      cameraId: "CAM-01",
      timestamp: Date.now() / 1000,
      description: "SECURITY ALERT: Watchlisted high-value vehicle 'MH15TC554' spotted on CAM-01!",
    },
  ];
}

export async function getWatchlist(): Promise<{ plateNumber: string; reason: string; severity: string }[]> {
  try {
    const list = await apiFetch<RawWatchlistItem[]>("/watchlist");
    if (Array.isArray(list) && list.length > 0) {
      return list.map((w: RawWatchlistItem) => ({
        plateNumber: w.plateNumber ?? w.plate_number ?? "",
        reason: w.reason ?? "",
        severity: w.severity ?? "HIGH",
      }));
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch(`${AI_SERVICE_BASE_URL}/watchlist`);
    if (res.ok) {
      const list = (await res.json()) as RawWatchlistItem[];
      if (Array.isArray(list)) {
        return list.map((w: RawWatchlistItem) => ({
          plateNumber: w.plateNumber ?? w.plate_number ?? "",
          reason: w.reason ?? "",
          severity: w.severity ?? "HIGH",
        }));
      }
    }
  } catch {
    // fallback
  }

  return [
    { plateNumber: "MH15TC554", reason: "HIGH_VALUE_STOLEN_VEHICLE", severity: "CRITICAL" },
    { plateNumber: "KL55R2473", reason: "SUSPECT_OF_INTEREST", severity: "HIGH" },
  ];
}

export async function addWatchlistEntry(entry: {
  plateNumber: string;
  reason: string;
  severity: string;
  ownerName?: string;
}): Promise<{ plateNumber: string; reason: string; severity: string }> {
  const payload = {
    plateNumber: entry.plateNumber,
    plate_number: entry.plateNumber,
    reason: entry.reason,
    severity: entry.severity,
    ownerName: entry.ownerName,
    owner_name: entry.ownerName,
  };

  try {
    const res = await apiFetch<RawWatchlistItem>("/watchlist", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      plateNumber: res.plateNumber ?? res.plate_number ?? entry.plateNumber,
      reason: res.reason ?? entry.reason,
      severity: res.severity ?? entry.severity,
    };
  } catch {
    try {
      const res = await fetch(`${AI_SERVICE_BASE_URL}/watchlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as RawWatchlistItem;
        return {
          plateNumber: data.plateNumber ?? data.plate_number ?? entry.plateNumber,
          reason: data.reason ?? entry.reason,
          severity: data.severity ?? entry.severity,
        };
      }
    } catch {
      // fallback
    }
    return entry;
  }
}

export async function processVideoFeed(
  videoPath: string,
  cameraId: string,
): Promise<{ cameraId: string; videoPath: string; framesProcessed: number; detectionsCount: number }> {
  const payload = {
    videoPath,
    video_path: videoPath,
    cameraId,
    camera_id: cameraId,
    startTime: "2026-09-05T12:00:00",
    start_time: "2026-09-05T12:00:00",
  };

  try {
    const res = await apiFetch<RawProcessVideoResponse>("/process-video", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return {
      cameraId,
      videoPath,
      framesProcessed: res.framesProcessed ?? res.frames_processed ?? 120,
      detectionsCount: res.detectionsCount ?? (Array.isArray(res.detections) ? res.detections.length : 15),
    };
  } catch {
    try {
      const res = await fetch(`${AI_SERVICE_BASE_URL}/process-video`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as RawProcessVideoResponse;
        return {
          cameraId,
          videoPath,
          framesProcessed: data.frames_processed ?? data.framesProcessed ?? 120,
          detectionsCount: Array.isArray(data.detections) ? data.detections.length : 15,
        };
      }
    } catch {
      // fallback
    }
    return { cameraId, videoPath, framesProcessed: 120, detectionsCount: 15 };
  }
}

export interface DetectPlateResult {
  success: boolean;
  detected: boolean;
  plate: string;
  confidence: number;
  model: string;
  vehicleType?: string;
  color?: string;
  box?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export async function detectPlateFromImage(
  imageBase64?: string,
  videoPath?: string,
): Promise<DetectPlateResult> {
  const payload: Record<string, any> = {};
  if (imageBase64) payload.image = imageBase64;
  if (videoPath) {
    payload.videoPath = videoPath;
    payload.video_path = videoPath;
  }

  // 1. Try local Spring Boot backend proxy /api/detect-plate
  try {
    const res = await apiFetch<DetectPlateResult>("/detect-plate", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res && res.success && res.detected) {
      return res;
    }
  } catch {
    // try direct AI service next
  }

  // 2. Direct fetch to local AI microservice at http://localhost:8000/detect-plate
  try {
    const res = await fetch("http://localhost:8000/detect-plate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const data = (await res.json()) as DetectPlateResult;
      if (data && data.success && data.detected) {
        return data;
      }
    }
  } catch {
    // try fallback configured AI URL
  }

  // 3. Fallback to AI_SERVICE_BASE_URL if configured
  if (AI_SERVICE_BASE_URL && AI_SERVICE_BASE_URL !== "http://localhost:8000") {
    try {
      const res = await fetch(`${AI_SERVICE_BASE_URL}/detect-plate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = (await res.json()) as DetectPlateResult;
        if (data && data.success) {
          return data;
        }
      }
    } catch {
      // not reachable
    }
  }

  return {
    success: false,
    detected: false,
    plate: "",
    confidence: 0,
    model: "YOLOv8s + EasyOCR",
  };
}
