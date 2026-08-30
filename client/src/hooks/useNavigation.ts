import { useState, useEffect, useRef } from 'react';
import { voiceEngine } from '../components/Navigation/VoiceEngine';
import type { RouteInfo } from '../types/navigation';

export function useNavigation(
  activeRoute: RouteInfo | null,
  userCoords: { latitude: number; longitude: number; heading: number | null } | null,
  isNavigating: boolean,
  onRerouteRequest?: () => void
) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [distanceToNextStep, setDistanceToNextStep] = useState<number>(0);
  const [remainingDuration, setRemainingDuration] = useState<number>(0);
  const [remainingDistance, setRemainingDistance] = useState<number>(0);

  const lastRerouteTime = useRef<number>(0);
  const offRouteTicksRef = useRef<number>(0);

  // Reset steps when a new route is loaded
  useEffect(() => {
    if (activeRoute) {
      setCurrentStepIndex(0);
      setRemainingDistance(activeRoute.distance);
      setRemainingDuration(activeRoute.duration);
      offRouteTicksRef.current = 0;
      if (isNavigating && activeRoute.steps.length > 0) {
        voiceEngine.speak(`Starting navigation. ${activeRoute.steps[0].instruction}`, true);
      }
    }
  }, [activeRoute, isNavigating]);

  // Track progress along route steps
  useEffect(() => {
    if (!isNavigating || !activeRoute || !userCoords || activeRoute.steps.length === 0) {
      return;
    }

    const currentStep = activeRoute.steps[currentStepIndex];
    if (!currentStep) return;

    // Calculate distance from user to current step waypoint
    const distToStep = calculateDistance(
      userCoords.latitude,
      userCoords.longitude,
      currentStep.location[1],
      currentStep.location[0]
    );

    setDistanceToNextStep(Math.round(distToStep));

    // Voice announcement thresholds
    if (distToStep < 30) {
      if (currentStepIndex < activeRoute.steps.length - 1) {
        const nextIdx = currentStepIndex + 1;
        setCurrentStepIndex(nextIdx);
        const nextStep = activeRoute.steps[nextIdx];
        voiceEngine.speak(nextStep.instruction, true);
      } else {
        voiceEngine.speak('You have arrived at your destination.', true);
      }
    } else if (distToStep <= 150 && distToStep > 120) {
      voiceEngine.speak(`In 150 meters, ${currentStep.instruction}`);
    } else if (distToStep <= 500 && distToStep > 450) {
      voiceEngine.speak(`In 500 meters, ${currentStep.instruction}`);
    }

    // Calculate total remaining distance
    let remDist = distToStep;
    for (let i = currentStepIndex + 1; i < activeRoute.steps.length; i++) {
      remDist += activeRoute.steps[i].distance;
    }
    setRemainingDistance(Math.round(remDist));

    const estimatedSeconds = Math.round((remDist / 1000) / 45 * 3600);
    setRemainingDuration(estimatedSeconds);

    // 🔄 Robust Cross-Track Deviation Detection (Point-to-Polyline)
    const minDistanceToRoute = calculateMinDistanceToPolyline(
      userCoords.latitude,
      userCoords.longitude,
      activeRoute.geometry.coordinates
    );

    const now = Date.now();
    // If user is > 45 meters away from the entire polyline
    if (minDistanceToRoute > 45) {
      offRouteTicksRef.current += 1;
      // If off route for 2 consecutive GPS updates and cooldown expired
      if (offRouteTicksRef.current >= 2 && now - lastRerouteTime.current > 8000) {
        lastRerouteTime.current = now;
        offRouteTicksRef.current = 0;
        if (onRerouteRequest) {
          voiceEngine.speak('Rerouting', true);
          onRerouteRequest();
        }
      }
    } else {
      offRouteTicksRef.current = 0;
    }
  }, [userCoords, isNavigating, activeRoute, currentStepIndex, onRerouteRequest]);

  return {
    currentStep: activeRoute?.steps[currentStepIndex] || null,
    nextStep: activeRoute?.steps[currentStepIndex + 1] || null,
    currentStepIndex,
    distanceToNextStep,
    remainingDistance,
    remainingDuration,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function calculateMinDistanceToPolyline(lat: number, lng: number, coords: [number, number][]): number {
  if (!coords || coords.length < 2) return 999;
  let minDistance = Infinity;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const dist = distanceToSegment(lat, lng, p1[1], p1[0], p2[1], p2[0]);
    if (dist < minDistance) {
      minDistance = dist;
    }
  }

  return minDistance;
}

function distanceToSegment(pLat: number, pLng: number, lat1: number, lng1: number, lat2: number, lng2: number): number {
  const x = pLng;
  const y = pLat;
  const x1 = lng1;
  const y1 = lat1;
  const x2 = lng2;
  const y2 = lat2;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return calculateDistance(pLat, pLng, lat1, lng1);
  }

  const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  return calculateDistance(pLat, pLng, projY, projX);
}
