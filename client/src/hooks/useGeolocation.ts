import { useState, useEffect, useRef } from 'react';

export interface GeolocationState {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null; // meters per second
  } | null;
  speedKmh: number;
  speedMph: number;
  isSimulated: boolean;
  error: string | null;
}

export function useGeolocation(enableHighAccuracy = true) {
  const [state, setState] = useState<GeolocationState>({
    coords: null,
    speedKmh: 0,
    speedMph: 0,
    isSimulated: false,
    error: null,
  });

  const lastPos = useRef<{ lat: number; lng: number; time: number } | null>(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setState((s) => ({
        ...s,
        error: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        let calculatedSpeedKmh = 0;
        let calculatedHeading = pos.coords.heading;

        // If hardware speed is available (in m/s), convert to km/h
        if (pos.coords.speed !== null && pos.coords.speed > 0) {
          calculatedSpeedKmh = Math.round(pos.coords.speed * 3.6);
        } else if (lastPos.current) {
          // Calculate speed based on delta distance and delta time
          const dt = (pos.timestamp - lastPos.current.time) / 1000;
          if (dt > 1) {
            const dist = calculateDistance(
              lastPos.current.lat,
              lastPos.current.lng,
              pos.coords.latitude,
              pos.coords.longitude
            );
            const speedMs = dist / dt;
            calculatedSpeedKmh = Math.round(speedMs * 3.6);
            if (!calculatedHeading) {
              calculatedHeading = calculateBearing(
                lastPos.current.lat,
                lastPos.current.lng,
                pos.coords.latitude,
                pos.coords.longitude
              );
            }
          }
        }

        lastPos.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          time: pos.timestamp,
        };

        setState({
          coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: calculatedHeading,
            speed: pos.coords.speed,
          },
          speedKmh: calculatedSpeedKmh,
          speedMph: Math.round(calculatedSpeedKmh * 0.621371),
          isSimulated: false,
          error: null,
        });
      },
      (err) => {
        console.warn('[Geolocation] Real GPS unavailable or denied:', err.message);
        // Fallback default coordinates (e.g. vibrant metropolis / Kuala Lumpur / Singapore / NY center)
        setState({
          coords: {
            latitude: 3.140853,
            longitude: 101.693207,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: 45,
            speed: 0,
          },
          speedKmh: 0,
          speedMph: 0,
          isSimulated: true,
          error: err.message,
        });
      },
      {
        enableHighAccuracy,
        maximumAge: 1000,
        timeout: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enableHighAccuracy]);

  return state;
}

/**
 * Calculates haversine distance between two coordinates in meters.
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
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

/**
 * Calculates initial bearing between two points in degrees (0-360).
 */
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(((lon2 - lon1) * Math.PI) / 180);
  const theta = Math.atan2(y, x);
  return ((theta * 180) / Math.PI + 360) % 360;
}
