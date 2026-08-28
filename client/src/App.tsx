import { useState, useCallback, useRef } from 'react';
import { Moon, Sun, AlertTriangle, Crosshair, Compass, Play, Square, Plus, Navigation } from 'lucide-react';
import { MapView } from './components/Map/MapView';
import { NavigationHUD } from './components/Navigation/NavigationHUD';
import { RouteSummary } from './components/UI/RouteSummary';
import { SearchBar } from './components/Search/SearchBar';
import { ReportModal } from './components/Incidents/ReportModal';
import { IncidentDetails } from './components/Incidents/IncidentDetails';
import { useGeolocation } from './hooks/useGeolocation';
import { useOrientation } from './hooks/useOrientation';
import { useNavigation } from './hooks/useNavigation';
import { useWakeLock } from './hooks/useWakeLock';
import { useIncidentSocket } from './hooks/useIncidentSocket';
import { processMultiRoutes } from './utils/routeUtils';
import type { Incident, RouteInfo } from './types/navigation';

export default function App() {
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [selectedProfile, setSelectedProfile] = useState<'driving' | 'bike' | 'foot'>('driving');
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState<boolean>(false);

  const activeRoute = allRoutes[selectedRouteIndex] || null;

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const { isConnected, incidents, reportIncident, voteIncident } = useIncidentSocket();

  useWakeLock(isNavigating);

  const geo = useGeolocation(true);
  const compassHeading = useOrientation();

  const [simulatedPos, setSimulatedPos] = useState<{ lat: number; lng: number; heading: number; speedKmh: number } | null>(null);
  const simIntervalRef = useRef<number | null>(null);

  const userCoords = simulatedPos
    ? {
        latitude: simulatedPos.lat,
        longitude: simulatedPos.lng,
        heading: simulatedPos.heading,
      }
    : geo.coords
    ? {
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
        heading: geo.coords.heading || compassHeading || 0,
      }
    : null;

  const currentSpeed = simulatedPos ? simulatedPos.speedKmh : geo.speedKmh;

  const nav = useNavigation(
    activeRoute,
    userCoords,
    isNavigating,
    () => {
      if (destination && userCoords) {
        calculateRoute([userCoords.longitude, userCoords.latitude], destination, selectedProfile);
      }
    }
  );

  const calculateRoute = useCallback(async (
    start: [number, number],
    end: [number, number],
    profile: 'driving' | 'bike' | 'foot'
  ) => {
    try {
      const url = `/api/route?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}&profile=${profile}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data.routes && json.data.routes.length > 0) {
        const parsedRoutes = processMultiRoutes(json.data.routes, profile, incidents);
        setAllRoutes(parsedRoutes);
        setSelectedRouteIndex(0);
      }
    } catch (err) {
      console.error('[App] Failed to calculate route:', err);
    }
  }, [incidents]);

  const handleMapClick = useCallback((coords: [number, number]) => {
    if (isNavigating) return;
    setDestination(coords);
    const startLng = userCoords ? userCoords.longitude : 101.6932;
    const startLat = userCoords ? userCoords.latitude : 3.1408;
    calculateRoute([startLng, startLat], coords, selectedProfile);
  }, [isNavigating, userCoords, selectedProfile, calculateRoute]);

  const handleSearchSelect = (coords: [number, number]) => {
    setDestination(coords);
    const startLng = userCoords ? userCoords.longitude : 101.6932;
    const startLat = userCoords ? userCoords.latitude : 3.1408;
    calculateRoute([startLng, startLat], coords, selectedProfile);
  };

  const handleSelectProfile = (profile: 'driving' | 'bike' | 'foot') => {
    setSelectedProfile(profile);
    if (destination && userCoords) {
      calculateRoute([userCoords.longitude, userCoords.latitude], destination, profile);
    }
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    setFollowUser(true);
  };

  const handleStopNavigation = () => {
    setIsNavigating(false);
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setDestination(null);
    stopDriveSimulation();
  };

  const startDriveSimulation = () => {
    if (!activeRoute || activeRoute.geometry.coordinates.length < 2) return;

    setIsSimulatingDrive(true);
    setIsNavigating(true);
    setFollowUser(true);

    const coords = activeRoute.geometry.coordinates;
    let idx = 0;

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = window.setInterval(() => {
      if (idx >= coords.length - 1) {
        stopDriveSimulation();
        return;
      }

      const curr = coords[idx];
      const next = coords[idx + 1];

      const y = Math.sin(((next[0] - curr[0]) * Math.PI) / 180) * Math.cos((next[1] * Math.PI) / 180);
      const x =
        Math.cos((curr[1] * Math.PI) / 180) * Math.sin((next[1] * Math.PI) / 180) -
        Math.sin((curr[1] * Math.PI) / 180) *
          Math.cos((next[1] * Math.PI) / 180) *
          Math.cos(((next[0] - curr[0]) * Math.PI) / 180);
      const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

      setSimulatedPos({
        lng: curr[0],
        lat: curr[1],
        heading: Math.round(bearing),
        speedKmh: Math.floor(Math.random() * 20) + 45,
      });

      idx += 1;
    }, 1500);
  };

  const stopDriveSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulatingDrive(false);
    setSimulatedPos(null);
  };

  const handleIncidentClick = useCallback((inc: Incident) => {
    setSelectedIncident(inc);
  }, []);

  return (
    <div className={`w-full h-full flex flex-col relative overflow-hidden ${theme === 'night' ? 'dark bg-[#121316] text-[#e3e2e6]' : 'bg-[#fdfcff] text-[#121316]'}`}>
      {!isNavigating && (
        <header className="absolute top-3 left-3 right-3 z-30 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2.5 pointer-events-auto">
            <div className="pixel-card px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-[#0b57d0] flex items-center justify-center text-white shadow-sm">
                <Navigation className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold tracking-tight text-white leading-none">Mapeta</h1>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#6dd58c] animate-pulse' : 'bg-red-500'}`}></span>
                </div>
              </div>
            </div>

            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
                className="pixel-card p-2.5 rounded-full text-[#a8c7fa] border border-white/10 shadow-xl transition-colors"
              >
                {theme === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="w-full sm:w-80 flex-1 max-w-sm">
            <SearchBar onSelectResult={handleSearchSelect} />
          </div>

          <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
            {incidents.length > 0 && (
              <div className="pixel-card flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{incidents.length} alert{incidents.length > 1 ? 's' : ''}</span>
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
              className="pixel-card p-2.5 rounded-full text-[#a8c7fa] border border-white/10 hover:border-[#a8c7fa]/40 shadow-xl transition-colors"
              title="Toggle Day/Night Mode"
            >
              {theme === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* Floating Action Buttons */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col gap-2.5">
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="pixel-btn-primary p-3.5 rounded-full shadow-2xl active:scale-95 transition-all"
          title="Report Hazard / Incident"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {activeRoute && (
          <button
            onClick={isSimulatingDrive ? stopDriveSimulation : startDriveSimulation}
            className={`pixel-card p-3 rounded-full shadow-2xl transition-all border ${
              isSimulatingDrive
                ? 'bg-amber-500/30 text-amber-300 border-amber-400 animate-pulse'
                : 'text-white border-white/10 hover:text-[#a8c7fa]'
            }`}
            title={isSimulatingDrive ? 'Stop Drive Simulation' : 'Simulate GPS Drive'}
          >
            {isSimulatingDrive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
        )}

        <button
          onClick={() => setFollowUser(!followUser)}
          className={`pixel-card p-3 rounded-full shadow-2xl transition-all border ${
            followUser
              ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border-[#a8c7fa]'
              : 'text-white border-white/10 hover:text-[#a8c7fa]'
          }`}
          title="Recenter Camera"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsNavigating(!isNavigating)}
          className={`pixel-card p-3 rounded-full shadow-2xl transition-all border ${
            isNavigating
              ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border-[#a8c7fa]'
              : 'text-white border-white/10 hover:text-[#a8c7fa]'
          }`}
          title="Toggle 3D Perspective"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {isNavigating && activeRoute && (
        <NavigationHUD
          currentStep={nav.currentStep}
          nextStep={nav.nextStep}
          distanceToNextStep={nav.distanceToNextStep}
          remainingDistance={nav.remainingDistance}
          remainingDuration={nav.remainingDuration}
          currentSpeedKmh={currentSpeed}
          allRoutes={allRoutes}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRouteIndex={(idx) => setSelectedRouteIndex(idx)}
          onStopNavigation={handleStopNavigation}
        />
      )}

      {!isNavigating && allRoutes.length > 0 && (
        <RouteSummary
          allRoutes={allRoutes}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRouteIndex={(idx) => setSelectedRouteIndex(idx)}
          selectedProfile={selectedProfile}
          onSelectProfile={handleSelectProfile}
          onStartNavigation={handleStartNavigation}
          onClose={() => {
            setAllRoutes([]);
            setSelectedRouteIndex(0);
            setDestination(null);
          }}
        />
      )}

      {isReportModalOpen && (
        <ReportModal
          userCoords={userCoords}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={async (inc) => {
            await reportIncident(inc);
          }}
        />
      )}

      {selectedIncident && (
        <IncidentDetails
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onVote={async (id, vote) => {
            await voteIncident(id, vote);
            setSelectedIncident(null);
          }}
        />
      )}

      <main className="flex-1 w-full h-full relative">
        <MapView
          theme={theme}
          userCoords={userCoords}
          activeRoute={activeRoute}
          allRoutes={allRoutes}
          selectedRouteIndex={selectedRouteIndex}
          incidents={incidents}
          isNavigating={isNavigating}
          followUser={followUser}
          onMapClick={handleMapClick}
          onUserPan={() => setFollowUser(false)}
          onSelectAlternative={(idx) => setSelectedRouteIndex(idx)}
          onIncidentClick={handleIncidentClick}
        />
      </main>
    </div>
  );
}
