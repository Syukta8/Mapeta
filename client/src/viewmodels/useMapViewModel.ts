import { useState, useCallback } from 'react';

export function useMapViewModel() {
  const [theme, setTheme] = useState<'day' | 'night'>('night');
  const [followUser, setFollowUser] = useState<boolean>(true);
  const [is3DPerspective, setIs3DPerspective] = useState<boolean>(false);
  const [showTrafficLayer, setShowTrafficLayer] = useState<boolean>(true);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'night' ? 'day' : 'night'));
  }, []);

  const toggle3DPerspective = useCallback(() => {
    setIs3DPerspective((prev) => !prev);
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
    is3DPerspective,
    showTrafficLayer,
    toggleTheme,
    toggle3DPerspective,
    toggleTrafficLayer,
    recenterCamera,
    setFollowUser,
    handleUserPan,
  };
}
