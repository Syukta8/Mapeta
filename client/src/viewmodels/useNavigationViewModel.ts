import { useState, useCallback, useRef } from 'react';
import type { RouteInfo, TravelProfile, Coordinates } from '../models/NavigationModel';
import type { Incident } from '../models/IncidentModel';
import { RouteService } from '../models/RouteService';
import { useNavigation } from '../hooks/useNavigation';
import { useWakeLock } from '../hooks/useWakeLock';

export function useNavigationViewModel(
  userCoords: Coordinates | null,
  incidents: Incident[]
) {
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [selectedProfile, setSelectedProfile] = useState<TravelProfile>('driving');
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isSimulatingDrive, setIsSimulatingDrive] = useState<boolean>(false);

  const [simulatedPos, setSimulatedPos] = useState<{ lat: number; lng: number; heading: number; speedKmh: number } | null>(null);
  const simIntervalRef = useRef<number | null>(null);

  const activeRoute = allRoutes[selectedRouteIndex] || null;

  useWakeLock(isNavigating);

  const calculateRoute = useCallback(async (
    start: [number, number],
    end: [number, number],
    profile: TravelProfile = selectedProfile
  ) => {
    const routes = await RouteService.fetchRoutes(start, end, profile, incidents);
    setAllRoutes(routes);
    setSelectedRouteIndex(0);
  }, [selectedProfile, incidents]);

  // Turn-by-turn navigation progression hook
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

  const handleSelectDestination = useCallback((coords: [number, number]) => {
    setDestination(coords);
    const startLng = userCoords ? userCoords.longitude : 101.6932;
    const startLat = userCoords ? userCoords.latitude : 3.1408;
    calculateRoute([startLng, startLat], coords, selectedProfile);
  }, [userCoords, selectedProfile, calculateRoute]);

  const selectProfile = useCallback((profile: TravelProfile) => {
    setSelectedProfile(profile);
    if (destination && userCoords) {
      calculateRoute([userCoords.longitude, userCoords.latitude], destination, profile);
    }
  }, [destination, userCoords, calculateRoute]);

  const selectRouteIndex = useCallback((idx: number) => {
    setSelectedRouteIndex(idx);
  }, []);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setDestination(null);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulatingDrive(false);
    setSimulatedPos(null);
  }, []);

  const startDriveSimulation = useCallback(() => {
    if (!activeRoute || activeRoute.geometry.coordinates.length < 2) return;

    setIsSimulatingDrive(true);
    setIsNavigating(true);

    const coords = activeRoute.geometry.coordinates;
    let idx = 0;

    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    simIntervalRef.current = window.setInterval(() => {
      if (idx >= coords.length - 1) {
        stopNavigation();
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
        speedKmh: Math.floor(Math.random() * 20) + 55,
      });

      idx += 1;
    }, 1500);
  }, [activeRoute, stopNavigation]);

  const stopDriveSimulation = useCallback(() => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setIsSimulatingDrive(false);
    setSimulatedPos(null);
  }, []);

  return {
    allRoutes,
    activeRoute,
    selectedRouteIndex,
    selectedProfile,
    destination,
    isNavigating,
    isSimulatingDrive,
    simulatedPos,
    navStep: nav.currentStep,
    nextStep: nav.nextStep,
    distanceToNextStep: nav.distanceToNextStep,
    remainingDistance: nav.remainingDistance,
    remainingDuration: nav.remainingDuration,
    calculateRoute,
    handleSelectDestination,
    selectProfile,
    selectRouteIndex,
    startNavigation,
    stopNavigation,
    startDriveSimulation,
    stopDriveSimulation,
  };
}
