import { useEffect, useRef } from 'react';

export function useWakeLock(isActive: boolean) {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!isActive) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
      return;
    }

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.warn('[WakeLock] Screen wake lock unavailable or denied:', err);
      }
    };

    requestWakeLock();

    // Re-acquire wake lock if app returns from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isActive) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(console.error);
        wakeLockRef.current = null;
      }
    };
  }, [isActive]);
}
