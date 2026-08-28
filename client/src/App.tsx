import { useState, useEffect } from 'react';
import { Compass, Navigation, Moon, Sun, AlertTriangle } from 'lucide-react';
import type { Incident } from './types/navigation';

export default function App() {
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [serverStatus, setServerStatus] = useState<string>('Connecting...');
  const [incidents, setIncidents] = useState<Incident[]>([]);

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

  return (
    <div className={`w-full h-full flex flex-col ${theme === 'night' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-2xl shadow-xl pointer-events-auto">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md">
            <Navigation className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-wide text-white leading-none">Mapeta</h1>
            <span className="text-[10px] text-sky-400 font-medium">{serverStatus}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          {incidents.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-xl">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>{incidents.length} active alerts</span>
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

      <main className="flex-1 w-full h-full relative" id="map-container">
        <div className="w-full h-full flex items-center justify-center flex-col gap-4 text-center p-6">
          <div className="w-16 h-16 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Mapeta Engine Initialized</h2>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              Ready to render MapLibre GL JS vector tiles, turn-by-turn HUD, and real-time Waze incident reporting.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
