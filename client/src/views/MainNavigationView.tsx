import { Moon, Sun, AlertTriangle, Crosshair, Compass, Play, Square, Plus, Navigation } from 'lucide-react';
import { MapView } from '../components/Map/MapView';
import { NavigationHUD } from '../components/Navigation/NavigationHUD';
import { RouteSummary } from '../components/UI/RouteSummary';
import { SearchBar } from '../components/Search/SearchBar';
import { ReportModal } from '../components/Incidents/ReportModal';
import { IncidentDetails } from '../components/Incidents/IncidentDetails';
import { IncidentApproachAlert } from '../components/Incidents/IncidentApproachAlert';
import { useGeolocation } from '../hooks/useGeolocation';
import { useOrientation } from '../hooks/useOrientation';
import { useMapViewModel } from '../viewmodels/useMapViewModel';
import { useIncidentViewModel } from '../viewmodels/useIncidentViewModel';
import { useNavigationViewModel } from '../viewmodels/useNavigationViewModel';
import type { Coordinates } from '../models/NavigationModel';

export function MainNavigationView() {
  const geo = useGeolocation(true);
  const compassHeading = useOrientation();

  const mapVM = useMapViewModel();

  // Navigation ViewModel will be initialized below after we calculate coordinates
  const simulatedPosRef = useNavigationViewModel(null, []);

  const userCoords: Coordinates | null = simulatedPosRef.simulatedPos
    ? {
        latitude: simulatedPosRef.simulatedPos.lat,
        longitude: simulatedPosRef.simulatedPos.lng,
        heading: simulatedPosRef.simulatedPos.heading,
      }
    : geo.coords
    ? {
        latitude: geo.coords.latitude,
        longitude: geo.coords.longitude,
        heading: geo.coords.heading || compassHeading || 0,
      }
    : null;

  const currentSpeed = simulatedPosRef.simulatedPos ? simulatedPosRef.simulatedPos.speedKmh : geo.speedKmh;

  const incidentVM = useIncidentViewModel(userCoords, simulatedPosRef.isNavigating);
  const navVM = useNavigationViewModel(userCoords, incidentVM.incidents);

  return (
    <div className={`w-full h-full flex flex-col relative overflow-hidden ${mapVM.theme === 'night' ? 'dark bg-[#121316] text-[#e3e2e6]' : 'bg-[#fdfcff] text-[#121316]'}`}>
      
      {/* Top Header Bar */}
      {!navVM.isNavigating && (
        <header className="absolute top-3 left-3 right-3 z-30 flex flex-col sm:flex-row items-center justify-between gap-2.5 pointer-events-none">
          <div className="flex items-center justify-between w-full sm:w-auto gap-2.5 pointer-events-auto">
            <div className="pixel-card px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 border border-white/10">
              <div className="w-6 h-6 rounded-full bg-[#0b57d0] flex items-center justify-center text-white shadow-sm">
                <Navigation className="w-3.5 h-3.5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-bold tracking-tight text-white leading-none">Mapeta</h1>
                  <span className={`w-1.5 h-1.5 rounded-full ${incidentVM.isConnected ? 'bg-[#6dd58c] animate-pulse' : 'bg-red-500'}`}></span>
                </div>
              </div>
            </div>

            <div className="flex sm:hidden items-center gap-1.5">
              <button
                onClick={mapVM.toggleTheme}
                className="pixel-card p-2.5 rounded-full text-[#a8c7fa] border border-white/10 shadow-xl transition-colors"
              >
                {mapVM.theme === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="w-full sm:w-80 flex-1 max-w-sm">
            <SearchBar onSelectResult={navVM.handleSelectDestination} />
          </div>

          <div className="hidden sm:flex items-center gap-2 pointer-events-auto">
            {incidentVM.incidents.length > 0 && (
              <div className="pixel-card flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-amber-500/30 text-amber-300 text-xs font-semibold shadow-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>{incidentVM.incidents.length} alert{incidentVM.incidents.length > 1 ? 's' : ''}</span>
              </div>
            )}
            <button
              onClick={mapVM.toggleTheme}
              className="pixel-card p-2.5 rounded-full text-[#a8c7fa] border border-white/10 hover:border-[#a8c7fa]/40 shadow-xl transition-colors"
              title="Toggle Day/Night Mode"
            >
              {mapVM.theme === 'night' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>
      )}

      {/* Floating Action Buttons */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col gap-2.5">
        <button
          onClick={incidentVM.openReportModal}
          className="pixel-btn-primary p-3.5 rounded-full shadow-2xl active:scale-95 transition-all"
          title="Report Hazard / Incident (Waze Style)"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        {navVM.activeRoute && (
          <button
            onClick={navVM.isSimulatingDrive ? navVM.stopDriveSimulation : navVM.startDriveSimulation}
            className={`pixel-card p-3 rounded-full shadow-2xl transition-all border ${
              navVM.isSimulatingDrive
                ? 'bg-amber-500/30 text-amber-300 border-amber-400 animate-pulse'
                : 'text-white border-white/10 hover:text-[#a8c7fa]'
            }`}
            title={navVM.isSimulatingDrive ? 'Stop Drive Simulation' : 'Simulate GPS Drive'}
          >
            {navVM.isSimulatingDrive ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
        )}

        <button
          onClick={mapVM.recenterCamera}
          className={`pixel-card p-3 rounded-full shadow-2xl transition-all border ${
            mapVM.followUser
              ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border-[#a8c7fa]'
              : 'text-white border-white/10 hover:text-[#a8c7fa]'
          }`}
          title="Recenter Camera"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={mapVM.toggle3DPerspective}
          className={`pixel-card p-3 rounded-full shadow-2xl transition-all border ${
            mapVM.is3DPerspective
              ? 'bg-[#a8c7fa]/20 text-[#a8c7fa] border-[#a8c7fa]'
              : 'text-white border-white/10 hover:text-[#a8c7fa]'
          }`}
          title="Toggle 3D Perspective"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Waze Proximity Approach Banner Alert */}
      {incidentVM.approachingIncident && (
        <IncidentApproachAlert
          incident={incidentVM.approachingIncident}
          onVote={incidentVM.voteIncident}
          onDismiss={incidentVM.dismissApproachAlert}
        />
      )}

      {/* Navigation Turn HUD Banner */}
      {navVM.isNavigating && navVM.activeRoute && (
        <NavigationHUD
          currentStep={navVM.navStep}
          nextStep={navVM.nextStep}
          distanceToNextStep={navVM.distanceToNextStep}
          remainingDistance={navVM.remainingDistance}
          remainingDuration={navVM.remainingDuration}
          currentSpeedKmh={currentSpeed}
          allRoutes={navVM.allRoutes}
          selectedRouteIndex={navVM.selectedRouteIndex}
          onSelectRouteIndex={navVM.selectRouteIndex}
          onStopNavigation={navVM.stopNavigation}
        />
      )}

      {/* Route Selection Summary Cards */}
      {!navVM.isNavigating && navVM.allRoutes.length > 0 && (
        <RouteSummary
          allRoutes={navVM.allRoutes}
          selectedRouteIndex={navVM.selectedRouteIndex}
          onSelectRouteIndex={navVM.selectRouteIndex}
          selectedProfile={navVM.selectedProfile}
          onSelectProfile={navVM.selectProfile}
          onStartNavigation={navVM.startNavigation}
          onClose={() => navVM.stopNavigation()}
        />
      )}

      {/* Waze 5-Second Auto-Send Incident Report Modal */}
      {incidentVM.isReportModalOpen && (
        <ReportModal
          userCoords={userCoords}
          onClose={incidentVM.closeReportModal}
          onSubmit={incidentVM.reportIncident}
        />
      )}

      {/* Incident Details Card */}
      {incidentVM.selectedIncident && (
        <IncidentDetails
          incident={incidentVM.selectedIncident}
          onClose={incidentVM.clearSelectedIncident}
          onVote={incidentVM.voteIncident}
        />
      )}

      {/* WebGL Map Presentation View */}
      <main className="flex-1 w-full h-full relative">
        <MapView
          theme={mapVM.theme}
          userCoords={userCoords}
          activeRoute={navVM.activeRoute}
          allRoutes={navVM.allRoutes}
          selectedRouteIndex={navVM.selectedRouteIndex}
          incidents={incidentVM.incidents}
          isNavigating={navVM.isNavigating}
          followUser={mapVM.followUser}
          onMapClick={navVM.handleSelectDestination}
          onUserPan={mapVM.handleUserPan}
          onSelectAlternative={navVM.selectRouteIndex}
          onIncidentClick={incidentVM.selectIncident}
        />
      </main>
    </div>
  );
}
