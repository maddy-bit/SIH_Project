import { getApiBaseUrl, type TrajectoryPointDto } from "@/lib/api";

export interface LiveConnectedMessage {
  type: "connected";
  plate: string;
  totalEvents: number;
}

export interface LiveDetectionMessage {
  type: "detection";
  index: number;
  total: number;
  point: TrajectoryPointDto;
}

export interface LiveCompleteMessage {
  type: "complete";
  overallConfidence: number | null;
  estimatedDistanceKm: number;
  estimatedDurationMinutes: number;
}

export interface LiveErrorMessage {
  type: "error";
  message: string;
}

export type LiveMessage =
  | LiveConnectedMessage
  | LiveDetectionMessage
  | LiveCompleteMessage
  | LiveErrorMessage;

interface LiveTrackingHandlers {
  onMessage: (message: LiveMessage) => void;
  onClose?: () => void;
  onError?: () => void;
}

/**
 * Opens a WebSocket to the backend's live-simulation endpoint
 * (GET /ws/live/{plate}) which replays the vehicle's reconstructed
 * trajectory as a paced stream of detection events.
 *
 * Uses getApiBaseUrl() at invocation time (not module-level constant) so
 * the correct runtime URL is used on Vercel (https → wss).
 *
 * Returns a cleanup function that closes the connection.
 */
export function connectLiveTracking(
  plate: string,
  handlers: LiveTrackingHandlers,
): () => void {
  // Evaluate at call time — picks up runtime env on Vercel correctly
  const apiBase = getApiBaseUrl();
  const wsBase = apiBase
    .replace(/^https:\/\//, "wss://")
    .replace(/^http:\/\//, "ws://");

  const socket = new WebSocket(`${wsBase}/ws/live/${encodeURIComponent(plate)}`);

  // 8-second connection timeout — fires onError if backend is cold-sleeping
  const timeoutId = window.setTimeout(() => {
    if (socket.readyState !== WebSocket.OPEN) {
      socket.close();
      handlers.onError?.();
    }
  }, 8000);

  socket.onopen = () => {
    window.clearTimeout(timeoutId);
  };

  socket.onmessage = (event) => {
    try {
      handlers.onMessage(JSON.parse(event.data) as LiveMessage);
    } catch {
      // ignore malformed frames
    }
  };

  socket.onclose = () => {
    window.clearTimeout(timeoutId);
    handlers.onClose?.();
  };

  socket.onerror = () => {
    window.clearTimeout(timeoutId);
    handlers.onError?.();
  };

  return () => {
    window.clearTimeout(timeoutId);
    socket.close();
  };
}
