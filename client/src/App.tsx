import { useState, useCallback, useRef } from 'react';
import { Navigation, Moon, Sun, AlertTriangle, Crosshair, Compass, Play, Square, Plus } from 'lucide-react';
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
import { parseOSRMRoute } from './utils/routeUtils';
import type { Incident, RouteInfo } from './types/navigation';

export default function App() {
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [selectedProfile, setSelectedProfile] = useState<'driving' | 'bike' | 'foot'>('driving');
  const [avoidTolls, setAvoidTolls] = useState<boolean>(false);
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState<boolean>(false);

  // Active route is the selected route index
  const activeRoute = allRoutes[selectedRouteIndex] || null;

  // Incident state modals
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Live WebSocket incident connection
  const { isConnected, incidents, reportIncident, voteIncident } = useIncidentSocket();

  // Screen wake lock while actively driving in navigation mode
  useWakeLock(isNavigating);

  // High accuracy GPS & Speedometer
  const geo = useGeolocation(true);
  const compassHeading = useOrientation();

  // Simulated GPS position when testing navigation
  const [simulatedPos, setSimulatedPos] = useState<{ lat: number; lng: number; heading: number; speedKmh: number } | null>(null);
  const simIntervalRef = useRef<number | null>(null);

  // Active coordinates
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

  // Turn-by-turn progression hook
  const nav = useNavigation(
    activeRoute,
    userCoords,
    isNavigating,
    () => {
      if (destination && userCoords) {
        calculateRoute([userCoords.longitude, userCoords.latitude], destination, selectedProfile, avoidTolls);
      }
    }
  );

  // Calculate route between start and end with multiple alternatives and toll exclusion
  const calculateRoute = useCallback(async (
    start: [number, number],
    end: [number, number],
    profile: 'driving' | 'bike' | 'foot',
    noTolls: boolean
  ) => {
    try {
      const url = `/api/route?start=${start[0]},${start[1]}&end=${end[0]},${end[1]}&profile=${profile}&alternatives=true&avoidTolls=${noTolls}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data.routes && json.data.routes.length > 0) {
        const parsedRoutes = json.data.routes.map((r: any, idx: number) => parseOSRMRoute(r, profile, idx));
        setAllRoutes(parsedRoutes);
        setSelectedRouteIndex(0);
      }
    } catch (err) {
      console.error('[App] Failed to calculate route:', err);
    }
  }, []);

  // Handle map click to pick a destination
  const handleMapClick = useCallback((coords: [number, number]) => {
    if (isNavigating) return;
    setDestination(coords);
    const startLng = userCoords ? userCoords.longitude : 101.6932;
    const startLat = userCoords ? userCoords.latitude : 3.1408;
    calculateRoute([startLng, startLat], coords, selectedProfile, avoidTolls);
  }, [isNavigating, userCoords, selectedProfile, avoidTolls, calculateRoute]);

  // Handle search bar selection
  const handleSearchSelect = (coords: [number, number]) => {
    setDestination(coords);
    const startLng = userCoords ? userCoords.longitude : 101.6932;
    const startLat = userCoords ? userCoords.latitude : 3.1408;
    calculateRoute([startLng, startLat], coords, selectedProfile, avoidTolls);
  };

  // Profile switch
  const handleSelectProfile = (profile: 'driving' | 'bike' | 'foot') => {
    setSelectedProfile(profile);
    if (destination && userCoords) {
      calculateRoute([userCoords.longitude, userCoords.latitude], destination, profile, avoidTolls);
    }
  };

  // Toggle Avoid Tolls
  const handleToggleAvoidTolls = () => {
    const nextAvoid = !avoidTolls;
    setAvoidTolls(nextAvoid);
    if (destination && userCoords) {
      calculateRoute([userCoords.longitude, userCoords.latitude], destination, selectedProfile, nextAvoid);
    }
  };

  // Start navigation
  const handleStartNavigation = () => {
    setIsNavigating(true);
    setFollowUser(true);
  };

  // Stop navigation
  const handleStopNavigation = () => {
    setIsNavigating(false);
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setDestination(null);
    stopDriveSimulation();
  };

  // Simulated driving along the active route coordinates for live demo/testing
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
    <div className={`w-full h-full flex flex-col relative overflow-hidden ${theme === 'night' ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top App Header & Search Bar (Hidden during active HUD navigation) */}
      {!isNavigating && (
        <header className="absolute top-3 left-3 right-3 z-30 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2.5 pointer-events-auto">
            <div className="flex items-center gap-2.5 bg-slate-900/95 backdrop-blur-2xl border border-slate-800 px-3.5 py-2 rounded-2xl shadow-2xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white shadow-md">
                <Navigation className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold tracking-wide text-white leading-none">Mapeta</h1>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
                </div>
                <span className="text-[10px] text-sky-400 font-medium">
                  {isConnected ? 'Live Sync' : 'Reconnecting...'}
                </span>
              </div>
            </div>

            {/* Mobile quick theme toggle */}
            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
                className="p-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 text-slate-300 hover:text-sky-400 shadow-xl transition-colors"
              >
                {theme === 'night' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="w-full sm:w-80 flex-1 max-w-sm">
            <SearchBar onSelectResult={handleSearchSelect} />
          </div>

          {/* Desktop Right Header Alerts & Theme Controls */}
          <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
            {incidents.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-xl">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>{incidents.length} alert{incidents.length > 1 ? 's' : ''}</span>
              </div>
            )}
            <button
              onClick={() => setTheme(theme === 'night' ? 'day' : 'night')}
              className="p-2.5 rounded-2xl bg-slate-900/95 backdrop-blur-2xl border border-slate-800 text-slate-300 hover:text-sky-400 shadow-xl transition-colors"
              title="Toggle Day/Night Mode"
            >
              {theme === 'night' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </header>
      )}

      {/* Floating Map Action Controls */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col gap-2.5">
        {/* Waze-style Quick Report FAB */}
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black shadow-2xl shadow-orange-500/30 border border-amber-300 active:scale-95 transition-all"
          title="Report Hazard / Incident"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Drive Simulation Test button */}
        {activeRoute && (
          <button
            onClick={isSimulatingDrive ? stopDriveSimulation : startDriveSimulation}
            className={`p-3 rounded-2xl backdrop-blur-md border shadow-2xl transition-all ${
              isSimulatingDrive
                ? 'bg-amber-500 text-white border-amber-400 shadow-amber-500/20 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:text-amber-400'
            }`}
            title={isSimulatingDrive ? 'Stop Drive Simulation' : 'Simulate GPS Drive'}
          >
            {isSimulatingDrive ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
          </button>
        )}

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

      {/* Turn-by-Turn Navigation HUD (Active Mode) */}
      {isNavigating && activeRoute && (
        <NavigationHUD
          currentStep={nav.currentStep}
          nextStep={nav.nextStep}
          distanceToNextStep={nav.distanceToNextStep}
          remainingDistance={nav.remainingDistance}
          remainingDuration={nav.remainingDuration}
          currentSpeedKmh={currentSpeed}
          onStopNavigation={handleStopNavigation}
        />
      )}

      {/* Pre-Navigation Route Summary Card */}
      {!isNavigating && activeRoute && (
        <RouteSummary
          route={activeRoute}
          allRoutes={allRoutes}
          selectedRouteIndex={selectedRouteIndex}
          onSelectRouteIndex={(idx) => setSelectedRouteIndex(idx)}
          selectedProfile={selectedProfile}
          onSelectProfile={handleSelectProfile}
          avoidTolls={avoidTolls}
          onToggleAvoidTolls={handleToggleAvoidTolls}
          onStartNavigation={handleStartNavigation}
          onClose={() => {
            setAllRoutes([]);
            setSelectedRouteIndex(0);
            setDestination(null);
          }}
        />
      )}

      {/* Incident Reporting Sheet Modal */}
      {isReportModalOpen && (
        <ReportModal
          userCoords={userCoords}
          onClose={() => setIsReportModalOpen(false)}
          onSubmit={async (inc) => {
            await reportIncident(inc);
          }}
        />
      )}

      {/* Incident Details & Voting Popup */}
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

      {/* Core MapLibre Canvas */}
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
