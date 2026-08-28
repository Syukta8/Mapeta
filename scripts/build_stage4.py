import pathlib

ws_hook = """import { useState, useEffect, useRef, useCallback } from 'react';
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
"""

report_modal = """import { useState } from 'react';
import { Shield, AlertTriangle, Car, Construction, Flame, X, Send } from 'lucide-react';
import type { Incident } from '../../types/navigation';

interface ReportModalProps {
  userCoords: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSubmit: (incident: Partial<Incident>) => Promise<void>;
}

export function ReportModal({ userCoords, onClose, onSubmit }: ReportModalProps) {
  const [selectedType, setSelectedType] = useState<Incident['type']>('police');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories: { type: Incident['type']; label: string; icon: any; color: string; desc: string }[] = [
    {
      type: 'police',
      label: 'Police / Radar',
      icon: Shield,
      color: 'bg-blue-600 border-blue-400 text-white shadow-blue-500/30',
      desc: 'Speed camera or patrol car',
    },
    {
      type: 'hazard',
      label: 'Hazard',
      icon: AlertTriangle,
      color: 'bg-amber-500 border-amber-300 text-slate-950 shadow-amber-500/30',
      desc: 'Object, pothole, or animal on road',
    },
    {
      type: 'jam',
      label: 'Traffic Jam',
      icon: Car,
      color: 'bg-rose-600 border-rose-400 text-white shadow-rose-500/30',
      desc: 'Heavy standstill traffic',
    },
    {
      type: 'closure',
      label: 'Road Closure',
      icon: Construction,
      color: 'bg-purple-600 border-purple-400 text-white shadow-purple-500/30',
      desc: 'Construction or blocked lane',
    },
    {
      type: 'accident',
      label: 'Accident',
      icon: Flame,
      color: 'bg-orange-600 border-orange-400 text-white shadow-orange-500/30',
      desc: 'Crash or vehicle breakdown',
    },
  ];

  const handleSubmit = async () => {
    if (!userCoords || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const selected = categories.find((c) => c.type === selectedType);
      await onSubmit({
        type: selectedType,
        lat: userCoords.latitude,
        lng: userCoords.longitude,
        title: selected?.label || 'Incident reported',
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-5 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-8 duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
            <h2 className="text-base font-bold text-white">Report Road Incident</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800/80 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick-Select Category Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedType === cat.type;
            return (
              <button
                key={cat.type}
                type="button"
                onClick={() => setSelectedType(cat.type)}
                className={`p-3 rounded-2xl border flex flex-col items-start gap-1.5 transition-all text-left ${
                  isSelected
                    ? `${cat.color} shadow-lg scale-[1.02]`
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-bold">{cat.label}</span>
                </div>
                <span className={`text-[10px] leading-tight ${isSelected ? 'opacity-90' : 'text-slate-500'}`}>
                  {cat.desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Optional Note / Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-400">Additional Note (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Right lane blocked, patrol with camera"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        {/* Submit Report Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !userCoords}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-600 hover:from-sky-300 hover:to-blue-500 text-white font-extrabold text-sm shadow-xl shadow-sky-500/25 active:scale-98 disabled:opacity-50 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? 'Broadcasting...' : 'Broadcast to Mapeta Community'}</span>
        </button>
      </div>
    </div>
  );
}
"""

incident_details = """import { ThumbsUp, ThumbsDown, X, Clock } from 'lucide-react';
import type { Incident } from '../../types/navigation';

interface IncidentDetailsProps {
  incident: Incident;
  onClose: () => void;
  onVote: (id: string, vote: 'up' | 'down') => void;
}

export function IncidentDetails({ incident, onClose, onVote }: IncidentDetailsProps) {
  const timeAgo = (timestamp: number) => {
    const elapsedMins = Math.round((Date.now() - timestamp) / 60000);
    if (elapsedMins < 1) return 'Just now';
    if (elapsedMins < 60) return `${elapsedMins}m ago`;
    const hrs = Math.floor(elapsedMins / 60);
    return `${hrs}h ago`;
  };

  const getEmoji = (type: Incident['type']) => {
    switch (type) {
      case 'police': return '👮';
      case 'hazard': return '⚠️';
      case 'jam': return '🚗';
      case 'closure': return '🚧';
      case 'accident': return '💥';
      default: return '📍';
    }
  };

  return (
    <div className="absolute bottom-28 left-3 right-3 z-40 max-w-sm mx-auto animate-in fade-in slide-in-from-bottom-6 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-2xl border border-slate-800 rounded-3xl p-4 shadow-2xl flex flex-col gap-3">
        {/* Top Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getEmoji(incident.type)}</span>
            <div className="flex flex-col">
              <h3 className="text-sm font-bold text-white leading-tight">{incident.title}</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>Reported {timeAgo(incident.reported_at)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {incident.description && (
          <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            {incident.description}
          </p>
        )}

        {/* Upvote / Downvote Confirmation Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onVote(incident.id, 'up')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold transition-colors"
          >
            <ThumbsUp className="w-4 h-4 text-emerald-400" />
            <span>Still there ({incident.upvotes})</span>
          </button>

          <button
            onClick={() => onVote(incident.id, 'down')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-300 hover:border-rose-500/40 text-xs font-bold transition-colors"
          >
            <ThumbsDown className="w-4 h-4" />
            <span>Cleared ({incident.downvotes})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
"""

pathlib.Path('client/src/components/Incidents').mkdir(parents=True, exist_ok=True)
pathlib.Path('client/src/hooks/useIncidentSocket.ts').write_text(ws_hook, encoding='utf-8')
pathlib.Path('client/src/components/Incidents/ReportModal.tsx').write_text(report_modal, encoding='utf-8')
pathlib.Path('client/src/components/Incidents/IncidentDetails.tsx').write_text(incident_details, encoding='utf-8')
print('Stage 4 Incident reporting and socket components generated successfully!')