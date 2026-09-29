import { useState, useCallback, useRef, useMemo } from 'react';
import { RouteService } from '../models/RouteService';
import { useNavigation } from '../hooks/useNavigation';
import { formatManeuverDistance, formatNavigationDuration } from '../utils/formatters';
import type { RouteInfo, Coordinates, TravelProfile } from '../models/NavigationModel';
import type { Incident } from '../models/IncidentModel';

export function useNavigationViewModel(
  userCoords: Coordinates | null,
  incidents: Incident[] = []
) {
  const [allRoutes, setAllRoutes] = useState<RouteInfo[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState<number>(0);
  const [selectedProfile, setSelectedProfile] = useState<TravelProfile>('driving');
  const [destination, setDestination] = useState<[number, number] | null>(null);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isRerouting, setIsRerouting] = useState<boolean>(false);

  const [isSimulatingDrive, setIsSimulatingDrive] = useState<boolean>(false);
  const [simulatedPos, setSimulatedPos] = useState<{ lat: number; lng: number; heading: number; speedKmh: number } | null>(null);
  const simIntervalRef = useRef<number | null>(null);

  const activeRoute = allRoutes[selectedRouteIndex] || null;

  const calculateRoute = useCallback(
    async (
      originCoords: [number, number],
      destCoords: [number, number],
      profile: TravelProfile = selectedProfile
    ) => {
      try {
        const routes = await RouteService.fetchRoutes(
          originCoords,
          destCoords,
          profile
        );

        if (routes && routes.length > 0) {
          setAllRoutes(routes);
          setSelectedRouteIndex(0);
          setDestination(destCoords);
          return routes;
        }
        return [];
      } catch (err) {
        console.error('[useNavigationViewModel] calculateRoute error:', err);
        return [];
      }
    },
    [selectedProfile, incidents]
  );

  const handleAutoReroute = useCallback(async () => {
    if (!destination || !userCoords) return;
    setIsRerouting(true);
    try {
      const routes = await RouteService.fetchRoutes(
        [userCoords.longitude, userCoords.latitude],
        destination,
        selectedProfile
      );
      if (routes && routes.length > 0) {
        setAllRoutes(routes);
        setSelectedRouteIndex(0);
      }
    } catch (e) {
      console.error('[AutoReroute] Failed to recalculate route:', e);
    } finally {
      setIsRerouting(false);
    }
  }, [destination, userCoords, selectedProfile, incidents]);

  const nav = useNavigation(activeRoute, userCoords, isNavigating, handleAutoReroute);

  const handleSelectDestination = useCallback(
    async (destCoords: [number, number]) => {
      const origin: [number, number] = userCoords
        ? [userCoords.longitude, userCoords.latitude]
        : [101.6932, 3.1408];

      await calculateRoute(origin, destCoords, selectedProfile);
    },
    [userCoords, selectedProfile, calculateRoute]
  );

  const selectProfile = useCallback(
    (profile: TravelProfile) => {
      setSelectedProfile(profile);
      if (destination && userCoords) {
        calculateRoute([userCoords.longitude, userCoords.latitude], destination, profile);
      }
    },
    [destination, userCoords, calculateRoute]
  );

  const selectRouteIndex = useCallback((index: number) => {
    setSelectedRouteIndex(index);
  }, []);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
  }, []);

  const stopNavigation = useCallback(() => {
    setIsNavigating(false);
    setIsSimulatingDrive(false);
    setIsRerouting(false);
    setAllRoutes([]);
    setSelectedRouteIndex(0);
    setDestination(null);
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
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

  // Computed Presentation State (Clean Code Guy ViewModel Standard)
  const computed = useMemo(() => {
    const progressPercent = Math.max(
      0,
      Math.min(100, (1 - nav.distanceToNextStep / Math.max(100, nav.stepInitialDistance)) * 100)
    );

    return {
      formattedDistanceToNextStep: formatManeuverDistance(nav.distanceToNextStep),
      formattedRemainingDistance: formatManeuverDistance(nav.remainingDistance),
      formattedRemainingDuration: formatNavigationDuration(nav.remainingDuration),
      progressPercent,
      hasRoutes: allRoutes.length > 0,
      activeSummary: activeRoute?.summary || '',
      activeTollTotal: activeRoute ? `RM ${activeRoute.tollTotal.toFixed(2)}` : 'Free',
    };
  }, [nav.distanceToNextStep, nav.stepInitialDistance, nav.remainingDistance, nav.remainingDuration, allRoutes, activeRoute]);

  return {
    allRoutes,
    activeRoute,
    selectedRouteIndex,
    selectedProfile,
    destination,
    isNavigating,
    isRerouting,
    isSimulatingDrive,
    simulatedPos,
    navStep: nav.currentStep,
    nextStep: nav.nextStep,
    nextNextStep: nav.nextNextStep,
    distanceToNextStep: nav.distanceToNextStep,
    stepInitialDistance: nav.stepInitialDistance,
    remainingDistance: nav.remainingDistance,
    remainingDuration: nav.remainingDuration,
    computed,
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
