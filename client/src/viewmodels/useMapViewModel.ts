import { useState, useCallback } from 'react';

export type MapViewMode = '3d-heading' | '2d-north' | '2d-heading';

export function useMapViewModel() {
  const [theme, setTheme] = useState<'day' | 'night'>('day');
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<MapViewMode>('2d-heading');
  const [showTrafficLayer, setShowTrafficLayer] = useState<boolean>(true);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'night' ? 'day' : 'night'));
  }, []);

  const cycleViewMode = useCallback(() => {
    setViewMode((prev) => {
      if (prev === '2d-heading') return '3d-heading';
      if (prev === '3d-heading') return '2d-north';
      return '2d-heading';
    });
  }, []);

  const toggleTrafficLayer = useCallback(() => {
    setShowTrafficLayer((prev) => !prev);
  }, []);

  const recenterCamera = useCallback(() => {
    setFollowUser(true);
  }, []);

  const handleUserPan = useCallback(() => {
    setFollowUser(false);
  }, []);

  return {
    theme,
    followUser,
    viewMode,
    showTrafficLayer,
    toggleTheme,
    cycleViewMode,
    toggleTrafficLayer,
    recenterCamera,
    setFollowUser,
    handleUserPan,
  };
}
