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

  // Reset steps when a new route is loaded
  useEffect(() => {
    if (activeRoute) {
      setCurrentStepIndex(0);
      setRemainingDistance(activeRoute.distance);
      setRemainingDuration(activeRoute.duration);
      if (isNavigating && activeRoute.steps.length > 0) {
        voiceEngine.speak(`Starting navigation to destination. ${activeRoute.steps[0].instruction}`, true);
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
      // Advance to next step
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

    // Estimate remaining time assuming average speed ~40 km/h
    const estimatedSeconds = Math.round((remDist / 1000) / 40 * 3600);
    setRemainingDuration(estimatedSeconds);

    // Cross-track off-route detection: if user is > 60m away from current step & path
    const now = Date.now();
    if (distToStep > 250 && currentStepIndex === 0 && now - lastRerouteTime.current > 15000) {
      lastRerouteTime.current = now;
      if (onRerouteRequest) {
        voiceEngine.speak('Rerouting, please wait.');
        onRerouteRequest();
      }
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
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dphi / 2) * Math.sin(dphi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) * Math.sin(dlambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
