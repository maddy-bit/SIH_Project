/**
 * Thin fetch wrapper for the Spring Boot backend.
 * All backend routes are namespaced under /api on the server, so callers
 * pass paths like "/health", "/vehicles/MH12AB1234", etc.
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface CameraDto {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  direction: string;
  status: "ONLINE" | "PROCESSING" | "OFFLINE" | string;
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
      // non-JSON error body, keep the generic message
    }
    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}

export function getCameras(): Promise<CameraDto[]> {
  return apiFetch<CameraDto[]>("/cameras");
}

export function getVehicleSummary(plate: string): Promise<VehicleSummaryDto> {
  return apiFetch<VehicleSummaryDto>(`/vehicles/${encodeURIComponent(plate)}`);
}

export function getVehicleDetections(plate: string): Promise<VehicleDetectionDto[]> {
  return apiFetch<VehicleDetectionDto[]>(`/vehicles/${encodeURIComponent(plate)}/detections`);
}

export function getVehicleTrajectory(plate: string): Promise<TrajectoryResponseDto> {
  return apiFetch<TrajectoryResponseDto>(`/vehicles/${encodeURIComponent(plate)}/trajectory`);
}

/** Builds the URL for an evidence frame stored under data/evidence/. */
export function evidenceImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath) return null;
  return `${API_BASE_URL}/evidence/${imagePath}`;
}
