import type { Incident, CreateIncidentPayload, VoteIncidentPayload } from './IncidentModel';
import { getWebSocketUrl, API_BASE } from '../config';

export type IncidentCallback = (incidents: Incident[]) => void;
export type ConnectionCallback = (connected: boolean) => void;

export class IncidentService {
  private socket: WebSocket | null = null;
  private reconnectTimer: number | null = null;
  private currentIncidents: Incident[] = [];
  private incidentListeners: Set<IncidentCallback> = new Set();
  private connectionListeners: Set<ConnectionCallback> = new Set();

  constructor() {
    this.refreshHttp();
    this.connect();
  }

  /**
   * Fetches active incidents from REST endpoint for initial load or reconnect recovery.
   */
  public async refreshHttp() {
    try {
      const res = await fetch(`${API_BASE}/api/incidents`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.currentIncidents = json.data;
          this.notifyIncidents(this.currentIncidents);
        }
      }
    } catch (e) {
      console.warn('[IncidentService] HTTP fetch failed, relying on WebSocket:', e);
    }
  }

  public connect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketUrl();

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.notifyConnection(true);
        this.refreshHttp();
      };

      this.socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INCIDENT_SNAPSHOT' && Array.isArray(msg.payload)) {
            this.currentIncidents = msg.payload;
            this.notifyIncidents(this.currentIncidents);
          } else if (msg.type === 'INCIDENT_NEW' && msg.payload) {
            const exists = this.currentIncidents.some((i) => i.id === msg.payload.id);
            if (!exists) {
              this.currentIncidents = [msg.payload, ...this.currentIncidents];
              this.notifyIncidents(this.currentIncidents);
            }
          } else if (msg.type === 'INCIDENT_UPDATE' && msg.payload) {
            this.currentIncidents = this.currentIncidents.map((i) =>
              i.id === msg.payload.id ? msg.payload : i
            );
            this.notifyIncidents(this.currentIncidents);
          } else if (msg.type === 'INCIDENT_DELETE' && msg.payload) {
            this.currentIncidents = this.currentIncidents.filter((i) => i.id !== msg.payload.id);
            this.notifyIncidents(this.currentIncidents);
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
    if (this.currentIncidents.length > 0) {
      cb(this.currentIncidents);
    }
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

  /**
   * Reports a new incident using HTTP POST with idempotency key and fallback.
   */
  public async reportIncident(payload: CreateIncidentPayload): Promise<Incident | null> {
    const idempotencyKey = payload.idempotency_key || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `idm_${Date.now()}_${Math.random()}`);
    const fullPayload = { ...payload, idempotency_key: idempotencyKey };

    try {
      const res = await fetch(`${API_BASE}/api/incidents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullPayload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[IncidentService] HTTP report failed:', err);
    }
    return null;
  }

  /**
   * Votes on an incident using HTTP POST.
   */
  public async voteIncident(payload: VoteIncidentPayload): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/incidents/${payload.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: payload.vote }),
      });
      return res.ok;
    } catch (err) {
      console.warn('[IncidentService] HTTP vote failed:', err);
      return false;
    }
  }
}

export const incidentService = new IncidentService();

