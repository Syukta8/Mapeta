import { useState, useEffect, useCallback } from 'react';
import type { FavoritePlace, FavoriteType } from '../models/FavoriteModel';
import { FavoriteService } from '../models/FavoriteService';

export function useFavoritesViewModel(
  onSelectDestination: (coords: [number, number]) => void
) {
  const [favorites, setFavorites] = useState<FavoritePlace[]>([]);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState<boolean>(false);
  const [pendingSaveTarget, setPendingSaveTarget] = useState<{
    lat: number;
    lng: number;
    name?: string;
    address?: string;
  } | null>(null);

  const loadFavorites = useCallback(async () => {
    const list = await FavoriteService.getFavorites();
    setFavorites(list);
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const openSaveModal = useCallback((lat: number, lng: number, name?: string, address?: string) => {
    setPendingSaveTarget({ lat, lng, name, address });
    setIsSaveModalOpen(true);
  }, []);

  const closeSaveModal = useCallback(() => {
    setIsSaveModalOpen(false);
    setPendingSaveTarget(null);
  }, []);

  const saveFavorite = useCallback(async (name: string, type: FavoriteType) => {
    if (!pendingSaveTarget) return;

    const saved = await FavoriteService.saveFavorite({
      name,
      type,
      lat: pendingSaveTarget.lat,
      lng: pendingSaveTarget.lng,
      address: pendingSaveTarget.address,
    });

    if (saved) {
      await loadFavorites();
      closeSaveModal();
    }
  }, [pendingSaveTarget, loadFavorites, closeSaveModal]);

  const removeFavorite = useCallback(async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const ok = await FavoriteService.deleteFavorite(id);
    if (ok) {
      setFavorites((prev) => prev.filter((f) => f.id !== id));
    }
  }, []);

  const selectFavorite = useCallback((fav: FavoritePlace) => {
    onSelectDestination([fav.lng, fav.lat]);
  }, [onSelectDestination]);

  return {
    favorites,
    isSaveModalOpen,
    pendingSaveTarget,
    openSaveModal,
    closeSaveModal,
    saveFavorite,
    removeFavorite,
    selectFavorite,
  };
}
