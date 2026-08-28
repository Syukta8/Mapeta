import { useState, useEffect } from 'react';

export function useOrientation() {
  const [compassHeading, setCompassHeading] = useState<number | null>(null);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      // iOS / WebKit compass heading
      if ('webkitCompassHeading' in event && typeof (event as any).webkitCompassHeading === 'number') {
        setCompassHeading((event as any).webkitCompassHeading);
      } else if (event.alpha !== null) {
        // Android standard device alpha
        setCompassHeading(360 - event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => {
      window.removeEventListener('deviceorientationabsolute' as any, handleOrientation, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  return compassHeading;
}
