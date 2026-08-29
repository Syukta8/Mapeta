import { useState, useEffect, useCallback, useRef } from 'react';
import type { Incident, CreateIncidentPayload } from '../models/IncidentModel';
import { incidentService } from '../models/IncidentService';
import { voiceEngine } from '../components/Navigation/VoiceEngine';

export function useIncidentViewModel(
  userCoords: { latitude: number; longitude: number } | null,
  isNavigating: boolean = false
) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Waze Approach Alert State (<600m ahead)
  const [approachingIncident, setApproachingIncident] = useState<Incident | null>(null);
  const alertedIncidentIdsRef = useRef<Set<string>>(new Set());

  // Subscribe to WebSocket Incident events
  useEffect(() => {
    const unsubIncidents = incidentService.onIncidents((data) => {
      setIncidents(data);
    });
    const unsubConn = incidentService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    return () => {
      unsubIncidents();
      unsubConn();
    };
  }, []);

  // Waze Proximity Approach Detection Engine
  useEffect(() => {
    if (!userCoords || incidents.length === 0) {
      setApproachingIncident(null);
      return;
    }

    let nearestIncident: Incident | null = null;
    let minDistanceMeters = Infinity;

    for (const inc of incidents) {
      // Calculate distance in meters
      const R = 6371000;
      const dLat = ((inc.lat - userCoords.latitude) * Math.PI) / 180;
      const dLon = ((inc.lng - userCoords.longitude) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((userCoords.latitude * Math.PI) / 180) *
          Math.cos((inc.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const dist = R * c;

      // Proximity threshold: between 50m and 650m ahead
      if (dist < 650 && dist > 30) {
        if (dist < minDistanceMeters) {
          minDistanceMeters = dist;
          nearestIncident = inc;
        }
      }
    }

    if (nearestIncident) {
      const candidate: Incident = nearestIncident;
      if (candidate.id !== approachingIncident?.id) {
        setApproachingIncident(candidate);
        // Voice alert trigger if not yet alerted for this incident
        if (!alertedIncidentIdsRef.current.has(candidate.id)) {
          alertedIncidentIdsRef.current.add(candidate.id);
          voiceEngine.speakIncidentAlert(candidate.type, candidate.subtype);
        }
      }
    } else if (approachingIncident) {
      setApproachingIncident(null);
    }
  }, [userCoords, incidents, isNavigating, approachingIncident]);

  // Actions
  const openReportModal = useCallback(() => setIsReportModalOpen(true), []);
  const closeReportModal = useCallback(() => setIsReportModalOpen(false), []);

  const selectIncident = useCallback((inc: Incident) => setSelectedIncident(inc), []);
  const clearSelectedIncident = useCallback(() => setSelectedIncident(null), []);

  const reportIncident = useCallback(async (payload: CreateIncidentPayload) => {
    incidentService.reportIncident(payload);
    setIsReportModalOpen(false);
  }, []);

  const voteIncident = useCallback(async (id: string, vote: 'up' | 'down') => {
    incidentService.voteIncident({ id, vote });
    if (selectedIncident?.id === id) setSelectedIncident(null);
    if (approachingIncident?.id === id) setApproachingIncident(null);
  }, [selectedIncident, approachingIncident]);

  const dismissApproachAlert = useCallback(() => {
    setApproachingIncident(null);
  }, []);

  return {
    incidents,
    isConnected,
    isReportModalOpen,
    selectedIncident,
    approachingIncident,
    openReportModal,
    closeReportModal,
    selectIncident,
    clearSelectedIncident,
    reportIncident,
    voteIncident,
    dismissApproachAlert,
  };
}
