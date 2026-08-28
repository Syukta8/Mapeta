import pathlib

index_html = """<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <title>Mapeta — Self-Hosted Map & Navigation</title>
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2338bdf8'><path d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/></svg>" />
    <link href="https://unpkg.com/maplibre-gl@5.1.0/dist/maplibre-gl.css" rel="stylesheet" />
  </head>
  <body class="bg-slate-950 text-slate-100 overflow-hidden select-none m-0 p-0 font-sans antialiased">
    <div id="root" class="w-screen h-screen overflow-hidden"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
"""

index_css = """@tailwind base;
@tailwind components;
@tailwind utilities;

html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.6);
}
::-webkit-scrollbar-thumb {
  background: rgba(56, 189, 248, 0.4);
  border-radius: 9999px;
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(56, 189, 248, 0.7);
}

.maplibregl-ctrl-bottom-right,
.maplibregl-ctrl-bottom-left {
  z-index: 10 !important;
}

@keyframes pulse-ring {
  0% { transform: scale(0.9); opacity: 0.8; }
  50% { transform: scale(1.4); opacity: 0.2; }
  100% { transform: scale(0.9); opacity: 0.8; }
}

.user-pos-pulse {
  animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
}
"""

types_nav_ts = """export type ManeuverType = 
  | 'turn-left'
  | 'turn-right'
  | 'turn-slight-left'
  | 'turn-slight-right'
  | 'turn-sharp-left'
  | 'turn-sharp-right'
  | 'straight'
  | 'roundabout'
  | 'merge'
  | 'on-ramp'
  | 'off-ramp'
  | 'fork'
  | 'u-turn'
  | 'arrive'
  | 'depart';

export interface RouteStep {
  distance: number; // meters
  duration: number; // seconds
  name: string;
  instruction: string;
  maneuverType: ManeuverType;
  modifier?: string;
  location: [number, number]; // [lng, lat]
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  geometry: {
    type: 'LineString';
    coordinates: [number, number][];
  };
  steps: RouteStep[];
  summary: string;
  profile: 'driving' | 'bike' | 'foot';
}

export interface Incident {
  id: string;
  type: 'police' | 'hazard' | 'jam' | 'closure' | 'accident';
  lat: number;
  lng: number;
  title: string;
  description?: string;
  reported_at: number;
  expires_at: number;
  upvotes: number;
  downvotes: number;
  active: number;
}

export interface SearchResult {
  id?: string;
  name?: string;
  display_name?: string;
  lat: string | number;
  lng?: string | number;
  lon?: string | number;
  category?: string;
}
"""

map_styles_ts = """export const MAP_STYLES = {
  day: 'https://tiles.openfreemap.org/styles/bright',
  night: 'https://tiles.openfreemap.org/styles/dark',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  positron: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  darkMatter: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
};
"""

main_tsx = """import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""

app_tsx = """import { useState, useEffect } from 'react';
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
"""

manifest_json = """{
  "name": "Mapeta Navigation",
  "short_name": "Mapeta",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f172a",
  "theme_color": "#0f172a",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192' fill='%2338bdf8'><rect width='192' height='192' rx='36' fill='%230f172a'/><path d='M96 30C66.18 30 42 54.18 42 84c0 40.5 54 98 54 98s54-57.5 54-98c0-29.82-24.18-54-54-54zm0 73.5c-10.77 0-19.5-8.73-19.5-19.5S85.23 64.5 96 64.5s19.5 8.73 19.5 19.5-8.73 19.5-19.5 19.5z' fill='%2338bdf8'/></svg>",
      "sizes": "192x192",
      "type": "image/svg+xml"
    }
  ]
}
"""

pathlib.Path('client/src/types').mkdir(parents=True, exist_ok=True)
pathlib.Path('client/src/styles').mkdir(parents=True, exist_ok=True)
pathlib.Path('client/src/components').mkdir(parents=True, exist_ok=True)
pathlib.Path('client/src/hooks').mkdir(parents=True, exist_ok=True)

pathlib.Path('client/index.html').write_text(index_html, encoding='utf-8')
pathlib.Path('client/src/index.css').write_text(index_css, encoding='utf-8')
pathlib.Path('client/src/types/navigation.ts').write_text(types_nav_ts, encoding='utf-8')
pathlib.Path('client/src/styles/mapStyles.ts').write_text(map_styles_ts, encoding='utf-8')
pathlib.Path('client/src/main.tsx').write_text(main_tsx, encoding='utf-8')
pathlib.Path('client/src/App.tsx').write_text(app_tsx, encoding='utf-8')
pathlib.Path('client/manifest.json').write_text(manifest_json, encoding='utf-8')
print('Client foundation files written successfully!')