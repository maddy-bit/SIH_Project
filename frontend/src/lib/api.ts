/**
 * Thin fetch wrapper for the Spring Boot backend.
 * All backend routes are namespaced under /api on the server, so callers
 * pass paths like "/health", "/vehicles/MH12AB1234", etc.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
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
    throw new ApiError(`Request to ${path} failed`, response.status);
  }

  return (await response.json()) as T;
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}
