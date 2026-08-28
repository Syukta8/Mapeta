import { useState, useEffect, useCallback } from 'react';
import { Navigation, Moon, Sun, AlertTriangle, Crosshair, Compass } from 'lucide-react';
import { MapView } from './components/Map/MapView';
import { useGeolocation } from './hooks/useGeolocation';
import { useOrientation } from './hooks/useOrientation';
import type { Incident, RouteInfo } from './types/navigation';

export default function App() {
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [serverStatus, setServerStatus] = useState<string>('Connecting...');
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [activeRoute] = useState<RouteInfo | null>(null);
  const [alternativeRoutes] = useState<RouteInfo[]>([]);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [followUser, setFollowUser] = useState<boolean>(true);

  // High accuracy GPS & Speedometer
  const geo = useGeolocation(true);
  const compassHeading = useOrientation();

  // Prefer compass heading on mobile if stationary, otherwise GPS heading
  const currentHeading = geo.coords?.heading || compassHeading || 0;

  const userCoords = geo.coords
    ? {
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
        heading: currentHeading,
      }
    : null;

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setServerStatus(`Online (${data.app})`))
      .catch(() => setServerStatus('Offline'));

    fetch('/api/incidents')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setIncidents(res.data);
        }
      })
      .catch(console.error);
  }, []);

  const handleIncidentClick = useCallback((inc: Incident) => {
    alert(`Incident: ${inc.title}\nDetails: ${inc.description || 'No description'}\nVotes: +${inc.upvotes} / -${inc.downvotes}`);
  }, []);

  return (
    <div className={`w-full h-full flex flex-col relative overflow-hidden ${theme === 'night' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top App Header */}
      <header className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-2xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-wide text-white leading-none">Mapeta</h1>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <span className="text-[10px] text-sky-400 font-medium">{serverStatus}</span>
          </div>
        </div>

        {/* Right Header Status & Theme Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {incidents.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-xl">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{incidents.length} alert{incidents.length > 1 ? 's' : ''}</span>
            </div>
          )}
          <button
            onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
            className="p-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-300 hover:text-sky-400 shadow-xl transition-colors"
            title="Toggle Day/Night Mode"
          >
            {theme === 'night' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Floating Map Action Controls (Recenter, 2D/3D tilt, Compass) */}
      <div className="absolute right-3 bottom-24 z-20 flex flex-col gap-2.5">
        <button
          onClick={() => setFollowUser(!followUser)}
          className={`p-3 rounded-2xl backdrop-blur-md border shadow-2xl transition-all ${
            followUser
              ? 'bg-sky-500 text-white border-sky-400 shadow-sky-500/20'
              : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-sky-400'
          }`}
          title="Recenter & Follow Vehicle"
        >
          <Crosshair className="w-5 h-5" />
        </button>

        <button
          onClick={() => setIsNavigating(!isNavigating)}
          className={`p-3 rounded-2xl backdrop-blur-md border shadow-2xl transition-all ${
            isNavigating
              ? 'bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20'
              : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-emerald-400'
          }`}
          title="Toggle 3D Navigation Perspective"
        >
          <Compass className="w-5 h-5" />
        </button>
      </div>

      {/* Core MapLibre Canvas */}
      <main className="flex-1 w-full h-full relative">
        <MapView
          theme={theme}
          userCoords={userCoords}
          activeRoute={activeRoute}
          alternativeRoutes={alternativeRoutes}
          incidents={incidents}
          isNavigating={isNavigating}
          followUser={followUser}
          onIncidentClick={handleIncidentClick}
        />
      </main>
    </div>
  );
}
