import { API_BASE_URL, type TrajectoryPointDto } from "@/lib/api";

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

export type LiveMessage = LiveConnectedMessage | LiveDetectionMessage | LiveCompleteMessage | LiveErrorMessage;

interface LiveTrackingHandlers {
  onMessage: (message: LiveMessage) => void;
  onClose?: () => void;
  onError?: () => void;
}

/**
 * Opens a WebSocket to the backend's live-simulation endpoint
 * (GET /ws/live/{plate} - see LiveTrackingWebSocketHandler) which replays
 * the vehicle's reconstructed trajectory as a paced stream of detection
 * events. Returns a cleanup function that closes the connection.
 */
export function connectLiveTracking(plate: string, handlers: LiveTrackingHandlers): () => void {
  const wsBase = API_BASE_URL.replace(/^http/, "ws");
  const socket = new WebSocket(`${wsBase}/ws/live/${encodeURIComponent(plate)}`);

  socket.onmessage = (event) => {
    try {
      handlers.onMessage(JSON.parse(event.data) as LiveMessage);
    } catch {
      // ignore malformed frames
    }
  };
  socket.onclose = () => handlers.onClose?.();
  socket.onerror = () => handlers.onError?.();

  return () => socket.close();
}
