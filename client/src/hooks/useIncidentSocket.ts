import { useState, useEffect, useRef, useCallback } from 'react';
import type { Incident } from '../types/navigation';

export function useIncidentSocket(onNewIncident?: (incident: Incident) => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveIncidents, setLiveIncidents] = useState<Incident[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Initial load via REST
  const fetchIncidents = useCallback(async () => {
    try {
      const res = await fetch('/api/incidents');
      const data = await res.json();
      if (data.success) {
        setLiveIncidents(data.data);
      }
    } catch (err) {
      console.error('[IncidentSocket] REST fetch failed:', err);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'INCIDENT_NEW') {
            const inc: Incident = msg.payload;
            setLiveIncidents((prev) => {
              const filtered = prev.filter((i) => i.id !== inc.id);
              return [inc, ...filtered];
            });
            if (onNewIncident) onNewIncident(inc);
          } else if (msg.type === 'INCIDENT_UPDATE') {
            const updated: Incident = msg.payload;
            setLiveIncidents((prev) =>
              prev.map((i) => (i.id === updated.id ? updated : i))
            );
          } else if (msg.type === 'INCIDENT_DELETE') {
            const removed: Incident = msg.payload;
            setLiveIncidents((prev) => prev.filter((i) => i.id !== removed.id));
          }
        } catch (err) {
          console.error('[IncidentSocket] Message parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Exponential auto-reconnect
        reconnectTimeoutRef.current = window.setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[IncidentSocket] WebSocket error:', err);
        ws.close();
      };
    };

    connect();

    // Heartbeat ping every 30s
    const pingInterval = window.setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000);

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchIncidents, onNewIncident]);

  // Report new incident via REST (server broadcasts via WS)
  const reportIncident = async (incident: Partial<Incident>) => {
    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incident),
      });
      return await res.json();
    } catch (err) {
      console.error('[IncidentSocket] Post failed:', err);
      throw err;
    }
  };

  // Vote on incident
  const voteIncident = async (id: string, vote: 'up' | 'down') => {
    try {
      const res = await fetch(`/api/incidents/${id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote }),
      });
      return await res.json();
    } catch (err) {
      console.error('[IncidentSocket] Vote failed:', err);
      throw err;
    }
  };

  return {
    isConnected,
    incidents: liveIncidents,
    reportIncident,
    voteIncident,
    refreshIncidents: fetchIncidents,
  };
}
