import type { Incident, CreateIncidentPayload, VoteIncidentPayload } from './IncidentModel';
import { getWebSocketUrl } from '../config';

export type IncidentCallback = (incidents: Incident[]) => void;
export type ConnectionCallback = (connected: boolean) => void;

export class IncidentService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private incidentListeners: Set<IncidentCallback> = new Set();
  private connectionListeners: Set<ConnectionCallback> = new Set();

  constructor() {
    this.connect();
  }

  public connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.notifyConnection(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'init' || msg.type === 'incident_created' || msg.type === 'incident_updated') {
            if (Array.isArray(msg.data)) {
              this.notifyIncidents(msg.data);
            } else if (msg.data && typeof msg.data === 'object') {
              // Handled by full array broadcast from server
            }
          }
        } catch (e) {
          console.error('[IncidentService] Parse error:', e);
        }
      };

      this.socket.onclose = () => {
        this.notifyConnection(false);
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        this.notifyConnection(false);
      };
    } catch (e) {
      this.notifyConnection(false);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => this.connect(), 3000);
  }

  public onIncidents(cb: IncidentCallback): () => void {
    this.incidentListeners.add(cb);
    return () => this.incidentListeners.delete(cb);
  }

  public onConnectionChange(cb: ConnectionCallback): () => void {
    this.connectionListeners.add(cb);
    return () => this.connectionListeners.delete(cb);
  }

  private notifyIncidents(data: Incident[]) {
    this.incidentListeners.forEach((cb) => cb(data));
  }

  private notifyConnection(connected: boolean) {
    this.connectionListeners.forEach((cb) => cb(connected));
  }

  public reportIncident(payload: CreateIncidentPayload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'report_incident', data: payload }));
    }
  }

  public voteIncident(payload: VoteIncidentPayload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'vote_incident', data: payload }));
    }
  }
}

export const incidentService = new IncidentService();
